import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckerReview, SapPoData, EmailItem } from '@/data/types';

interface CheckerQCProps {
  sapPo: SapPoData;
  checkerReview: CheckerReview;
  onApprove: () => void;
  onReject: () => void;
  onHold: () => void;
  isCheckerPersona: boolean;
  onSendPoEmail?: (email: EmailItem) => void;
  hasCheckerException?: boolean;
  checkerExceptionResolved?: boolean;
  onApproved?: () => void;
}

const statusIcons = {
  pass: <CheckCircle size={14} className="text-green-500" />,
  fail: <XCircle size={14} className="text-red-500" />,
  warning: <AlertTriangle size={14} className="text-amber-500" />,
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function ApprovalCopilot({
  sapPo,
  checkerReview,
  onApprove,
  onReject,
  onHold,
  isCheckerPersona,
  onSendPoEmail,
  hasCheckerException = false,
  checkerExceptionResolved = false,
  onApproved,
}: CheckerQCProps) {
  const [approved, setApproved] = useState(false);
  const [held, setHeld] = useState(false);

  const handleApprove = () => {
    setApproved(true);
    onApprove();
    onApproved?.();
  };

  const handleHold = () => {
    setHeld(true);
    onHold();
  };

  // Clear held state when exception is resolved
  useEffect(() => {
    if (checkerExceptionResolved && held) setHeld(false);
  }, [checkerExceptionResolved]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendEmail = () => {
    const draft: EmailItem = {
      id: `po-confirm-${Date.now()}`,
      from: 'PO Team',
      fromEmail: 'po-team@company.com',
      to: sapPo.supplierName,
      toEmail: 'supplier@vendor.com',
      subject: `PO Confirmation — ${sapPo.poNumber}`,
      preview: `Your purchase order ${sapPo.poNumber} has been released in SAP.`,
      body: `Dear ${sapPo.supplierName},

Please find below details of Purchase Order ${sapPo.poNumber} released in SAP.

PO Number: ${sapPo.poNumber}
Supplier: ${sapPo.supplierName} (${sapPo.supplierCode})
Total Value: €${sapPo.totalValue.toLocaleString("en-US")}
Validity: ${sapPo.validityStart} – ${sapPo.validityEnd}
Payment Terms: ${sapPo.paymentTerms}
Incoterms: ${sapPo.incoterms} (${sapPo.incotermsLocation})

Please acknowledge receipt and confirm delivery schedule.

Regards,
P&SC Support Group — GDC`,
      date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      read: true,
      attachments: [`PO_Confirmation_${sapPo.poNumber}.pdf`, `Delivery_Terms_${sapPo.poNumber}.pdf`],
      type: 'outgoing',
      relatedPO: sapPo.poNumber,
    };
    onSendPoEmail?.(draft);
  };

  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          PO Release — Checker QC
        </h4>
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
          isCheckerPersona ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
        )}>
          {isCheckerPersona ? 'Checker Active' : 'Waiting for Checker'}
        </span>
      </div>

      {/* Checker Info */}
      <motion.div variants={fadeUp} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">Quality Control Review</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-700/70">Reviewer</span>
            <span className="font-medium text-emerald-800">{checkerReview.reviewerName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-700/70">PO Number</span>
            <span className="font-mono font-medium text-emerald-800">{sapPo.poNumber}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-700/70">Total Value</span>
            <span className="font-semibold text-emerald-800">€{sapPo.totalValue.toLocaleString("en-US")}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-700/70">Supplier</span>
            <span className="font-medium text-emerald-800">{sapPo.supplierName}</span>
          </div>
        </div>
      </motion.div>

      {/* Re-validation Checks */}
      <motion.div variants={fadeUp}>
        <h5 className="text-xs font-semibold text-slate-600 mb-2">Re-validation Checks</h5>
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {checkerReview.revalidationChecks.map((check, idx) => {
            // After exception resolution, override fail checks to show as resolved
            const resolved = checkerExceptionResolved && check.status === 'fail';
            const displayStatus = resolved ? 'pass' : check.status;
            // When resolved, show corrected actual values and clear resolution message
            let displayActual = check.actual;
            let displayMessage = check.message;
            if (resolved) {
              if (check.field === 'totalValue') {
                displayActual = `€${sapPo.totalValue.toLocaleString("en-US")}`;
                displayMessage = `RESOLVED: PO total value €${sapPo.totalValue.toLocaleString("en-US")} now within budget`;
              } else if (check.field === 'supplierMatch') {
                displayActual = sapPo.supplierCode;
                displayMessage = `RESOLVED: Supplier code corrected to ${sapPo.supplierCode}`;
              } else {
                displayMessage = `RESOLVED: ${check.message.replace(/^(MISMATCH|BUDGET EXCEEDED): /, '')}`;
              }
            }
            return (
              <div
                key={check.field}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-xs',
                  idx < checkerReview.revalidationChecks.length - 1 && 'border-b border-slate-50'
                )}
              >
                {statusIcons[displayStatus]}
                <span className="font-medium text-slate-700 w-28">{check.label}</span>
                <span className="text-slate-500 flex-1">{displayActual}</span>
                <span className={cn('text-[10px]', displayStatus === 'fail' ? 'text-red-600' : 'text-green-600')}>{displayMessage}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Action Buttons */}
      {isCheckerPersona && hasCheckerException && !checkerExceptionResolved ? (
        <motion.div variants={fadeUp} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center">
          <p className="text-xs text-amber-700 font-medium">Exception must be resolved before PO can be released.</p>
        </motion.div>
      ) : isCheckerPersona ? (
        approved ? (
          hasCheckerException ? (
            /* When exception flow exists, show only the "Released" banner here.
               The Send PO Confirmation Email button is rendered separately at the
               very end of the workflow panel (below exception handler). */
            <motion.div variants={fadeUp}>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700">PO {sapPo.poNumber} Released in SAP</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Notify the supplier by sending the PO confirmation email.</p>
                </div>
              </div>
            </motion.div>
          ) : (
          <motion.div variants={fadeUp} className="space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700">PO {sapPo.poNumber} Released in SAP</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Notify the supplier by sending the PO confirmation email.</p>
              </div>
            </div>
            <button
              onClick={handleSendEmail}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
            >
              <Mail size={14} />
              Send PO Confirmation Email
            </button>
          </motion.div>
          )
        ) : held ? (
          <motion.div variants={fadeUp} className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2.5">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle size={14} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">ON HOLD</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                className="flex-1 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                Approve & Release PO
              </button>
              <button
                onClick={onReject}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
              >
                Reject
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="flex gap-2">
            <button
              onClick={handleApprove}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Approve & Release PO
            </button>
            <button
              onClick={handleHold}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              Hold
            </button>
            <button
              onClick={onReject}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              Reject
            </button>
          </motion.div>
        )
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center">
          <p className="text-xs text-slate-500">Switch to <strong>Checker</strong> persona to review and release this PO.</p>
        </div>
      )}
    </motion.div>
  );
}
