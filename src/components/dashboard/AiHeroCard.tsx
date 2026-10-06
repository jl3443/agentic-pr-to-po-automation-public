import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AiHeroCardProps {
  summary: string;
  chips: { label: string; type: 'critical' | 'warning' | 'positive' }[];
}

const chipColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300 ring-red-400/20',
  warning: 'bg-amber-500/20 text-amber-300 ring-amber-400/20',
  positive: 'bg-green-500/20 text-green-300 ring-green-400/20',
};

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const chipVariant = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

// Typewriter: streams words in one-by-one
function TypewriterText({ text, delayMs = 0 }: { text: string; delayMs?: number }) {
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);
  const [thinking, setThinking] = useState(true);

  useEffect(() => {
    // Show thinking dots first, then start streaming words
    const startTimer = setTimeout(() => {
      setThinking(false);
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        setVisibleCount(i);
        if (i >= words.length) clearInterval(interval);
      }, 38); // ~38ms per word → full sentence in ~1.5s
      return () => clearInterval(interval);
    }, delayMs + 600); // 600ms thinking dots first

    return () => clearTimeout(startTimer);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  if (thinking) {
    return (
      <div className="mt-1 flex items-center gap-1.5 h-5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-slate-500"
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
    );
  }

  return (
    <p className="mt-1 text-sm leading-relaxed text-slate-300">
      {words.slice(0, visibleCount).join(' ')}
      {visibleCount < words.length && (
        <motion.span
          className="inline-block w-0.5 h-3.5 bg-blue-400 ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </p>
  );
}

export function AiHeroCard({ summary, chips }: AiHeroCardProps) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-4 py-3 shadow-lg ring-1 ring-white/5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#084A90]/30 ring-1 ring-blue-400/20">
          <Sparkles size={16} className="text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">AI Decision Intelligence</h3>
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400 ring-1 ring-blue-400/20">
              AI-Powered
            </span>
            <span className="ml-auto text-[11px] text-slate-500">Updated 2m ago</span>
          </div>
          <TypewriterText text={summary} delayMs={0} />
          <motion.div
            className="mt-2.5 flex flex-wrap gap-1.5"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {chips.map((chip) => (
              <motion.span
                key={chip.label}
                variants={chipVariant}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ring-1',
                  chipColors[chip.type]
                )}
              >
                {chip.label}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
