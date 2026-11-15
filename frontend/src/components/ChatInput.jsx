import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Sparkles,
  Trash2,
  Cpu,
  Paperclip,
  FileText,
  X
} from 'lucide-react';
import { useChat } from '../context/ChatContext';

export const ChatInput = ({ inputRef }) => {
  const {
    sendMessage,
    stopGenerating,
    isStreaming,
    geminiModel,
    updateModel,
    clearAllConversations,
    currentConversationId
  } = useChat();

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const processFile = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(`File "${file.name}" exceeds the 10MB limit.`);
      return;
    }

    const reader = new FileReader();

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.onload = () => {
        const result = reader.result;
        const base64Data = result.includes(';base64,') ? result.split(';base64,')[1] : result;

        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            data: base64Data,
            preview: file.type.startsWith('image/') ? result : null
          }
        ]);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const textContent = reader.result;
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || 'text/plain',
            size: file.size,
            textContent: textContent,
            data: btoa(unescape(encodeURIComponent(textContent))),
            preview: null
          }
        ]);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const hasText = text.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if ((!hasText && !hasAttachments) || isStreaming) return;

    sendMessage(text, attachments);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    files.forEach(processFile);
  };

  const modelOptions = [
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (Recommended ✓)' },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite (Fast)' },
    { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' }
  ];

  const canSubmit = (text.trim().length > 0 || attachments.length > 0) && !isStreaming;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-4 select-none">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl glass-input shadow-2xl transition-all border ${
          isDragging
            ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-cyan-950/20'
            : 'border-slate-700/60 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30'
        }`}
      >
        {/* Model Switcher and Actions Header */}
        <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1 border-b border-slate-800/40 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={geminiModel}
              onChange={(e) => updateModel(e.target.value)}
              className="bg-transparent text-slate-300 font-medium hover:text-white cursor-pointer focus:outline-none border-none pr-1"
            >
              {modelOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {currentConversationId && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all messages in this conversation?')) {
                    clearAllConversations();
                  }
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <span className="text-slate-500 hidden sm:inline">
              Shift + Enter for newline
            </span>
          </div>
        </div>

        {/* Attachment Preview Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1 border-b border-slate-800/40">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs text-slate-200 max-w-[220px]"
              >
                {att.preview ? (
                  <img
                    src={att.preview}
                    alt={att.name}
                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                )}
                <span className="truncate font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          multiple
          accept="image/*,.pdf,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv"
          className="hidden"
        />

        {/* Text Input Row */}
        <div className="flex items-end gap-1.5 sm:gap-2 p-2 sm:p-3">
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors flex-shrink-0 disabled:opacity-50"
            title="Attach images, documents or code (multimodal vision)"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <textarea
            ref={(el) => {
              textareaRef.current = el;
              if (inputRef) inputRef.current = el;
            }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              attachments.length > 0
                ? "Add a question about your attached file(s)... (or hit send to analyze)"
                : "Ask Aetheris anything... (e.g. explain algorithms, write code, solve problems)"
            }
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent border-0 text-slate-100 placeholder-slate-500 text-sm sm:text-base resize-none focus:outline-none focus:ring-0 max-h-44 scrollbar-thin px-2 py-1 leading-relaxed"
          />

          {/* Action Button: Send or Stop */}
          {isStreaming ? (
            <button
              onClick={stopGenerating}
              className="p-2.5 sm:p-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 animate-pulse"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-white" />
              <span className="text-xs hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`p-2.5 sm:p-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center flex-shrink-0 ${
                canSubmit
                  ? 'bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25 scale-100'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
              title="Send prompt (Enter)"
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Subtle branding hint */}
      <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-slate-500 text-center">
        <span>Aetheris AI Multimodal Vision active • Attach images, PDFs or code files to analyze</span>
      </div>
    </div>
  );
};
