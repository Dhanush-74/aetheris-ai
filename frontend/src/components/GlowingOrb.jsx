import React from 'react';
import { motion } from 'framer-motion';

export const GlowingOrb = ({ isThinking = false, size = 'lg' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44'
  }[size];

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses} mx-auto my-4 select-none`}>
      {/* Outer ambient glow */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.25, 1] : [1, 1.08, 1],
          opacity: isThinking ? [0.6, 0.9, 0.6] : [0.35, 0.55, 0.35]
        }}
        transition={{
          duration: isThinking ? 1.5 : 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 blur-2xl"
      />

      {/* Outer orbital ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: isThinking ? 6 : 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border border-cyan-400/25 border-dashed"
      />

      {/* Middle reverse orbital ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: isThinking ? 8 : 28, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-2 rounded-full border border-purple-400/30 border-t-transparent border-b-transparent"
      />

      {/* Inner core orb */}
      <motion.div
        animate={{
          scale: isThinking ? [0.92, 1.05, 0.92] : [0.96, 1.02, 0.96]
        }}
        transition={{
          duration: isThinking ? 1.2 : 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="relative z-10 w-3/4 h-3/4 rounded-full bg-gradient-to-br from-cyan-300 via-sky-500 to-indigo-700 shadow-[0_0_40px_rgba(0,242,254,0.6)] flex items-center justify-center overflow-hidden"
      >
        {/* Core highlight sheen */}
        <div className="absolute top-1 left-2 w-1/2 h-1/2 rounded-full bg-white/40 blur-[2px]" />

        {/* Neural synapse pulse glyph */}
        <div className="relative text-white font-mono font-bold text-xs tracking-widest uppercase opacity-85">
          {isThinking ? (
            <motion.span
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              SYNAPSE
            </motion.span>
          ) : (
            'AETHERIS'
          )}
        </div>
      </motion.div>

      {/* Satellite orbiting spark */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#00f2fe] absolute -top-1 left-1/2 -translate-x-1/2" />
      </motion.div>
    </div>
  );
};
