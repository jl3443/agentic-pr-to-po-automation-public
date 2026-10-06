import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, CheckCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmailItem, RfxTicket } from '@/data/types';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';

interface EmailModalProps {
  email: EmailItem;
  mode: 'view' | 'compose';
  onClose: () => void;
  onSend?: (email: EmailItem) => void;
  showFollowUp?: boolean;
  tickets?: RfxTicket[];
  effectiveSapPo?: import('@/data/types').SapPoData;
}

// ── Follow-Up Phase ──────────────────────────────────────────────────────────
function FollowUpPhase({
  updated,
  onConfirm,
  onSkip,
}: {
  updated: EmailItem;
  onConfirm: (e: EmailItem) => void;
  onSkip: (e: EmailItem) => void;
}) {
  const today = new Date();

  // Quick selection: 'quick' | 'custom'
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');
  const [customDays, setCustomDays] = useState(3);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calendar state
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

  const quickDate = new Date(today);
  quickDate.setDate(quickDate.getDate() + 2);

  const computedDate: Date = (() => {
    if (selectedDate) return selectedDate;
    if (mode === 'quick') return quickDate;
    const d = new Date(today);
    d.setDate(d.getDate() + customDays);
    return d;
  })();

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Build calendar grid
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <h3 className="text-sm font-bold text-slate-800">Set a follow-up reminder</h3>

      {/* Quick vs Custom toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode('quick'); setSelectedDate(null); }}
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
            mode === 'quick'
              ? 'border-[#084A90] bg-[#084A90] text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          Follow up in 2 days
        </button>
        <button
          onClick={() => setMode('custom')}
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
            mode === 'custom'
              ? 'border-[#084A90] bg-[#084A90] text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          Custom
        </button>
      </div>

      {/* Custom row */}
      {mode === 'custom' && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-600">Days:</label>
          <input
            type="number"
            min={1}
            max={30}
            value={customDays}
            onChange={e => { setCustomDays(Number(e.target.value)); setSelectedDate(null); }}
            className="w-16 rounded-md border border-slate-200 px-2 py-1 text-xs text-center focus:border-[#084A90] focus:outline-none"
          />
          <span className="text-xs text-slate-500">Follow up on {formatDate(computedDate)}</span>
        </div>
      )}

      {/* Mini calendar */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
          <button onClick={prevMonth} className="rounded p-0.5 hover:bg-slate-200 transition-colors">
            <ChevronLeft size={14} className="text-slate-600" />
          </button>
          <span className="text-xs font-semibold text-slate-700">{monthName}</span>
          <button onClick={nextMonth} className="rounded p-0.5 hover:bg-slate-200 transition-colors">
            <ChevronRight size={14} className="text-slate-600" />
          </button>
        </div>
        <div className="p-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-center text-[9px] font-semibold text-slate-400 py-0.5">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const cellDate = new Date(calYear, calMonth, day);
              const isToday = isSameDay(cellDate, today);
              const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : isSameDay(cellDate, computedDate);
              const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <button
                  key={day}
                  disabled={isPast}
                  onClick={() => { setSelectedDate(cellDate); setMode('custom'); }}
                  className={cn(
                    'rounded text-[10px] py-1 font-medium transition-colors',
                    isSelected ? 'bg-[#084A90] text-white' : '',
                    !isSelected && isToday ? 'bg-blue-50 text-[#084A90] font-bold' : '',
                    !isSelected && !isToday && !isPast ? 'text-slate-700 hover:bg-slate-100' : '',
                    isPast ? 'text-slate-300 cursor-not-allowed' : '',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected reminder display */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700 font-medium">
        Reminder set: Follow up on {formatDate(computedDate)}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-1">
        <button
          onClick={() => onSkip(updated)}
          className="text-xs text-slate-500 underline hover:text-slate-700 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => onConfirm(updated)}
          className="rounded-lg bg-[#084A90] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

// ── Main EmailModal ──────────────────────────────────────────────────────────
export function EmailModal({ email, mode, onClose, onSend, showFollowUp, tickets, effectiveSapPo }: EmailModalProps) {
  const [to, setTo] = useState(email.to);
  const [cc, setCc] = useState(email.cc ?? '');
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [sent, setSent] = useState(false);
  const [showFollowUpSection, setShowFollowUpSection] = useState(false);
  const [updatedEmail, setUpdatedEmail] = useState<EmailItem | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);

  const isCompose = mode === 'compose';

  const handleSend = () => {
    const updated: EmailItem = { ...email, to, cc, subject, body };
    setSent(true);
    if (showFollowUp && isCompose) {
      setTimeout(() => {
        setUpdatedEmail(updated);
        setShowFollowUpSection(true);
      }, 700);
    } else {
      setTimeout(() => {
        onSend?.(updated);
        onClose();
      }, 1200);
    }
  };

  const handleFollowUpConfirm = (u: EmailItem) => {
    onSend?.(u);
    onClose();
  };

  const handleFollowUpSkip = (u: EmailItem) => {
    onSend?.(u);
    onClose();
  };

  return (
    <>
    <AnimatePresence>
      <motion.div
        key="email-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="email-modal"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#084A90]">
                <Mail size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                {isCompose ? 'Compose Email' : 'View Email'}
              </span>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Sent confirmation banner */}
          {sent && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-50 border-b border-green-100 shrink-0"
            >
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-xs font-semibold text-green-700">Email sent successfully</span>
            </motion.div>
          )}

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Fields */}
            <div className="px-5 py-3 border-b border-slate-100 space-y-2 shrink-0">
              {/* From */}
              <div className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 text-xs font-medium text-slate-500">From</span>
                <span className="text-slate-700 text-xs">{email.from} &lt;{email.fromEmail}&gt;</span>
              </div>
              {/* To */}
              <div className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs font-medium text-slate-500">To</span>
                {isCompose && !sent ? (
                  <input
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-[#084A90] focus:outline-none focus:ring-1 focus:ring-[#084A90]/20"
                  />
                ) : (
                  <span className="text-xs text-slate-700">{to} &lt;{email.toEmail}&gt;</span>
                )}
              </div>
              {/* CC */}
              <div className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs font-medium text-slate-500">CC</span>
                {isCompose && !sent ? (
                  <input
                    value={cc}
                    onChange={e => setCc(e.target.value)}
                    className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-[#084A90] focus:outline-none"
                    placeholder="CC recipients..."
                  />
                ) : (
                  <span className="text-xs text-slate-500">{cc || '—'}</span>
                )}
              </div>
              {/* Subject */}
              <div className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs font-medium text-slate-500">Subject</span>
                {isCompose && !sent ? (
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 focus:border-[#084A90] focus:outline-none"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-800">{subject}</span>
                )}
              </div>
              {/* Date (view only) */}
              {!isCompose && (
                <div className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-xs font-medium text-slate-500">Date</span>
                  <span className="text-xs text-slate-500">{email.date}</span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="px-5 py-3 flex-1">
              {isCompose && !sent ? (
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full h-full min-h-[140px] resize-none text-sm text-slate-700 leading-relaxed focus:outline-none"
                />
              ) : body.includes('<table') ? (
                <div className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{body}</p>
              )}
            </div>

            {/* Inline follow-up section */}
            {showFollowUpSection && updatedEmail && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-blue-100 bg-blue-50/40"
              >
                <FollowUpPhase
                  updated={updatedEmail}
                  onConfirm={handleFollowUpConfirm}
                  onSkip={handleFollowUpSkip}
                />
              </motion.div>
            )}
          </div>

          {/* Attachments + Footer — hidden after send */}
          {!sent && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
              {email.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {email.attachments.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setPreviewAttachment(a)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-[#084A90] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                    >
                      <FileText size={10} className="text-red-400 group-hover:text-red-500 shrink-0" />
                      {a}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {isCompose ? 'Discard' : 'Close'}
                </button>
                {isCompose && (
                  <button
                    onClick={handleSend}
                    className="flex items-center gap-2 rounded-lg bg-[#084A90] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#084A90]/90"
                  >
                    <Send size={14} /> Send
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>

    {/* Attachment preview */}
    <AnimatePresence>
      {previewAttachment && (
        <AttachmentPreviewModal
          filename={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          tickets={tickets}
          effectiveSapPo={effectiveSapPo}
        />
      )}
    </AnimatePresence>
    </>
  );
}
