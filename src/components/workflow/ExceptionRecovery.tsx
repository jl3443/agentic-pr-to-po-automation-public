import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import { IncomingEmailCard } from '@/components/email/IncomingEmailCard';
import type { PostPoAmendment, EmailItem } from '@/data/types';

interface ExceptionRecoveryProps {
  amendment: PostPoAmendment;
  onApproveAmendment: () => void;
  onGoToInbox?: () => void;
  resolved?: boolean;
}

function buildAmendmentEmail(amendment: PostPoAmendment): EmailItem {
  return {
    id: 'amendment-trigger',
    from: amendment.requesterName,
    fromEmail: amendment.requesterEmail,
    to: 'PO Team',
    toEmail: 'po-team@company.com',
    subject: `Amendment Request — PO ${amendment.poNumber}`,
    preview: amendment.reason.slice(0, 80) + '…',
    body: `Dear PO Team,\n\nPlease process the following amendment for PO ${amendment.poNumber}:\n\n${amendment.reason}\n\nDetails:\n${amendment.amendments.map(a => `- ${a.label}: ${a.originalValue} → ${a.requestedValue}`).join('\n')}\n\nRegards,\n${amendment.requesterName}`,
    date: '26 Mar 2026',
    read: true,
    attachments: [`Amendment_${amendment.poNumber}.pdf`],
    type: 'incoming',
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function ExceptionRecovery({ amendment, onApproveAmendment, onGoToInbox, resolved = false }: ExceptionRecoveryProps) {
  const [showRecovery, setShowRecovery] = useState(false);
  const { fmt, symbol } = useCurrency();

  useEffect(() => {
    const timer = setTimeout(() => setShowRecovery(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const valueDelta = amendment.amendedTotalValue - amendment.originalTotalValue;
  const percentChange = ((valueDelta / amendment.originalTotalValue) * 100).toFixed(1);
  const triggerEmail = buildAmendmentEmail(amendment);

  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Post-PO Amendment
        </h4>
        {onGoToInbox && (
          <button
            onClick={onGoToInbox}
            className="flex items-center gap-1 text-[11px] font-medium text-[#084A90] hover:underline"
          >
            View in Inbox <ExternalLink size={10} />
          </button>
        )}
      </div>

      {/* Incoming email that triggered the amendment */}
      <IncomingEmailCard
        email={triggerEmail}
        agentNote="AI detected amendment request. Quantity increase (+24.8%) and tax code change processed automatically. Manager approval verified."
      />

      {/* Amendment Request */}
      <motion.div variants={fadeUp} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-amber-700">Amendment Request — PO {amendment.poNumber}</span>
        </div>
        <p className="text-xs text-amber-600 mb-2">
          Requested by {amendment.requesterName} ({amendment.requesterEmail})
        </p>
        <p className="text-sm text-slate-700">{amendment.reason}</p>
      </motion.div>

      {/* Amendment Diff Table */}
      <motion.div variants={fadeUp} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_24px_1fr_1fr] gap-2 border-b border-slate-100 px-3 py-2">
          {['Field', 'Original', '', 'Amended', 'Impact'].map((h) => (
            <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{h}</span>
          ))}
        </div>
        {amendment.amendments.map((item) => (
          <div key={item.field} className="grid grid-cols-[1fr_1fr_24px_1fr_1fr] gap-2 px-3 py-2 text-xs border-b border-slate-50 items-center">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-600">{item.originalValue}</span>
            <ArrowRight size={12} className="text-slate-400" />
            <span className="font-semibold text-[#084A90]">{item.requestedValue}</span>
            <span className="text-[10px] text-slate-500">{item.impact}</span>
          </div>
        ))}
      </motion.div>

      {/* Cost Impact */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
          <p className="text-[10px] font-medium uppercase text-slate-500">Original Value</p>
          <p className="text-sm font-bold text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {symbol}{fmt(amendment.originalTotalValue)}
          </p>
        </div>
        <div className="rounded-lg border border-[#084A90]/20 bg-blue-50 p-3 text-center">
          <p className="text-[10px] font-medium uppercase text-[#084A90]">Amended Value</p>
          <p className="text-sm font-bold text-[#084A90]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {symbol}{fmt(amendment.amendedTotalValue)}
          </p>
        </div>
        <div className={cn(
          'rounded-lg border p-3 text-center',
          valueDelta > 0 ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'
        )}>
          <p className="text-[10px] font-medium uppercase text-slate-500">Delta</p>
          <p className={cn(
            'text-sm font-bold',
            valueDelta > 0 ? 'text-amber-700' : 'text-green-700'
          )} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {valueDelta > 0 ? '+' : ''}{symbol}{fmt(Math.abs(valueDelta))} ({percentChange}%)
          </p>
        </div>
      </motion.div>

      {/* AI Analysis */}
      {showRecovery && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={14} className="text-[#084A90]" />
              <span className="text-xs font-semibold text-[#084A90]">AI Amendment Analysis</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              Amendment validated against current contract terms. Quantity increase of {amendment.amendments.find(a => a.field === 'quantity')?.requestedValue ?? 'N/A'} is within supplier capacity.
              {amendment.amendments.find(a => a.field === 'taxCode') && ' Tax code change to services category requires VAT re-calculation.'}
              {' '}Total value change: +{symbol}{fmt(valueDelta)} ({percentChange}%).
              Manager approval already on file. Amendment ready for Checker QC.
            </p>
          </div>
        </motion.div>
      )}

      {/* Approve Button or Resolved Banner */}
      {showRecovery && (
        resolved ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2.5">
              <span className="text-green-500 text-base">✓</span>
              <div>
                <p className="text-xs font-semibold text-green-800">Amendment Approved — Processing in SAP</p>
                <p className="text-[11px] text-green-600 mt-0.5">Amendment confirmed and PO updated. Supplier notification sent.</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={onApproveAmendment}
              className="w-full rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
            >
              Approve Amendment & Proceed →
            </button>
          </motion.div>
        )
      )}
    </motion.div>
  );
}
