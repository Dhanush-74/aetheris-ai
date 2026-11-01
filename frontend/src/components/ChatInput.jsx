import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Sparkles,
  Trash2,
  Cpu,
  CornerDownLeft
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
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || isStreaming) return;

    sendMessage(text);
    setText('');
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

  const modelOptions = [
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (Recommended ✓)' },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite (Fast)' },
    { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-4 select-none">
      <div className="relative rounded-2xl glass-input shadow-2xl transition-all border border-slate-700/60 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30">
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

        {/* Text Input Row */}
        <div className="flex items-end gap-2 p-2 sm:p-3">
          <textarea
            ref={(el) => {
              textareaRef.current = el;
              if (inputRef) inputRef.current = el;
            }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aetheris anything... (e.g. explain algorithms, write code, solve problems)"
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
              disabled={!text.trim()}
              className={`p-2.5 sm:p-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center flex-shrink-0 ${
                text.trim()
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
        <span>Aetheris AI may occasionally produce speculative output. Verify important factual details.</span>
      </div>
    </div>
  );
};
