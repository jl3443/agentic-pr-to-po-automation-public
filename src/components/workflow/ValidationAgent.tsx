import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle, XCircle, AlertTriangle, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ValidationResult } from '@/data/types';

interface ValidationAgentProps {
  validationResult: ValidationResult;
  onAccept: () => void;
  onHold: () => void;
  hideCta?: boolean;
  budgetExceeded?: { allocated: number; poValue: number; shortfall: number; sioCode: string };
}

const statusIcons = {
  pass: <CheckCircle size={14} className="text-green-500" />,
  fail: <XCircle size={14} className="text-red-500" />,
  warning: <AlertTriangle size={14} className="text-amber-500" />,
};

const statusRowBg = {
  pass: '',
  fail: 'bg-red-50',
  warning: 'bg-amber-50',
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

function ValidationProgress({ totalChecks }: { totalChecks: number }) {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const steps = [
    'Checking quantity against portal…',
    'Verifying supplier & material codes…',
    'Validating tax codes & payment terms…',
    'Confirming document completeness…',
    `Cross-referencing ${totalChecks} fields…`,
  ];
  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => Math.min(p + 8 + Math.random() * 12, 95));
      setStepIdx(i => (i + 1) % steps.length);
    }, 350);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-[#084A90] animate-spin" />
        <span className="text-xs font-medium text-slate-600">Validating {totalChecks} fields...</span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#084A90] to-blue-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {/* Thinking step text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stepIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-[10px] text-slate-400"
        >
          {steps[stepIdx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function ValidationAgent({ validationResult, onAccept, onHold, hideCta, budgetExceeded }: ValidationAgentProps) {
  const [showChecks, setShowChecks] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowChecks(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const isFail = validationResult.status === 'fail';

  // For budget-exceeded cases, append a budget warning check
  const displayChecks = budgetExceeded
    ? [
        ...validationResult.checks,
        {
          field: 'budgetCheck',
          label: 'Budget Check',
          expected: `≤ €${budgetExceeded.allocated.toLocaleString("en-US")} (SIO)`,
          actual: `€${budgetExceeded.poValue.toLocaleString("en-US")}`,
          status: 'warning' as const,
          message: `PO value exceeds SIO budget by €${budgetExceeded.shortfall.toLocaleString("en-US")} — pending Finance approval`,
        },
      ]
    : validationResult.checks;

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Validation Agent
      </h4>

      {!showChecks ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <ValidationProgress totalChecks={displayChecks.length} />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-3">
          {/* Summary Bar */}
          <div className={cn(
            'flex items-center justify-between rounded-lg px-4 py-2.5 ring-1',
            isFail
              ? 'bg-red-50 ring-red-200'
              : budgetExceeded
              ? 'bg-amber-50 ring-amber-200'
              : 'bg-green-50 ring-green-200'
          )}>
            <div className="flex items-center gap-2">
              {isFail ? <PauseCircle size={16} className="text-red-600" /> : budgetExceeded ? <AlertTriangle size={16} className="text-amber-600" /> : <CheckCircle size={16} className="text-green-600" />}
              <span className={cn('text-sm font-bold', isFail ? 'text-red-700' : budgetExceeded ? 'text-amber-700' : 'text-green-700')}>
                {isFail ? 'HOLD — Validation Failed' : budgetExceeded ? 'Checks Passed · Budget Exceeded' : 'All Checks Passed'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                <CheckCircle size={10} /> {validationResult.passCount}
              </span>
              {(validationResult.failCount > 0) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  <XCircle size={10} /> {validationResult.failCount}
                </span>
              )}
              {(validationResult.warningCount > 0 || budgetExceeded) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  <AlertTriangle size={10} /> {(validationResult.warningCount || 0) + (budgetExceeded ? 1 : 0)}
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {validationResult.overallConfidence}%
              </span>
            </div>
          </div>

          {/* Hold Reason */}
          {isFail && validationResult.holdReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Hold Reason:</p>
              <p className="text-sm text-red-600">{validationResult.holdReason}</p>
            </div>
          )}

          {/* Checks Table */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="grid grid-cols-[24px_1fr_1fr_1fr] gap-2 border-b border-slate-100 px-3 py-2">
              <span />
              {['Field', 'Expected', 'Actual'].map((h) => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
              ))}
            </div>
            <motion.div variants={stagger} initial="hidden" animate="show" className="max-h-[280px] overflow-y-auto">
              {displayChecks.map((check) => (
                <motion.div
                  key={check.field}
                  variants={fadeUp}
                  className={cn(
                    'grid grid-cols-[24px_1fr_1fr_1fr] gap-2 border-b border-slate-50 px-3 py-1.5 text-xs',
                    statusRowBg[check.status],
                    check.status === 'fail' && 'border-l-2 border-l-red-400',
                    check.status === 'warning' && 'border-l-2 border-l-amber-400'
                  )}
                >
                  <div className="flex items-center">{statusIcons[check.status]}</div>
                  <span className="font-medium text-slate-700">{check.label}</span>
                  <span className={cn(
                    'truncate',
                    check.status === 'fail' ? 'text-slate-500 line-through decoration-red-300' : 'text-slate-500'
                  )}>{check.expected}</span>
                  <span className={cn(
                    'truncate',
                    check.status === 'fail' ? 'font-bold text-red-700 bg-red-100 rounded px-1 -mx-1' : check.status === 'warning' ? 'font-semibold text-amber-700 bg-amber-100 rounded px-1 -mx-1' : 'text-slate-700'
                  )}>
                    {check.actual}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Action Button */}
          {!hideCta && (
            isFail ? (
              <button
                onClick={onHold}
                className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Place on Hold & Draft Clarification →
              </button>
            ) : (
              <button
                onClick={onAccept}
                className="w-full rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
              >
                Proceed to PO Creation →
              </button>
            )
          )}
        </motion.div>
      )}
    </div>
  );
}
