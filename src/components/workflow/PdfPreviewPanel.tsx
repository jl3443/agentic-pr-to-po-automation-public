import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileCheck, X, FileText, ShieldCheck, ClipboardCheck, Globe, FileSpreadsheet, Mail, Stamp, Maximize2, Minimize2, AlertTriangle, ArrowRight, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RfxDocumentPreview } from './RfxDocumentPreview';
import { SapPoDocument } from './SapPoDocument';
import type { RfxTicket, RfxMismatch, PostPoAmendment, SapPoData } from '@/data/types';

interface PdfPreviewPanelProps {
  ticket: RfxTicket;
  workflowStage: number;
  onClose: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
  hasMismatchReply?: boolean;
  hasAmendmentReply?: boolean;
  /** Effective SAP PO after modifications (cost reduction, data fix, amendment) */
  effectiveSapPo?: SapPoData;
  persona?: 'maker' | 'checker';
}

type DetectionPhase = 'scanning' | 'identified' | 'ready';

// ── Exception Evidence View ──────────────────────────────────────────────────
function ExceptionEvidenceView({ ticket, mismatch, resolved }: { ticket: RfxTicket; mismatch: RfxMismatch; resolved?: boolean }) {
  const triggerEmail = {
    from: 'Buyer <buyer@company.com>',
    subject: 'RFX Request — Quantity Clarification Needed',
    date: '26 Mar 2026',
    preview: resolved
      ? 'Reply confirmed: correct quantity is 250 EA as per latest indent approval. Revised annexure attached.'
      : 'Attached RFX and annexure for PO creation. Portal updated with revised quantity (150 EA).',
  };

  return (
    <div className="space-y-4 text-[10px]">
      {/* Section header */}
      <div className={cn(
        'flex items-center gap-2 pb-2 border-b',
        resolved ? 'border-green-200' : 'border-red-200'
      )}>
        {resolved
          ? <><Sparkles size={14} className="text-green-600" /><h3 className="text-xs font-bold text-green-700 uppercase tracking-wide">Exception Resolved — AI Confirmed</h3></>
          : <><AlertTriangle size={14} className="text-red-600" /><h3 className="text-xs font-bold text-red-700 uppercase tracking-wide">Exception Evidence — AI Compiled</h3></>
        }
      </div>

      {/* Resolved banner */}
      {resolved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 flex items-center gap-2">
          <Sparkles size={12} className="text-green-600" />
          <p className="text-[11px] font-semibold text-green-700">Mismatch resolved via email reply — values confirmed by requester</p>
        </div>
      )}

      {/* Trigger Email */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className={cn('px-3 py-1.5 border-b', resolved ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200')}>
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
            {resolved ? 'Reply Email — Confirmation' : 'Trigger Email'}
          </span>
        </div>
        <div className="px-3 py-2 space-y-1">
          <div className="flex gap-2">
            <span className="text-slate-400 w-10 shrink-0">From</span>
            <span className="text-slate-700 font-medium">{triggerEmail.from}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-10 shrink-0">Subject</span>
            <span className="text-slate-700 font-semibold">{triggerEmail.subject}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-10 shrink-0">Date</span>
            <span className="text-slate-500">{triggerEmail.date}</span>
          </div>
          <p className="text-slate-500 mt-1 leading-relaxed">{triggerEmail.preview}</p>
        </div>
      </div>

      {/* Field Discrepancies / Confirmed Values Table */}
      <div className={cn(
        'rounded-lg border overflow-hidden',
        resolved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      )}>
        <div className={cn('px-3 py-1.5 border-b', resolved ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200')}>
          <span className={cn('text-[10px] font-semibold uppercase tracking-wide', resolved ? 'text-green-700' : 'text-red-700')}>
            {resolved ? 'Confirmed Values' : 'Field Discrepancies'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 px-3 py-1.5 border-b border-opacity-50">
          {['Field', resolved ? 'Confirmed' : 'PDF Value', resolved ? 'Aligned' : 'Portal Value'].map(h => (
            <span key={h} className={cn('text-[9px] font-semibold uppercase tracking-wide', resolved ? 'text-green-400' : 'text-red-400')}>{h}</span>
          ))}
        </div>
        {mismatch.mismatches.map(m => (
          <div key={m.field} className="grid grid-cols-3 gap-1 px-3 py-1.5 border-b border-opacity-10 last:border-b-0">
            <span className={cn('font-medium', resolved ? 'text-green-700' : 'text-red-700')}>{m.label}</span>
            <span className={cn('font-semibold rounded px-1', resolved ? 'text-green-800 bg-green-100' : 'text-slate-800 bg-white')}>
              {resolved ? '250 EA' : m.pdfValue}
            </span>
            <span className={cn('font-semibold rounded px-1', resolved ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-100')}>
              {resolved ? '250 EA ✓' : m.portalValue}
            </span>
          </div>
        ))}
      </div>

      {/* Missing Documents — only show if not resolved */}
      {!resolved && mismatch.missingDocs.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[10px] font-semibold text-amber-700 mb-1 uppercase tracking-wide">Missing Documents</p>
          {mismatch.missingDocs.map(doc => (
            <p key={doc} className="text-amber-700 mt-0.5">❌ {doc}</p>
          ))}
        </div>
      )}

      {/* Resolved documents */}
      {resolved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <p className="text-[10px] font-semibold text-green-700 mb-1 uppercase tracking-wide">Documents Confirmed</p>
          <p className="text-green-700 mt-0.5">✅ Revised_Annexure_RFX3012438300.xlsx</p>
          <p className="text-green-700 mt-0.5">✅ Indent approval dated 03/09/2026</p>
        </div>
      )}

      {/* Annexure Preview */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Annexure Preview</span>
        </div>
        <div className="px-3 py-2 grid grid-cols-2 gap-1">
          {[
            ['RFX Number', ticket.extractedData.rfxNumber],
            ['Material', ticket.extractedData.materialDescription],
            ['Material No', ticket.extractedData.materialNumber],
            ['PDF Qty', resolved ? '250 EA' : `${ticket.extractedData.quantity} ${ticket.extractedData.unit}`],
            ['Portal Qty', resolved ? '250 EA ✓' : `${ticket.portalValues.portalQuantity} ${ticket.portalValues.portalUnit}`],
            ['Plant', ticket.extractedData.plant],
            ['Category', ticket.extractedData.category],
            ['Requester', ticket.extractedData.prCreatorName],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col border-b border-slate-100 pb-1 last:border-b-0">
              <span className="text-[9px] text-slate-400">{label}</span>
              <span className={cn('font-medium', resolved && (label === 'PDF Qty' || label === 'Portal Qty') ? 'text-green-700' : 'text-slate-700')}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Amendment Evidence View ──────────────────────────────────────────────────
function AmendmentEvidenceView({ amendment, resolved }: { amendment: PostPoAmendment; resolved?: boolean }) {
  const valueDelta = amendment.amendedTotalValue - amendment.originalTotalValue;
  const percentChange = ((valueDelta / amendment.originalTotalValue) * 100).toFixed(1);

  return (
    <div className="space-y-4 text-[10px]">
      {/* Section header */}
      <div className={cn('flex items-center gap-2 pb-2 border-b', resolved ? 'border-green-200' : 'border-amber-200')}>
        {resolved
          ? <><Sparkles size={14} className="text-green-600" /><h3 className="text-xs font-bold text-green-700 uppercase tracking-wide">Amendment Confirmed — AI Verified</h3></>
          : <><FileEdit size={14} className="text-amber-600" /><h3 className="text-xs font-bold text-amber-700 uppercase tracking-wide">Amendment Evidence — AI Compiled</h3></>
        }
      </div>

      {/* Resolved banner */}
      {resolved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 flex items-center gap-2">
          <Sparkles size={12} className="text-green-600" />
          <p className="text-[11px] font-semibold text-green-700">Amendment cleared via email confirmation — budget approval received</p>
        </div>
      )}

      {/* Trigger email */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className={cn('px-3 py-1.5 border-b', resolved ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200')}>
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
            {resolved ? 'Reply Email — Confirmation' : 'Amendment Request Email'}
          </span>
        </div>
        <div className="px-3 py-2 space-y-1">
          <div className="flex gap-2"><span className="text-slate-400 w-10 shrink-0">From</span>
            <span className="text-slate-700 font-medium">{amendment.requesterName} &lt;{amendment.requesterEmail}&gt;</span>
          </div>
          <div className="flex gap-2"><span className="text-slate-400 w-10 shrink-0">Subject</span>
            <span className="text-slate-700 font-semibold">
              {resolved ? `RE: Amendment Clarification — PO ${amendment.poNumber}` : `Amendment Request — PO ${amendment.poNumber}`}
            </span>
          </div>
          <div className="flex gap-2"><span className="text-slate-400 w-10 shrink-0">Date</span>
            <span className="text-slate-500">26 Mar 2026</span>
          </div>
          <p className="text-slate-500 mt-1 leading-relaxed">
            {resolved
              ? 'Budget approval reference attached. Revised delivery schedule confirmed. Please proceed with the amendment.'
              : amendment.reason}
          </p>
        </div>
      </div>

      {/* Amendment Diff Table */}
      <div className={cn('rounded-lg border overflow-hidden', resolved ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50')}>
        <div className={cn('px-3 py-1.5 border-b', resolved ? 'bg-green-100 border-green-200' : 'bg-amber-100 border-amber-200')}>
          <span className={cn('text-[10px] font-semibold uppercase tracking-wide', resolved ? 'text-green-700' : 'text-amber-700')}>
            {resolved ? 'Confirmed Changes' : 'Requested Changes'}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_1fr_16px_1fr] gap-1 px-3 py-1.5 border-b border-opacity-20">
          {['Field', resolved ? 'Confirmed' : 'Original', '', resolved ? 'Aligned' : 'Amended'].map(h => (
            <span key={h} className={cn('text-[9px] font-semibold uppercase tracking-wide', resolved ? 'text-green-400' : 'text-amber-400')}>{h}</span>
          ))}
        </div>
        {amendment.amendments.map(a => (
          <div key={a.field} className="grid grid-cols-[1fr_1fr_16px_1fr] gap-1 px-3 py-1.5 border-b border-opacity-10 last:border-b-0 items-center">
            <span className={cn('font-medium text-[10px]', resolved ? 'text-green-700' : 'text-amber-700')}>{a.label}</span>
            <span className={cn('font-semibold rounded px-1 text-[10px]', resolved ? 'text-green-800 bg-green-100' : 'text-slate-700 bg-white')}>{a.originalValue}</span>
            <ArrowRight size={10} className="text-slate-400" />
            <span className={cn('font-semibold rounded px-1 text-[10px]', resolved ? 'text-green-700 bg-green-100' : 'text-amber-800 bg-amber-100')}>
              {a.requestedValue}{resolved ? ' ✓' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Documents confirmed (resolved only) */}
      {resolved && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <p className="text-[10px] font-semibold text-green-700 mb-1 uppercase tracking-wide">Documents Received</p>
          <p className="text-green-700 mt-0.5">✅ Budget_Approval_{amendment.poNumber}.pdf</p>
          <p className="text-green-700 mt-0.5">✅ Revised_Delivery_Schedule.xlsx</p>
        </div>
      )}

      {/* Cost Impact */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Original Value', value: `€${amendment.originalTotalValue.toLocaleString("en-US")}`, style: 'border-slate-200 bg-white text-slate-800' },
          { label: resolved ? 'Confirmed Value' : 'Amended Value', value: `€${amendment.amendedTotalValue.toLocaleString("en-US")}`, style: resolved ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700' },
          { label: 'Delta', value: `+€${valueDelta.toLocaleString("en-US")} (${percentChange}%)`, style: 'border-amber-200 bg-amber-50 text-amber-700' },
        ].map(({ label, value, style }) => (
          <div key={label} className={cn('rounded-lg border p-2 text-center', style)}>
            <p className="text-[9px] font-medium uppercase text-slate-500 mb-0.5">{label}</p>
            <p className="text-[11px] font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Document configs for each available file
const docTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'rfx-pdf': { label: 'RFX Synopsis PDF', icon: FileText, color: 'text-blue-600' },
  'annexure': { label: 'Annexure Excel', icon: FileSpreadsheet, color: 'text-green-600' },
  'rate-negotiation': { label: 'Rate Negotiation Email', icon: Mail, color: 'text-amber-600' },
  'approval': { label: 'Purchase Approval', icon: Stamp, color: 'text-purple-600' },
  'validation': { label: 'Validation Report', icon: ShieldCheck, color: 'text-amber-600' },
  'sap-po': { label: 'SAP Purchase Order', icon: ClipboardCheck, color: 'text-green-700' },
  'po-qc': { label: 'PO Release — QC Review', icon: ShieldCheck, color: 'text-emerald-600' },
  'ticket-resolved': { label: 'Ticket Resolution', icon: Globe, color: 'text-green-600' },
  'exception': { label: 'Exception Evidence', icon: AlertTriangle, color: 'text-red-600' },
  'amendment-evidence': { label: 'Amendment Evidence', icon: FileEdit, color: 'text-amber-600' },
};

// Map workflow stage to which doc to auto-select
function getActiveDocForStage(stage: number, hasRfxException?: boolean, hasAmendmentException?: boolean): string {
  if (stage <= 1) return 'rfx-pdf';
  if (stage === 2) return hasRfxException ? 'exception' : 'annexure';
  if (stage === 3) return 'sap-po';
  if (stage === 4) return hasAmendmentException ? 'amendment-evidence' : 'po-qc';
  return 'ticket-resolved';
}

export function PdfPreviewPanel({ ticket, workflowStage, onClose, expanded = false, onToggleExpand, hasMismatchReply = false, hasAmendmentReply = false, effectiveSapPo: effectiveSapPoProp, persona: _persona }: PdfPreviewPanelProps) {
  const sapPo = effectiveSapPoProp ?? ticket.sapPo;
  const hasRfxMismatchException = ticket.exception?.type === 'rfx-mismatch';
  const hasAmendmentException = ticket.exception?.type === 'post-po-amendment';
  // Resolve PO data from any available source (budget cases store PO in exception.pendingSapPo)
  const pendingSapPoData = ticket.exception?.type === 'checker-budget-issue' ? (ticket.exception as any)?.pendingSapPo as import('@/data/types').SapPoData | undefined : undefined;
  const displaySapPo = sapPo ?? pendingSapPoData;
  // Budget hold: at stage 3 for budget cases, hide PO until budget is resolved
  const isBudgetHoldStage = ticket.exception?.type === 'checker-budget-issue' && workflowStage === 3;
  const isMakerFixVariant = !!(ticket.exception as any)?.requiresMakerFix;
  // Maker-fix (08842): hide until cost reduction changes totalValue
  // Direct allocation (08855): hide until effectiveSapPo arrives (finance replied)
  const budgetResolved = isMakerFixVariant
    ? (effectiveSapPoProp && pendingSapPoData && effectiveSapPoProp.totalValue !== pendingSapPoData.totalValue)
    : !!effectiveSapPoProp;
  const hideSapPoTab = isBudgetHoldStage && !budgetResolved;
  const suppressPoAutoSelect = hideSapPoTab;

  const [phase, setPhase] = useState<DetectionPhase>('scanning');
  const [activeDocType, setActiveDocType] = useState(() => {
    // Budget cases at stage 3: always default to RFX
    if (suppressPoAutoSelect) return 'rfx-pdf';
    // Hard logic: at Create PO (3) or Release (4+) stages, default to sap-po
    if (workflowStage >= 3) return 'sap-po';
    return 'rfx-pdf';
  });
  // Flash border on stage transition to draw attention
  const [borderFlash, setBorderFlash] = useState(false);

  // Build available docs list based on ticket data + current stage
  const availableDocs = (() => {
    const docs: { type: string; fileName: string }[] = [];
    // Always show docs from ticket data
    for (const doc of ticket.extractedData.docsAvailable) {
      if (doc.present) {
        docs.push({ type: doc.type, fileName: doc.fileName ?? doc.name });
      }
    }
    // Add exception evidence tab at stage 2 when rfx-mismatch
    if (workflowStage >= 2 && hasRfxMismatchException) {
      docs.push({ type: 'exception', fileName: 'Exception_Evidence.pdf' });
    }
    // Add amendment evidence tab at stage 4 when post-po-amendment
    if (workflowStage >= 4 && hasAmendmentException) {
      docs.push({ type: 'amendment-evidence', fileName: 'Amendment_Evidence.pdf' });
    }
    // Add stage-specific documents
    if (workflowStage >= 2 && ticket.validationResult) {
      docs.push({ type: 'validation', fileName: 'Validation_Report.pdf' });
    }
    if (workflowStage >= 3 && !hideSapPoTab) {
      docs.push({ type: 'sap-po', fileName: displaySapPo ? `PO_${displaySapPo.poNumber}.pdf` : 'SAP_PO.pdf' });
    }
    if (workflowStage >= 4 && !hideSapPoTab) {
      docs.push({ type: 'po-qc', fileName: displaySapPo ? `QC_Review_${displaySapPo.poNumber}.pdf` : 'QC_Review.pdf' });
    }
    if (workflowStage >= 5) {
      docs.push({ type: 'ticket-resolved', fileName: `Ticket_Resolved.pdf` });
    }
    return docs;
  })();

  // Re-trigger animation + auto-switch doc when stage changes
  const sapPoAvailable = workflowStage >= 3 && !suppressPoAutoSelect;
  useEffect(() => {
    let newDoc: string;
    if (sapPoAvailable) {
      newDoc = 'sap-po';
    } else {
      newDoc = getActiveDocForStage(workflowStage, hasRfxMismatchException, hasAmendmentException);
      // Budget hold at stage 3: force RFX
      if (suppressPoAutoSelect) newDoc = 'rfx-pdf';
    }
    setActiveDocType(newDoc);
    setPhase('scanning');
    setBorderFlash(true);
    const t0 = setTimeout(() => setBorderFlash(false), 800);
    const t1 = setTimeout(() => setPhase('identified'), 1200);
    const t2 = setTimeout(() => setPhase('ready'), 1800);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [workflowStage, sapPoAvailable, ticket.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // When user manually clicks a doc:
  // — Exception Evidence tab: trigger full AI analyzing animation (Fix 4)
  // — Other tabs: switch immediately (no animation)
  const handleDocClick = (docType: string) => {
    if (docType === activeDocType) return;
    setActiveDocType(docType);
    if (docType === 'exception' || docType === 'amendment-evidence') {
      // Show AI analyzing progress animation for AI-compiled evidence tabs
      setPhase('scanning');
      const t1 = setTimeout(() => setPhase('identified'), 1400);
      const t2 = setTimeout(() => setPhase('ready'), 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    setPhase('ready');
  };

  const activeConfig = docTypeConfig[activeDocType] ?? docTypeConfig['rfx-pdf'];
  const ActiveIcon = activeConfig.icon;
  const activeFile = availableDocs.find(d => d.type === activeDocType);

  return (
    <div className={cn(
      'flex flex-col bg-white rounded-l-xl shadow-2xl overflow-hidden border transition-all duration-300',
      expanded ? 'flex-1 min-w-0' : 'w-[520px]',
      borderFlash ? 'border-[#084A90] shadow-[0_0_0_1px_rgba(0,0,179,0.3)]' : 'border-slate-200'
    )}>
      {/* Top accent bar */}
      <div className="h-1 shrink-0 bg-[#084A90]" />

      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ActiveIcon size={16} className={activeConfig.color} />
            <span className="text-sm font-bold text-slate-800">{activeConfig.label}</span>
          </div>
          <div className="flex items-center gap-1">
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
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* File status badge */}
        <div className="mt-2 flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-500',
            phase === 'scanning' && 'bg-amber-50 text-amber-700',
            phase === 'identified' && 'bg-blue-50 text-blue-700',
            phase === 'ready' && 'bg-green-50 text-green-700',
          )}>
            {phase === 'scanning' && <><Sparkles size={12} className="animate-spin" /> AI Agent detecting document...</>}
            {phase === 'identified' && <><FileCheck size={12} /> Identified: {activeFile?.fileName ?? ''}</>}
            {phase === 'ready' && <><FileCheck size={12} /> {activeFile?.fileName ?? ''}</>}
          </div>
          {phase === 'ready' && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
              AI Extracted
            </span>
          )}
        </div>
      </div>

      {/* Document file tabs */}
      <div className="shrink-0 border-b border-slate-200 px-4 py-2 flex flex-wrap gap-1.5">
        {availableDocs.map((doc) => {
          const cfg = docTypeConfig[doc.type];
          if (!cfg) return null;
          const Icon = cfg.icon;
          const isActive = doc.type === activeDocType;
          return (
            <button
              key={doc.type}
              onClick={() => handleDocClick(doc.type)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all',
                isActive
                  ? 'bg-[#084A90] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Icon size={11} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {phase === 'scanning' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#084A90]/10"
            >
              <Sparkles size={28} className="text-[#084A90]" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Scanning Document</p>
              <p className="mt-1 text-xs text-slate-500">AI Agent is identifying and extracting content...</p>
            </div>
            <div className="w-full max-w-[360px] space-y-2 mt-4">
              {[0.8, 1, 0.6, 0.9, 0.7].map((w, i) => (
                <motion.div
                  key={i}
                  className="h-2.5 rounded bg-slate-100"
                  style={{ width: `${w * 100}%` }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === 'identified' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              <FileCheck size={28} className="text-[#084A90]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Document Identified</p>
              <p className="mt-1 text-xs text-slate-500">Opening {activeFile?.fileName ?? ''}...</p>
            </div>
          </motion.div>
        )}

        {phase === 'ready' && (
          <motion.div
            key={activeDocType}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-inner">
              {/* Exception Evidence — RFX Mismatch */}
              {activeDocType === 'exception' && hasRfxMismatchException && ticket.exception?.type === 'rfx-mismatch' && (
                <ExceptionEvidenceView ticket={ticket} mismatch={ticket.exception} resolved={hasMismatchReply} />
              )}

              {/* Amendment Evidence — Post-PO Amendment */}
              {activeDocType === 'amendment-evidence' && hasAmendmentException && ticket.exception?.type === 'post-po-amendment' && (
                <AmendmentEvidenceView amendment={ticket.exception} resolved={hasAmendmentReply} />
              )}

              {/* RFX Synopsis */}
              {activeDocType === 'rfx-pdf' && (
                <RfxDocumentPreview
                  extractedData={ticket.extractedData}
                  supplierQuotes={ticket.supplierQuotes}
                  effectiveSapPo={
                    // Only pass effectiveSapPo when values have actually changed from original
                    // (mismatch reply confirmed qty, amendment applied, cost reduction applied)
                    hasMismatchReply || (sapPo && ticket.sapPo && sapPo.totalValue !== ticket.sapPo.totalValue)
                      ? sapPo
                      : undefined
                  }
                />
              )}

              {/* Annexure Excel preview */}
              {activeDocType === 'annexure' && sapPo && (
                <div className="bg-white text-[10px]">
                  <div className="border border-slate-300">
                    <div className="bg-yellow-50 p-2 border-b border-slate-300">
                      <p className="font-bold text-[11px] text-center">Annexure — Indirect Material Purchase Approval</p>
                      <p className="text-[9px] text-slate-500 text-center mt-0.5">Approval Ref No: IDM I | Date: {ticket.extractedData.rfxDate}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-0">
                      {[
                        ['Vendor Name', sapPo.supplierName],
                        ['Vendor Code', sapPo.supplierCode],
                        ['PO No', sapPo.poNumber],
                        ['Action', 'PO Creation'],
                        ['Material', ticket.extractedData.materialDescription],
                        ['Material No', ticket.extractedData.materialNumber],
                        ['Qty', `${ticket.extractedData.quantity} ${ticket.extractedData.unit}`],
                        ['Tax Code', sapPo.lineItems[0]?.taxCode ?? 'VG'],
                        ['HSN Code', 'U1'],
                        ['Basic Rate', `€${ticket.supplierQuotes.find(s => s.selected)?.basicRate ?? '—'}`],
                        ['NEGO Rate', `€${ticket.supplierQuotes.find(s => s.selected)?.negotiatedRate ?? '—'}`],
                        ['Net Landed', `€${ticket.supplierQuotes.find(s => s.selected)?.netLandedRate ?? '—'}`],
                        ['Total Value', `€${sapPo.totalValue.toLocaleString("en-US")}`],
                        ['VAT', '18.00%'],
                        ['Payment Terms', sapPo.paymentTerms],
                        ['Delivery', 'As per schedule'],
                      ].map(([label, value], i) => (
                        <div key={label} className={cn('px-2 py-1 border-b border-slate-100 flex justify-between', i % 2 === 0 && 'border-r border-slate-100')}>
                          <span className="text-slate-500 text-[9px]">{label}</span>
                          <span className="font-medium text-slate-800 text-[9px] text-right max-w-[120px] truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rate Negotiation Email preview */}
              {activeDocType === 'rate-negotiation' && (
                <div className="bg-white text-[10px]">
                  <div className="border border-slate-300">
                    <div className="bg-slate-50 p-2 border-b border-slate-300">
                      <p className="font-bold text-[10px]">RE: Rate Negotiation — {ticket.extractedData.materialDescription}</p>
                    </div>
                    <div className="p-2 space-y-1.5 text-[9px]">
                      <div className="flex gap-1"><span className="text-slate-500 w-12">From:</span><span>Procurement Team &lt;procurement@company.com&gt;</span></div>
                      <div className="flex gap-1"><span className="text-slate-500 w-12">To:</span><span>{ticket.supplierQuotes.find(s => s.selected)?.supplierName ?? ''}</span></div>
                      <div className="flex gap-1"><span className="text-slate-500 w-12">Date:</span><span>{ticket.extractedData.rfxDate}</span></div>
                      <div className="flex gap-1"><span className="text-slate-500 w-12">Subject:</span><span className="font-semibold">Rate Negotiation for {ticket.extractedData.materialNumber}</span></div>
                    </div>
                    <div className="p-2 border-t border-slate-200 text-[9px] leading-relaxed">
                      <p>Dear Team,</p>
                      <p className="mt-1">Regarding the quotation for {ticket.extractedData.materialDescription} ({ticket.extractedData.materialNumber}), we have negotiated the rate from the quoted price of €{ticket.supplierQuotes.find(s => s.selected)?.basicRate ?? '—'}/EA to €{ticket.supplierQuotes.find(s => s.selected)?.negotiatedRate ?? '—'}/EA.</p>
                      <p className="mt-1">Payment Terms: {sapPo?.paymentTerms ?? 'AP02'} | Incoterms: {sapPo?.incoterms ?? 'FH'} (Free House)</p>
                      <p className="mt-2">Please confirm to proceed with PO creation.</p>
                      <p className="mt-2">Regards,<br/>Procurement Team</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase Approval */}
              {activeDocType === 'approval' && (
                <div className="bg-white text-[10px]">
                  <div className="border border-green-300 p-3">
                    <p className="font-bold text-[11px] text-green-700 text-center mb-2">Purchase Approval — Approved</p>
                    <div className="space-y-1.5">
                      {[
                        ['Approver', 'Senior Manager — Procurement'],
                        ['Approval Date', ticket.extractedData.rfxDate],
                        ['Material', ticket.extractedData.materialDescription],
                        ['Supplier', ticket.supplierQuotes.find(s => s.selected)?.supplierName ?? '—'],
                        ['Value', `€${sapPo?.totalValue.toLocaleString("en-US") ?? '—'}`],
                        ['Approval Level', 'As per DOA/SOA'],
                        ['Status', 'Approved'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-[9px] border-b border-green-100 pb-1 last:border-b-0">
                          <span className="text-green-700/70">{label}</span>
                          <span className="font-semibold text-green-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Report */}
              {activeDocType === 'validation' && ticket.validationResult && (
                <div className="bg-white text-[10px]">
                  <div className="border border-slate-300 p-2 mb-2">
                    <p className="font-bold text-[11px] text-center mb-2">Validation Report</p>
                    <div className="flex justify-between text-xs mb-2">
                      <span>Status: <strong className={ticket.validationResult.status === 'pass' ? 'text-green-600' : 'text-red-600'}>{ticket.validationResult.status.toUpperCase()}</strong></span>
                      <span>Confidence: <strong>{ticket.validationResult.overallConfidence}%</strong></span>
                    </div>
                  </div>
                  <div className="border border-slate-300">
                    <div className="grid grid-cols-[20px_1fr_1fr_1fr] bg-slate-100 border-b border-slate-300">
                      {['', 'Field', 'Expected', 'Actual'].map((h) => (
                        <div key={h} className="px-1.5 py-1 text-[8px] font-bold text-slate-600">{h}</div>
                      ))}
                    </div>
                    {ticket.validationResult.checks.map((check) => (
                      <div key={check.field} className={cn(
                        'grid grid-cols-[20px_1fr_1fr_1fr] border-b border-slate-100 last:border-b-0',
                        check.status === 'fail' && 'bg-red-50',
                        check.status === 'warning' && 'bg-amber-50',
                      )}>
                        <div className="px-1.5 py-1 text-[9px]">
                          {check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️'}
                        </div>
                        <div className="px-1.5 py-1 text-[9px] font-medium text-slate-700">{check.label}</div>
                        <div className="px-1.5 py-1 text-[9px] text-slate-500">{check.expected}</div>
                        <div className={cn('px-1.5 py-1 text-[9px]', check.status === 'fail' ? 'text-red-600 font-semibold' : 'text-slate-700')}>
                          {check.actual}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SAP PO Document (professional format) */}
              {(activeDocType === 'sap-po' || activeDocType === 'po-qc') && displaySapPo && (
                <SapPoDocument sapPo={displaySapPo} extractedData={ticket.extractedData} />
              )}

              {/* Ticket Resolution */}
              {activeDocType === 'ticket-resolved' && (
                <div className="bg-white text-[10px]">
                  <div className="border border-green-300 p-3">
                    <p className="font-bold text-[11px] text-green-700 text-center mb-3">Ticket Resolved</p>
                    <div className="space-y-2">
                      {[
                        ['Ticket ID', ticket.id],
                        ['RFX Number', ticket.rfxId],
                        ['PO Number', sapPo?.poNumber ?? '—'],
                        ['Status', 'Resolved'],
                        ['Portal', 'Updated'],
                        ['PO Copy', 'Attached'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-[10px] border-b border-green-100 pb-1 last:border-b-0">
                          <span className="text-green-700/70">{label}</span>
                          <span className="font-semibold text-green-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
