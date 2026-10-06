import { cn } from '@/lib/utils';
import type { RfxExtractedData, SupplierQuote } from '@/data/types';

interface RfxDocumentPreviewProps {
  extractedData: RfxExtractedData;
  supplierQuotes: SupplierQuote[];
  /** When provided, overrides quantity display with effective PO values */
  effectiveSapPo?: import('@/data/types').SapPoData;
}

function Cell({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('px-1.5 py-1 border-r border-b border-slate-300', className)}>
      <span className="text-[7.5px] text-slate-500 block leading-none mb-0.5">{label}</span>
      <span className="text-[8.5px] font-medium text-slate-800 leading-snug">{value}</span>
    </div>
  );
}

function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-1 py-1 text-[7px] font-bold text-slate-600 bg-slate-100 border-r border-b border-slate-300 text-center leading-tight', className)}>
      {children}
    </div>
  );
}

function TD({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-1 py-1 text-[8px] text-center border-r border-b border-slate-200 tabular-nums leading-none', className)}>
      {children}
    </div>
  );
}

export function RfxDocumentPreview({ extractedData, supplierQuotes, effectiveSapPo }: RfxDocumentPreviewProps) {
  // Use effective PO quantity when available (e.g. after amendment/mismatch resolution)
  const displayQty = effectiveSapPo?.lineItems[0]?.quantity ?? extractedData.quantity;
  const displayValue = effectiveSapPo ? effectiveSapPo.totalValue / 100000 : extractedData.currentValueLacs;
  return (
    <div className="bg-white text-slate-800 border border-slate-300 select-text">
      {/* ── Row 1: Title header ── */}
      <div className="grid grid-cols-[1fr_1.4fr_1fr] border-b border-slate-300">
        <div className="px-1.5 py-1 border-r border-slate-300">
          <p className="text-[7px] text-slate-400 leading-none">Synopsis of Quotations</p>
          <p className="text-[9px] font-bold text-slate-800 mt-0.5">AeroCorp S.A.</p>
        </div>
        <div className="px-1.5 py-1 border-r border-slate-300 flex items-center justify-center">
          <p className="text-[9px] font-bold text-slate-800 text-center">Indirect Material Purchase Approval</p>
        </div>
        <div className="px-1.5 py-1">
          <div className="text-[8px] leading-snug">
            <div className="flex gap-1"><span className="text-slate-500 w-[56px] shrink-0">Category:</span><span className="font-medium">{extractedData.category}</span></div>
            <div className="flex gap-1 mt-0.5"><span className="text-slate-500 w-[56px] shrink-0">Indent No:</span><span className="font-medium">{extractedData.indentNumber}</span></div>
          </div>
        </div>
      </div>

      {/* ── Row 2: RFx Creator / RFx Type / Commodity / Email / Proc Type ── */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] border-b border-slate-300">
        <Cell label="RFx Creator Name" value="C. MOREAU" />
        <Cell label="RFx Type" value={extractedData.rfxType} />
        <Cell label="Phone No" value="—" />
        <Cell label="Commodity Vertical" value={extractedData.commodityVertical} />
        <Cell label="Email" value={extractedData.email} className="border-r-0" />
      </div>

      {/* ── Row 3: Part No / Part Desc / Current Value / Cumul Value ── */}
      <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr] border-b border-slate-300">
        <Cell label="Part No" value={extractedData.materialNumber} />
        <Cell label="Part Description" value={extractedData.materialDescription} />
        <Cell label="Current Value (k€)" value={`${displayValue}`} />
        <Cell label="Cumulative Value (k€)" value={`${extractedData.cumulativeValueLacs}`} className="border-r-0" />
      </div>

      {/* ── Row 4: RFX No / Qty / UoM / P Org / Pur Grp / RFX Date ── */}
      <div className="grid grid-cols-[1fr_1fr_1fr_2fr_1fr_1fr] border-b border-slate-300">
        <Cell label="RFX No" value={extractedData.rfxNumber} />
        <Cell label="Current Qty" value={`${displayQty}`} />
        <Cell label="UoM" value={extractedData.unit} />
        <Cell label="P Org" value={extractedData.purchasingOrg} />
        <Cell label="Pur Grp" value={extractedData.purchasingGroup} />
        <Cell label="RFX Date" value={extractedData.rfxDate} className="border-r-0" />
      </div>

      {/* ── Row 5: Shopping Cart / Material Type / PR Creator / PR No / Proc Type ── */}
      <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1fr]">
        <Cell label="Shopping Cart No" value="—" />
        <Cell label="Material Type" value="—" />
        <Cell label="PR Creator Name" value={extractedData.prCreatorName} />
        <Cell label="PR No" value={extractedData.prNumber} />
        <Cell label="Proc Type" value={extractedData.procurementType} className="border-r-0" />
      </div>

      {/* ── Supplier Comparison Table ── */}
      <div className="mt-0 border-t border-slate-300">
        {/* Column headers */}
        <div className="grid grid-cols-[1.6fr_50px_45px_42px_42px_42px_28px_32px_30px_32px]">
          <TH className="text-left pl-1.5">Supplier Name (Code) / Location</TH>
          <TH>Plant</TH>
          <TH>Qty</TH>
          <TH>Basic Rate</TH>
          <TH>Neg. Rate</TH>
          <TH>Net Landed</TH>
          <TH>Tax</TH>
          <TH>Pay Terms</TH>
          <TH>Del Terms</TH>
          <TH className="border-r-0">SOB%</TH>
        </div>

        {supplierQuotes.map((sup) => (
          <div key={sup.supplierCode} className={cn(sup.selected && 'bg-blue-50/30')}>
            {/* Supplier meta row */}
            <div className="grid grid-cols-[1fr]">
              <div className="px-1.5 py-0.5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-bold">{sup.supplierName} ({sup.supplierCode})</span>
                  <span className="text-[7px] text-slate-400 ml-2">Loc: {sup.location}</span>
                  <span className="text-[7px] text-slate-400 ml-2">RFX Resp: {sup.rfxResponseNo}</span>
                  <span className="text-[7px] text-slate-400 ml-2">Valid: {sup.validityStart}–{sup.validityEnd}</span>
                  <span className="text-[7px] text-slate-400 ml-2">Del: {sup.deliveryDays}d</span>
                </div>
                <span className="text-[7.5px] text-slate-500 font-medium">Level: {sup.level}</span>
              </div>
            </div>
            {/* Data row */}
            <div className="grid grid-cols-[1.6fr_50px_45px_42px_42px_42px_28px_32px_30px_32px]">
              <TD className="text-left pl-1.5 text-[7.5px] text-slate-500">Storage: U01</TD>
              <TD>3158</TD>
              <TD>{displayQty}</TD>
              <TD>{sup.basicRate.toFixed(2)}</TD>
              <TD className="font-semibold text-[#084A90]">{sup.negotiatedRate.toFixed(2)}</TD>
              <TD>{sup.netLandedRate.toFixed(2)}</TD>
              <TD>{sup.taxCode}</TD>
              <TD>{sup.paymentTerms}</TD>
              <TD>{sup.deliveryTerms}</TD>
              <TD className={cn('border-r-0', sup.selected && 'font-bold text-[#084A90]')}>{sup.sobPercent}</TD>
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer: Existing procurement ── */}
      <div className="border-t border-slate-300">
        <div className="px-1.5 py-0.5 border-b border-slate-200 bg-slate-50">
          <span className="text-[7.5px] font-bold text-slate-500">Existing Details Mar&apos; 2026 year Procurement</span>
        </div>
        <div className="grid grid-cols-4">
          {['Supplier Name', 'Vendor Code', 'PO Number', 'GR Date'].map((h) => (
            <div key={h} className="px-1.5 py-0.5 text-[7px] font-bold text-slate-500 bg-slate-50 border-r border-b border-slate-200 last:border-r-0">{h}</div>
          ))}
          {[
            supplierQuotes.find(s => s.selected)?.supplierName?.split(' ').slice(0, 2).join(' ') ?? '',
            supplierQuotes.find(s => s.selected)?.supplierCode ?? '',
            '',
            '',
          ].map((val, i) => (
            <div key={i} className="px-1.5 py-1 text-[8px] border-r border-slate-200 last:border-r-0">{val}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
