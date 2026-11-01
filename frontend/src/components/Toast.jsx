import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export const Toast = () => {
  const { errorToast, successToast } = useChat();

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none select-none">
      <AnimatePresence>
        {errorToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs shadow-2xl backdrop-blur-md max-w-sm pointer-events-auto"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="font-medium leading-snug">{errorToast}</span>
          </motion.div>
        )}

        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs shadow-2xl backdrop-blur-md max-w-sm pointer-events-auto"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-medium leading-snug">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
