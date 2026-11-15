import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileCode, Printer, ChevronDown } from 'lucide-react';
import { exportToMarkdown, exportToText, exportToPDF } from '../utils/exportChat';
import { useChat } from '../context/ChatContext';

export const ExportDropdown = () => {
  const { messages, conversations, currentConversationId } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentConv = conversations.find(c => c._id === currentConversationId);
  const title = currentConv ? currentConv.title : 'Aetheris_AI_Chat';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!messages || messages.length === 0) {
    return null;
  }

  const handleExport = (format) => {
    setIsOpen(false);
    if (format === 'pdf') {
      exportToPDF(title, messages);
    } else if (format === 'markdown') {
      exportToMarkdown(title, messages);
    } else if (format === 'text') {
      exportToText(title, messages);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-all"
        title="Export conversation"
      >
        <Download className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl py-1.5 z-50 backdrop-blur-xl">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-500 border-b border-slate-800">
            Export Conversation
          </div>

          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 text-left transition-colors"
          >
            <Printer className="w-4 h-4 text-rose-400" />
            <div>
              <div className="font-medium">Save as PDF</div>
              <div className="text-[10px] text-slate-500">Print or PDF export</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('markdown')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 text-left transition-colors"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="font-medium">Markdown (.md)</div>
              <div className="text-[10px] text-slate-500">Formatted for docs</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('text')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 text-left transition-colors"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="font-medium">Plain Text (.txt)</div>
              <div className="text-[10px] text-slate-500">Raw dialog log</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
