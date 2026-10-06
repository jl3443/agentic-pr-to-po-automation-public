import { motion } from 'framer-motion';
import { CheckCircle2, FileCheck2, Package, X } from 'lucide-react';

interface ReadyAnimationProps {
  shipmentId: string;
  totalDocs: number;
  onDismiss: () => void;
}

const GATES = [
  'Docs Received',
  'Validated',
  'Compliance',
  'Handoff Ready',
];

export function ReadyAnimation({ shipmentId, totalDocs, onDismiss }: ReadyAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ type: 'spring', damping: 22, stiffness: 250 }}
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 z-10 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Green gradient top strip */}
        <div className="h-2 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

        <div className="px-8 py-8 flex flex-col items-center text-center gap-5">
          {/* Animated checkmark with pulse rings */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulse rings */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [1, 1.35, 1.6], opacity: [0.5, 0.25, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.5 }}
              className="absolute h-28 w-28 rounded-full bg-green-200"
            />
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: [1, 1.25, 1.45], opacity: [0.6, 0.3, 0] }}
              transition={{ duration: 1.8, delay: 0.15, repeat: Infinity, repeatDelay: 0.5 }}
              className="absolute h-24 w-24 rounded-full bg-green-300"
            />

            {/* Check icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 16, stiffness: 200, delay: 0.1 }}
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-lg shadow-green-200"
            >
              <CheckCircle2 className="h-11 w-11 text-green-600" strokeWidth={2} />
            </motion.div>
          </div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-green-600 mb-1">
              Document Pack Complete
            </p>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
              Cleared for Handoff
            </h2>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              <FileCheck2 size={13} className="text-slate-500" />
              <code className="text-xs font-mono font-bold text-slate-700">{shipmentId}</code>
            </div>
          </motion.div>

          {/* Gate check grid */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid grid-cols-2 gap-2 w-full"
          >
            {GATES.map((gate, i) => (
              <motion.div
                key={gate}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2"
              >
                <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                <span className="text-xs font-medium text-green-800">{gate}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-4 text-xs text-slate-500"
          >
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span><strong className="text-slate-700">{totalDocs}</strong> of {totalDocs} docs verified</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>No open exceptions</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>100% ready</span>
            </span>
          </motion.div>

          {/* Assemble Doc Pack CTA + Dismiss */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-3 w-full"
          >
            <button
              onClick={onDismiss}
              className="flex-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200"
            >
              <Package size={15} />
              Assemble Final Doc Pack
            </button>
            <button
              onClick={onDismiss}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
