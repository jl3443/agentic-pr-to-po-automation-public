import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Paperclip, Sparkles, ExternalLink, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmailItem, RfxTicket } from '@/data/types';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';

interface EmailInboxViewProps {
  emails: EmailItem[];
  initialFolder?: 'inbox' | 'sent';
  onEmailRead?: (id: string) => void;
  returnTicketId?: string | null;
  onReturnToWorkflow?: (ticketId: string) => void;
  activePersona?: 'maker' | 'checker';
  tickets?: RfxTicket[];
  effectiveSapPo?: import('@/data/types').SapPoData;
}

// Determine AI insight text based on email content
function getAiInsight(email: EmailItem): { summary: string; action: string } {
  const subj = email.subject.toLowerCase();
  if (subj.includes('amended') && subj.includes('ready for qc review')) {
    return {
      summary: 'Amended PO has been updated by Maker and submitted for your QC review. Amendment details verified. Ready for re-validation and release.',
      action: 'Open QC Review →',
    };
  }
  if (subj.includes('ready for qc review')) {
    return {
      summary: 'PO has been created by Maker and submitted for your QC review. All validation checks passed. Ready for re-validation and release.',
      action: 'Open QC Review →',
    };
  }
  if (subj.includes('correction applied') || subj.includes('corrected')) {
    return {
      summary: 'Maker has corrected the data issue and resubmitted the PO. Re-validation checks should now pass. Ready for Checker release.',
      action: 'Open QC Review →',
    };
  }
  if (subj.includes('cost reduced') || subj.includes('resubmitted')) {
    return {
      summary: 'Maker has applied the cost reduction per Finance instruction and resubmitted the PO. Revised quantity is within the SIO budget. Ready for Checker QC.',
      action: 'Resume QC Review →',
    };
  }
  if (subj.includes('budget') && email.body?.includes('cannot allocate')) {
    return {
      summary: 'Finance cannot allocate additional budget. Cost reduction required — reduce PO quantity to bring the total within the SIO budget.',
      action: 'Apply Cost Reduction →',
    };
  }
  if (subj.includes('budget') && subj.includes('allocation')) {
    return {
      summary: 'Finance has allocated additional budget to cover the non-deductible tax shortfall. SIO code updated in SAP. PO is now within budget.',
      action: 'Submit PO to Checker →',
    };
  }
  if (subj.includes('amendment') || subj.includes('po 2430')) {
    return {
      summary: 'Amendment confirmed — budget approval reference received. Delivery schedule updated. Amendment cleared for Checker QC.',
      action: 'Resume Amendment Processing →',
    };
  }
  if (subj.includes('returned') && subj.includes('data correction')) {
    return {
      summary: 'Checker has identified a data error in the PO and returned it for correction. Please review the error details and fix the affected fields.',
      action: 'Open PO for Correction →',
    };
  }
  return {
    summary: 'Quantity mismatch resolved — confirmed 250 EA per latest indent approval. Revised annexure attached. Re-validation ready.',
    action: 'Resume RFX Processing →',
  };
}

// Analyzing steps shown during progress animation
const ANALYZE_STEPS = [
  'Reading email content...',
  'Cross-referencing with procurement data...',
  'Generating resolution summary...',
];

export function EmailInboxView({
  emails,
  initialFolder,
  onEmailRead,
  returnTicketId,
  onReturnToWorkflow,
  activePersona = 'maker',
  tickets,
  effectiveSapPo,
}: EmailInboxViewProps) {
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent'>(initialFolder ?? 'inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);

  // AI analyzing state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzed, setAnalyzed] = useState<string | null>(null); // email id that has been analyzed

  // Filter by persona: show emails for this persona or untagged (backwards compat)
  const personaMatch = (e: EmailItem) => !e.forPersona || e.forPersona === activePersona;
  const inboxEmails = emails.filter(e => e.type === 'incoming' && personaMatch(e));
  const sentEmails = emails.filter(e => e.type === 'outgoing' && personaMatch(e));
  const inboxUnread = inboxEmails.filter(e => !e.read).length;
  // Sort newest-first: emails added later appear at top
  const folderEmails = [...(activeFolder === 'inbox' ? inboxEmails : sentEmails)].reverse();

  const returnEmail = returnTicketId
    ? folderEmails.find(e => e.relatedTicketId === returnTicketId) ?? null
    : null;

  // Run analyzing animation for AI-flagged emails
  useEffect(() => {
    if (!analyzing) return;
    setAnalyzeStep(0);
    const timers = ANALYZE_STEPS.map((_, i) =>
      setTimeout(() => setAnalyzeStep(i + 1), (i + 1) * 650)
    );
    const done = setTimeout(() => {
      setAnalyzing(false);
      if (selectedEmail) setAnalyzed(selectedEmail.id);
    }, ANALYZE_STEPS.length * 650 + 300);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, [analyzing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = (email: EmailItem) => {
    setSelectedEmail(email);
    if (!email.read) onEmailRead?.(email.id);
    // Trigger AI analysis for reply/AI-flagged emails
    if ((email.isReply || email.relatedTicketId) && analyzed !== email.id) {
      setAnalyzed(null);
      setAnalyzing(true);
    }
  };

  const handleFolderChange = (folder: 'inbox' | 'sent') => {
    setActiveFolder(folder);
    setSelectedEmail(null);
    setAnalyzing(false);
    setAnalyzed(null);
  };

  const aiInsight = selectedEmail ? getAiInsight(selectedEmail) : null;
  const showAiInsights = selectedEmail && (selectedEmail.isReply || selectedEmail.relatedTicketId) && analyzed === selectedEmail.id;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar */}
      <div className="w-48 shrink-0 border-r border-slate-200 bg-white flex flex-col py-3 px-2 gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1">Folders</p>
        <button
          onClick={() => handleFolderChange('inbox')}
          className={cn(
            'flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
            activeFolder === 'inbox' ? 'bg-[#084A90]/10 text-[#084A90]' : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <span className="flex items-center gap-2"><Mail size={14} />Inbox</span>
          {inboxUnread > 0 && (
            <span className="rounded-full bg-[#084A90] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {inboxUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => handleFolderChange('sent')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
            activeFolder === 'sent' ? 'bg-[#084A90]/10 text-[#084A90]' : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <Send size={14} />Sent
        </button>

        {/* Return to workflow banner */}
        {returnTicketId && returnEmail && (
          <div className="mt-auto mb-2 mx-1 rounded-lg bg-amber-50 border border-amber-200 p-2">
            <p className="text-[10px] font-semibold text-amber-700 mb-1">Reply received</p>
            <button
              onClick={() => onReturnToWorkflow?.(returnTicketId)}
              className="text-[10px] text-[#084A90] font-semibold underline flex items-center gap-0.5"
            >
              Resume workflow <ExternalLink size={9} />
            </button>
          </div>
        )}
      </div>

      {/* Email list pane */}
      <div className={cn(
        'shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden',
        selectedEmail ? 'w-64' : 'flex-1'
      )}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            {activeFolder === 'inbox' ? <Mail size={14} className="text-[#084A90]" /> : <Send size={14} className="text-slate-500" />}
            <span className="text-sm font-bold text-slate-800 capitalize">{activeFolder}</span>
          </div>
          <span className="text-xs text-slate-400">{folderEmails.length} messages</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {folderEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              {activeFolder === 'inbox' ? <Mail size={36} /> : <Send size={36} />}
              <p className="text-sm">No messages in {activeFolder}</p>
            </div>
          ) : (
            folderEmails.map(email => {
              const isSelected = selectedEmail?.id === email.id;
              const sender = activeFolder === 'inbox' ? email.from : email.to;
              return (
                <button
                  key={email.id}
                  onClick={() => handleOpen(email)}
                  className={cn(
                    'w-full flex items-start gap-2.5 px-3 py-3 text-left transition-colors',
                    isSelected ? 'bg-[#084A90]/8 border-l-2 border-[#084A90]' : 'hover:bg-slate-50',
                    !email.read && !isSelected && 'bg-blue-50/40'
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    activeFolder === 'inbox' ? 'bg-[#084A90]/10 text-[#084A90]' : 'bg-slate-100 text-slate-600'
                  )}>
                    {sender.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn('text-xs truncate', !email.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>
                        {sender}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{email.date}</span>
                    </div>
                    <p className={cn('text-[11px] truncate mt-0.5', !email.read ? 'font-semibold text-slate-800' : 'text-slate-600')}>
                      {email.subject}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{email.preview}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {email.attachments.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                          <Paperclip size={9} />{email.attachments.length}
                        </span>
                      )}
                      {email.isReply && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1 py-0.5 text-[9px] font-medium text-amber-700">
                          <Sparkles size={8} />AI
                        </span>
                      )}
                      {!email.read && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-[#084A90] shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right pane — full email view */}
      {selectedEmail && (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <AnimatePresence mode="wait">
            {analyzing ? (
              /* ── AI Analyzing overlay ── */
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col items-center justify-center gap-6 px-10"
              >
                {/* Pulse icon */}
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#084A90]/10"
                >
                  <Sparkles size={28} className="text-[#084A90]" />
                </motion.div>

                <div className="w-full max-w-sm space-y-4">
                  <p className="text-sm font-semibold text-slate-700 text-center">AI Agent Analyzing Email</p>

                  {/* Step list */}
                  <div className="space-y-2">
                    {ANALYZE_STEPS.map((step, i) => {
                      const done = analyzeStep > i + 1;
                      const active = analyzeStep === i + 1;
                      return (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: analyzeStep >= i + 1 ? 1 : 0.25, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-2.5"
                        >
                          <div className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all',
                            done ? 'bg-green-500 text-white' :
                            active ? 'bg-[#084A90] text-white' :
                            'bg-slate-200 text-slate-400'
                          )}>
                            {done ? '✓' : i + 1}
                          </div>
                          <span className={cn(
                            'text-xs transition-all',
                            done ? 'text-green-700 font-medium' :
                            active ? 'text-slate-800 font-semibold' :
                            'text-slate-400'
                          )}>
                            {step}
                          </span>
                          {active && (
                            <motion.span
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ repeat: Infinity, duration: 0.8 }}
                              className="ml-auto text-[10px] text-[#084A90] font-medium"
                            >
                              Processing...
                            </motion.span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#084A90]"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(analyzeStep / ANALYZE_STEPS.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    {Math.round((analyzeStep / ANALYZE_STEPS.length) * 100)}% complete
                  </p>
                </div>
              </motion.div>
            ) : (
              /* ── Email content ── */
              <motion.div
                key="email-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* AI insight banner (shown after analyzing) */}
                {showAiInsights && aiInsight && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="shrink-0 flex items-center justify-between gap-3 px-5 py-2.5 bg-amber-50 border-b border-amber-200"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <CheckCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">AI Agent Analyzed</p>
                        <p className="text-xs text-amber-800 leading-snug">{aiInsight.summary}</p>
                      </div>
                    </div>
                    {selectedEmail.relatedTicketId && onReturnToWorkflow ? (
                      <button
                        onClick={() => onReturnToWorkflow(selectedEmail.relatedTicketId!)}
                        className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#084A90] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#063A70]"
                      >
                        {aiInsight.action}
                      </button>
                    ) : null}
                  </motion.div>
                )}

                {/* Email header */}
                <div className="shrink-0 px-6 py-4 border-b border-slate-200 space-y-1.5">
                  <h2 className="text-base font-bold text-slate-900">{selectedEmail.subject}</h2>
                  <div className="space-y-1">
                    {[
                      ['From', `${selectedEmail.from} <${selectedEmail.fromEmail}>`],
                      ['To', `${selectedEmail.to} <${selectedEmail.toEmail}>`],
                      ...(selectedEmail.cc ? [['CC', selectedEmail.cc]] : []),
                      ['Date', selectedEmail.date],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center gap-3 text-xs">
                        <span className="w-10 shrink-0 text-slate-500 font-medium">{label}</span>
                        <span className="text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{selectedEmail.body}</p>
                </div>

                {/* Attachments */}
                {selectedEmail.attachments.length > 0 && (
                  <div className="shrink-0 px-6 py-3 border-t border-slate-100 bg-slate-50">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Attachments</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEmail.attachments.map(a => (
                        <button
                          key={a}
                          onClick={() => setPreviewAttachment(a)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-[#084A90] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                        >
                          <FileText size={11} className="text-red-400 group-hover:text-red-500" />{a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {!selectedEmail && <div className="hidden" />}

      {/* Attachment preview modal */}
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
    </div>
  );
}
