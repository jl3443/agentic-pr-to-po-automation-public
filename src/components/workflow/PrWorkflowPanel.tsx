'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Maximize2, Minimize2, Clock, Mail, ExternalLink, ChevronDown, CheckCircle, FileText, Tag, ShieldCheck, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SignalReconciliation } from './SignalReconciliation';
import { ScenarioIdentification } from './ScenarioIdentification';
import { ValidationAgent } from './ValidationAgent';
import { PoRecommendation } from './PoRecommendation';
import { ApprovalCopilot } from './ApprovalCopilot';
import { ExecutionStatus } from './ExecutionStatus';
import { ExceptionRecovery } from './ExceptionRecovery';
import { RfxMismatchEmail } from './RfxMismatchEmail';
import { CheckerExceptionHandler } from './CheckerExceptionHandler';
import { useCurrency } from '@/context/CurrencyContext';
import type { RfxTicket, Persona, EmailItem } from '@/data/types';

interface PrWorkflowPanelProps {
  ticket: RfxTicket;
  persona: Persona;
  onClose: () => void;
  onApprovePO: () => void;
  onApproveAmendment: () => void;
  onStageChange?: (stage: number) => void;
  initialStage?: number;
  onSendPoEmail?: (email: EmailItem) => void;
  onMismatchEmailSent?: (sent: EmailItem) => void;
  hasMismatchReply?: boolean;
  onAmendmentCheckerEmailSent?: (sent: EmailItem) => void;
  hasAmendmentCheckerReply?: boolean;
  onAmendmentApprovalSent?: (sent: EmailItem) => void;
  hasAmendmentApprovalReply?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onGoToInbox?: () => void;
  /** When flipped to true: animate progress bar to all-complete (stage 6) then close */
  triggerComplete?: boolean;
  /** Checker data-issue: triggers hold state only (no stage revert yet) */
  onCheckerDataHold?: () => void;
  /** Checker data-issue: opens compose modal with draft email */
  onSendDataIssueEmail?: (email: EmailItem) => void;
  /** Checker data-issue: email has been sent via compose modal */
  checkerDataEmailSent?: boolean;
  /** Checker data-issue: Maker has fixed and resubmitted */
  hasCheckerDataFixed?: boolean;
  /** Checker budget-issue: opens compose modal with draft */
  onSendBudgetEmail?: (email: EmailItem) => void;
  /** Checker budget-issue: email sent via compose modal */
  checkerBudgetEmailSent?: boolean;
  /** Checker budget-issue: Finance reply received */
  hasCheckerBudgetReply?: boolean;
  /** Checker budget-issue: Finance reply read in inbox */
  hasCheckerBudgetReplyRead?: boolean;
  /** Checker data-issue: Maker resubmits corrected PO */
  onCheckerDataResubmit?: () => void;
  /** Auto-send email when Maker submits PO to Checker */
  onSubmitToCheckerEmail?: (email: EmailItem) => void;
  /** Checker budget-issue (maker-fix): forwarded to Maker */
  // hasCheckerBudgetForwardedToMaker removed — budget resolved at Maker stage
  /** Checker budget-issue (maker-fix): Maker has fixed and resubmitted */
  hasCheckerBudgetFixed?: boolean;
  /** Checker budget-issue (maker-fix): Maker applies cost reduction and resubmits */
  onBudgetCostReductionResubmit?: () => void;
  /** Called when Maker clicks Apply Cost Reduction (updates effectiveSapPo in parent) */
  onMakerAppliedCostReduction?: () => void;
  /** Push effective SAP PO to parent so PdfPreviewPanel stays in sync */
  onEffectiveSapPoChange?: (po: import('@/data/types').SapPoData) => void;
}

const stageLabels = ['Extract', 'Identify', 'Validate', 'Create PO', 'Release', 'Update'];

const priorityConfig: Record<string, { label: string; bg: string; text: string }> = {
  critical: { label: 'Exception', bg: 'bg-red-100', text: 'text-red-700' },
  high:     { label: 'Amendment', bg: 'bg-amber-100', text: 'text-amber-700' },
  medium:   { label: 'Standard',  bg: 'bg-blue-100',  text: 'text-blue-700' },
  low:      { label: 'Routine',   bg: 'bg-green-100', text: 'text-green-700' },
};

// ── Collapsed summary bar for completed stages ──────────────────────────────
function CompletedStageSummary({
  icon,
  label,
  summary,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-semibold text-green-700">{label}</span>
          <span className="text-[10px] text-slate-400 ml-1.5">{summary}</span>
        </div>
        <ChevronDown size={12} className={cn('text-slate-400 transition-transform shrink-0', expanded && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StageProgressBar({ currentStage, isHold, persona }: { currentStage: number; isHold: boolean; persona: Persona }) {
  const accentBg = persona === 'checker' ? 'bg-emerald-600' : 'bg-[#084A90]';
  const accentText = persona === 'checker' ? 'text-emerald-600' : 'text-[#084A90]';
  const accentBorder = persona === 'checker' ? 'border-emerald-600' : 'border-[#084A90]';

  return (
    <div className="mt-3 grid grid-cols-6 gap-0">
      {stageLabels.map((label, idx) => {
        const isCompleted = idx < currentStage;
        const isCurrent = idx === currentStage;
        const isHoldCurrent = isHold && isCurrent;

        return (
          <div key={label} className="flex flex-col items-center relative">
            {/* Connector line (between dots) */}
            {idx > 0 && (
              <div className="absolute top-[14px] right-1/2 w-full h-0.5 -z-10">
                <div className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isCompleted ? accentBg : 'bg-slate-200'
                )} />
              </div>
            )}
            {/* Step circle with number */}
            <div
              className={cn(
                'relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-500',
                isCompleted
                  ? `${accentBorder} ${accentBg} text-white`
                  : isCurrent
                  ? isHoldCurrent
                    ? 'border-red-500 bg-red-500 text-white'
                    : `${accentBorder} bg-white ${accentText}`
                  : 'border-slate-300 bg-white text-slate-400'
              )}
            >
              {isCompleted ? '✓' : idx + 1}
            </div>
            {/* Label */}
            <span
              className={cn(
                'mt-1 text-[10px] font-medium text-center leading-tight',
                isCompleted || isCurrent
                  ? isHoldCurrent ? 'text-red-500' : accentText
                  : 'text-slate-400'
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PrWorkflowPanel({
  ticket,
  persona,
  onClose,
  onApprovePO,
  onApproveAmendment,
  onStageChange,
  initialStage = 0,
  onSendPoEmail,
  onMismatchEmailSent,
  hasMismatchReply = false,
  onAmendmentCheckerEmailSent,
  hasAmendmentCheckerReply = false,
  onAmendmentApprovalSent,
  hasAmendmentApprovalReply = false,
  expanded = false,
  onToggleExpand,
  onGoToInbox,
  triggerComplete = false,
  onCheckerDataHold,
  onSendDataIssueEmail,
  checkerDataEmailSent = false,
  hasCheckerDataFixed = false,
  onSendBudgetEmail,
  checkerBudgetEmailSent = false,
  hasCheckerBudgetReply = false,
  hasCheckerBudgetReplyRead = false,
  onCheckerDataResubmit,
  onSubmitToCheckerEmail,
  // hasCheckerBudgetForwardedToMaker removed
  hasCheckerBudgetFixed = false,
  onBudgetCostReductionResubmit,
  onMakerAppliedCostReduction,
  onEffectiveSapPoChange,
}: PrWorkflowPanelProps) {
  const [workflowStage, setWorkflowStageRaw] = useState(initialStage);
  const [amendmentApproved, setAmendmentApproved] = useState(initialStage >= 5);
  const setWorkflowStage = (stage: number) => {
    setWorkflowStageRaw(stage);
    onStageChange?.(stage);
  };

  // Sync workflowStage ONLY when initialStage is explicitly reverted (e.g., 4→3 by Checker forward).
  // Do NOT reset when initialStage drops to 0 (recalculation artifact after stage save).
  const prevInitialStageRef = useRef(initialStage);
  useEffect(() => {
    if (initialStage !== prevInitialStageRef.current && initialStage > 0) {
      setWorkflowStageRaw(initialStage);
      onStageChange?.(initialStage);
    }
    prevInitialStageRef.current = initialStage;
  }, [initialStage]); // eslint-disable-line react-hooks/exhaustive-deps

  // When parent signals workflow is complete, animate progress bar to all-done
  useEffect(() => {
    if (triggerComplete && workflowStage < 6) {
      setWorkflowStageRaw(6);
      onStageChange?.(6);
    }
  }, [triggerComplete]); // eslint-disable-line react-hooks/exhaustive-deps
  // Track which completed stages are expanded (user clicked to view details)
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});
  const toggleStageExpand = (stage: number) => setExpandedStages(prev => ({ ...prev, [stage]: !prev[stage] }));

  // If reply already received on mount, don't re-enter hold state
  const [isHold, setIsHold] = useState(false);
  const hasMismatch = ticket.exception?.type === 'rfx-mismatch';
  const hasAmendment = ticket.exception?.type === 'post-po-amendment';
  const hasCheckerDataIssue = ticket.exception?.type === 'checker-data-issue';
  const hasCheckerBudgetIssue = ticket.exception?.type === 'checker-budget-issue';
  const hasCheckerException = hasCheckerDataIssue; // Budget is resolved by Maker before reaching Checker
  // Checker exception is resolved when: data issue fixed by Maker, or budget reply received (direct allocation), or budget fixed by Maker (cost reduction)
  const [checkerPoApproved, setCheckerPoApproved] = useState(false);
  const [makerAppliedCostReduction, setMakerAppliedCostReduction] = useState(false);
  const checkerExceptionResolved = (hasCheckerDataIssue && hasCheckerDataFixed);
  const mismatchResolved = hasMismatchReply && hasMismatch;
  const [, setMismatchResolvedLocal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mismatchRef = useRef<HTMLDivElement>(null);

  const { fmt, symbol } = useCurrency();
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;

  // Auto-scroll to new section
  useEffect(() => {
    const target = sectionRefs.current[workflowStage];
    if (target && scrollRef.current) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, [workflowStage]);

  // Auto-scroll to mismatch section when hold is set
  useEffect(() => {
    if (isHold && hasMismatch && mismatchRef.current) {
      setTimeout(() => {
        mismatchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [isHold, hasMismatch]);

  // ── Effective SAP PO: reflects all modifications (amendment, cost reduction, data fix) ──
  // Budget-exceeded cases: PO comes from exception.pendingSapPo after budget is resolved
  const budgetPending = hasCheckerBudgetIssue && !hasCheckerBudgetFixed && !makerAppliedCostReduction && !hasCheckerBudgetReply && persona !== 'checker';
  const effectiveSapPo = useMemo(() => {
    // Budget cases: ticket.sapPo is undefined; use pendingSapPo from exception when resolved
    if (hasCheckerBudgetIssue && !ticket.sapPo && ticket.exception?.type === 'checker-budget-issue') {
      if (budgetPending) return undefined;
      const pendingPo = (ticket.exception as import('@/data/types').CheckerBudgetException).pendingSapPo;
      if (!pendingPo) return undefined;
      let po = { ...pendingPo };
      // Apply cost reduction for maker-fix variant
      const budgetEx = ticket.exception as import('@/data/types').CheckerBudgetException;
      if (budgetEx.requiresMakerFix && budgetEx.budgetFixDetails && (hasCheckerBudgetFixed || makerAppliedCostReduction || persona === 'checker')) {
        const { toQty, unitPrice } = budgetEx.budgetFixDetails;
        const newNetValue = toQty * unitPrice;
        const taxMultiplier = po.lineItems[0] ? po.totalValue / po.lineItems[0].totalPrice : 1.25;
        const newTotalValue = Math.round(newNetValue * taxMultiplier);
        po = {
          ...po,
          lineItems: po.lineItems.map((item, i) =>
            i === 0 ? { ...item, quantity: toQty, totalPrice: newNetValue } : item
          ),
          totalValue: newTotalValue,
        };
      }
      return po;
    }
    if (!ticket.sapPo) return ticket.sapPo;
    let po = ticket.sapPo;

    // Amendment: show amended values after Checker reply (Maker) or always for Checker persona
    if (hasAmendment && (hasAmendmentCheckerReply || persona === 'checker') && ticket.exception?.type === 'post-po-amendment') {
      const amendment = ticket.exception;
      const qtyStr = amendment.amendments.find(a => a.field === 'quantity')?.requestedValue ?? '';
      const newQty = parseFloat(qtyStr.replace(/[^0-9.]/g, '')) || po.lineItems[0]?.quantity;
      po = {
        ...po,
        lineItems: po.lineItems.map((item, i) =>
          i === 0 ? { ...item, quantity: newQty, taxCode: 'U1', totalPrice: amendment.amendedTotalValue } : item
        ),
        totalValue: amendment.amendedTotalValue,
      };
    }

    // Data issue correction: fix supplier code
    if (hasCheckerDataFixed && ticket.exception?.type === 'checker-data-issue') {
      const dataEx = ticket.exception as import('@/data/types').CheckerDataException;
      for (const issue of dataEx.issues) {
        if (issue.field === 'supplierCode') {
          po = { ...po, supplierCode: issue.correctValue };
        }
      }
    }

    return po;
  }, [ticket.sapPo, ticket.exception, hasAmendment, amendmentApproved, hasAmendmentApprovalReply, hasCheckerBudgetFixed, makerAppliedCostReduction, checkerBudgetEmailSent, hasCheckerDataFixed, budgetPending]);

  // Push effectiveSapPo to parent whenever it changes
  useEffect(() => {
    if (effectiveSapPo) onEffectiveSapPoChange?.(effectiveSapPo);
  }, [effectiveSapPo]); // eslint-disable-line react-hooks/exhaustive-deps

  // For budget-makerfix tickets: compute cost reduction info for Maker
  const budgetCostReductionInfo = useMemo(() => {
    if (!hasCheckerBudgetIssue || ticket.exception?.type !== 'checker-budget-issue') return undefined;
    const budgetEx = ticket.exception as import('@/data/types').CheckerBudgetException;
    if (!budgetEx.requiresMakerFix || !budgetEx.budgetFixDetails) return undefined;
    // Show when Finance has replied with denial (Maker budget flow)
    if (!hasCheckerBudgetReply) return undefined;
    return {
      fromQty: budgetEx.budgetFixDetails.fromQty,
      toQty: budgetEx.budgetFixDetails.toQty,
      unitPrice: budgetEx.budgetFixDetails.unitPrice,
      unit: budgetEx.budgetFixDetails.unit,
      allocatedBudget: budgetEx.allocatedBudget,
      sioCode: budgetEx.sioCode,
    };
  }, [hasCheckerBudgetIssue, ticket.exception, hasCheckerBudgetReply]);

  const handleAcceptExtraction = () => setWorkflowStage(1);
  const handleAcceptScenario = () => setWorkflowStage(2);
  const handleValidationPass = () => setWorkflowStage(3);

  // Budget-exceeded cases: auto-advance past validation to show Budget Hold at stage 3
  useEffect(() => {
    if (hasCheckerBudgetIssue && workflowStage === 2 && ticket.validationResult) {
      const timer = setTimeout(() => setWorkflowStage(3), 800);
      return () => clearTimeout(timer);
    }
  }, [hasCheckerBudgetIssue, workflowStage, ticket.validationResult]);
  const handleValidationHold = () => setIsHold(true);
  const handleMismatchSend = (sent: EmailItem) => {
    onMismatchEmailSent?.(sent);
  };
  const handleRevalidate = () => {
    setIsHold(false);
    setMismatchResolvedLocal(true);
    setWorkflowStage(3);
  };
  const handleSubmitToChecker = () => {
    if (hasAmendment && ticket.exception?.type === 'post-po-amendment') {
      // Auto-send checker review email (no modal) and stay on panel
      const amendment = ticket.exception;
      const amendedLines = amendment.amendments
        .map(a => `  • ${a.label}: ${a.originalValue} → ${a.requestedValue}`)
        .join('\n');
      const email: EmailItem = {
        id: `checker-review-${Date.now()}`,
        from: 'Maker',
        fromEmail: 'maker@company.com',
        to: 'Checker',
        toEmail: 'checker@company.com',
        cc: amendment.requesterEmail,
        subject: `Amended PO ${amendment.poNumber} Ready for QC Review — ${ticket.extractedData.materialDescription}`,
        preview: `Amended PO ${amendment.poNumber} has been updated and is ready for Checker QC review and release.`,
        body: `Dear Checker,\n\nAmended PO ${amendment.poNumber} has been updated in SAP and is ready for your QC review.\n\nAMENDED PO DETAILS:\nPO Number: ${amendment.poNumber}\nMaterial: ${ticket.extractedData.materialDescription}\nSupplier: ${ticket.sapPo?.supplierName ?? ''} (${ticket.sapPo?.supplierCode ?? ''})\n\nAMENDMENT CHANGES:\n${amendedLines}\n\nAmended Total Value: ${symbol}${fmt(amendment.amendedTotalValue)}\n\nAmendment Reason: ${amendment.reason}\n\nManager approval from ${amendment.requesterName} is on file. Please review and release at your earliest convenience.\n\nRegards,\nMaker\nP&SC Support Group — GDC`,
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        read: true,
        attachments: [`Amended_PO_${amendment.poNumber}.pdf`, `Amendment_${amendment.poNumber}.pdf`, `Manager_Approval_${amendment.poNumber}.pdf`],
        type: 'outgoing' as const,
        relatedPO: amendment.poNumber,
        relatedTicketId: ticket.id,
        forPersona: 'maker' as const,
      };
      onAmendmentCheckerEmailSent?.(email);
      setWorkflowStage(4); // advance stage bar but checker details gated behind reply
    } else {
      // Standard / Checker exception flows: auto-send notification email to Checker
      const poNumber = effectiveSapPo?.poNumber ?? '';
      const email: EmailItem = {
        id: `submit-checker-${Date.now()}`,
        from: 'Maker',
        fromEmail: 'maker@company.com',
        to: 'Checker',
        toEmail: 'checker@company.com',
        subject: `PO ${poNumber} Ready for QC Review — ${ticket.extractedData.materialDescription}`,
        preview: `PO ${poNumber} has been created and is ready for Checker QC review and release.`,
        body: `Dear Checker,\n\nPO ${poNumber} has been created in SAP and is ready for your QC review.\n\nMaterial: ${ticket.extractedData.materialDescription}\nSupplier: ${effectiveSapPo?.supplierName ?? ''} (${effectiveSapPo?.supplierCode ?? ''})\nTotal Value: ${symbol}${fmt(effectiveSapPo?.totalValue ?? 0)}\n\nPlease review and release at your earliest convenience.\n\nRegards,\nMaker\nP&SC Support Group — GDC`,
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        read: true,
        attachments: [`PO_${poNumber}.pdf`, `Validation_Report.pdf`],
        type: 'outgoing',
        relatedPO: poNumber,
        relatedTicketId: ticket.id,
        forPersona: 'maker',
      };
      onSubmitToCheckerEmail?.(email);
      setWorkflowStage(4);
    }
  };
  const handleApproveRelease = () => {
    setWorkflowStage(5);
    onApprovePO();
  };
  const handleCheckerHold = () => {
    setIsHold(true);
    toast.warning('PO placed on hold by Checker. Review required before release.');
  };
  const handleCheckerReject = () => {
    toast.error(`PO rejected by Checker. Ticket returned for rework.`);
    onClose();
  };
  const handleCheckerDataHold = () => {
    setIsHold(true);
    onCheckerDataHold?.();
  };
  const handleBudgetHold = () => {
    setIsHold(true);
  };
  const handleCheckerBudgetResolved = () => {
    setIsHold(false);
  };
  const handleApproveAmendment = () => {
    setAmendmentApproved(true);
    // Auto-send final verification request to Ops Team (not Checker) for sign-off before release
    if (ticket.exception?.type === 'post-po-amendment') {
      const amendment = ticket.exception;
      const email: EmailItem = {
        id: `approval-notify-${Date.now()}`,
        from: 'PO Team',
        fromEmail: 'po-team@company.com',
        to: 'Ops Team',
        toEmail: 'ops@company.com',
        subject: `Final Verification Required — PO ${amendment.poNumber} Amendment`,
        preview: `Maker has approved the amendment for PO ${amendment.poNumber}. Please complete final ops verification before Checker release.`,
        body: `Dear Ops Team,\n\nThe Maker has reviewed and approved the amendment to PO ${amendment.poNumber}. We require your final verification before the Checker can proceed with PO release.\n\nAmendment Reason: ${amendment.reason}\n\nPlease confirm ops-side checks (budget code, cost centre, vendor master) are complete so we can proceed to Checker release.\n\nRegards,\nP&SC Support Group — GDC`,
        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        read: true,
        attachments: [`Maker_Approval_${amendment.poNumber}.pdf`, `Amendment_Details_${amendment.poNumber}.pdf`],
        type: 'outgoing' as const,
        relatedPO: amendment.poNumber,
      };
      onAmendmentApprovalSent?.(email);
    }
    onApproveAmendment();
  };

  return (
      <div className={cn(
        'flex flex-col bg-white rounded-r-xl shadow-2xl overflow-hidden border border-slate-200 transition-all duration-300',
        expanded ? 'flex-1 min-w-0' : 'w-[520px]'
      )}>
        {/* Persona bar */}
        <div className={cn(
          'h-1 shrink-0',
          persona === 'checker' ? 'bg-emerald-500' : 'bg-[#084A90]'
        )} />

        {/* Header */}
        <div className="shrink-0 border-b border-slate-200">
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                persona === 'checker' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              )}>
                {persona}
              </span>
              {onToggleExpand && (
                <button
                  onClick={onToggleExpand}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  title={expanded ? 'Restore split view' : 'Expand to full width'}
                >
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-5 pb-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-800">{ticket.id.replace('GDC-INC-2026-', 'INC-')}</span>
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold', priority.bg, priority.text)}>
                {priority.label}
              </span>
              {isHold && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">
                  ON HOLD
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              RFX: {ticket.rfxId} — {ticket.extractedData.materialDescription}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Material: <strong className="text-slate-700">{ticket.extractedData.materialNumber}</strong></span>
              <span>Value: <strong className="text-slate-700">{symbol}{fmt(effectiveSapPo?.totalValue ?? ticket.totalValue)}</strong></span>
            </div>
            <StageProgressBar currentStage={workflowStage} isHold={isHold} persona={persona} />
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {/* ── Stages 0-3: Maker only (hidden from Checker) ── */}
          {persona !== 'checker' && (
            <>
              {/* Stage 0: Content Extraction */}
              <div ref={(el) => { sectionRefs.current[0] = el; }}>
                {workflowStage > 0 ? (
                  <CompletedStageSummary
                    icon={<FileText size={10} className="text-green-600" />}
                    label="Content Extraction"
                    summary={`${ticket.extractedData.docsAvailable.filter(d => d.present).length} docs · ${ticket.supplierQuotes.length} quotes · 18 fields`}
                    expanded={!!expandedStages[0]}
                    onToggle={() => toggleStageExpand(0)}
                  >
                    <SignalReconciliation
                      extractedData={ticket.extractedData}
                      portalValues={ticket.portalValues}
                      supplierQuotes={ticket.supplierQuotes}
                      onAccept={handleAcceptExtraction}
                    />
                  </CompletedStageSummary>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="extraction"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SignalReconciliation
                        extractedData={ticket.extractedData}
                        portalValues={ticket.portalValues}
                        supplierQuotes={ticket.supplierQuotes}
                        onAccept={handleAcceptExtraction}
                      />
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Stage 1: Scenario Identification */}
              {workflowStage >= 1 && ticket.scenarioResult && (
                <div ref={(el) => { sectionRefs.current[1] = el; }}>
                  {workflowStage > 1 ? (
                    <CompletedStageSummary
                      icon={<Tag size={10} className="text-green-600" />}
                      label="Scenario Identification"
                      summary={`${ticket.scenarioResult.scenarioType} · ${ticket.scenarioResult.confidence}% confidence`}
                      expanded={!!expandedStages[1]}
                      onToggle={() => toggleStageExpand(1)}
                    >
                      <ScenarioIdentification
                        scenarioResult={ticket.scenarioResult}
                        onAccept={handleAcceptScenario}
                      />
                    </CompletedStageSummary>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                      <div className="border-t border-slate-200 pt-4">
                        <ScenarioIdentification
                          scenarioResult={ticket.scenarioResult}
                          onAccept={handleAcceptScenario}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Stage 2: Validation */}
              {workflowStage >= 2 && ticket.validationResult && (
                <div ref={(el) => { sectionRefs.current[2] = el; }}>
                  {workflowStage > 2 && !isHold ? (
                    <CompletedStageSummary
                      icon={<ShieldCheck size={10} className="text-green-600" />}
                      label="Validation"
                      summary={mismatchResolved
                        ? 'Exception resolved · Re-validated'
                        : `${ticket.validationResult.passCount} pass · ${ticket.validationResult.failCount} fail · ${ticket.validationResult.warningCount} warn`
                      }
                      expanded={!!expandedStages[2]}
                      onToggle={() => toggleStageExpand(2)}
                    >
                      {mismatchResolved ? (
                        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2.5">
                          <span className="text-green-500 text-base">✓</span>
                          <div>
                            <p className="text-xs font-semibold text-green-800">Validation Cleared — Exception Resolved</p>
                            <p className="text-[11px] text-green-600 mt-0.5">Quantity confirmed via email reply. Re-validated and approved.</p>
                          </div>
                        </div>
                      ) : (
                        <ValidationAgent
                          validationResult={ticket.validationResult}
                          onAccept={handleValidationPass}
                          onHold={handleValidationHold}
                          hideCta={hasCheckerBudgetIssue}
                          budgetExceeded={hasCheckerBudgetIssue && ticket.exception?.type === 'checker-budget-issue' ? { allocated: (ticket.exception as import('@/data/types').CheckerBudgetException).allocatedBudget, poValue: (ticket.exception as import('@/data/types').CheckerBudgetException).poValue, shortfall: (ticket.exception as import('@/data/types').CheckerBudgetException).shortfall, sioCode: (ticket.exception as import('@/data/types').CheckerBudgetException).sioCode } : undefined}
                        />
                      )}
                    </CompletedStageSummary>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                      <div className="border-t border-slate-200 pt-4">
                        {mismatchResolved ? (
                          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2.5">
                            <span className="text-green-500 text-base">✓</span>
                            <div>
                              <p className="text-xs font-semibold text-green-800">Validation Cleared — Exception Resolved</p>
                              <p className="text-[11px] text-green-600 mt-0.5">Quantity confirmed via email reply. Re-validated and approved.</p>
                            </div>
                          </div>
                        ) : (
                          <ValidationAgent
                            validationResult={ticket.validationResult}
                            onAccept={handleValidationPass}
                            onHold={handleValidationHold}
                            hideCta={hasCheckerBudgetIssue}
                            budgetExceeded={hasCheckerBudgetIssue && ticket.exception?.type === 'checker-budget-issue' ? { allocated: (ticket.exception as import('@/data/types').CheckerBudgetException).allocatedBudget, poValue: (ticket.exception as import('@/data/types').CheckerBudgetException).poValue, shortfall: (ticket.exception as import('@/data/types').CheckerBudgetException).shortfall, sioCode: (ticket.exception as import('@/data/types').CheckerBudgetException).sioCode } : undefined}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* RFX Mismatch Email (if validation failed OR reply already received) */}
              {(isHold || mismatchResolved) && hasMismatch && ticket.exception?.type === 'rfx-mismatch' && (
                <div ref={mismatchRef}>
                  {mismatchResolved && workflowStage > 2 ? (
                    <CompletedStageSummary
                      icon={<CheckCircle size={10} className="text-green-600" />}
                      label="Exception Recovery"
                      summary="Clarification sent · Reply received · Mismatch resolved"
                      expanded={!!expandedStages[99]}
                      onToggle={() => toggleStageExpand(99)}
                    >
                      <RfxMismatchEmail
                        mismatch={ticket.exception}
                        onMismatchEmailSent={handleMismatchSend}
                        hasMismatchReply={hasMismatchReply}
                        onRevalidate={handleRevalidate}
                        onGoToInbox={onGoToInbox}
                      />
                    </CompletedStageSummary>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                      <div className="border-t border-red-200 pt-4">
                        <RfxMismatchEmail
                          mismatch={ticket.exception}
                          onMismatchEmailSent={handleMismatchSend}
                          hasMismatchReply={hasMismatchReply}
                          onRevalidate={handleRevalidate}
                          onGoToInbox={onGoToInbox}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Stage 3: PO Creation */}
              {workflowStage >= 3 && (effectiveSapPo || budgetPending) && (
                <div ref={(el) => { sectionRefs.current[3] = el; }}>
                  {/* PO details — hidden for budget-exceeded cases until resolved */}
                  {!(hasCheckerBudgetIssue && !hasCheckerBudgetFixed && !makerAppliedCostReduction) && (
                    <>
                      {workflowStage > 3 ? (
                        <CompletedStageSummary
                          icon={<FileCheck size={10} className="text-green-600" />}
                          label="PO Creation"
                          summary={`PO ${effectiveSapPo?.poNumber} · ${effectiveSapPo?.supplierName?.split(' ').slice(0, 2).join(' ')} · ${symbol}${fmt(effectiveSapPo?.totalValue ?? 0)}`}
                          expanded={!!expandedStages[3]}
                          onToggle={() => toggleStageExpand(3)}
                        >
                          <PoRecommendation
                            sapPo={effectiveSapPo!}
                            onSubmitToChecker={handleSubmitToChecker}
                            isAmendment={hasAmendment}
                            checkerDataIssue={hasCheckerDataIssue && checkerDataEmailSent && !hasCheckerDataFixed && ticket.exception?.type === 'checker-data-issue' ? ticket.exception : undefined}
                            onResubmitCorrected={onCheckerDataResubmit}
                            budgetCostReduction={budgetCostReductionInfo}
                            onBudgetCostReductionResubmit={onBudgetCostReductionResubmit}
                            onBudgetCostReductionApplied={() => { setMakerAppliedCostReduction(true); onMakerAppliedCostReduction?.(); }}
                          />
                        </CompletedStageSummary>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                          <div className="border-t border-slate-200 pt-4">
                            <PoRecommendation
                              sapPo={effectiveSapPo!}
                              onSubmitToChecker={handleSubmitToChecker}
                              isAmendment={hasAmendment}
                              checkerDataIssue={hasCheckerDataIssue && checkerDataEmailSent && !hasCheckerDataFixed && ticket.exception?.type === 'checker-data-issue' ? ticket.exception : undefined}
                              onResubmitCorrected={onCheckerDataResubmit}
                              hasPendingBudgetIssue={hasCheckerBudgetIssue}
                            />
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                  {/* Maker Budget Hold — always render at Stage 3 for budget-issue tickets */}
                  {hasCheckerBudgetIssue && ticket.exception?.type === 'checker-budget-issue' && persona === 'maker' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                      <div className="border-t border-amber-200 pt-4 mt-2">
                        <CheckerExceptionHandler
                          exception={ticket.exception}
                          onHoldTriggered={handleBudgetHold}
                          onSendBudgetEmail={onSendBudgetEmail}
                          budgetEmailSent={checkerBudgetEmailSent}
                          hasBudgetReply={hasCheckerBudgetReply}
                          hasBudgetReplyRead={hasCheckerBudgetReplyRead}
                          onGoToInbox={onGoToInbox}
                          isCheckerPersona={false}
                          isMakerBudget={true}
                          poNumber={effectiveSapPo?.poNumber}
                          onSubmitToChecker={handleSubmitToChecker}
                          budgetCostReduction={budgetCostReductionInfo}
                          onBudgetCostReductionApplied={() => { setMakerAppliedCostReduction(true); onMakerAppliedCostReduction?.(); }}
                          costReductionApplied={makerAppliedCostReduction}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Checker fallback: ticket not yet submitted by Maker */}
          {persona === 'checker' && workflowStage < 4 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Pending Maker Review</p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-[220px] leading-relaxed">
                This ticket is still being processed by the Maker. Switch to Maker persona to process it first.
              </p>
            </motion.div>
          )}

          {/* Stage 4 — Amendment waiting: email sent, waiting for Checker reply */}
          {workflowStage >= 4 && hasAmendment && !hasAmendmentCheckerReply && (
            <div ref={(el) => { sectionRefs.current[4] = el; }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <div className="border-t border-amber-200 pt-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2.5">
                    <Mail className="text-blue-600 shrink-0 mt-0.5 h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-700">Review request sent to Checker</p>
                      <p className="text-[11px] text-blue-600 mt-0.5">
                        Waiting for Checker approval. A reply will arrive in your Inbox shortly.
                      </p>
                      {onGoToInbox && (
                        <button
                          onClick={onGoToInbox}
                          className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#084A90] hover:underline"
                        >
                          View in Inbox <ExternalLink size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Post-PO Amendment — shown after Checker reply received */}
          {workflowStage >= 4 && hasAmendment && hasAmendmentCheckerReply && ticket.exception?.type === 'post-po-amendment' && (
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <div className="border-t border-amber-200 pt-4">
                  <ExceptionRecovery
                    amendment={ticket.exception}
                    onApproveAmendment={handleApproveAmendment}
                    onGoToInbox={onGoToInbox}
                    resolved={hasAmendmentApprovalReply}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {/* Stage 4 — Amendment 2nd waiting: Maker approved, waiting for Checker release ACK */}
          {workflowStage >= 4 && hasAmendment && amendmentApproved && !hasAmendmentApprovalReply && (
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <div className="border-t border-amber-200 pt-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2.5">
                    <Mail className="text-blue-600 shrink-0 mt-0.5 h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-700">Ops verification request sent</p>
                      <p className="text-[11px] text-blue-600 mt-0.5">
                        Waiting for Ops verification. A reply will arrive in your Inbox shortly.
                      </p>
                      {onGoToInbox && (
                        <button
                          onClick={onGoToInbox}
                          className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#084A90] hover:underline"
                        >
                          View in Inbox <ExternalLink size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Stage 4: Checker QC / PO Release — Amendment: only visible to Checker after release ACK */}
          {workflowStage >= 4 && effectiveSapPo && ticket.checkerReview && (!hasAmendment || (hasAmendmentApprovalReply && persona === 'checker')) && (
            <div ref={(el) => { sectionRefs.current[4] = el; }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <div className={cn('border-t pt-4', persona === 'checker' ? 'border-emerald-200' : 'border-slate-200')}>
                  <ApprovalCopilot
                    sapPo={effectiveSapPo!}
                    checkerReview={ticket.checkerReview}
                    onApprove={handleApproveRelease}
                    onReject={handleCheckerReject}
                    onHold={handleCheckerHold}
                    isCheckerPersona={persona === 'checker'}
                    onSendPoEmail={onSendPoEmail}
                    hasCheckerException={hasCheckerException}
                    checkerExceptionResolved={checkerExceptionResolved}
                    onApproved={() => setCheckerPoApproved(true)}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {/* Checker Exception Handler — only for data-issue (budget is resolved at Maker stage) */}
          {workflowStage >= 4 && hasCheckerException && ticket.exception && ticket.exception.type === 'checker-data-issue' && persona === 'checker' && (
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
                <div className="border-t border-red-200 pt-4">
                  <CheckerExceptionHandler
                    exception={ticket.exception}
                    onHoldTriggered={hasCheckerDataIssue ? handleCheckerDataHold : handleBudgetHold}
                    onSendDataIssueEmail={onSendDataIssueEmail}
                    dataEmailSent={checkerDataEmailSent}
                    dataFixedByMaker={hasCheckerDataFixed}
                    onSendBudgetEmail={onSendBudgetEmail}
                    budgetEmailSent={checkerBudgetEmailSent}
                    hasBudgetReply={hasCheckerBudgetReply}
                    hasBudgetReplyRead={hasCheckerBudgetReplyRead}
                    onBudgetResolved={handleCheckerBudgetResolved}
                    onGoToInbox={onGoToInbox}
                    isCheckerPersona={persona === 'checker'}
                    poNumber={effectiveSapPo?.poNumber}
                    hasBudgetForwardedToMaker={false}
                    hasBudgetFixedByMaker={false}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {/* Send PO Confirmation Email — rendered at the bottom for exception flows */}
          {checkerPoApproved && hasCheckerException && persona === 'checker' && effectiveSapPo && (
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                <div className="border-t border-emerald-200 pt-4">
                  <button
                    onClick={() => {
                      const po = effectiveSapPo!;
                      const draft: import('@/data/types').EmailItem = {
                        id: `po-confirm-${Date.now()}`,
                        from: 'PO Team',
                        fromEmail: 'po-team@company.com',
                        to: po.supplierName,
                        toEmail: 'supplier@vendor.com',
                        subject: `PO Confirmation — ${po.poNumber}`,
                        preview: `Your purchase order ${po.poNumber} has been released in SAP.`,
                        body: `Dear ${po.supplierName},\n\nPlease find below details of Purchase Order ${po.poNumber} released in SAP.\n\nPO Number: ${po.poNumber}\nSupplier: ${po.supplierName} (${po.supplierCode})\nTotal Value: €${po.totalValue.toLocaleString("en-US")}\nValidity: ${po.validityStart} – ${po.validityEnd}\nPayment Terms: ${po.paymentTerms}\nIncoterms: ${po.incoterms} (${po.incotermsLocation})\n\nPlease acknowledge receipt and confirm delivery schedule.\n\nRegards,\nP&SC Support Group — GDC`,
                        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
                        read: true,
                        attachments: [`PO_Confirmation_${po.poNumber}.pdf`, `Delivery_Terms_${po.poNumber}.pdf`],
                        type: 'outgoing',
                      };
                      onSendPoEmail?.(draft);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
                  >
                    <Mail size={14} />
                    Send PO Confirmation Email
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Stage 5: Ticket Updation — Amendment: only visible to Checker persona */}
          {workflowStage >= 5 && effectiveSapPo && (!hasAmendment || persona === 'checker') && (
            <div ref={(el) => { sectionRefs.current[5] = el; }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <div className="border-t border-green-200 pt-4">
                  <ExecutionStatus
                    sapPo={effectiveSapPo!}
                    ticketId={ticket.id}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
  );
}
