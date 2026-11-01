import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Key,
  Cpu,
  Sliders,
  Sun,
  Moon,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Activity
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export const SettingsModal = ({ isOpen, onClose }) => {
  const {
    geminiModel,
    updateModel,
    apiKeyOverride,
    updateApiKey,
    systemInstruction,
    updateInstruction,
    clearAllConversations,
    showSuccess
  } = useChat();

  const { theme, toggleTheme } = useTheme();

  const [localKey, setLocalKey] = useState(apiKeyOverride);
  const [localModel, setLocalModel] = useState(geminiModel);
  const [localInstruction, setLocalInstruction] = useState(systemInstruction);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalKey(apiKeyOverride);
      setLocalModel(geminiModel);
      setLocalInstruction(systemInstruction);
      checkHealth();
    }
  }, [isOpen, apiKeyOverride, geminiModel, systemInstruction]);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await api.getHealth();
      setHealthStatus(data);
    } catch (err) {
      setHealthStatus({ status: 'unreachable', error: err.message });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSave = () => {
    updateApiKey(localKey.trim());
    updateModel(localModel);
    updateInstruction(localInstruction.trim());
    showSuccess('Settings updated successfully');
    onClose();
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all conversations permanently?')) {
      clearAllConversations();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg rounded-2xl glass-panel bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Settings</h2>
              <p className="text-xs text-slate-400">Configure AI engine parameters and preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto scrollbar-thin">
          {/* Backend Status Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-slate-300">Engine Health</span>
            </div>

            <div className="flex items-center gap-2">
              {isCheckingHealth ? (
                <span className="text-slate-400">Pinging...</span>
              ) : healthStatus?.status === 'healthy' ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Online ({healthStatus.mongoConnected ? 'MongoDB' : 'JSON Store'})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Offline
                </span>
              )}
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              placeholder="Enter your AI Studio API key (starts with AIzaSy...)"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              If left blank, the system uses the default backend key. Your key is stored securely in your browser session.
            </p>
          </div>

          {/* Gemini Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Active AI Model
            </label>
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Latest default, high-speed & 1M context)</option>
              <option value="gemini-3.8-pro">Gemini 3.8 Pro (Maximum intelligence & deep reasoning)</option>
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Fast)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
            </select>
          </div>

          {/* Custom System Instruction */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Custom Persona / System Instructions
            </label>
            <textarea
              rows={3}
              placeholder="e.g. You are a senior software architect. Provide direct TypeScript answers with clean design patterns."
              value={localInstruction}
              onChange={(e) => setLocalInstruction(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none font-sans"
            />
          </div>

          {/* Theme & Appearance */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">Theme Mode</span>
              <span className="text-[11px] text-slate-500">Toggle between Dark and Light interface</span>
            </div>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Danger Zone: Clear History */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-400 block">Clear History</span>
              <span className="text-[11px] text-slate-500">Permanently delete all previous chats</span>
            </div>

            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

