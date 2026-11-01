import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sun,
  Moon,
  LogOut,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Sidebar = ({
  isOpen,
  setIsOpen,
  onOpenSettings,
  onOpenAuth
}) => {
  const {
    conversations,
    currentConversationId,
    selectConversation,
    newChat,
    searchQuery,
    setSearchQuery,
    renameConversation,
    deleteConversation
  } = useChat();

  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Group conversations by date
  const groupConversations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    conversations.forEach((conv) => {
      const convDate = new Date(conv.updatedAt || conv.createdAt);
      if (convDate >= today) {
        groups.Today.push(conv);
      } else if (convDate >= yesterday) {
        groups.Yesterday.push(conv);
      } else if (convDate >= sevenDaysAgo) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    return groups;
  };

  const handleStartRename = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      deleteConversation(id);
    }
  };

  const grouped = groupConversations();

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800/80 bg-[#0a0e1a]/95 dark:bg-[#0a0e1a]/95 light:bg-slate-50/95 backdrop-blur-2xl ${
          isOpen ? 'w-72 sm:w-80 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        {/* Top Brand & Collapse Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/25 flex-shrink-0">
              <div className="w-full h-full rounded-[10px] bg-[#0c111d] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>

            {isOpen && (
              <div className="flex flex-col select-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                    AETHERIS
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                    AI
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Gemini Cognitive Core
                </span>
              </div>
            )}
          </div>

          {/* Toggle sidebar button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              newChat();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/30 text-cyan-300 font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-cyan-500/10 group ${
              !isOpen && 'md:p-2.5'
            }`}
            title="Start New Chat (Ctrl+K)"
          >
            <MessageSquarePlus className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            {isOpen && <span>New Conversation</span>}
          </button>
        </div>

        {/* Search Bar (When Open) */}
        {isOpen && (
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 scrollbar-thin">
          {isOpen ? (
            Object.entries(grouped).map(([label, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={label} className="space-y-1">
                  <div className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase select-none">
                    {label}
                  </div>
                  {items.map((conv) => {
                    const isActive = conv._id === currentConversationId;
                    const isEditing = editingId === conv._id;

                    return (
                      <div
                        key={conv._id}
                        onClick={() => {
                          selectConversation(conv._id);
                          if (window.innerWidth < 768) setIsOpen(false);
                        }}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-950/60 to-slate-800 text-cyan-300 font-medium border border-cyan-500/30'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />

                          {isEditing ? (
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(e, conv._id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <span className="truncate">{conv.title}</span>
                          )}
                        </div>

                        {/* Hover Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          {isEditing ? (
                            <button
                              onClick={(e) => handleSaveRename(e, conv._id)}
                              className="p-1 hover:text-emerald-400"
                              title="Save title"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={(e) => handleStartRename(e, conv)}
                                className="p-1 hover:text-cyan-300 text-slate-400"
                                title="Rename conversation"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, conv._id)}
                                className="p-1 hover:text-rose-400 text-slate-400"
                                title="Delete conversation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            /* Collapsed mini list */
            <div className="space-y-2 flex flex-col items-center pt-2">
              {conversations.slice(0, 10).map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => selectConversation(conv._id)}
                  className={`p-2.5 rounded-xl transition-all ${
                    conv._id === currentConversationId
                      ? 'bg-cyan-950/70 text-cyan-400 border border-cyan-500/40'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={conv.title}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              ))}
            </div>
          )}

          {isOpen && conversations.length === 0 && (
            <div className="text-center py-8 px-4 text-slate-500 text-xs">
              No conversations yet. Start a new chat above!
            </div>
          )}
        </div>

        {/* Footer Profile & Settings Area */}
        <div className="p-3 border-t border-slate-800/60 bg-slate-950/40">
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'Explorer'}`}
                    alt="avatar"
                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                </div>

                {isOpen && (
                  <div className="flex flex-col min-w-0 select-none">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {user?.name || 'Quantum Explorer'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {user?.email || 'Logged In'}
                    </span>
                  </div>
                )}
              </div>

              {isOpen && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                    title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={onOpenSettings}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={logout}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isOpen && <span>Sign In / Demo</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
