import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Mail, ExternalLink, Sparkles, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckerDataException, CheckerBudgetException, EmailItem } from '@/data/types';

type DataIssueStage = 'idle' | 'animating' | 'draft-ready' | 'sent';

interface CheckerExceptionHandlerProps {
  exception: CheckerDataException | CheckerBudgetException;
  /** Both: triggers hold state (no email yet) */
  onHoldTriggered?: () => void;
  /** Data issue: opens compose modal with the draft email */
  onSendDataIssueEmail?: (email: EmailItem) => void;
  /** Data issue: email has been sent (compose modal completed) */
  dataEmailSent?: boolean;
  /** Data issue: Maker has fixed and resubmitted */
  dataFixedByMaker?: boolean;
  /** Budget issue: opens compose modal with draft */
  onSendBudgetEmail?: (email: EmailItem) => void;
  /** Budget issue: email sent via compose modal */
  budgetEmailSent?: boolean;
  hasBudgetReply?: boolean;
  /** Budget issue: Finance reply has been read in inbox */
  hasBudgetReplyRead?: boolean;
  onBudgetResolved?: () => void;
  onGoToInbox?: () => void;
  isCheckerPersona: boolean;
  poNumber?: string;
  /** Budget issue (maker-fix): forwarded to Maker */
  hasBudgetForwardedToMaker?: boolean;
  /** Budget issue (maker-fix): Maker has fixed and resubmitted */
  hasBudgetFixedByMaker?: boolean;
  /** When true, renders budget flow for Maker at Stage 3 instead of Checker at Stage 4 */
  isMakerBudget?: boolean;
  /** Maker budget: submit resolved PO to Checker */
  onSubmitToChecker?: () => void;
  /** Maker budget (maker-fix): cost reduction details */
  budgetCostReduction?: { fromQty: number; toQty: number; unitPrice: number; unit: string; allocatedBudget: number; sioCode: string };
  /** Maker budget (maker-fix): callback when Maker applies cost reduction */
  onBudgetCostReductionApplied?: () => void;
  /** Maker budget (maker-fix): cost reduction has been applied */
  costReductionApplied?: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// AI draft animation steps
const draftSteps = [
  'Analyzing QC re-validation results…',
  'Identifying data discrepancies…',
  'Composing notification email to Maker…',
  'Attaching QC review report…',
];

function AiDraftAnimation() {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => Math.min(p + 8 + Math.random() * 12, 95));
      setStepIdx(i => Math.min(i + 1, draftSteps.length - 1));
    }, 350);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-[#084A90] animate-spin" />
        <span className="text-xs font-semibold text-[#084A90]">AI Drafting Email…</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-indigo-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#084A90] to-blue-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={stepIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-[10px] text-indigo-400"
        >
          {draftSteps[stepIdx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function CheckerExceptionHandler({
  exception,
  onHoldTriggered,
  onSendDataIssueEmail,
  dataEmailSent = false,
  dataFixedByMaker = false,
  onSendBudgetEmail,
  budgetEmailSent = false,
  hasBudgetReply = false,
  hasBudgetReplyRead = false,
  onBudgetResolved,
  onGoToInbox,
  isCheckerPersona,
  poNumber = '',
  hasBudgetForwardedToMaker = false,
  hasBudgetFixedByMaker = false,
  isMakerBudget = false,
  onSubmitToChecker,
  budgetCostReduction,
  onBudgetCostReductionApplied,
  costReductionApplied = false,
}: CheckerExceptionHandlerProps) {
  const [dataStage, setDataStage] = useState<DataIssueStage>('idle');
  const [budgetStage, setBudgetStage] = useState<DataIssueStage>('idle');

  // After animation completes, show draft
  useEffect(() => {
    if (dataStage === 'animating') {
      const timer = setTimeout(() => setDataStage('draft-ready'), 1800);
      return () => clearTimeout(timer);
    }
  }, [dataStage]);

  useEffect(() => {
    if (budgetStage === 'animating') {
      const timer = setTimeout(() => setBudgetStage('draft-ready'), 1800);
      return () => clearTimeout(timer);
    }
  }, [budgetStage]);

  // When parent confirms email was sent via compose modal
  useEffect(() => {
    if (dataEmailSent && dataStage === 'draft-ready') {
      setDataStage('sent');
    }
  }, [dataEmailSent, dataStage]);

  useEffect(() => {
    if (budgetEmailSent && budgetStage === 'draft-ready') {
      setBudgetStage('sent');
    }
  }, [budgetEmailSent, budgetStage]);

  if (exception.type === 'checker-data-issue') {
    const issueLines = exception.issues
      .map(i => `  • ${i.label}: ${i.poValue} (incorrect) → ${i.correctValue} (correct)`)
      .join('\n');

    const buildDraftEmail = (): EmailItem => ({
      id: `data-return-${Date.now()}`,
      from: 'Checker',
      fromEmail: 'checker@company.com',
      to: 'Maker',
      toEmail: 'maker@company.com',
      subject: `PO ${poNumber} Returned — Data Correction Required`,
      preview: `Checker QC found data errors in PO ${poNumber}. Please correct and resubmit.`,
      body: `Dear Maker,\n\nDuring QC review of PO ${poNumber}, the following data issue(s) were identified:\n\n${issueLines}\n\nThe PO has been placed on hold and returned for correction. Please update the affected field(s) in the PO and resubmit for Checker release.\n\nRegards,\nChecker\nP&SC Support Group — GDC`,
      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      read: true,
      attachments: [`QC_Review_${poNumber}.pdf`, `Error_Report_${poNumber}.pdf`],
      type: 'outgoing',
      relatedPO: poNumber,
    });

    return (
      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {/* Header Banner */}
        <motion.div variants={fadeUp} className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-xs font-semibold text-red-700">HOLD — Data Issue Detected by Checker</span>
          </div>
          <p className="text-[11px] text-red-600 leading-relaxed">
            Checker QC review found data errors in the PO. Checker cannot modify the PO directly — it must be returned to the Maker for correction.
          </p>
        </motion.div>

        {/* Issue Table */}
        <motion.div variants={fadeUp}>
          <h5 className="text-xs font-semibold text-slate-600 mb-2">Data Issues Found</h5>
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="grid grid-cols-3 gap-0 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Field</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase">PO Value</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Correct Value</span>
            </div>
            {exception.issues.map((issue) => (
              <div key={issue.field} className="grid grid-cols-3 gap-0 px-3 py-2 border-b border-slate-50 last:border-b-0">
                <span className="text-xs font-medium text-slate-700">{issue.label}</span>
                <span className="text-xs font-mono text-red-600 bg-red-50 rounded px-1.5 py-0.5 w-fit">{issue.poValue}</span>
                <span className="text-xs font-mono text-green-600 bg-green-50 rounded px-1.5 py-0.5 w-fit">{issue.correctValue}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action — multi-stage flow */}
        {isCheckerPersona && (
          <>
            {dataFixedByMaker ? (
              <motion.div variants={fadeUp}>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-green-700">Corrected & Resubmitted by Maker</p>
                    <p className="text-[10px] text-green-600 mt-0.5">Data issue has been fixed. You may now proceed with QC review.</p>
                  </div>
                </div>
              </motion.div>
            ) : dataStage === 'idle' ? (
              <motion.div variants={fadeUp}>
                <button
                  onClick={() => {
                    setDataStage('animating');
                    onHoldTriggered?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                >
                  <AlertTriangle size={14} />
                  Put on Hold & Notify Maker
                </button>
              </motion.div>
            ) : dataStage === 'animating' ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AiDraftAnimation />
              </motion.div>
            ) : dataStage === 'draft-ready' ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {/* AI-composed email draft preview */}
                <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-[#084A90]" />
                    <span className="text-xs font-semibold text-[#084A90]">AI-Drafted Email</span>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white p-3 space-y-1.5 text-xs">
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-8 shrink-0">To:</span>
                      <span className="font-medium text-slate-700">Maker (maker@company.com)</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-8 shrink-0">Subj:</span>
                      <span className="font-medium text-slate-700">PO {poNumber} Returned — Data Correction Required</span>
                    </div>
                    <div className="h-px bg-slate-100 my-1" />
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      During QC review of PO {poNumber}, the following data issue(s) were identified:
                    </p>
                    {exception.issues.map((issue) => (
                      <div key={issue.field} className="flex items-center gap-2 text-[11px] pl-2">
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{issue.label}:</span>
                        <span className="font-mono text-red-600 line-through">{issue.poValue}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-mono text-green-600 font-semibold">{issue.correctValue}</span>
                      </div>
                    ))}
                    <p className="text-slate-500 text-[10px] mt-1">+ 2 attachments: QC_Review_{poNumber}.pdf, Error_Report_{poNumber}.pdf</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSendDataIssueEmail?.(buildDraftEmail());
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
                >
                  <Send size={14} />
                  Send Email to Maker
                </button>
              </motion.div>
            ) : /* sent */ (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2.5">
                  <Mail className="text-blue-600 shrink-0 mt-0.5 h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-700">Returned to Maker for Correction</p>
                    <p className="text-[11px] text-blue-600 mt-0.5">
                      Email sent to Maker. Switch to <strong>Maker</strong> persona to view the email in Inbox and apply the correction.
                    </p>
                    {onGoToInbox && (
                      <button
                        onClick={onGoToInbox}
                        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#084A90] hover:underline"
                      >
                        View in Sent <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {!isCheckerPersona && !exception.resolved && (
          <motion.div variants={fadeUp}>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">Correction Required</span>
              </div>
              <p className="text-[11px] text-amber-600 leading-relaxed">
                Checker has returned this PO for data correction. Please fix the highlighted fields and resubmit to Checker.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // checker-budget-issue
  const budget = exception as CheckerBudgetException;

  const buildBudgetDraft = (): EmailItem => ({
    id: `budget-notify-${Date.now()}`,
    from: isMakerBudget ? 'Maker' : 'Checker',
    fromEmail: isMakerBudget ? 'maker@company.com' : 'checker@company.com',
    to: 'Buyer',
    toEmail: budget.emailDraft.to,
    cc: budget.emailDraft.cc,
    subject: budget.emailDraft.subject,
    preview: budget.emailDraft.body.substring(0, 80),
    body: budget.emailDraft.body,
    date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
    read: true,
    attachments: budget.emailDraft.attachments,
    type: 'outgoing',
    relatedPO: poNumber,
  });

  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {/* Header Banner */}
      <motion.div variants={fadeUp} className={cn('rounded-lg border p-3',
        (costReductionApplied && isMakerBudget) ? 'border-green-200 bg-green-50' :
        hasBudgetFixedByMaker ? 'border-green-200 bg-green-50' :
        hasBudgetForwardedToMaker ? 'border-amber-200 bg-amber-50' :
        (hasBudgetReplyRead && !budget.requiresMakerFix) ? 'border-green-200 bg-green-50' :
        'border-red-200 bg-red-50'
      )}>
        <div className="flex items-center gap-2 mb-2">
          {(costReductionApplied && isMakerBudget)
            ? <><CheckCircle size={16} className="text-green-600" /><span className="text-xs font-semibold text-green-700">Cost Reduction Applied — PO Recalculated Within Budget</span></>
            : hasBudgetFixedByMaker
            ? <><CheckCircle size={16} className="text-green-600" /><span className="text-xs font-semibold text-green-700">Cost Reduced & Resubmitted by Maker</span></>
            : hasBudgetForwardedToMaker
            ? <><Mail size={16} className="text-amber-600" /><span className="text-xs font-semibold text-amber-700">Finance Requires Cost Reduction — Sent to Maker</span></>
            : (hasBudgetReplyRead && !budget.requiresMakerFix)
            ? <><CheckCircle size={16} className="text-green-600" /><span className="text-xs font-semibold text-green-700">Budget Issue Resolved — Finance Allocated Additional Funds</span></>
            : <><AlertTriangle size={16} className="text-red-600" /><span className="text-xs font-semibold text-red-700">HOLD — Budget Exceeded</span></>
          }
        </div>
        {!hasBudgetReplyRead && !hasBudgetForwardedToMaker && !hasBudgetFixedByMaker && !costReductionApplied && (
          <p className="text-[11px] text-red-600 leading-relaxed">
            {budget.reason}
          </p>
        )}
      </motion.div>

      {/* Budget Breakdown */}
      <motion.div variants={fadeUp}>
        <h5 className="text-xs font-semibold text-slate-600 mb-2">Budget Analysis</h5>
        <div className={cn('rounded-lg border p-3 space-y-2',
          (hasBudgetFixedByMaker || (hasBudgetReplyRead && !budget.requiresMakerFix)) ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white'
        )}>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">SIO Code</span>
            <span className="font-mono font-medium text-slate-800">{budget.sioCode}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Allocated Budget</span>
            {hasBudgetReplyRead && !budget.requiresMakerFix ? (
              <span className="font-semibold text-green-700">€{budget.poValue.toLocaleString("en-US")} <span className="text-[10px] text-green-500">(+{budget.shortfall.toLocaleString("en-US")} allocated)</span></span>
            ) : (
              <span className="font-semibold text-green-700">€{budget.allocatedBudget.toLocaleString("en-US")}</span>
            )}
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">PO Total Value</span>
            {(hasBudgetFixedByMaker || (costReductionApplied && isMakerBudget)) && (budget.budgetFixDetails || budgetCostReduction) ? (
              <span className="font-semibold text-green-700">
                <span className="line-through text-slate-400 mr-1">€{budget.poValue.toLocaleString("en-US")}</span>
                €{Math.round((budgetCostReduction?.toQty ?? budget.budgetFixDetails!.toQty) * (budgetCostReduction?.unitPrice ?? budget.budgetFixDetails!.unitPrice) * 1.25).toLocaleString("en-US")}
              </span>
            ) : (
              <span className={cn('font-semibold', (hasBudgetReplyRead && !budget.requiresMakerFix) ? 'text-green-700' : 'text-red-700')}>€{budget.poValue.toLocaleString("en-US")}</span>
            )}
          </div>
          <div className="h-px bg-slate-100" />
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 font-semibold">Shortfall</span>
            {hasBudgetFixedByMaker || (costReductionApplied && isMakerBudget) || (hasBudgetReplyRead && !budget.requiresMakerFix) ? (
              <span className="font-bold text-green-700 bg-green-50 rounded px-2 py-0.5">€0 — Resolved</span>
            ) : (
              <span className="font-bold text-red-700 bg-red-50 rounded px-2 py-0.5">€{budget.shortfall.toLocaleString("en-US")}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action — multi-stage flow */}
      {(isCheckerPersona || isMakerBudget) && (
        <>
          {/* Maker-fix path: cost reduction applied (Maker budget) or Maker fixed & resubmitted (Checker) */}
          {(isMakerBudget && costReductionApplied) ? (
            <motion.div variants={fadeUp} className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700">Cost Reduction Applied — PO Recalculated Within Budget</p>
                  <p className="text-[10px] text-green-600 mt-0.5">
                    PO quantity reduced from {budgetCostReduction?.fromQty} to {budgetCostReduction?.toQty} {budgetCostReduction?.unit}. Revised PO is within budget.
                  </p>
                </div>
              </div>
              <button
                onClick={onSubmitToChecker}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Send size={14} />
                Submit PO for Checker QC →
              </button>
            </motion.div>
          ) : hasBudgetFixedByMaker && !isMakerBudget ? (
            <motion.div variants={fadeUp} className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700">Maker Applied Cost Reduction</p>
                  <p className="text-[10px] text-green-600 mt-0.5">
                    PO quantity reduced from {budget.budgetFixDetails?.fromQty} to {budget.budgetFixDetails?.toQty} {budget.budgetFixDetails?.unit}. Revised PO is within budget.
                  </p>
                </div>
              </div>
              <button
                onClick={onBudgetResolved}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <CheckCircle size={14} />
                Resume QC Review
              </button>
            </motion.div>
          ) : hasBudgetForwardedToMaker && !isMakerBudget ? (
            /* Checker-only: forwarded, waiting for Maker */
            <motion.div variants={fadeUp}>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
                <Mail className="text-amber-600 shrink-0 mt-0.5 h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700">Cost reduction instructions sent to Maker</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    Waiting for Maker to reduce PO quantity and resubmit. Switch to Maker persona to apply the cost reduction.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : isMakerBudget && hasBudgetReplyRead && budget.requiresMakerFix && budgetCostReduction && !costReductionApplied ? (
            /* Maker budget: Finance denied, show cost reduction UI */
            <motion.div variants={fadeUp} className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">Finance Requires Cost Reduction</span>
                </div>
                <p className="text-[11px] text-amber-600 leading-relaxed">
                  Finance cannot allocate additional budget for {budgetCostReduction.sioCode}. Reduce PO quantity to bring total within €{budgetCostReduction.allocatedBudget.toLocaleString("en-US")}.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <div className="grid grid-cols-3 gap-0 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Field</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Current</span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Revised</span>
                </div>
                <div className="grid grid-cols-3 gap-0 px-3 py-2 border-b border-slate-50">
                  <span className="text-xs font-medium text-slate-700">Quantity</span>
                  <span className="text-xs font-mono text-red-600 line-through">{budgetCostReduction.fromQty} {budgetCostReduction.unit}</span>
                  <span className="text-xs font-mono text-green-600 font-semibold">{budgetCostReduction.toQty} {budgetCostReduction.unit}</span>
                </div>
                <div className="grid grid-cols-3 gap-0 px-3 py-2">
                  <span className="text-xs font-medium text-slate-700">Net Value</span>
                  <span className="text-xs font-mono text-red-600 line-through">€{(budgetCostReduction.fromQty * budgetCostReduction.unitPrice).toLocaleString("en-US")}</span>
                  <span className="text-xs font-mono text-green-600 font-semibold">€{(budgetCostReduction.toQty * budgetCostReduction.unitPrice).toLocaleString("en-US")}</span>
                </div>
              </div>
              <button
                onClick={onBudgetCostReductionApplied}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
              >
                Apply Cost Reduction
              </button>
            </motion.div>
          ) : hasBudgetReplyRead && !budget.requiresMakerFix ? (
            /* Direct allocation path: Finance allocated budget */
            <motion.div variants={fadeUp} className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700">Budget Allocated by Finance</p>
                  <p className="text-[10px] text-green-600 mt-0.5">
                    Additional €{budget.shortfall.toLocaleString("en-US")} allocated to {budget.sioCode}. You may now proceed.
                  </p>
                </div>
              </div>
              <button
                onClick={isMakerBudget ? onSubmitToChecker : onBudgetResolved}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                {isMakerBudget ? <><Send size={14} />Submit PO for Checker QC →</> : <><CheckCircle size={14} />Resume QC Review</>}
              </button>
            </motion.div>
          ) : hasBudgetReply ? (
            <motion.div variants={fadeUp}>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2.5">
                <Mail className="text-blue-600 shrink-0 mt-0.5 h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-700">{budget.requiresMakerFix ? 'Finance has replied — Cost reduction required' : 'Finance has replied — Budget allocation received'}</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">
                    Open the reply in your Inbox to review the details{!isMakerBudget && budget.requiresMakerFix ? ' and forward to Maker' : ' before proceeding'}.
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
            </motion.div>
          ) : budgetStage === 'idle' ? (
            <motion.div variants={fadeUp}>
              <button
                onClick={() => {
                  setBudgetStage('animating');
                  onHoldTriggered?.();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
              >
                <AlertTriangle size={14} />
                Put on Hold & Notify Requester
              </button>
            </motion.div>
          ) : budgetStage === 'animating' ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <AiDraftAnimation />
            </motion.div>
          ) : budgetStage === 'draft-ready' ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
              <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-[#084A90]" />
                  <span className="text-xs font-semibold text-[#084A90]">AI-Drafted Email</span>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-3 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-8 shrink-0">To:</span>
                    <span className="font-medium text-slate-700">Buyer ({budget.emailDraft.to})</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-8 shrink-0">CC:</span>
                    <span className="font-medium text-slate-700">Finance ({budget.emailDraft.cc})</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-8 shrink-0">Subj:</span>
                    <span className="font-medium text-slate-700">{budget.emailDraft.subject}</span>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <p>SIO Code: <span className="font-mono font-semibold">{budget.sioCode}</span></p>
                    <p>Allocated Budget: <span className="text-green-600 font-semibold">€{budget.allocatedBudget.toLocaleString("en-US")}</span></p>
                    <p>PO Total Value: <span className="text-red-600 font-semibold">€{budget.poValue.toLocaleString("en-US")}</span></p>
                    <p>Shortfall: <span className="text-red-600 font-bold">€{budget.shortfall.toLocaleString("en-US")}</span></p>
                    <p className="text-slate-500 italic mt-1">Requesting Finance to allocate additional budget or revise SIO code.</p>
                  </div>
                  <p className="text-slate-500 text-[10px] mt-1">+ 1 attachment: PO_Budget_Analysis_{poNumber}.pdf</p>
                </div>
              </div>
              <button
                onClick={() => onSendBudgetEmail?.(buildBudgetDraft())}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
              >
                <Send size={14} />
                Send to Requester & Finance
              </button>
            </motion.div>
          ) : /* sent, waiting for reply */ (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2.5">
                <Mail className="text-blue-600 shrink-0 mt-0.5 h-4 w-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-700">Budget request sent to Requester & Finance</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">
                    Waiting for Finance to allocate additional budget. A reply will arrive in your Inbox shortly.
                  </p>
                  {onGoToInbox && (
                    <button
                      onClick={onGoToInbox}
                      className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#084A90] hover:underline"
                    >
                      View in Sent <ExternalLink size={10} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}

      {!isCheckerPersona && !isMakerBudget && (
        <motion.div variants={fadeUp}>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-xs text-slate-500">Switch to <strong>Checker</strong> persona to resolve the budget issue.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
