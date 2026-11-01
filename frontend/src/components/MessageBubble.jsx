import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { motion } from 'framer-motion';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Cpu
} from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { useChat } from '../context/ChatContext';

export const MessageBubble = ({
  message,
  isLatest = false,
  isStreaming = false
}) => {
  const { setMessageFeedback, regenerateLastMessage } = useChat();
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isModel = message.role === 'model' || message.role === 'assistant';

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy response:', err);
    }
  };

  const handleFeedback = (type) => {
    const nextFeedback = message.feedback === type ? 'none' : type;
    setMessageFeedback(message._id, nextFeedback);
  };

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`w-full py-4 px-2 sm:px-4 flex gap-3 sm:gap-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* AI Avatar (Left side) */}
      {isModel && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full rounded-[10px] bg-[#0c111d] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`max-w-[92%] sm:max-w-[85%] md:max-w-[78%] flex flex-col ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        {/* User / Model Header Label */}
        <div className="flex items-center gap-2 mb-1 px-1 text-xs text-slate-400 select-none">
          {isUser ? (
            <>
              <span>{formattedTime}</span>
              <span className="font-semibold text-slate-300">You</span>
            </>
          ) : (
            <>
              <span className="font-semibold text-cyan-400 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                Aetheris AI
              </span>
              <span className="text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-cyan-300">
                {message.modelUsed || 'Gemini 1.5 Flash'}
              </span>
              <span>{formattedTime}</span>
            </>
          )}
        </div>

        {/* Message Bubble Card */}
        <div
          className={`relative rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 shadow-md transition-all text-sm sm:text-[15px] leading-relaxed ${
            isUser
              ? 'bg-gradient-to-br from-cyan-600/90 to-blue-700/90 text-white rounded-tr-none shadow-cyan-600/10'
              : 'glass-panel text-slate-100 dark:text-slate-200 rounded-tl-none border border-slate-700/50 dark:border-white/10'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="markdown-content break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    return !inline ? (
                      <CodeBlock
                        language={match ? match[1] : ''}
                        value={codeString}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming pulse cursor */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle rounded-sm" />
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar for AI responses */}
        {isModel && !isStreaming && (
          <div className="flex items-center gap-1 mt-2 px-1 text-slate-400 select-none">
            {/* Copy Button */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Copy entire response"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Regenerate Button (available on the latest response) */}
            {isLatest && (
              <button
                onClick={regenerateLastMessage}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title="Regenerate this response"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            )}

            {/* Thumbs Up */}
            <button
              onClick={() => handleFeedback('like')}
              className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors ${
                message.feedback === 'like'
                  ? 'text-cyan-400 bg-cyan-950/40'
                  : 'hover:text-slate-200'
              }`}
              title="Good response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            {/* Thumbs Down */}
            <button
              onClick={() => handleFeedback('dislike')}
              className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors ${
                message.feedback === 'dislike'
                  ? 'text-rose-400 bg-rose-950/40'
                  : 'hover:text-slate-200'
              }`}
              title="Bad response"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* User Avatar (Right side) */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-[1.5px] shadow-md">
            <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white">
              <User className="w-4 h-4 text-cyan-300" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
