import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Code2,
  Lightbulb,
  Wrench,
  GraduationCap,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { GlowingOrb } from './GlowingOrb';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

export const WelcomeScreen = ({ onSelectPrompt }) => {
  const { user } = useAuth();
  const { isStreaming } = useChat();

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'Explorer';

  const suggestionCards = [
    {
      title: 'Explain Something',
      description: 'Deconstruct quantum entanglement or general relativity with intuition & math',
      prompt: 'Can you explain quantum computing and superposition using simple intuition, key principles, and mathematical equations?',
      icon: BookOpen,
      color: 'from-cyan-500/20 to-blue-500/10',
      border: 'border-cyan-500/30 text-cyan-400'
    },
    {
      title: 'Write Code',
      description: 'Generate production-ready code in TypeScript, Python, Go, or React',
      prompt: 'Write a resilient TypeScript asynchronous queue with concurrency limits, exponential retry backoff, and full type safety.',
      icon: Code2,
      color: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/30 text-emerald-400'
    },
    {
      title: 'Generate Ideas',
      description: 'Brainstorm 10 disruptive startup concepts with product moats',
      prompt: 'Brainstorm 5 innovative, venture-scale AI startup concepts solving critical problems in healthcare or developer tooling.',
      icon: Lightbulb,
      color: 'from-amber-500/20 to-orange-500/10',
      border: 'border-amber-500/30 text-amber-400'
    },
    {
      title: 'Solve Problems',
      description: 'Diagnose architectural bottlenecks, race conditions, or memory leaks',
      prompt: 'What are the most common causes of high latency and connection pool exhaustion in Node.js with MongoDB, and how do I fix them?',
      icon: Wrench,
      color: 'from-rose-500/20 to-pink-500/10',
      border: 'border-rose-500/30 text-rose-400'
    },
    {
      title: 'Learn New Skills',
      description: 'Design a personalized masterclass roadmap for any complex domain',
      prompt: 'Create a structured 4-week roadmap to master modern Generative AI, embeddings, vector databases, and RAG pipelines.',
      icon: GraduationCap,
      color: 'from-purple-500/20 to-indigo-500/10',
      border: 'border-purple-500/30 text-purple-400'
    },
    {
      title: 'Help With Projects',
      description: 'Architect scalable cloud systems, database schemas, and API contracts',
      prompt: 'How should I architect an event-driven system for a real-time multiplayer application handling 100,000 concurrent connections?',
      icon: Layers,
      color: 'from-sky-500/20 to-blue-600/10',
      border: 'border-sky-500/30 text-sky-400'
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-5xl mx-auto w-full select-none">
      {/* Centered Glowing Neural Orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlowingOrb size="lg" isThinking={isStreaming} />
      </motion.div>

      {/* Dynamic Personalized Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-center space-y-2 mt-2 mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Aetheris AI · Powered by Google Gemini</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
          {getGreetingTime()},{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">
            {userName}
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          How can Aetheris elevate your cognition today? Select a capability below or ask any question.
        </p>
      </motion.div>

      {/* 6 Suggestion Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full"
      >
        {suggestionCards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <motion.button
              key={card.title}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectPrompt(card.prompt)}
              className={`group text-left p-4 rounded-2xl glass-panel bg-gradient-to-br ${card.color} border ${card.border} hover:border-cyan-400/60 transition-all duration-200 shadow-lg flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl bg-slate-900/60 border border-slate-700/50 ${card.border}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
