import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorToast, setErrorToast] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Settings
  const [geminiModel, setGeminiModel] = useState(() => {
    const saved = localStorage.getItem('aetheris_model');
    if (!saved || saved.includes('1.5') || saved.includes('2.0')) {
      localStorage.setItem('aetheris_model', 'gemini-3.6-flash');
      return 'gemini-3.6-flash';
    }
    return saved;
  });
  const [apiKeyOverride, setApiKeyOverride] = useState(() => {
    return localStorage.getItem('aetheris_api_key') || '';
  });
  const [systemInstruction, setSystemInstruction] = useState(() => {
    return localStorage.getItem('aetheris_instruction') || '';
  });

  const abortControllerRef = useRef(null);

  // Load conversations when user is authenticated
  const loadConversations = async (search = searchQuery) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getConversations(search);
      if (res.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
    }
  }, [isAuthenticated]);

  // Select conversation
  const selectConversation = async (convId) => {
    if (isStreaming) {
      stopGenerating();
    }
    setCurrentConversationId(convId);
    setIsLoadingMessages(true);
    try {
      const res = await api.getConversation(convId);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
      showError('Failed to load conversation history');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Start new chat
  const newChat = () => {
    if (isStreaming) {
      stopGenerating();
    }
    setCurrentConversationId(null);
    setMessages([]);
    setStreamingContent('');
  };

  // Stop ongoing AI streaming
  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // If there was partial streaming content, commit it to local messages
    if (streamingContent.trim()) {
      setMessages(prev => [
        ...prev,
        {
          _id: 'temp-' + Date.now(),
          role: 'model',
          content: streamingContent + ' *(Stream interrupted)*',
          createdAt: new Date().toISOString()
        }
      ]);
      setStreamingContent('');
    }
  };

  // Send message
  const sendMessage = async (promptText) => {
    if (!promptText || !promptText.trim() || isStreaming) return;

    const trimmedPrompt = promptText.trim();

    // Optimistic user message
    const tempUserMsg = {
      _id: 'temp-u-' + Date.now(),
      role: 'user',
      content: trimmedPrompt,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingContent('');

    abortControllerRef.current = new AbortController();

    let streamAccumulator = '';
    let targetConvId = currentConversationId;

    await api.streamMessage(
      {
        conversationId: targetConvId,
        prompt: trimmedPrompt,
        model: geminiModel,
        apiKeyOverride: apiKeyOverride || undefined,
        systemInstruction: systemInstruction || undefined
      },
      {
        signal: abortControllerRef.current.signal,
        onMeta: (meta) => {
          if (meta.conversationId && !currentConversationId) {
            targetConvId = meta.conversationId;
            setCurrentConversationId(meta.conversationId);
          }
        },
        onChunk: (chunk) => {
          streamAccumulator += chunk;
          setStreamingContent(streamAccumulator);
        },
        onDone: (doneData) => {
          setIsStreaming(false);
          const finalAI = streamAccumulator;
          setStreamingContent('');

          const modelMsg = {
            _id: doneData.messageId || 'model-' + Date.now(),
            role: 'model',
            content: finalAI,
            modelUsed: geminiModel,
            createdAt: new Date().toISOString()
          };

          setMessages(prev => [...prev, modelMsg]);

          // Refresh conversation list to capture title & updated order
          loadConversations();
          abortControllerRef.current = null;
        },
        onError: (err) => {
          setIsStreaming(false);
          setStreamingContent('');
          showError(err.message || 'Error occurred while generating response');
          abortControllerRef.current = null;
        }
      }
    );
  };

  // Regenerate last response
  const regenerateLastMessage = async () => {
    if (messages.length === 0 || isStreaming) return;

    // Find the last user message
    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const promptText = messages[actualIndex].content;

    // Trim messages back to that user message
    setMessages(messages.slice(0, actualIndex + 1));

    setIsStreaming(true);
    setStreamingContent('');
    abortControllerRef.current = new AbortController();

    let streamAccumulator = '';

    await api.streamMessage(
      {
        conversationId: currentConversationId,
        prompt: promptText,
        model: geminiModel,
        apiKeyOverride: apiKeyOverride || undefined,
        systemInstruction: systemInstruction || undefined
      },
      {
        signal: abortControllerRef.current.signal,
        onChunk: (chunk) => {
          streamAccumulator += chunk;
          setStreamingContent(streamAccumulator);
        },
        onDone: (doneData) => {
          setIsStreaming(false);
          setStreamingContent('');
          const modelMsg = {
            _id: doneData.messageId || 'model-' + Date.now(),
            role: 'model',
            content: streamAccumulator,
            modelUsed: geminiModel,
            createdAt: new Date().toISOString()
          };
          setMessages(prev => [...prev, modelMsg]);
          abortControllerRef.current = null;
        },
        onError: (err) => {
          setIsStreaming(false);
          setStreamingContent('');
          showError(err.message || 'Regeneration failed');
          abortControllerRef.current = null;
        }
      }
    );
  };

  // Rename conversation
  const renameConversation = async (id, newTitle) => {
    try {
      const res = await api.updateConversationTitle(id, newTitle);
      if (res.success) {
        setConversations(prev =>
          prev.map(c => (c._id === id ? { ...c, title: newTitle } : c))
        );
        showSuccess('Conversation renamed');
      }
    } catch (err) {
      showError('Failed to rename conversation');
    }
  };

  // Delete conversation
  const deleteConversation = async (id) => {
    try {
      const res = await api.deleteConversation(id);
      if (res.success) {
        setConversations(prev => prev.filter(c => c._id !== id));
        if (currentConversationId === id) {
          newChat();
        }
        showSuccess('Conversation deleted');
      }
    } catch (err) {
      showError('Failed to delete conversation');
    }
  };

  // Clear all conversations
  const clearAllConversations = async () => {
    try {
      const res = await api.clearAllConversations();
      if (res.success) {
        setConversations([]);
        newChat();
        showSuccess('All conversations cleared');
      }
    } catch (err) {
      showError('Failed to clear conversations');
    }
  };

  // Set message feedback
  const setMessageFeedback = async (messageId, feedback) => {
    // Optimistic update
    setMessages(prev =>
      prev.map(m => (m._id === messageId ? { ...m, feedback } : m))
    );
    try {
      await api.updateFeedback(messageId, feedback);
    } catch (err) {
      console.warn('Feedback update error:', err);
    }
  };

  // Settings persistence
  const updateModel = (model) => {
    setGeminiModel(model);
    localStorage.setItem('aetheris_model', model);
  };

  const updateApiKey = (key) => {
    setApiKeyOverride(key);
    localStorage.setItem('aetheris_api_key', key);
  };

  const updateInstruction = (instr) => {
    setSystemInstruction(instr);
    localStorage.setItem('aetheris_instruction', instr);
  };

  const showError = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversationId,
        messages,
        isLoadingMessages,
        isStreaming,
        streamingContent,
        searchQuery,
        setSearchQuery,
        loadConversations,
        selectConversation,
        newChat,
        sendMessage,
        stopGenerating,
        regenerateLastMessage,
        renameConversation,
        deleteConversation,
        clearAllConversations,
        setMessageFeedback,
        geminiModel,
        updateModel,
        apiKeyOverride,
        updateApiKey,
        systemInstruction,
        updateInstruction,
        errorToast,
        successToast,
        showError,
        showSuccess
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

