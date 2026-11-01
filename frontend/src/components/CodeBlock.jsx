import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

export const CodeBlock = ({ language = 'code', value = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const lineCount = value.split('\n').length;

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-700/60 bg-[#070b12] text-slate-200 font-mono text-sm shadow-xl">
      {/* Code header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold uppercase tracking-wider text-cyan-300">
            {language || 'plaintext'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">{lineCount} lines</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-150 border border-slate-700"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed scrollbar-thin">
        <pre className="m-0 font-mono">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
