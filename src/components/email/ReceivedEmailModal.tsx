import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X } from 'lucide-react';
import type { EmailItem } from '@/data/types';

interface ReceivedEmailModalProps {
  email: EmailItem;
  onClose: () => void;
  onViewInbox?: () => void;
}

export function ReceivedEmailModal({ email, onClose, onViewInbox }: ReceivedEmailModalProps) {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bodyLines = email.body.split('\n').filter(l => l.trim()).slice(0, 2).join(' ');

  return (
    <AnimatePresence>
      <motion.div
        key="received-email-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="received-email-modal"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Accent bar */}
          <div className="h-1 bg-[#084A90]" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">New Email Received</span>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 pb-5 flex flex-col items-center gap-4">
            {/* Animated envelope icon */}
            <motion.div
              animate={{
                scale: [1, 1.12, 1, 1.06, 1],
                y: [0, -4, 0, -2, 0],
              }}
              transition={{ duration: 1.2, ease: 'easeInOut', repeat: 1 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#084A90]/10"
            >
              <Mail size={30} className="text-[#084A90]" />
            </motion.div>

            <div className="w-full text-center space-y-1">
              <p className="text-sm font-bold text-slate-900">{email.from}</p>
              <p className="text-xs font-semibold text-slate-700">{email.subject}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-2">{bodyLines}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full mt-1">
              {onViewInbox && (
                <button
                  onClick={() => { onViewInbox(); onClose(); }}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  View in Inbox
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-[#084A90] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#063A70]"
              >
                Continue Workflow
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
