import React, { useRef, useEffect, useState } from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { WelcomeScreen } from './WelcomeScreen';
import { useChat } from '../context/ChatContext';

export const ChatArea = ({ onSelectPrompt }) => {
  const {
    messages,
    isStreaming,
    streamingContent,
    isLoadingMessages
  } = useChat();

  const scrollContainerRef = useRef(null);
  const bottomAnchorRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll to bottom on new message or stream chunk
  const scrollToBottom = (smooth = true) => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, streamingContent]);

  // Handle scroll to toggle "jump to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto relative flex flex-col scrollbar-thin"
    >
      {isLoadingMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-cyan-400">
          <Sparkles className="w-8 h-8 animate-spin-slow" />
          <span className="text-sm font-medium text-slate-400">
            Reconstructing neural synapse history...
          </span>
        </div>
      ) : !hasMessages ? (
        <WelcomeScreen onSelectPrompt={onSelectPrompt} />
      ) : (
        <div className="flex-1 max-w-4xl mx-auto w-full py-4 space-y-1">
          {/* History Messages */}
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg._id || idx}
              message={msg}
              isLatest={idx === messages.length - 1 && !isStreaming}
            />
          ))}

          {/* Active Streaming Message Bubble */}
          {isStreaming && (
            <div className="w-full">
              {streamingContent ? (
                <MessageBubble
                  message={{
                    _id: 'active-stream',
                    role: 'model',
                    content: streamingContent,
                    createdAt: new Date().toISOString()
                  }}
                  isLatest={true}
                  isStreaming={true}
                />
              ) : (
                /* Thinking Pulse Shimmer */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-4 px-4 sm:px-6 flex items-center gap-3 text-cyan-400 text-sm select-none"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
                    <div className="w-full h-full rounded-[10px] bg-[#0c111d] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-slate-900/80 px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-300">
                    <span className="animate-pulse">Synthesizing response with Gemini neural core...</span>
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <div ref={bottomAnchorRef} className="h-4" />
        </div>
      )}

      {/* Floating Jump to Bottom Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-24 right-6 sm:right-10 p-2.5 rounded-full bg-slate-900/90 hover:bg-cyan-950 text-cyan-400 border border-cyan-500/40 shadow-xl backdrop-blur-md transition-all z-20 group"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
