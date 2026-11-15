import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sparkles,
  Settings,
  Plus,
  LogIn
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';

function ChatDashboard() {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const { newChat, sendMessage } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const inputRef = useRef(null);

  // Auto-login guest if first time visiting for friction-free instant test
  useEffect(() => {
    const hasToken = localStorage.getItem('aetheris_token');
    if (!hasToken) {
      demoLogin();
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + K or Cmd + K -> New Chat
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        newChat();
      }
      // Ctrl + / or Cmd + / -> Open Settings
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newChat]);

  // Handle clicking a prompt suggestion from the WelcomeScreen
  const handleSelectPrompt = (promptText) => {
    sendMessage(promptText);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800/60 px-4 flex items-center justify-between select-none glass-panel z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Aetheris AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Gemini Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={newChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              title="New Chat (Ctrl+K)"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Settings (Ctrl+/)"
            >
              <Settings className="w-4 h-4" />
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-medium shadow-md transition-all hover:brightness-110"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Chat Area */}
        <ChatArea onSelectPrompt={handleSelectPrompt} />

        {/* Floating Chat Input Bar */}
        <ChatInput inputRef={inputRef} />
      </div>

      {/* Modals & Global Notifications */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <ChatDashboard />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
