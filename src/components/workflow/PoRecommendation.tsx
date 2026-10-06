import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileCheck, AlertTriangle, CheckCircle, ArrowDown } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import type { SapPoData, CheckerDataException } from '@/data/types';

interface BudgetCostReductionInfo {
  fromQty: number;
  toQty: number;
  unitPrice: number;
  unit: string;
  allocatedBudget: number;
  sioCode: string;
}

interface PoCreationAgentProps {
  sapPo: SapPoData;
  onSubmitToChecker: () => void;
  isAmendment?: boolean;
  /** When set, Maker is correcting a checker-flagged data issue */
  checkerDataIssue?: CheckerDataException;
  /** Called when Maker fixes and resubmits corrected PO */
  onResubmitCorrected?: () => void;
  /** When set, Maker must apply cost reduction per Finance instruction */
  budgetCostReduction?: BudgetCostReductionInfo;
  /** Called when Maker applies cost reduction and resubmits */
  onBudgetCostReductionResubmit?: () => void;
  /** Called when Maker clicks "Apply Cost Reduction" (before resubmit) */
  onBudgetCostReductionApplied?: () => void;
  /** When true, hides submit button (budget handler owns the submit action) */
  hasPendingBudgetIssue?: boolean;
}

function PoCreationProgress({ sapPo }: { sapPo: SapPoData }) {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const steps = [
    'Mapping RFX fields to SAP structure…',
    `Populating line items for ${sapPo.supplierName.split(' ').slice(0, 2).join(' ')}…`,
    'Setting tax codes & payment terms…',
    'Calculating total value & validating…',
    'Writing PO to SAP via BAPI…',
  ];
  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => Math.min(p + 6 + Math.random() * 14, 95));
      setStepIdx(i => (i + 1) % steps.length);
    }, 350);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-[#084A90] animate-spin" />
        <span className="text-xs font-medium text-slate-600">Creating PO in SAP via API...</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
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
          className="text-[10px] text-slate-400"
        >
          {steps[stepIdx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function PoRecommendation({ sapPo, onSubmitToChecker, isAmendment: _isAmendment, checkerDataIssue, onResubmitCorrected, budgetCostReduction, onBudgetCostReductionResubmit, onBudgetCostReductionApplied, hasPendingBudgetIssue }: PoCreationAgentProps) {
  const [showPo, setShowPo] = useState(false);
  const [corrected, setCorrected] = useState(false);
  const [costReduced, setCostReduced] = useState(false);
  const { fmt, symbol } = useCurrency();

  useEffect(() => {
    const timer = setTimeout(() => setShowPo(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  // When data issue is corrected, patch the displayed PO with corrected values
  const displayPo = useMemo(() => {
    // Budget cost reduction applied
    if (costReduced && budgetCostReduction) {
      const { toQty, unitPrice } = budgetCostReduction;
      const newNetValue = toQty * unitPrice;
      // Estimate tax: derive from original PO ratio (totalValue / lineItem.totalPrice)
      const origItem = sapPo.lineItems[0];
      const taxMultiplier = origItem ? sapPo.totalValue / origItem.totalPrice : 1.2;
      const newTotalValue = Math.round(newNetValue * taxMultiplier);
      return {
        ...sapPo,
        lineItems: sapPo.lineItems.map((item, i) =>
          i === 0 ? { ...item, quantity: toQty, totalPrice: newNetValue } : item
        ),
        totalValue: newTotalValue,
      };
    }
    if (!corrected || !checkerDataIssue) return sapPo;
    let patched = { ...sapPo };
    for (const issue of checkerDataIssue.issues) {
      if (issue.field === 'supplierCode') {
        patched = { ...patched, supplierCode: issue.correctValue };
      }
    }
    return patched;
  }, [sapPo, corrected, checkerDataIssue, costReduced, budgetCostReduction]);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        PO Creation Agent
      </h4>

      {!showPo ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <PoCreationProgress sapPo={sapPo} />
        </div>
      ) : (
        <div className="space-y-3">
          {/* PO Created Banner */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 ring-1 ring-green-200"
          >
            <FileCheck size={16} className="text-green-600" />
            <span className="text-sm font-bold text-green-700">PO {displayPo.poNumber} Created in SAP</span>
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-600">
              22 fields captured
            </span>
          </motion.div>

          {/* PO Header Details */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}
            className="rounded-lg border border-slate-200 bg-white p-3"
          >
            <h5 className="text-xs font-semibold text-slate-700 mb-2">PO Header</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                ['PO Number', displayPo.poNumber],
                ['PO Type', displayPo.poType],
                ['Company Code', displayPo.companyCode],
                ['Purchasing Org', displayPo.purchasingOrg],
                ['Supplier', `${displayPo.supplierCode} — ${displayPo.supplierName}`],
                ['Created By', displayPo.createdBy],
                ['Date', displayPo.createdDate],
                ['Validity', `${displayPo.validityStart} – ${displayPo.validityEnd}`],
                ['Incoterms', `${displayPo.incoterms} (${displayPo.incotermsLocation})`],
                ['Payment Terms', displayPo.paymentTerms],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-800 text-right max-w-[140px] truncate">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Line Items Table */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.16 }}
            className="rounded-lg border border-slate-200 bg-white overflow-hidden"
          >
            <h5 className="text-xs font-semibold text-slate-700 px-3 py-2 border-b border-slate-100">Line Items</h5>
            <div className="grid grid-cols-[40px_1fr_60px_70px_70px_60px] gap-2 border-b border-slate-100 px-3 py-1.5">
              {['Item', 'Material', 'Qty', 'Price', 'Total', 'Tax'].map((h) => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
              ))}
            </div>
            {displayPo.lineItems.map((item) => (
              <div key={item.itemNumber} className="grid grid-cols-[40px_1fr_60px_70px_70px_60px] gap-2 px-3 py-2 text-xs border-b border-slate-50">
                <span className="font-mono text-slate-600">{item.itemNumber}</span>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{item.description}</p>
                  <p className="text-[10px] text-slate-500">{item.materialNumber}</p>
                </div>
                <span className="text-slate-700">{item.quantity} {item.unit}</span>
                <span className="text-slate-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{symbol}{fmt(item.pricePerUnit)}</span>
                <span className="font-semibold text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>{symbol}{fmt(item.totalPrice)}</span>
                <span className="text-slate-600">{item.taxCode}</span>
              </div>
            ))}
            <div className="flex justify-between px-3 py-2 bg-slate-50">
              <span className="text-xs font-semibold text-slate-700">Total PO Value</span>
              <span className="text-sm font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{symbol}{fmt(displayPo.totalValue)} </span>
            </div>
          </motion.div>

          {/* AI Rationale */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.24 }}
            className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={14} className="text-[#084A90]" />
              <span className="text-xs font-semibold text-[#084A90]">PO Creation Agent Summary</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              PO {displayPo.poNumber} has been created in SAP with {displayPo.lineItems.length} line item(s) totaling {symbol}{fmt(displayPo.totalValue)} .
              Supplier {displayPo.supplierName} selected based on RFX evaluation.
              All {displayPo.lineItems.reduce((sum) => sum + 1, 0) * 12}+ fields captured via API call.
              PO is ready for Checker QC review and release.
            </p>
          </motion.div>

          {/* Checker Data Issue — Correction Mode */}
          {checkerDataIssue && !corrected && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.28 }}>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-600" />
                  <span className="text-xs font-semibold text-red-700">Checker Returned — Data Correction Required</span>
                </div>
                <div className="rounded-md border border-red-100 bg-white overflow-hidden">
                  <div className="grid grid-cols-3 gap-0 px-3 py-1.5 bg-red-50/50 border-b border-red-100">
                    <span className="text-[10px] font-semibold text-red-500 uppercase">Field</span>
                    <span className="text-[10px] font-semibold text-red-500 uppercase">Incorrect</span>
                    <span className="text-[10px] font-semibold text-red-500 uppercase">Correct</span>
                  </div>
                  {checkerDataIssue.issues.map((issue) => (
                    <div key={issue.field} className="grid grid-cols-3 gap-0 px-3 py-2">
                      <span className="text-xs font-medium text-slate-700">{issue.label}</span>
                      <span className="text-xs font-mono text-red-600 line-through">{issue.poValue}</span>
                      <span className="text-xs font-mono text-green-600 font-semibold">{issue.correctValue}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setCorrected(true)}
                  className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                >
                  Apply Correction
                </button>
              </div>
            </motion.div>
          )}

          {checkerDataIssue && corrected && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">Correction Applied — Ready to Resubmit</span>
              </div>
              <button
                onClick={onResubmitCorrected}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Resubmit Corrected PO to Checker →
              </button>
            </motion.div>
          )}

          {/* Budget Cost Reduction — Maker must reduce qty */}
          {budgetCostReduction && !costReduced && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.28 }}>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">Finance Requires Cost Reduction</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Finance cannot allocate additional budget for {budgetCostReduction.sioCode}. Reduce PO quantity to bring total within the allocated budget of {symbol}{fmt(budgetCostReduction.allocatedBudget)}.
                </p>
                <div className="rounded-md border border-amber-100 bg-white overflow-hidden">
                  <div className="grid grid-cols-3 gap-0 px-3 py-1.5 bg-amber-50/50 border-b border-amber-100">
                    <span className="text-[10px] font-semibold text-amber-500 uppercase">Field</span>
                    <span className="text-[10px] font-semibold text-amber-500 uppercase">Current</span>
                    <span className="text-[10px] font-semibold text-amber-500 uppercase">Revised</span>
                  </div>
                  <div className="grid grid-cols-3 gap-0 px-3 py-2 border-b border-slate-50">
                    <span className="text-xs font-medium text-slate-700">Quantity</span>
                    <span className="text-xs font-mono text-red-600 line-through">{budgetCostReduction.fromQty} {budgetCostReduction.unit}</span>
                    <span className="text-xs font-mono text-green-600 font-semibold">{budgetCostReduction.toQty} {budgetCostReduction.unit}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-0 px-3 py-2 border-b border-slate-50">
                    <span className="text-xs font-medium text-slate-700">Net Value</span>
                    <span className="text-xs font-mono text-red-600 line-through">{symbol}{fmt(budgetCostReduction.fromQty * budgetCostReduction.unitPrice)}</span>
                    <span className="text-xs font-mono text-green-600 font-semibold">{symbol}{fmt(budgetCostReduction.toQty * budgetCostReduction.unitPrice)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setCostReduced(true); onBudgetCostReductionApplied?.(); }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                >
                  <ArrowDown size={14} />
                  Apply Cost Reduction
                </button>
              </div>
            </motion.div>
          )}

          {budgetCostReduction && costReduced && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700">Cost Reduction Applied — PO Recalculated Within Budget</span>
              </div>
              <button
                onClick={onBudgetCostReductionResubmit}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Resubmit Reduced PO to Checker →
              </button>
            </motion.div>
          )}

          {/* Submit Button */}
          {!checkerDataIssue && !budgetCostReduction && !hasPendingBudgetIssue && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.32 }}>
            <button
              onClick={onSubmitToChecker}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Submit PO for Checker QC →
            </button>
          </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
