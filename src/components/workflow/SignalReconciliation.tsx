import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, Globe, FolderCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RfxExtractedData, PortalValues, SupplierQuote, DocStatus } from '@/data/types';

interface ContentExtractionProps {
  extractedData: RfxExtractedData;
  portalValues: PortalValues;
  supplierQuotes: SupplierQuote[];
  onAccept: () => void;
}

// Thinking dots animation with rotating status text
function ThinkingDots() {
  const [stepIdx, setStepIdx] = useState(0);
  const steps = [
    'Parsing RFX PDF document…',
    'Extracting 18 structured fields…',
    'Cross-referencing portal values…',
    'Matching supplier quote data…',
    'Validating document checklist…',
  ];
  useEffect(() => {
    const iv = setInterval(() => setStepIdx(i => (i + 1) % steps.length), 1600);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="flex items-center gap-1.5 py-3 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-slate-300"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
      <AnimatePresence mode="wait">
        <motion.span
          key={stepIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-[10px] text-slate-400 ml-1"
        >
          {steps[stepIdx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Animated rows — each child fades up with stagger
const rowContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const rowItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

function AnimatedRows({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={rowContainer} initial="hidden" animate="show" className="space-y-1.5">
      {children}
    </motion.div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.div variants={rowItem} className="flex justify-between gap-2 text-xs">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-medium text-slate-800 text-right truncate">{children}</span>
    </motion.div>
  );
}

function DocChecklist({ docs }: { docs: DocStatus[] }) {
  return (
    <motion.div variants={rowContainer} initial="hidden" animate="show" className="space-y-1.5">
      {docs.map((doc) => (
        <motion.div key={doc.name} variants={rowItem} className="flex items-center gap-2 text-xs">
          <span className={doc.present ? 'text-green-500' : 'text-red-500'}>
            {doc.present ? '✅' : '❌'}
          </span>
          <span className={cn('text-slate-700', !doc.present && 'text-red-600 font-medium')}>
            {doc.name}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Card wrapper — appears instantly, shows thinking for 1s, then reveals content
function AnimatedCard({
  icon,
  title,
  showContent,
  fieldCount,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  showContent: boolean;
  fieldCount?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-lg border border-slate-200 bg-white p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold text-slate-700">{title}</span>
        {showContent && fieldCount !== undefined && (
          <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
            {fieldCount} fields
          </span>
        )}
      </div>
      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div key="thinking" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <ThinkingDots />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SignalReconciliation({
  extractedData,
  portalValues,
  supplierQuotes,
  onAccept,
}: ContentExtractionProps) {
  const [showContent, setShowContent] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 1000);   // 1s thinking → content
    const t2 = setTimeout(() => setShowAnalysis(true), 1800);  // analysis section
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const selectedSupplier = supplierQuotes.find(s => s.selected);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Content Extraction Agent
      </h4>

      {/* 2x2 Card Grid — all 4 appear immediately, content streams in after 1s */}
      <div className="grid grid-cols-2 gap-2">

        {/* RFX PDF Extracted */}
        <AnimatedCard
          icon={<FileText size={14} className="text-blue-600" />}
          title="RFX PDF Extracted"
          showContent={showContent}
          fieldCount={6}
        >
          <AnimatedRows>
            <Row label="Material">{extractedData.materialNumber}</Row>
            <Row label="Description">{extractedData.materialDescription}</Row>
            <Row label="Quantity"><strong>{extractedData.quantity} {extractedData.unit}</strong></Row>
            <Row label="Plant / Storage">{extractedData.plant} / {extractedData.storageLocation}</Row>
            <Row label="Category">{extractedData.category}</Row>
            <Row label="Value">{extractedData.currentValueLacs} k€</Row>
          </AnimatedRows>
        </AnimatedCard>

        {/* Portal Values */}
        <AnimatedCard
          icon={<Globe size={14} className="text-indigo-600" />}
          title="Portal Values"
          showContent={showContent}
          fieldCount={6}
        >
          <AnimatedRows>
            <Row label="Ticket ID">{portalValues.ticketId.replace('SAF-INC-2026-', 'INC-')}</Row>
            <Row label="Requester">{portalValues.requesterName}</Row>
            <Row label="Department">{portalValues.requesterDepartment}</Row>
            <Row label="Quantity"><strong>{portalValues.portalQuantity} {portalValues.portalUnit}</strong></Row>
            <motion.div variants={rowItem} className="flex justify-between text-xs">
              <span className="text-slate-500">Priority</span>
              <span className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-medium capitalize',
                portalValues.priority === 'critical' ? 'bg-red-50 text-red-600'
                  : portalValues.priority === 'high' ? 'bg-orange-50 text-orange-600'
                  : portalValues.priority === 'medium' ? 'bg-amber-50 text-amber-600'
                  : 'bg-green-50 text-green-600'
              )}>
                {portalValues.priority}
              </span>
            </motion.div>
            <Row label="Location">{portalValues.location}</Row>
          </AnimatedRows>
        </AnimatedCard>

        {/* Document Checklist */}
        <AnimatedCard
          icon={<FolderCheck size={14} className="text-slate-600" />}
          title="Document Checklist"
          showContent={showContent}
          fieldCount={extractedData.docsAvailable.length}
        >
          <DocChecklist docs={extractedData.docsAvailable} />
        </AnimatedCard>

        {/* Supplier Quotes */}
        <AnimatedCard
          icon={<Users size={14} className="text-slate-600" />}
          title="Supplier Quotes"
          showContent={showContent}
          fieldCount={supplierQuotes.length}
        >
          <motion.div variants={rowContainer} initial="hidden" animate="show" className="space-y-2">
            {supplierQuotes.slice(0, 3).map((sup) => (
              <motion.div
                key={sup.supplierCode}
                variants={rowItem}
                className={cn('space-y-1 rounded p-1.5', sup.selected ? 'bg-green-50 ring-1 ring-green-200' : 'bg-slate-50')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-200 rounded px-1">{sup.level}</span>
                    <p className="text-xs font-medium text-slate-700">{sup.supplierName.split(' ').slice(0, 2).join(' ')}</p>
                  </div>
                  {sup.selected && <span className="text-[9px] font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">SELECTED</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>Rate: <strong className="text-slate-700">€{sup.negotiatedRate}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>SOB: {sup.sobPercent}%</span>
                  <span className="text-slate-300">|</span>
                  <span>{sup.deliveryDays}d</span>
                </div>
              </motion.div>
            ))}
            {supplierQuotes.length > 3 && (
              <p className="text-[10px] text-slate-400 text-center">+{supplierQuotes.length - 3} more</p>
            )}
          </motion.div>
        </AnimatedCard>
      </div>

      {/* AI Extraction Summary */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          AI Extraction Analysis
        </h4>
        <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
          {!showAnalysis ? (
            <div className="animate-pulse space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#084A90] animate-spin" />
                <span className="text-xs font-medium text-slate-600">Extracting fields from RFX PDF…</span>
              </div>
              <div className="h-3 w-3/4 rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
              <div className="h-3 w-full rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-[#084A90]" />
                <span className="text-xs font-semibold text-[#084A90]">Content Extraction Complete</span>
                <span className="ml-auto rounded-full bg-[#084A90]/10 px-2 py-0.5 text-[10px] font-medium text-[#084A90]">
                  18 fields extracted
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                Successfully extracted {extractedData.docsAvailable.filter(d => d.present).length}/{extractedData.docsAvailable.length} documents.
                Material: {extractedData.materialDescription} ({extractedData.materialNumber}),
                Qty: {extractedData.quantity} {extractedData.unit} from {selectedSupplier?.supplierName ?? 'pending selection'}.
                {selectedSupplier && ` Negotiated rate: €${selectedSupplier.negotiatedRate}/EA (${((1 - selectedSupplier.negotiatedRate / selectedSupplier.basicRate) * 100).toFixed(1)}% below basic rate).`}
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-md bg-white/60 px-3 py-2">
                <span className="text-xs font-medium text-slate-600">Fields Extracted:</span>
                <span className="text-sm font-bold text-slate-900">18 / 18</span>
                <span className="text-[10px] text-green-600 ml-1">✓ All required fields present</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Accept Button */}
      {showAnalysis && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={onAccept}
            className="w-full rounded-lg bg-[#084A90] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#063A70]"
          >
            Proceed to Scenario Identification →
          </button>
        </motion.div>
      )}
    </div>
  );
}
