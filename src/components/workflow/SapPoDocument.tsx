import { cn } from '@/lib/utils';
import type { SapPoData, RfxExtractedData } from '@/data/types';

interface SapPoDocumentProps {
  sapPo: SapPoData;
  extractedData: RfxExtractedData;
}

function HeaderField({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex text-[9px] leading-snug">
      <span className="text-slate-500 w-[85px] shrink-0">{label}</span>
      <span className={cn('text-slate-800', bold && 'font-bold')}>{value}</span>
    </div>
  );
}

export function SapPoDocument({ sapPo, extractedData }: SapPoDocumentProps) {
  return (
    <div className="bg-white text-slate-800 text-[10px] leading-tight select-text">
      {/* SAP Header Bar */}
      <div className="bg-[#354A5F] text-white px-3 py-2 flex items-center justify-between rounded-t">
        <div className="flex items-center gap-2">
          <div className="font-bold text-[11px] tracking-wide">SAP</div>
          <span className="text-[9px] text-slate-300">|</span>
          <span className="text-[9px]">Purchase Order</span>
        </div>
        <span className="text-[9px] text-slate-300">ME23N — Display</span>
      </div>

      {/* PO Title Bar */}
      <div className="bg-[#F5F6F7] border border-t-0 border-slate-300 px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-500">PO (UNB)</span>
            <span className="ml-2 font-bold text-[12px]">{sapPo.poNumber}</span>
          </div>
          <div className="text-[9px] text-slate-500">
            Created by <span className="font-semibold text-slate-700">{sapPo.createdBy}</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border border-t-0 border-slate-300 bg-white">
        <div className="flex gap-0 text-[8px] border-b border-slate-200">
          {['Org. Data', 'Status', 'Delivery', 'Conditions', 'Texts', 'Incoterms', 'Payment'].map((tab, i) => (
            <div
              key={tab}
              className={cn(
                'px-2 py-1.5 border-r border-slate-200 cursor-default',
                i === 0 ? 'bg-white font-bold text-[#354A5F] border-b-2 border-b-[#354A5F]' : 'bg-slate-50 text-slate-500'
              )}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Org Data content */}
        <div className="grid grid-cols-2 gap-0 p-2">
          <div className="space-y-1 pr-2 border-r border-slate-100">
            <HeaderField label="Supplier:" value={`${sapPo.supplierCode} ${sapPo.supplierName}`} bold />
            <HeaderField label="Purch. Org:" value={sapPo.purchasingOrg} />
            <HeaderField label="Purch. Group:" value={sapPo.purchasingGroup} />
            <HeaderField label="Company Code:" value={sapPo.companyCode} />
          </div>
          <div className="space-y-1 pl-2">
            <HeaderField label="PO Type:" value={sapPo.poType} />
            <HeaderField label="Created:" value={sapPo.createdDate} />
            <HeaderField label="Validity Start:" value={sapPo.validityStart} />
            <HeaderField label="Validity End:" value={sapPo.validityEnd} />
          </div>
        </div>
      </div>

      {/* Key Terms Strip */}
      <div className="border border-t-0 border-slate-300 bg-blue-50/50 px-3 py-1.5 flex gap-4 text-[9px]">
        <div>
          <span className="text-slate-500">Incoterms:</span>{' '}
          <span className="font-semibold">{sapPo.incoterms}</span>{' '}
          <span className="text-slate-400">({sapPo.incotermsLocation})</span>
        </div>
        <div>
          <span className="text-slate-500">Payment:</span>{' '}
          <span className="font-semibold">{sapPo.paymentTerms}</span>
        </div>
        <div>
          <span className="text-slate-500">Currency:</span>{' '}
          <span className="font-semibold">€ (Rupee)</span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="border border-t-0 border-slate-300">
        <div className="bg-slate-100 px-2 py-1 border-b border-slate-200">
          <span className="font-bold text-[9px] text-slate-600">Item Overview</span>
        </div>
        {/* Table header */}
        <div className="grid grid-cols-[28px_70px_1fr_55px_45px_50px_55px_60px] bg-[#E8EDF2] border-b border-slate-300">
          {['S.', 'Material', 'Short Text', 'PO Qty', 'OUn', 'Delv. Date', 'Net Price', 'Per'].map((h) => (
            <div key={h} className="px-1 py-1 text-[8px] font-bold text-[#354A5F] border-r border-slate-200 last:border-r-0">
              {h}
            </div>
          ))}
        </div>
        {/* Line items */}
        {sapPo.lineItems.map((li, idx) => (
          <div key={li.itemNumber} className={cn(
            'grid grid-cols-[28px_70px_1fr_55px_45px_50px_55px_60px] border-b border-slate-100',
            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
          )}>
            <div className="px-1 py-1 text-[9px] border-r border-slate-100 tabular-nums">{li.itemNumber}</div>
            <div className="px-1 py-1 text-[9px] border-r border-slate-100 tabular-nums">{extractedData.materialNumber}</div>
            <div className="px-1 py-1 text-[9px] border-r border-slate-100 truncate">{li.description}</div>
            <div className="px-1 py-1 text-[9px] border-r border-slate-100 tabular-nums text-right">{li.quantity}</div>
            <div className="px-1 py-1 text-[9px] border-r border-slate-100">{li.unit}</div>
            <div className="px-1 py-1 text-[9px] border-r border-slate-100 tabular-nums">{sapPo.validityEnd}</div>
            <div className="px-1 py-1 text-[9px] border-r border-slate-100 tabular-nums text-right">{li.pricePerUnit.toFixed(2)}</div>
            <div className="px-1 py-1 text-[9px] tabular-nums">/ 1 {li.unit}</div>
          </div>
        ))}
      </div>

      {/* Material Data Section */}
      <div className="border border-t-0 border-slate-300">
        <div className="bg-slate-100 px-2 py-1 border-b border-slate-200">
          <span className="text-[8px] text-slate-500">Item {sapPo.lineItems[0]?.itemNumber} | {extractedData.materialNumber}, {extractedData.materialDescription}</span>
        </div>
        {/* Sub-tabs */}
        <div className="flex gap-0 text-[8px] border-b border-slate-200">
          {['Material Data', 'Quantities', 'Delivery', 'Invoice', 'Conditions'].map((tab, i) => (
            <div
              key={tab}
              className={cn(
                'px-2 py-1 border-r border-slate-200',
                i === 0 ? 'bg-white font-bold text-[#354A5F]' : 'bg-slate-50 text-slate-500'
              )}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-0 p-2">
          <div className="space-y-1 pr-2 border-r border-slate-100">
            <HeaderField label="Material Grp:" value={sapPo.lineItems[0]?.materialGroup ?? 'IEFAZZZ'} />
            <HeaderField label="Plant:" value={extractedData.plant} />
            <HeaderField label="Stor. Location:" value={extractedData.storageLocation} />
          </div>
          <div className="space-y-1 pl-2">
            <HeaderField label="Tax Code:" value={sapPo.lineItems[0]?.taxCode ?? 'VG'} />
            <HeaderField label="OPU:" value={extractedData.unit} />
            <HeaderField label="Matl Group:" value={sapPo.lineItems[0]?.materialGroup ?? 'IEFAZZZ'} />
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="border border-t-0 border-slate-300 bg-[#354A5F] text-white px-3 py-2 flex justify-between rounded-b">
        <span className="font-bold text-[10px]">Total PO Value</span>
        <span className="font-bold text-[12px] tabular-nums">€{sapPo.totalValue.toLocaleString('en-US')}</span>
      </div>
    </div>
  );
}
