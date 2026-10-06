import { useState, useMemo, useCallback, useRef } from 'react';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle, Building2, Mail, Paperclip, FileText } from 'lucide-react';

import { scenarios } from '@/data/scenarios';
import { AttachmentPreviewModal } from '@/components/email/AttachmentPreviewModal';
import type { ViewTab, Persona, EmailItem } from '@/data/types';
import type { AiAction } from '@/data/ai-responses';

import { LoginPage } from '@/components/auth/LoginPage';
import { TopBar } from '@/components/layout/TopBar';
import { PoDashboard } from '@/components/dashboard/PoDashboard';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { EmailInboxView } from '@/components/email/EmailInboxView';
import { EmailModal } from '@/components/email/EmailModal';
import { ReceivedEmailModal } from '@/components/email/ReceivedEmailModal';
import { PrWorkflowPanel } from '@/components/workflow/PrWorkflowPanel';
import { PdfPreviewPanel } from '@/components/workflow/PdfPreviewPanel';
import { AiChatPanel } from '@/components/ai/AiChatPanel';

// ── PO Success Modal ────────────────────────────────────────────────────────
function PoSuccessModal({
  supplier,
  subject,
  attachments,
  onClose,
  tickets,
  effectiveSapPo,
}: {
  supplier: string;
  subject: string;
  attachments: string[];
  onClose: () => void;
  tickets?: import('@/data/types').RfxTicket[];
  effectiveSapPo?: import('@/data/types').SapPoData;
}) {
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Green header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.15, duration: 0.5, bounce: 0.55 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 border-2 border-white/40"
          >
            <CheckCircle size={36} className="text-white" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-white"
          >
            PO Successfully Placed &amp; Sent
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-1 text-sm text-green-100"
          >
            Confirmation email dispatched · Logged in Sent folder
          </motion.p>
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-2.5">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3"
          >
            <Building2 size={15} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Supplier</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{supplier}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.42 }}
            className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3"
          >
            <Mail size={15} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Subject</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{subject}</p>
            </div>
          </motion.div>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.49 }}
              className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3"
            >
              <Paperclip size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Attachments</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {attachments.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setPreviewAttachment(a)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-[#084A90] font-medium shadow-sm hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer"
                    >
                      <FileText size={11} className="shrink-0" />
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <p className="text-center text-[11px] text-slate-400 pt-0.5">
            Ticket status updating — Update step completing…
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#084A90] px-10 py-2.5 text-sm font-semibold text-white hover:bg-[#063A70] transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>

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
    </motion.div>
  );
}

export default function App() {
  // ── Login state ──
  const [showLogin, setShowLogin] = useState(true);

  // ── Core state ──
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [activeScenarioId, setActiveScenarioId] = useState(scenarios[0].id);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activePersona, setActivePersona] = useState<Persona>('maker');

  // ── Panel state ──
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [currentWorkflowStage, setCurrentWorkflowStage] = useState(0);
  const [expandedPanel, setExpandedPanel] = useState(false);

  // Track per-ticket completed stages (Maker submits → Checker picks up)
  const [ticketStages, setTicketStages] = useState<Record<string, number>>({});
  // Tickets that have been fully released — shown as "Routine" in the queue
  const [completedTicketIds, setCompletedTicketIds] = useState<string[]>([]);
  // Scenarios whose primary ticket has been completed — moves to Completed tier in dropdown
  const [completedScenarioIds, setCompletedScenarioIds] = useState<string[]>([]);
  // Active order tier filter (null = no filter = default landing)
  const [activeOrderTier, setActiveOrderTier] = useState<string | null>(null);
  // Ref to prevent the onTabChange('dashboard') fired alongside onScenarioChange from resetting the tier
  const skipNextOrderReset = useRef(false);


  // ── Email state ──
  // Per-scenario dynamic email list (starts from scenario data, grows with sent/replies)
  const [scenarioEmails, setScenarioEmails] = useState<Record<string, EmailItem[]>>({});
  const [composeEmail, setComposeEmail] = useState<EmailItem | null>(null);
  // true when compose was triggered from a workflow PO-release (close panel on send)
  const [composeIsPoConfirm, setComposeIsPoConfirm] = useState(false);
  // true when compose was triggered from checker data-issue return-to-maker
  const [composeIsCheckerData, setComposeIsCheckerData] = useState(false);
  // Track which tickets have had their checker data-issue email sent via compose modal
  const [checkerDataEmailSent, setCheckerDataEmailSent] = useState<Record<string, boolean>>({});
  // PO success modal (shown after email send instead of immediately closing panel)
  const [showPoSuccess, setShowPoSuccess] = useState<{ supplier: string; subject: string; attachments: string[] } | null>(null);
  // When true → PrWorkflowPanel advances its internal stage to 6 (all ✓) then closes
  const [triggerWorkflowComplete, setTriggerWorkflowComplete] = useState(false);
  // Track which ticket has had its mismatch email sent (so reply can arrive)
  const [, setMismatchEmailSent] = useState<Record<string, boolean>>({});
  // Track which amendment tickets have received Checker reply
  const [amendmentCheckerReplied, setAmendmentCheckerReplied] = useState<Record<string, boolean>>({});
  // Track which amendment tickets have received Checker release-approval reply (2nd gate)
  const [amendmentApprovalReplied, setAmendmentApprovalReplied] = useState<Record<string, boolean>>({});
  // Track Checker data-issue: Maker has fixed and resubmitted
  const [checkerDataFixed, setCheckerDataFixed] = useState<Record<string, boolean>>({});
  // Track Checker budget-issue: Finance reply received
  const [checkerBudgetReplied, setCheckerBudgetReplied] = useState<Record<string, boolean>>({});
  // Track Checker budget-issue: email sent via compose modal
  const [checkerBudgetEmailSent, setCheckerBudgetEmailSent] = useState<Record<string, boolean>>({});
  // Track Checker budget-issue: Finance reply read in inbox (user returned from inbox)
  const [checkerBudgetReplyRead, setCheckerBudgetReplyRead] = useState<Record<string, boolean>>({});
  const [composeIsBudgetNotify, setComposeIsBudgetNotify] = useState(false);
  // composeIsBudgetForwardToMaker removed — budget flow is now at Maker stage
  // Track Checker budget-issue (maker-fix): forwarded to Maker
  // checkerBudgetForwardedToMaker removed — budget flow is now at Maker stage
  // Track Checker budget-issue (maker-fix): Maker has fixed and resubmitted
  const [checkerBudgetFixed, setCheckerBudgetFixed] = useState<Record<string, boolean>>({});
  const [showReceivedEmailModal, setShowReceivedEmailModal] = useState<EmailItem | null>(null);
  const [inboxReturnTicketId, setInboxReturnTicketId] = useState<string | null>(null);

  // ── Derived data ──
  const scenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0],
    [activeScenarioId]
  );

  // Merge scenario base emails with dynamic emails
  const currentEmails = useMemo(() => {
    const base = scenario.emails ?? [];
    const dynamic = scenarioEmails[activeScenarioId] ?? [];
    return [...base, ...dynamic];
  }, [scenario, activeScenarioId, scenarioEmails]);

  const inboxUnread = useMemo(
    () => currentEmails.filter(e => e.type === 'incoming' && !e.read && (!e.forPersona || e.forPersona === activePersona)).length,
    [currentEmails, activePersona]
  );

  const scenarioOptions = useMemo(
    () => scenarios.map((s) => ({ id: s.id, name: s.name })),
    []
  );

  const selectedTicket = useMemo(
    () => (selectedTicketId ? scenario.tickets.find((t) => t.id === selectedTicketId) : null) ?? null,
    [scenario.tickets, selectedTicketId]
  );

  // Whether mismatch reply has arrived for a given ticket
  const hasMismatchReply = useCallback((ticketId: string) => {
    const emails = [...(scenario.emails ?? []), ...(scenarioEmails[activeScenarioId] ?? [])];
    return emails.some(e => e.relatedTicketId === ticketId && e.isReply);
  }, [scenario.emails, scenarioEmails, activeScenarioId]);

  // Whether Checker reply has arrived for an amendment ticket
  const hasAmendmentCheckerReply = useCallback((ticketId: string) => {
    return amendmentCheckerReplied[ticketId] ?? false;
  }, [amendmentCheckerReplied]);

  // Whether Checker release-approval reply has arrived (2nd gate — after Maker approves amendment)
  const hasAmendmentApprovalReply = useCallback((ticketId: string) => {
    return amendmentApprovalReplied[ticketId] ?? false;
  }, [amendmentApprovalReplied]);

  // Whether Checker data-issue has been fixed by Maker
  const hasCheckerDataFixed = useCallback((ticketId: string) => {
    return checkerDataFixed[ticketId] ?? false;
  }, [checkerDataFixed]);

  // Whether Checker budget-issue Finance reply has arrived
  const hasCheckerBudgetReply = useCallback((ticketId: string) => {
    return checkerBudgetReplied[ticketId] ?? false;
  }, [checkerBudgetReplied]);

  // Whether Checker budget-issue Finance reply has been read in inbox
  const hasCheckerBudgetReplyRead = useCallback((ticketId: string) => {
    return checkerBudgetReplyRead[ticketId] ?? false;
  }, [checkerBudgetReplyRead]);

  // Whether Maker has fixed the budget issue and resubmitted
  const hasCheckerBudgetFixed = useCallback((ticketId: string) => {
    return checkerBudgetFixed[ticketId] ?? false;
  }, [checkerBudgetFixed]);

  // Determine the initial stage when opening a ticket
  const initialStageForTicket = useMemo(() => {
    if (!selectedTicketId) return 0;
    const savedStage = ticketStages[selectedTicketId];
    if (activePersona === 'checker' && savedStage !== undefined && savedStage >= 4) {
      return savedStage;
    }
    // If mismatch reply received, start at stage 3 (PO Creation) — exception resolved
    if (hasMismatchReply(selectedTicketId) && selectedTicket?.exception?.type === 'rfx-mismatch') {
      return Math.max(savedStage ?? 0, 3);
    }
    // Amendment: Checker auto-starts at stage 4 (pre-seeded email, amendment already submitted)
    if (activePersona === 'checker' && selectedTicket?.exception?.type === 'post-po-amendment') {
      return Math.max(savedStage ?? 0, 4);
    }
    // If amendment checker replied, start at stage 4 (Checker QC visible)
    if (selectedTicket?.exception?.type === 'post-po-amendment' && hasAmendmentCheckerReply(selectedTicketId)) {
      return Math.max(savedStage ?? 0, 4);
    }
    // If amendment was approved (stage saved >= 5), restore it for any persona
    if (selectedTicket?.exception?.type === 'post-po-amendment' && savedStage !== undefined && savedStage >= 5) {
      return savedStage;
    }
    // Checker data-issue: if Maker fixed, restore to stage 4 for Checker re-review
    if (selectedTicket?.exception?.type === 'checker-data-issue' && hasCheckerDataFixed(selectedTicketId)) {
      return Math.max(savedStage ?? 0, 4);
    }
    // Checker data-issue: if returned to Maker (stage 3), restore that
    if (selectedTicket?.exception?.type === 'checker-data-issue' && savedStage !== undefined && savedStage === 3) {
      return 3;
    }
    // Checker budget-issue (Maker stage): if budget email sent or Finance replied, restore to stage 3
    if (selectedTicket?.exception?.type === 'checker-budget-issue' && activePersona === 'maker') {
      if (checkerBudgetEmailSent[selectedTicketId] || hasCheckerBudgetReply(selectedTicketId)) {
        return Math.max(savedStage ?? 0, 3);
      }
    }
    // Checker budget-issue: Checker auto-starts at stage 4 (budget resolved at Maker stage)
    if (activePersona === 'checker' && selectedTicket?.exception?.type === 'checker-budget-issue') {
      return Math.max(savedStage ?? 0, 4);
    }
    // Checker budget-issue: if Maker has fixed (cost reduction), restore to stage 4
    if (selectedTicket?.exception?.type === 'checker-budget-issue' && hasCheckerBudgetFixed(selectedTicketId)) {
      return Math.max(savedStage ?? 0, 4);
    }
    // Checker normal flows: if ticket already has a PO, start at stage 4 (QC review)
    if (activePersona === 'checker' && selectedTicket?.sapPo) {
      return Math.max(savedStage ?? 0, 4);
    }
    return 0;
  }, [selectedTicketId, activePersona, ticketStages, selectedTicket, hasMismatchReply, hasAmendmentCheckerReply, hasCheckerDataFixed, hasCheckerBudgetReply, hasCheckerBudgetFixed, checkerBudgetEmailSent]);

  // Effective SAP PO: pushed from PrWorkflowPanel via onEffectiveSapPoChange callback
  // This ensures the PDF preview panel always shows the same data as the workflow panel
  const [effectiveSapPoFromPanel, setEffectiveSapPoFromPanel] = useState<import('./data/types').SapPoData | undefined>(undefined);

  // Fallback computation when panel hasn't pushed yet (e.g., viewing email attachments)
  const effectiveSapPoFallback = useMemo(() => {
    if (!selectedTicket?.sapPo) return selectedTicket?.sapPo;
    const po = selectedTicket.sapPo;
    const ex = selectedTicket.exception;
    // Amendment: apply amended values only after approval flow completes
    const tid = selectedTicketId ?? '';
    if (ex?.type === 'post-po-amendment' && (activePersona === 'checker' || amendmentApprovalReplied[tid] || (ticketStages[tid] ?? 0) >= 5)) {
      const qtyStr = ex.amendments.find((a: any) => a.field === 'quantity')?.requestedValue ?? '';
      const newQty = parseFloat(qtyStr.replace(/[^0-9.]/g, '')) || po.lineItems[0]?.quantity;
      return { ...po, lineItems: po.lineItems.map((item, i) => i === 0 ? { ...item, quantity: newQty, taxCode: 'U1', totalPrice: ex.amendedTotalValue } : item), totalValue: ex.amendedTotalValue };
    }
    // Budget cost reduction: apply if fixed
    if (ex?.type === 'checker-budget-issue' && (ex as any).requiresMakerFix && checkerBudgetFixed[tid]) {
      const fix = (ex as any).budgetFixDetails;
      if (fix) {
        const newNet = fix.toQty * fix.unitPrice;
        const mult = po.lineItems[0] ? po.totalValue / po.lineItems[0].totalPrice : 1.25;
        return { ...po, lineItems: po.lineItems.map((item, i) => i === 0 ? { ...item, quantity: fix.toQty, totalPrice: newNet } : item), totalValue: Math.round(newNet * mult) };
      }
    }
    // Data issue: fix supplier code
    if (ex?.type === 'checker-data-issue' && checkerDataFixed[tid]) {
      let fixed = po;
      for (const issue of (ex as any).issues ?? []) {
        if (issue.field === 'supplierCode') fixed = { ...fixed, supplierCode: issue.correctValue };
      }
      return fixed;
    }
    return po;
  }, [selectedTicket, selectedTicketId, checkerBudgetFixed, checkerDataFixed, amendmentApprovalReplied, ticketStages, activePersona]);

  const effectiveSapPo = effectiveSapPoFromPanel ?? effectiveSapPoFallback;

  // AI context
  const aiContext = useMemo((): string => {
    if (!selectedTicket) return 'dashboard';
    if (selectedTicket.exception?.type === 'rfx-mismatch') return 'exception';
    if (selectedTicket.exception?.type === 'post-po-amendment') return 'exception';
    const stage = selectedTicket.workflowStage;
    if (stage >= 4) return 'checker';
    if (stage >= 3) return 'po_creation';
    if (stage >= 2) return 'validation';
    if (stage >= 1) return 'extraction';
    return 'dashboard';
  }, [selectedTicket]);


  // ── Handlers ──
  const handleScenarioChange = useCallback((id: string) => {
    setActiveScenarioId(id);
    setSelectedTicketId(null);
    setShowAiPanel(false);
    setActiveTab('dashboard');
    setCurrentWorkflowStage(0);
    // activeOrderTier is set by onOrderTierSelect before this fires
  }, []);

  const handleSelectTicket = useCallback((id: string) => {
    setSelectedTicketId(id);
    setEffectiveSapPoFromPanel(undefined); // reset — PrWorkflowPanel will push new value
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedTicketId(null);
    setCurrentWorkflowStage(0);
    setExpandedPanel(false);
  }, []);

  // ── Login handlers ──
  const handleLogin = useCallback((persona: Persona) => {
    setActivePersona(persona);
    setShowLogin(false);
    // Checker logs in → navigate to Inbox to read Maker's submission email
    if (persona === 'checker') {
      setTimeout(() => setActiveTab('inbox'), 300);
    }
    toast.success(persona === 'checker'
      ? 'Signed in as Checker — QC review mode active.'
      : 'Signed in as Maker — PO creation mode active.'
    );
  }, []);

  // Checker button in TopBar triggers login page (preserves all workflow state)
  const handleCheckerLoginRequest = useCallback(() => {
    setShowLogin(true);
  }, []);

  const handlePersonaChange = useCallback((persona: Persona) => {
    // Only used for direct Maker switch-back (no login required)
    setActivePersona(persona);
    toast.success('Switched to Maker persona — PO creation mode active.');
  }, []);

  const handleStageChange = useCallback((stage: number) => {
    setCurrentWorkflowStage(stage);
    if (selectedTicketId) {
      setTicketStages(prev => ({ ...prev, [selectedTicketId]: stage }));
    }
  }, [selectedTicketId]);

  // ── Email: Checker sends PO confirmation — open compose modal first ──
  const handleSendPoEmail = useCallback((draft: EmailItem) => {
    setComposeEmail(draft);
    setComposeIsPoConfirm(true);
  }, []);

  // ── Email: Mismatch clarification sent → reply arrives after 2s ──
  const handleMismatchEmailSent = useCallback((ticketId: string, sentEmail: EmailItem) => {
    setMismatchEmailSent(prev => ({ ...prev, [ticketId]: true }));
    // Add to sent
    setScenarioEmails(prev => ({
      ...prev,
      [activeScenarioId]: [
        ...(prev[activeScenarioId] ?? []),
        { ...sentEmail, id: `sent-mismatch-${Date.now()}`, type: 'outgoing', read: true, forPersona: 'maker' as const },
      ],
    }));
    // NOTE: Do NOT call handleClosePanel() here — leave workflow panel open
    // Simulate reply arriving after 2s
    setTimeout(() => {
      const reply: EmailItem = {
        id: `reply-${Date.now()}`,
        from: 'Buyer',
        fromEmail: 'buyer@company.com',
        to: 'PO Team',
        toEmail: 'po-team@company.com',
        subject: `RE: ${sentEmail.subject}`,
        preview: 'Confirmed — the correct quantity is 250 EA as per the latest indent. Annexure attached.',
        body: `Dear Team,

Thank you for flagging this. Confirmed — the correct quantity is 250 EA as per the latest indent approval dated 03/09/2026.

The revised annexure and RFX synopsis PDF are attached for your reference. Please proceed with PO creation at the negotiated rate of €4.57/EA.

Regards,
Buyer
Engine MRO — Réau`,
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        read: false,
        attachments: ['Revised_Annexure_RFX3012438300.xlsx', 'RFX_3012438300.pdf'],
        type: 'incoming',
        relatedTicketId: ticketId,
        isReply: true,
        forPersona: 'maker',
      };
      setScenarioEmails(prev => ({
        ...prev,
        [activeScenarioId]: [...(prev[activeScenarioId] ?? []), reply],
      }));
      toast.success('New email received in Inbox — reply from Buyer.');
      setShowReceivedEmailModal(reply);
    }, 2000);
  }, [activeScenarioId]);

  // ── Email: Amendment checker email sent → Checker reply arrives after 2s ──
  const handleAmendmentCheckerEmailSent = useCallback((ticketId: string, sentEmail: EmailItem) => {
    // Add to Maker's Sent + Checker's Inbox
    const incomingForChecker: EmailItem = {
      ...sentEmail,
      id: `incoming-amend-checker-${Date.now()}`,
      type: 'incoming',
      read: false,
      forPersona: 'checker',
    };
    setScenarioEmails(prev => ({
      ...prev,
      [activeScenarioId]: [
        ...(prev[activeScenarioId] ?? []),
        { ...sentEmail, id: `sent-checker-${Date.now()}`, type: 'outgoing', read: true, forPersona: 'maker' as const },
        incomingForChecker,
      ],
    }));
    // Auto-progress flow without creating a separate reply email
    setTimeout(() => {
      setAmendmentCheckerReplied(prev => ({ ...prev, [ticketId]: true }));
      // Show the original Maker amendment email as a received-email popup
      setShowReceivedEmailModal(sentEmail);
    }, 2000);
  }, [activeScenarioId, handleClosePanel]);

  // ── Email: Maker approves amendment → Ops verification email sent → Ops ACK arrives after 2s → unlocks Checker ──
  const handleAmendmentApprovalSent = useCallback((ticketId: string, sentEmail: EmailItem) => {
    setScenarioEmails(prev => ({
      ...prev,
      [activeScenarioId]: [
        ...(prev[activeScenarioId] ?? []),
        { ...sentEmail, id: `sent-approval-${Date.now()}`, type: 'outgoing', read: true, forPersona: 'maker' as const },
      ],
    }));
    const ticket = scenarios.find(s => s.id === activeScenarioId)?.tickets.find(t => t.id === ticketId);
    const amendment = ticket?.exception?.type === 'post-po-amendment' ? ticket.exception : null;
    const poNumber = amendment?.poNumber ?? '';
    setTimeout(() => {
      const reply: EmailItem = {
        id: `reply-approval-${Date.now()}`,
        from: 'Ops',
        fromEmail: 'ops@company.com',
        to: 'PO Team',
        toEmail: 'po-team@company.com',
        subject: `RE: ${sentEmail.subject}`,
        preview: `Ops verification complete. PO ${poNumber} amendment cleared — Checker may proceed with release.`,
        body: `Dear Team,

Ops verification for PO ${poNumber} amendment is now complete.

✓ Budget Code: Confirmed — cost centre updated in system
✓ Vendor Master: No discrepancy — supplier details verified
✓ Cost Centre Approval: Buyer sign-off on file
✓ Maker Approval: Maker — confirmed

All ops-side checks are complete. The Checker may now proceed with final PO release.

Regards,
Ops
Operations Verification`,
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        read: false,
        attachments: [`Ops_Verification_${poNumber}.pdf`],
        type: 'incoming',
        relatedTicketId: ticketId,
        isReply: true,
        forPersona: 'maker',
      };
      setScenarioEmails(prev => ({
        ...prev,
        [activeScenarioId]: [...(prev[activeScenarioId] ?? []), reply],
      }));
      setAmendmentApprovalReplied(prev => ({ ...prev, [ticketId]: true }));
      toast.success('New email received in Inbox — Ops verification complete. Checker cleared for release.');
      setShowReceivedEmailModal(reply);
    }, 2000);
  }, [activeScenarioId]);

  // ── Maker submits PO to Checker: add to Maker's Sent + Checker's Inbox ──
  const handleSubmitToCheckerEmail = useCallback((email: EmailItem) => {
    const incomingForChecker: EmailItem = {
      ...email,
      id: `incoming-checker-${Date.now()}`,
      from: 'Maker',
      fromEmail: 'maker@company.com',
      to: 'Checker',
      toEmail: 'checker@company.com',
      type: 'incoming',
      read: false,
      forPersona: 'checker',
    };
    setScenarioEmails(prev => ({
      ...prev,
      [activeScenarioId]: [
        ...(prev[activeScenarioId] ?? []),
        { ...email, id: `sent-submit-${Date.now()}`, type: 'outgoing', read: true, forPersona: 'maker' as const },
        incomingForChecker,
      ],
    }));
    toast.success('PO submitted to Checker. Notification email sent.');
  }, [activeScenarioId]);

  // ── Checker data-issue: Hold triggered (no email or stage revert yet) ──
  const handleCheckerDataHold = useCallback(() => {
    // Hold state is set in PrWorkflowPanel locally — nothing to do in App state yet
  }, []);

  // ── Checker data-issue: Send email via compose modal ──
  const handleSendDataIssueEmail = useCallback((draft: EmailItem) => {
    setComposeEmail({ ...draft, relatedTicketId: selectedTicketId ?? undefined });
    setComposeIsCheckerData(true);
  }, [selectedTicketId]);

  // ── Checker data-issue: Maker resubmits corrected PO (called when Maker clicks resubmit at stage 3) ──
  const handleCheckerDataResubmit = useCallback((ticketId: string) => {
    setCheckerDataFixed(prev => ({ ...prev, [ticketId]: true }));
    setTicketStages(prev => ({ ...prev, [ticketId]: 4 }));

    // Send confirmation email from Maker to Checker
    const ticket = scenarios.find(s => s.id === activeScenarioId)?.tickets.find(t => t.id === ticketId);
    const poNumber = ticket?.sapPo?.poNumber ?? '';
    const dataException = ticket?.exception?.type === 'checker-data-issue' ? ticket.exception : null;
    const fixLines = dataException?.issues
      .map(i => `  • ${i.label}: corrected from ${i.poValue} to ${i.correctValue}`)
      .join('\n') ?? '';

    const sentEmail: EmailItem = {
      id: `sent-data-fix-${Date.now()}`,
      from: 'Maker',
      fromEmail: 'maker@company.com',
      to: 'Checker',
      toEmail: 'checker@company.com',
      subject: `RE: PO ${poNumber} Returned — Correction Applied`,
      preview: `Data correction applied for PO ${poNumber}. Please re-review.`,
      body: `Dear Checker,\n\nThe data issue on PO ${poNumber} has been corrected:\n\n${fixLines}\n\nThe PO has been updated in SAP and resubmitted for your QC review. Please proceed with release.\n\nRegards,\nMaker\nProcurement Shared Services`,
      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      read: false,
      attachments: [`Corrected_PO_${poNumber}.pdf`],
      type: 'incoming',
      relatedTicketId: ticketId,
      relatedPO: poNumber,
      isReply: true,
      forPersona: 'checker',
    };
    setScenarioEmails(prev => ({
      ...prev,
      [activeScenarioId]: [...(prev[activeScenarioId] ?? []), sentEmail],
    }));

    toast.success('Corrected PO resubmitted to Checker. Notification email sent.');
    setShowReceivedEmailModal(sentEmail);
  }, [activeScenarioId]);

  // ── Checker budget-issue (maker-fix): Maker applies cost reduction and resubmits ──
  const handleBudgetCostReductionResubmit = useCallback(() => {
    if (!selectedTicketId) return;
    const ticket = scenarios.find(s => s.id === activeScenarioId)?.tickets.find(t => t.id === selectedTicketId);
    const budgetEx = ticket?.exception?.type === 'checker-budget-issue' ? ticket.exception : null;
    const fixDetails = budgetEx?.budgetFixDetails;
    const poNum = ticket?.sapPo?.poNumber ?? '';
    const newQty = fixDetails?.toQty ?? 43;
    const unitPrice = fixDetails?.unitPrice ?? 2200;
    const newNet = newQty * unitPrice;
    const taxRate = 0.25; // V0 non-deductible tax
    const newTotal = Math.round(newNet * (1 + taxRate));

    // Mark as fixed
    setCheckerBudgetFixed(prev => ({ ...prev, [selectedTicketId]: true }));
    // Advance stage to 4
    setTicketStages(prev => ({ ...prev, [selectedTicketId]: 4 }));

    // Send email to Checker's Inbox
    const resubmitEmail: EmailItem = {
      id: `resubmit-budget-${Date.now()}`,
      from: 'Maker',
      fromEmail: 'maker@company.com',
      to: 'Checker',
      toEmail: 'checker@company.com',
      subject: `Cost Reduced & Resubmitted — PO ${poNum} (Qty ${newQty} ${fixDetails?.unit ?? 'EA'})`,
      preview: `PO quantity reduced from ${fixDetails?.fromQty ?? 50} to ${newQty} ${fixDetails?.unit ?? 'EA'}. Revised total within budget.`,
      body: `Dear Checker,\n\nPer Finance instruction, the PO ${poNum} has been revised:\n\nQuantity: ${fixDetails?.fromQty ?? 50} → ${newQty} ${fixDetails?.unit ?? 'EA'}\nRevised Net Value: €${newNet.toLocaleString("en-US")}\nEstimated Total (incl. tax): €${newTotal.toLocaleString("en-US")}\n\nThe revised PO is now within the SIO budget of €${(budgetEx?.allocatedBudget ?? 0).toLocaleString("en-US")}. Please proceed with QC review and release.\n\nRegards,\nMaker\nProcurement Shared Services`,
      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      read: false,
      attachments: [`PO_Revised_${poNum}.pdf`],
      type: 'incoming',
      relatedTicketId: selectedTicketId,
      isReply: true,
      forPersona: 'checker',
    };
    setScenarioEmails(prev => ({
      ...prev,
      [activeScenarioId]: [...(prev[activeScenarioId] ?? []), resubmitEmail],
    }));
    toast.success('Reduced PO resubmitted to Checker. Notification email sent.');
    setShowReceivedEmailModal(resubmitEmail);
  }, [activeScenarioId, selectedTicketId]);

  // ── Checker budget-issue: email sent to Buyer → Finance reply arrives after 2s ──
  // ── Checker budget-issue: open compose modal with draft email ──
  const handleSendBudgetEmail = useCallback((draft: EmailItem) => {
    setComposeEmail({ ...draft, relatedTicketId: selectedTicketId ?? undefined });
    setComposeIsBudgetNotify(true);
  }, [selectedTicketId]);

  // ── Navigate to inbox from workflow panel ──
  const handleNavigateToInbox = useCallback(() => {
    if (selectedTicketId) setInboxReturnTicketId(selectedTicketId);
    handleClosePanel();
    setActiveTab('inbox');
  }, [selectedTicketId, handleClosePanel]);

  // ── Return from inbox to workflow ──
  const handleReturnFromInbox = useCallback((ticketId: string) => {
    setActiveTab('dashboard');
    setSelectedTicketId(ticketId);
    setInboxReturnTicketId(null);
    // If returning from inbox for a budget-issue ticket with reply, mark as read
    const ticket = scenarios.find(s => s.id === activeScenarioId)?.tickets.find(t => t.id === ticketId);
    if (ticket?.exception?.type === 'checker-budget-issue' && checkerBudgetReplied[ticketId]) {
      setCheckerBudgetReplyRead(prev => ({ ...prev, [ticketId]: true }));
    }
  }, [activeScenarioId, checkerBudgetReplied]);

  // ── HITL: Approve PO Release ──
  const handleApprovePO = useCallback(() => {
    toast.success(`PO ${selectedTicket?.sapPo?.poNumber ?? ''} released in SAP.`);
  }, [selectedTicket]);

  const handleApproveAmendment = useCallback(() => {
    toast.success(`Amendment approved for PO ${selectedTicket?.sapPo?.poNumber ?? ''}.`);
  }, [selectedTicket]);

  // ── AI Actions ──
  const handleAiAction = useCallback((action: AiAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.target === 'analytics') setActiveTab('analytics');
        if (action.target === 'dashboard') { setActiveTab('dashboard'); setSelectedTicketId(null); }
        break;
      case 'open-ticket':
        if (action.target) {
          const ticket = scenario.tickets.find((t) => t.id === action.target);
          if (ticket) handleSelectTicket(ticket.id);
        }
        break;
      case 'approve':
        if (action.target === 'release-po') handleApprovePO();
        break;
    }
  }, [scenario.tickets, handleSelectTicket, handleApprovePO]);

  const handleEmailRead = useCallback((id: string) => {
    setScenarioEmails(prev => ({
      ...prev,
      [activeScenarioId]: (prev[activeScenarioId] ?? []).map(e =>
        e.id === id ? { ...e, read: true } : e
      ),
    }));
  }, [activeScenarioId]);

  // ── Login screen ──
  if (showLogin) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <CurrencyProvider>
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <TopBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'dashboard') {
            if (skipNextOrderReset.current) {
              skipNextOrderReset.current = false;
            } else {
              setActiveOrderTier(null);
            }
          }
        }}
        scenarios={scenarioOptions}
        activeScenario={activeScenarioId}
        onScenarioChange={handleScenarioChange}
        onAiToggle={() => setShowAiPanel((p) => !p)}
        aiPanelOpen={showAiPanel}
        activePersona={activePersona}
        onPersonaChange={handlePersonaChange}
        onCheckerLoginRequest={handleCheckerLoginRequest}
        inboxUnread={inboxUnread}
        completedScenarioIds={completedScenarioIds}
        activeOrderTier={activeOrderTier}
        onOrderTierSelect={(level) => {
          setActiveOrderTier(level);
          skipNextOrderReset.current = true;
        }}
      />

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <PoDashboard
            scenario={scenario}
            selectedTicketId={selectedTicketId ?? undefined}
            onSelectTicket={handleSelectTicket}
            completedTicketIds={completedTicketIds}
            primaryPriority={activeOrderTier ?? undefined}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsView />}
        {(activeTab === 'inbox' || activeTab === 'sent') && (
          <EmailInboxView
            emails={currentEmails}
            initialFolder={activeTab as 'inbox' | 'sent'}
            onEmailRead={handleEmailRead}
            returnTicketId={inboxReturnTicketId}
            onReturnToWorkflow={handleReturnFromInbox}
            activePersona={activePersona}
            tickets={scenario.tickets}
            effectiveSapPo={effectiveSapPo}
          />
        )}
      </div>

      {/* ── Shared Backdrop ── */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            key="panels-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClosePanel}
          />
        )}
      </AnimatePresence>

      {/* ── Centered Dual Panels ── */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            key="panels-container"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-stretch justify-center pointer-events-none"
            style={{ paddingTop: '8px', paddingBottom: '8px' }}
          >
            <div className={cn("flex gap-1 pointer-events-auto max-h-full transition-all duration-300", expandedPanel ? "w-[calc(100vw-16px)]" : "")}>
              <PdfPreviewPanel
                key={`${selectedTicket.id}-${activeTab}`}
                ticket={selectedTicket}
                workflowStage={Math.max(currentWorkflowStage, initialStageForTicket)}
                onClose={handleClosePanel}
                expanded={expandedPanel}
                onToggleExpand={() => setExpandedPanel(p => !p)}
                hasMismatchReply={hasMismatchReply(selectedTicket.id)}
                effectiveSapPo={effectiveSapPo}
                persona={activePersona}
              />
              <PrWorkflowPanel
                ticket={selectedTicket}
                persona={activePersona}
                onClose={handleClosePanel}
                onApprovePO={handleApprovePO}
                onApproveAmendment={handleApproveAmendment}
                onStageChange={handleStageChange}
                initialStage={initialStageForTicket}
                onSendPoEmail={handleSendPoEmail}
                onMismatchEmailSent={(sent) => handleMismatchEmailSent(selectedTicket.id, sent)}
                hasMismatchReply={hasMismatchReply(selectedTicket.id)}
                onAmendmentCheckerEmailSent={(sent) => handleAmendmentCheckerEmailSent(selectedTicket.id, sent)}
                hasAmendmentCheckerReply={hasAmendmentCheckerReply(selectedTicket.id)}
                onAmendmentApprovalSent={(sent) => handleAmendmentApprovalSent(selectedTicket.id, sent)}
                hasAmendmentApprovalReply={hasAmendmentApprovalReply(selectedTicket.id)}
                expanded={expandedPanel}
                onToggleExpand={() => setExpandedPanel(p => !p)}
                onGoToInbox={handleNavigateToInbox}
                triggerComplete={triggerWorkflowComplete}
                onCheckerDataHold={handleCheckerDataHold}
                onSendDataIssueEmail={handleSendDataIssueEmail}
                checkerDataEmailSent={checkerDataEmailSent[selectedTicket.id] ?? false}
                hasCheckerDataFixed={hasCheckerDataFixed(selectedTicket.id)}
                onSendBudgetEmail={handleSendBudgetEmail}
                checkerBudgetEmailSent={checkerBudgetEmailSent[selectedTicket.id] ?? false}
                hasCheckerBudgetReply={hasCheckerBudgetReply(selectedTicket.id)}
                hasCheckerBudgetReplyRead={hasCheckerBudgetReplyRead(selectedTicket.id)}
                onCheckerDataResubmit={() => handleCheckerDataResubmit(selectedTicket.id)}
                onSubmitToCheckerEmail={handleSubmitToCheckerEmail}
                hasCheckerBudgetFixed={hasCheckerBudgetFixed(selectedTicket.id)}
                onBudgetCostReductionResubmit={handleBudgetCostReductionResubmit}
                onEffectiveSapPoChange={setEffectiveSapPoFromPanel}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Global Email Compose Modal ── */}
      <AnimatePresence>
        {composeEmail && (
          <EmailModal
            key="compose-modal"
            email={composeEmail}
            mode="compose"
            tickets={scenario.tickets}
            effectiveSapPo={effectiveSapPo}
            onClose={() => { setComposeEmail(null); setComposeIsPoConfirm(false); setComposeIsCheckerData(false); setComposeIsBudgetNotify(false); }}
            onSend={(sent) => {
              // Determine persona for this email
              const sentPersona = (composeIsPoConfirm || composeIsCheckerData) ? 'checker' as const : 'maker' as const;
              // Always add to sent folder
              setScenarioEmails(prev => ({
                ...prev,
                [activeScenarioId]: [
                  ...(prev[activeScenarioId] ?? []),
                  { ...sent, id: `sent-${Date.now()}`, type: 'outgoing', read: true, forPersona: sentPersona },
                ],
              }));
              setComposeEmail(null);
              if (composeIsPoConfirm) {
                setComposeIsPoConfirm(false);
                // Show success modal — don't close panel yet
                setShowPoSuccess({
                  supplier: sent.to,
                  subject: sent.subject,
                  attachments: sent.attachments,
                });
              } else if (composeIsCheckerData) {
                setComposeIsCheckerData(false);
                const ticketId = sent.relatedTicketId ?? selectedTicketId;
                if (ticketId) {
                  // Mark email as sent for the component
                  setCheckerDataEmailSent(prev => ({ ...prev, [ticketId]: true }));
                  // Revert stage to 3 so Maker can fix
                  setTicketStages(prev => ({ ...prev, [ticketId]: 3 }));
                  // Add incoming copy for Maker's inbox
                  const incomingCopy: EmailItem = {
                    id: `incoming-data-${Date.now()}`,
                    from: 'Checker',
                    fromEmail: 'checker@company.com',
                    to: 'Maker',
                    toEmail: 'maker@company.com',
                    subject: sent.subject,
                    preview: sent.preview,
                    body: sent.body,
                    date: sent.date,
                    read: false,
                    attachments: sent.attachments,
                    type: 'incoming',
                    relatedTicketId: ticketId,
                    relatedPO: sent.relatedPO,
                    forPersona: 'maker',
                  };
                  setScenarioEmails(prev => ({
                    ...prev,
                    [activeScenarioId]: [...(prev[activeScenarioId] ?? []), incomingCopy],
                  }));
                }
                toast.success('Email sent to Maker. Switch to Maker persona to apply correction.');
              } else if (composeIsBudgetNotify) {
                setComposeIsBudgetNotify(false);
                const ticketId = sent.relatedTicketId ?? selectedTicketId;
                if (ticketId) {
                  setCheckerBudgetEmailSent(prev => ({ ...prev, [ticketId]: true }));
                  // Simulate Finance reply after 2s
                  const ticket = scenarios.find(s => s.id === activeScenarioId)?.tickets.find(t => t.id === ticketId);
                  const budgetException = ticket?.exception?.type === 'checker-budget-issue' ? ticket.exception : null;
                  const poNum = ticket?.sapPo?.poNumber ?? '';
                  const sioCode = budgetException?.sioCode ?? '';
                  const shortfall = budgetException?.shortfall ?? 0;
                  setTimeout(() => {
                    const isMakerFix = budgetException?.requiresMakerFix === true;
                    const fixDetails = budgetException?.budgetFixDetails;
                    const reply: EmailItem = isMakerFix ? {
                      id: `reply-budget-${Date.now()}`,
                      from: 'Finance',
                      fromEmail: 'finance@company.com',
                      to: 'PO Team',
                      toEmail: 'po-team@company.com',
                      subject: `RE: ${sent.subject}`,
                      preview: `Cannot allocate additional budget. Reduce qty from ${fixDetails?.fromQty ?? 50} → ${fixDetails?.toQty ?? 43} ${fixDetails?.unit ?? 'EA'}`,
                      body: `Dear Team,\n\nWe have reviewed the budget overshoot request for PO ${poNum}.\n\nUnfortunately, we cannot allocate additional budget for ${sioCode}. The current SIO allocation of €${(budgetException?.allocatedBudget ?? 0).toLocaleString("en-US")} must be maintained.\n\nRecommended Action:\nReduce quantity from ${fixDetails?.fromQty ?? 50} ${fixDetails?.unit ?? 'EA'} to ${fixDetails?.toQty ?? 43} ${fixDetails?.unit ?? 'EA'} to bring the PO value within the allocated budget.\n\nRevised estimate: ${fixDetails?.toQty ?? 43} × €${(fixDetails?.unitPrice ?? 2200).toLocaleString("en-US")} = €${((fixDetails?.toQty ?? 43) * (fixDetails?.unitPrice ?? 2200)).toLocaleString("en-US")} (net) + applicable tax.\n\nPlease instruct the Maker to revise the PO accordingly.\n\nRegards,\nFinance Team\nCorporate Finance`,
                      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
                      read: false,
                      attachments: [`Budget_Review_${sioCode}.pdf`],
                      type: 'incoming',
                      relatedTicketId: ticketId,
                      isReply: true,
                      forPersona: 'maker',
                    } : {
                      id: `reply-budget-${Date.now()}`,
                      from: 'Finance',
                      fromEmail: 'finance@company.com',
                      to: 'PO Team',
                      toEmail: 'po-team@company.com',
                      subject: `RE: ${sent.subject}`,
                      preview: `Budget allocated. Additional €${shortfall.toLocaleString("en-US")} approved for ${sioCode}.`,
                      body: `Dear Team,\n\nWe have reviewed the budget overshoot for PO ${poNum} and have processed the following:\n\nSIO Code: ${sioCode}\nAdditional Budget Allocated: €${shortfall.toLocaleString("en-US")}\nRevised Total Budget: €${((budgetException?.allocatedBudget ?? 0) + shortfall).toLocaleString("en-US")}\n\nThe non-deductible tax impact (code V0 — reverse charge) has been accounted for in the revised budget allocation. The SIO code has been updated in SAP.\n\nPlease proceed with PO release.\n\nRegards,\nFinance Team\nCorporate Finance`,
                      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
                      read: false,
                      attachments: [`Budget_Allocation_${sioCode}.pdf`, `Revised_SIO_${poNum}.pdf`],
                      type: 'incoming',
                      relatedTicketId: ticketId,
                      isReply: true,
                      forPersona: 'maker',
                    };
                    setScenarioEmails(prev => ({
                      ...prev,
                      [activeScenarioId]: [...(prev[activeScenarioId] ?? []), reply],
                    }));
                    setCheckerBudgetReplied(prev => ({ ...prev, [ticketId]: true }));
                    toast.success(isMakerFix
                      ? 'New email received in Inbox — Finance requires cost reduction.'
                      : 'New email received in Inbox — Finance budget allocation confirmed.');
                    setShowReceivedEmailModal(reply);
                  }, 2000);
                }
                toast.success('Budget notification sent to Requester & Finance.');
              } else {
                toast.success('Email sent.');
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ── PO Success Modal ── */}
      <AnimatePresence>
        {showPoSuccess && (
          <PoSuccessModal
            supplier={showPoSuccess.supplier}
            subject={showPoSuccess.subject}
            attachments={showPoSuccess.attachments}
            tickets={scenario.tickets}
            effectiveSapPo={selectedTicket?.sapPo}
            onClose={() => {
              setShowPoSuccess(null);
              // Mark the ticket as completed → moves to Standard in the queue
              if (selectedTicketId) {
                setCompletedTicketIds(prev => prev.includes(selectedTicketId) ? prev : [...prev, selectedTicketId]);
              }
              // Mark the scenario as completed → moves to Completed tier in dropdown
              setCompletedScenarioIds(prev => prev.includes(activeScenarioId) ? prev : [...prev, activeScenarioId]);
              // Fire the complete animation in PrWorkflowPanel
              setTriggerWorkflowComplete(true);
              // After animation plays, close the panel
              setTimeout(() => {
                setTriggerWorkflowComplete(false);
                handleClosePanel();
              }, 1500);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── AI Chat Panel ── */}
      <AnimatePresence>
        {showAiPanel && (
          <AiChatPanel
            key="ai"
            context={aiContext}
            onClose={() => setShowAiPanel(false)}
            onAction={handleAiAction}
          />
        )}
      </AnimatePresence>

      {/* ── Received Email Modal ── */}
      {showReceivedEmailModal && (
        <ReceivedEmailModal
          email={showReceivedEmailModal}
          onClose={() => setShowReceivedEmailModal(null)}
          onViewInbox={() => {
            if (showReceivedEmailModal.relatedTicketId) {
              setInboxReturnTicketId(showReceivedEmailModal.relatedTicketId);
            }
            // Close workflow panel before navigating to inbox (Fix 3)
            handleClosePanel();
            setActiveTab('inbox');
            setShowReceivedEmailModal(null);
          }}
        />
      )}
    </div>
    </CurrencyProvider>
  );
}
