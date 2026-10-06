import { motion } from 'framer-motion';
import { X, FileText, Download, Stamp, CheckCircle, AlertTriangle, Table2 } from 'lucide-react';
import type { RfxTicket } from '@/data/types';

interface AttachmentPreviewModalProps {
  filename: string;
  onClose: () => void;
  tickets?: RfxTicket[];
  effectiveSapPo?: import('@/data/types').SapPoData;
}

export function AttachmentPreviewModal({ filename, onClose, tickets, effectiveSapPo: effectiveSapPoProp }: AttachmentPreviewModalProps) {
  const lower = filename.toLowerCase();
  const isXlsx        = lower.endsWith('.xlsx') || lower.endsWith('.xls');
  const isAnnexure    = lower.includes('annexure') || lower.includes('revised_annexure');
  const isAmendedPO   = lower.includes('amended_po');
  const isApproval    = lower.includes('approval') && !lower.includes('amended');
  const isConfirmation = lower.includes('confirmation') || lower.includes('po_confirm') || (lower.startsWith('po_') && !lower.includes('budget'));
  const isDelivery    = lower.includes('delivery');
  const isRfx         = lower.includes('rfx') && !isAnnexure;
  const isBudgetAnalysis = lower.includes('budget_analysis') || lower.includes('budget_review') || lower.includes('budget_allocation');
  const isQcReview     = lower.includes('qc_review') || lower.includes('checker_review');
  const isErrorReport  = lower.includes('error_report');
  const isValidation   = lower.includes('validation');
  const isCorrectedPO  = lower.includes('corrected_po');
  const isQuote        = lower.includes('quote');
  const isOpsVerify    = lower.includes('ops_verification');
  const isAmendmentDetail = lower.includes('amendment_details') || lower.includes('amendment_request');
  const isRevisedSIO   = lower.includes('revised_sio');

  // Extract PO/RFX number from filename
  const numMatch = filename.match(/(\d{7,})/);
  const refNumber = numMatch ? numMatch[1] : '3012438300';
  const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  // Look up the ticket by PO number or RFX number from filename
  // Also check pendingSapPo (budget cases) and checkerReview (for PO number refs)
  const matchedTicket = tickets?.find(t =>
    t.sapPo?.poNumber === refNumber ||
    t.rfxId?.includes(refNumber) ||
    t.extractedData?.rfxNumber === refNumber ||
    (t.exception?.type === 'checker-budget-issue' && (t.exception as any)?.pendingSapPo?.poNumber === refNumber) ||
    t.checkerReview?.revalidationChecks?.some((c: any) => c.field === 'poNumber' && c.actual === refNumber)
  );
  // Budget cases: ticket.sapPo is undefined, PO lives in exception.pendingSapPo
  // Apply cost reduction if requiresMakerFix variant
  const budgetPendingPo = (() => {
    if (matchedTicket?.exception?.type !== 'checker-budget-issue') return undefined;
    const budgetEx = matchedTicket.exception as any;
    const po = budgetEx?.pendingSapPo;
    if (!po) return undefined;
    if (budgetEx.requiresMakerFix && budgetEx.budgetFixDetails) {
      const { toQty, unitPrice } = budgetEx.budgetFixDetails;
      const newNet = toQty * unitPrice;
      const taxMult = po.lineItems[0] ? po.totalValue / po.lineItems[0].totalPrice : 1.25;
      return {
        ...po,
        lineItems: po.lineItems.map((item: any, i: number) =>
          i === 0 ? { ...item, quantity: toQty, totalPrice: newNet } : item
        ),
        totalValue: Math.round(newNet * taxMult),
      };
    }
    return po;
  })();
  const rawSapPo = effectiveSapPoProp ?? matchedTicket?.sapPo ?? budgetPendingPo;
  const ext = matchedTicket?.extractedData;
  const exception = matchedTicket?.exception;
  // For amendment tickets, always show amended values in PO documents
  const sapPo = (() => {
    if (!rawSapPo || exception?.type !== 'post-po-amendment') return rawSapPo;
    const amendment = exception as any;
    const qtyStr = amendment.amendments?.find((a: any) => a.field === 'quantity')?.requestedValue ?? '';
    const newQty = parseFloat(qtyStr.replace(/[^0-9.]/g, '')) || rawSapPo.lineItems[0]?.quantity;
    if (newQty === rawSapPo.lineItems[0]?.quantity) return rawSapPo;
    return {
      ...rawSapPo,
      lineItems: rawSapPo.lineItems.map((item: any, i: number) =>
        i === 0 ? { ...item, quantity: newQty, taxCode: 'U1', totalPrice: amendment.amendedTotalValue } : item
      ),
      totalValue: amendment.amendedTotalValue,
    };
  })();

  const docTitle = isAnnexure
    ? 'ANNEXURE — QUANTITY CONFIRMATION'
    : isAmendedPO
    ? 'AMENDED PURCHASE ORDER'
    : isApproval
    ? 'AMENDMENT APPROVAL CERTIFICATE'
    : isQcReview
    ? 'QC REVIEW REPORT'
    : isErrorReport
    ? 'DATA ERROR REPORT'
    : isValidation
    ? 'FIELD VALIDATION REPORT'
    : isCorrectedPO
    ? 'CORRECTED PURCHASE ORDER'
    : isQuote
    ? 'SUPPLIER QUOTATION'
    : isOpsVerify
    ? 'OPS VERIFICATION REPORT'
    : isAmendmentDetail
    ? 'AMENDMENT REQUEST DETAILS'
    : isRevisedSIO
    ? 'REVISED SIO BUDGET ALLOCATION'
    : isConfirmation
    ? 'PURCHASE ORDER CONFIRMATION'
    : isDelivery
    ? 'DELIVERY TERMS & CONDITIONS'
    : isRfx
    ? 'RFX CLARIFICATION REQUEST'
    : 'DOCUMENT PREVIEW';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* PDF/Excel toolbar */}
        <div className={`flex items-center justify-between px-4 py-2.5 shrink-0 ${isXlsx ? 'bg-emerald-900' : 'bg-slate-800'}`}>
          <div className="flex items-center gap-2.5">
            {isXlsx
              ? <Table2 size={14} className="text-emerald-300" />
              : <FileText size={14} className="text-red-400" />
            }
            <span className="text-xs font-medium text-slate-200 truncate max-w-xs">{filename}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-md bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600 transition-colors">
              <Download size={12} /> Download
            </button>
            <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-700 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* PDF page */}
        <div className="flex-1 overflow-y-auto bg-slate-200 flex justify-center py-6 px-4">
          <div className="w-full max-w-[560px] bg-white shadow-lg rounded-sm min-h-[680px] px-10 py-8 space-y-5 text-[12px] text-slate-800">

            {/* Company header */}
            <div className="flex items-start justify-between border-b border-slate-300 pb-4">
              <div>
                <p className="text-lg font-extrabold text-[#084A90] tracking-tight">PO ORCHESTRATOR</p>
                <p className="text-[10px] text-slate-500">P&SC Support Group — AeroCorp S.A.</p>
                <p className="text-[10px] text-slate-500">Email: po-team@company.com</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700">{docTitle}</p>
                <p className="text-[10px] text-slate-500 mt-1">Document Date: {today}</p>
                <p className="text-[10px] text-slate-500">Ref No: {refNumber}</p>
              </div>
            </div>

            {/* ── Annexure / Excel Spreadsheet ── */}
            {isAnnexure && (
              <div className="space-y-4 text-[11px]">
                {/* Excel-style header bar */}
                <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                  <p className="font-bold text-emerald-800">Revised Annexure — RFX {refNumber}</p>
                  <p className="text-emerald-700 mt-0.5">Quantity confirmation as per latest indent approval dated 03/09/2026</p>
                </div>

                {/* Spreadsheet grid */}
                <div className="overflow-x-auto rounded-md border border-slate-300">
                  {/* Excel column header row */}
                  <div className="flex bg-slate-200 border-b border-slate-300 text-[10px] font-bold text-slate-600">
                    <div className="w-8 shrink-0 px-2 py-1 border-r border-slate-300 text-center">#</div>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => (
                      <div key={c} className="flex-1 px-2 py-1 border-r border-slate-300 text-center last:border-r-0">{c}</div>
                    ))}
                  </div>
                  {/* Header row */}
                  <div className="flex bg-slate-100 border-b border-slate-300 text-[10px] font-bold text-slate-700">
                    <div className="w-8 shrink-0 px-2 py-1.5 border-r border-slate-300 text-center text-slate-400">1</div>
                    {['RFX Number', 'Material No.', 'Material Desc.', 'Indent Qty', 'Portal Qty', 'Confirmed Qty', 'Remarks'].map(h => (
                      <div key={h} className="flex-1 px-2 py-1.5 border-r border-slate-300 last:border-r-0 bg-blue-50">{h}</div>
                    ))}
                  </div>
                  {/* Data rows */}
                  {[
                    [ext?.rfxNumber ?? '3012438300', ext?.materialNumber ?? '889000087436', ext?.materialDescription ?? 'TITANIUM CAP SCREW M4X6', `${ext?.quantity ?? 200} ${ext?.unit ?? 'EA'}`, `${matchedTicket?.portalValues?.portalQuantity ?? 150} ${matchedTicket?.portalValues?.portalUnit ?? 'EA'}`, `${sapPo?.lineItems[0]?.quantity ?? 250} ${sapPo?.lineItems[0]?.unit ?? 'EA'}`, 'Per indent approval 03/09/2026'],
                    [ext?.rfxNumber ?? '3012438300', ext?.materialNumber ?? '889000087436', ext?.materialDescription ?? 'TITANIUM CAP SCREW M4X6', '', '', '', `Rate: €${sapPo?.lineItems[0]?.pricePerUnit ?? 4.57}/${sapPo?.lineItems[0]?.unit ?? 'EA'}`],
                  ].map((row, ri) => (
                    <div key={ri} className={`flex border-b border-slate-200 text-[10px] last:border-b-0 ${ri === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <div className="w-8 shrink-0 px-2 py-1.5 border-r border-slate-300 text-center text-slate-400">{ri + 2}</div>
                      {row.map((cell, ci) => (
                        <div key={ci} className={`flex-1 px-2 py-1.5 border-r border-slate-200 last:border-r-0 ${ci === 5 && ri === 0 ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-slate-700'}`}>
                          {cell}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Summary box */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Indent Qty', value: `${ext?.quantity ?? 200} ${ext?.unit ?? 'EA'}`, color: 'slate' },
                    { label: 'Portal Qty', value: `${matchedTicket?.portalValues?.portalQuantity ?? 150} ${matchedTicket?.portalValues?.portalUnit ?? 'EA'}`, color: 'red' },
                    { label: 'Confirmed Qty', value: `${sapPo?.lineItems[0]?.quantity ?? 250} ${sapPo?.lineItems[0]?.unit ?? 'EA'}`, color: 'green' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-md border px-3 py-2 text-center border-${color}-200 bg-${color}-50`}>
                      <p className={`text-[10px] font-semibold text-${color}-600 uppercase tracking-wide`}>{label}</p>
                      <p className={`text-sm font-bold text-${color}-800 mt-0.5`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2.5 text-[11px]">
                  <p className="font-semibold text-slate-700">Authorization</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Prepared By</span><span className="font-medium">Buyer</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Date</span><span className="font-medium">09 Mar 2026</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Department</span><span className="font-medium">Engine MRO</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Plant</span><span className="font-medium">Réau (3158)</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── RFX Clarification Request ── */}
            {isRfx && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-800">Exception Hold — Clarification Required</p>
                    <p className="text-red-700 mt-0.5">RFX {refNumber} has been placed on hold pending resolution of data discrepancies.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Requester</p>
                    <p className="font-semibold">Buyer</p>
                    <p className="text-slate-500">buyer@company.com</p>
                    <p className="text-slate-500">Engine MRO — Réau</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">RFX Details</p>
                    <p className="font-semibold">RFX-{refNumber}</p>
                    <p className="text-slate-500">Material: {ext?.materialDescription ?? 'TITANIUM CAP SCREW M4X6'}</p>
                    <p className="text-slate-500">Date: 26 Mar 2026</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Field Discrepancies Identified</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="border border-slate-300 px-3 py-1.5 text-left">Field</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-left">RFX PDF Value</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-left">Portal Value</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium">Quantity</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{ext?.quantity ?? 200} {ext?.unit ?? 'EA'}</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-bold text-red-600">{matchedTicket?.portalValues?.portalQuantity ?? 150} {matchedTicket?.portalValues?.portalUnit ?? 'EA'}</td>
                        <td className="border border-slate-300 px-3 py-1.5">
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Mismatch</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Missing Documents</p>
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-2.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-bold text-xs">✗</span>
                      <span className="text-amber-800">Annexure Excel (Approval Calculation Sheet)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Action Required</p>
                  <p className="text-slate-700">Please confirm the correct order quantity and provide the missing Annexure Excel sheet. Respond to: <span className="font-medium text-[#084A90]">po-team@company.com</span></p>
                  <p className="text-slate-500 mt-1">Reference: INC-08835 · Hold initiated: 26 Mar 2026</p>
                </div>
              </div>
            )}

            {/* ── Amended PO ── */}
            {isAmendedPO && (
              <div className="space-y-4 text-[11px]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Bill To</p>
                    <p className="font-semibold">{sapPo?.supplierName ?? 'MERIDIAN AEROSYSTEMS SAS'}</p>
                    <p className="text-slate-500">Supplier Code: {sapPo?.supplierCode ?? 'T70710'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Ship To / Plant</p>
                    <p className="font-semibold">{ext?.plantDescription ?? 'Gennevilliers'}</p>
                    <p className="text-slate-500">Plant {ext?.plant ?? '3158'}</p>
                  </div>
                </div>
                <div className="rounded-md bg-amber-50 border border-amber-300 px-4 py-2.5">
                  <p className="text-[11px] font-bold text-amber-800">⚠ AMENDMENT NOTICE</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">This document supersedes the original PO dated 26 Mar 2026.</p>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Item</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Material</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-right">Orig. Qty</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-right font-bold text-amber-700">Amd. Qty</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Tax</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-2 py-1.5">{sapPo?.lineItems[0]?.itemNumber ?? '0010'}</td>
                      <td className="border border-slate-300 px-2 py-1.5">{sapPo?.lineItems[0]?.description ?? ext?.materialDescription ?? 'N/A'}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right text-slate-400 line-through">{(ext?.quantity ?? 8000).toLocaleString("en-US")} {ext?.unit ?? 'EA'}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-bold text-amber-700">{parseFloat(exception?.type === 'post-po-amendment' ? (exception.amendments?.find((a: any) => a.field === 'quantity')?.requestedValue?.replace(/[^0-9.]/g, '') ?? '9987') : String(ext?.quantity ?? 9987)).toLocaleString("en-US")} {ext?.unit ?? 'EA'}</td>
                      <td className="border border-slate-300 px-2 py-1.5 font-medium text-amber-700">U1 (Svc)</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-bold">€{(exception?.type === 'post-po-amendment' ? exception.amendedTotalValue : sapPo?.totalValue ?? 29961).toLocaleString("en-US")}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="border border-slate-300 px-2 py-1.5 text-right font-bold">Amended Total</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-extrabold text-[#084A90]">€{(exception?.type === 'post-po-amendment' ? exception.amendedTotalValue : sapPo?.totalValue ?? 29961).toLocaleString("en-US")}</td>
                    </tr>
                  </tfoot>
                </table>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Payment Terms</span><span className="font-medium">NET 30</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Incoterms</span><span className="font-medium">DDP — Réau</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Validity</span><span className="font-medium">26 Mar – 31 Mar 2026</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Purchasing Org</span><span className="font-medium">BC-PO-001</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Approved By</span><span className="font-medium">Ashok Kumar (Checker)</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">SAP Status</span><span className="font-medium text-amber-700">Amended</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Amendment Approval ── */}
            {isApproval && !isAmendedPO && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-center gap-3 rounded-md bg-green-50 border border-green-200 px-4 py-3">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-800">Amendment Approved</p>
                    <p className="text-green-700 mt-0.5">PO {refNumber} — Amendment Request dated 26 Mar 2026</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Field</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Original</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Amended</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">PO Quantity</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-slate-500">{(sapPo?.lineItems[0]?.quantity ?? 8000).toLocaleString("en-US")} {sapPo?.lineItems[0]?.unit ?? 'EA'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-[#084A90]">{parseFloat(exception?.type === 'post-po-amendment' ? (exception.amendments?.find((a: any) => a.field === 'quantity')?.requestedValue?.replace(/[^0-9.]/g, '') ?? '9987') : String(ext?.quantity ?? 9987)).toLocaleString("en-US")} {ext?.unit ?? 'EA'}</td>
                      <td className="border border-slate-300 px-3 py-1.5"><span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Approved</span></td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">Tax Code</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-slate-500">VG (Standard)</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-[#084A90]">U1 (Services)</td>
                      <td className="border border-slate-300 px-3 py-1.5"><span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Approved</span></td>
                    </tr>
                  </tbody>
                </table>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Approval Details</p>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Approved By</span><span className="font-medium">Ashok Kumar</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Role</span><span className="font-medium">Checker QC</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Date</span><span className="font-medium">{today}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Reference</span><span className="font-medium">SAF-INC-2026-08840</span></div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Value Impact</p>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Original Value</span><span className="font-medium">€{(exception?.type === 'post-po-amendment' ? exception.originalTotalValue : sapPo?.totalValue ?? 24000).toLocaleString("en-US")}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Amended Value</span><span className="font-bold text-[#084A90]">€{(exception?.type === 'post-po-amendment' ? exception.amendedTotalValue : 29961).toLocaleString("en-US")}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Delta</span><span className="font-bold text-amber-600">+€{(exception?.type === 'post-po-amendment' ? (exception.amendedTotalValue - exception.originalTotalValue) : 4320).toLocaleString("en-US")}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PO Confirmation ── */}
            {isConfirmation && !isAmendedPO && !isApproval && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-center gap-3 rounded-md bg-green-50 border border-green-200 px-4 py-3">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-800">PO {sapPo?.poNumber ?? refNumber} Released in SAP</p>
                    <p className="text-green-700 mt-0.5">Active · Supplier notified · Delivery schedule confirmed</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Supplier</p>
                    <p className="font-semibold">{sapPo?.supplierName ?? 'MERIDIAN AEROSYSTEMS SAS'}</p>
                    <p className="text-slate-500">Code: {sapPo?.supplierCode ?? 'SUP-TKR-007'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Ship To / Plant</p>
                    <p className="font-semibold">{ext?.plantDescription ?? 'Réau – Villaroche'}</p>
                    <p className="text-slate-500">Plant {ext?.plant ?? '3158'}</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Item</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Material</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-right">Qty</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-left">Tax</th>
                      <th className="border border-slate-300 px-2 py-1.5 text-right">Value (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sapPo?.lineItems ?? [{ itemNumber: '10', description: 'N/A', quantity: 0, unit: 'EA', taxCode: 'VG', totalPrice: 0 }]).map((li: any) => (
                      <tr key={li.itemNumber}>
                        <td className="border border-slate-300 px-2 py-1.5">{li.itemNumber}</td>
                        <td className="border border-slate-300 px-2 py-1.5">{li.description}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-right">{li.quantity.toLocaleString("en-US")} {li.unit}</td>
                        <td className="border border-slate-300 px-2 py-1.5">{li.taxCode}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-right font-bold">€{li.totalPrice.toLocaleString("en-US")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50">
                      <td colSpan={4} className="border border-slate-300 px-2 py-1.5 text-right font-bold">Total PO Value</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-extrabold text-[#084A90]">€{(sapPo?.totalValue ?? 0).toLocaleString("en-US")}</td>
                    </tr>
                  </tfoot>
                </table>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Payment Terms</span><span className="font-medium">{sapPo?.paymentTerms ?? 'AP02'}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Incoterms</span><span className="font-medium">{sapPo?.incoterms ?? 'FH'} ({sapPo?.incotermsLocation ?? 'Free House'})</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Validity</span><span className="font-medium">{sapPo?.validityStart ?? ''} – {sapPo?.validityEnd ?? ''}</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Approved By</span><span className="font-medium">Checker</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-24">Released On</span><span className="font-medium">{today}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">SAP Status</span><span className="font-medium text-green-700">Released</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Delivery Terms ── */}
            {isDelivery && (
              <div className="space-y-4 text-[11px]">
                <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-2.5">
                  <p className="font-bold text-blue-800">Delivery Terms &amp; Conditions — PO {refNumber}</p>
                  <p className="text-blue-700 mt-0.5">Binding delivery schedule as agreed during RFX negotiation phase.</p>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Parameter</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Delivery Mode', 'DDP — Door Delivery'],
                      ['Delivery Location', 'Plant, Gennevilliers, Réau'],
                      ['Lead Time', '15 working days from PO date'],
                      ['Partial Shipments', 'Not permitted'],
                      ['Packing Standard', 'As per BC-PKG-2026 spec'],
                      ['Inspection', 'Incoming QC by Stores'],
                      ['Penalty Clause', '0.5% per week delay, max 5%'],
                      ['Warranty', '12 months from delivery date'],
                    ].map(([param, val]) => (
                      <tr key={param}>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-700">{param}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-400 text-center">Supplier must acknowledge receipt within 48 hours of PO issue.</p>
              </div>
            )}

            {/* ── Budget Analysis / Budget Review ── */}
            {isBudgetAnalysis && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-800">Budget Exceeded — PO {sapPo?.poNumber ?? refNumber}</p>
                    <p className="text-red-700 mt-0.5">{exception?.type === 'checker-budget-issue' ? (exception as any).reason : 'PO total value exceeds allocated SIO budget.'}</p>
                  </div>
                </div>
                {exception?.type === 'checker-budget-issue' && (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="border border-slate-300 px-3 py-1.5 text-left">Parameter</th>
                        <th className="border border-slate-300 px-3 py-1.5 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['SIO Code', (exception as any).sioCode],
                        ['Allocated Budget', `${((exception as any).allocatedBudget ?? 0).toLocaleString("en-US")}`],
                        ['PO Total Value', `${((exception as any).poValue ?? 0).toLocaleString("en-US")}`],
                        ['Shortfall', `${((exception as any).shortfall ?? 0).toLocaleString("en-US")}`],
                        ['Material', ext?.materialDescription ?? 'N/A'],
                        ['Quantity', `${sapPo?.lineItems[0]?.quantity ?? 0} ${sapPo?.lineItems[0]?.unit ?? 'EA'}`],
                        ['Unit Price', `${(sapPo?.lineItems[0]?.pricePerUnit ?? 0).toLocaleString("en-US")}`],
                        ['Tax Code', sapPo?.lineItems[0]?.taxCode ?? 'V0'],
                      ].map(([param, val]) => (
                        <tr key={param}>
                          <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-700">{param}</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-right text-slate-600">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── QC Review Report ── */}
            {isQcReview && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-start gap-3 rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
                  <CheckCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-800">QC Review — PO {sapPo?.poNumber ?? refNumber}</p>
                    <p className="text-blue-700 mt-0.5">Checker quality review completed for Purchase Order release.</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Check</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Expected</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Actual</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Supplier Code', sapPo?.supplierCode ?? 'V44200', sapPo?.supplierCode ?? 'V44200', true],
                      ['Material Number', ext?.materialNumber ?? '889000088100', ext?.materialNumber ?? '889000088100', true],
                      ['Quantity', `${sapPo?.lineItems[0]?.quantity ?? 300} ${sapPo?.lineItems[0]?.unit ?? 'EA'}`, `${sapPo?.lineItems[0]?.quantity ?? 300} ${sapPo?.lineItems[0]?.unit ?? 'EA'}`, true],
                      ['Unit Price', `€${(sapPo?.lineItems[0]?.pricePerUnit ?? 0).toLocaleString("en-US")}`, `€${(sapPo?.lineItems[0]?.pricePerUnit ?? 0).toLocaleString("en-US")}`, true],
                      ['Tax Code', sapPo?.lineItems[0]?.taxCode ?? 'VG', sapPo?.lineItems[0]?.taxCode ?? 'VG', true],
                      ['Payment Terms', sapPo?.paymentTerms ?? 'AP02', sapPo?.paymentTerms ?? 'AP02', true],
                    ].map(([check, expected, actual, pass]) => (
                      <tr key={check as string}>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium">{check}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{expected}</td>
                        <td className="border border-slate-300 px-3 py-1.5">{actual}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{pass ? 'Pass' : 'Fail'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2.5 space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Reviewer</p>
                  <div className="flex gap-2"><span className="text-slate-500 w-24">Reviewed By</span><span className="font-medium">Checker — P&SC QC</span></div>
                  <div className="flex gap-2"><span className="text-slate-500 w-24">Date</span><span className="font-medium">{today}</span></div>
                  <div className="flex gap-2"><span className="text-slate-500 w-24">Result</span><span className="font-bold text-green-700">Approved for Release</span></div>
                </div>
              </div>
            )}

            {/* ── Error Report ── */}
            {isErrorReport && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-800">Data Error Report — PO {sapPo?.poNumber ?? refNumber}</p>
                    <p className="text-red-700 mt-0.5">The following data issue(s) were identified during QC review.</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Field</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">PO Value</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Correct Value</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">Supplier Code</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-red-600 font-medium line-through">V44020</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-green-700 font-bold">{sapPo?.supplierCode ?? 'V44200'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-center"><span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">High</span></td>
                    </tr>
                  </tbody>
                </table>
                <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-2.5">
                  <p className="text-[10px] font-bold uppercase text-amber-700">Action Required</p>
                  <p className="text-amber-800 mt-1">Maker must correct the affected field(s) in the PO and resubmit for Checker release.</p>
                </div>
              </div>
            )}

            {/* ── Validation Report ── */}
            {isValidation && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-center gap-3 rounded-md bg-green-50 border border-green-200 px-4 py-3">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-800">Field Validation Complete — PO {sapPo?.poNumber ?? refNumber}</p>
                    <p className="text-green-700 mt-0.5">All required fields validated. PO ready for Checker QC.</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Validation</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Value</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['PO Number', sapPo?.poNumber ?? refNumber],
                      ['Supplier', `${sapPo?.supplierName ?? 'N/A'} (${sapPo?.supplierCode ?? 'N/A'})`],
                      ['Material', ext?.materialDescription ?? 'N/A'],
                      ['Quantity', `${sapPo?.lineItems[0]?.quantity ?? 0} ${sapPo?.lineItems[0]?.unit ?? 'EA'}`],
                      ['Total Value', `€${(sapPo?.totalValue ?? 0).toLocaleString("en-US")}`],
                      ['RFX Rate Match', 'Matches negotiated rate'],
                      ['Vendor Master', 'Active in SAP'],
                      ['Budget Check', 'Within SIO allocation'],
                    ].map(([field, value]) => (
                      <tr key={field}>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium">{field}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{value}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center"><span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Pass</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2.5 text-center">
                  <p className="font-semibold text-green-700">8/8 Validations Passed · PO cleared for Checker review</p>
                </div>
              </div>
            )}

            {/* ── Corrected PO ── */}
            {isCorrectedPO && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-center gap-3 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
                  <CheckCircle size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-800">Corrected PO — {sapPo?.poNumber ?? refNumber}</p>
                    <p className="text-amber-700 mt-0.5">Data issue(s) have been corrected. PO resubmitted for Checker release.</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Field</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Before</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">After (Corrected)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5 font-medium">Supplier Code</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-red-500 line-through">V44020</td>
                      <td className="border border-slate-300 px-3 py-1.5 font-bold text-green-700">{sapPo?.supplierCode ?? 'V44200'}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-slate-500 w-28">PO Number</span><span className="font-medium">{sapPo?.poNumber ?? refNumber}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Supplier</span><span className="font-medium">{sapPo?.supplierName ?? 'N/A'}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Total Value</span><span className="font-medium">€{(sapPo?.totalValue ?? 0).toLocaleString("en-US")}</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Corrected By</span><span className="font-medium">Maker</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Date</span><span className="font-medium">{today}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Status</span><span className="font-medium text-amber-700">Resubmitted</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Supplier Quote ── */}
            {isQuote && (
              <div className="space-y-4 text-[11px]">
                <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-2.5">
                  <p className="font-bold text-blue-800">Supplier Quotation — RFX {ext?.rfxNumber ?? refNumber}</p>
                  <p className="text-blue-700 mt-0.5">Quotation received for {ext?.materialDescription ?? 'Material'} procurement.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Supplier</p>
                    <p className="font-semibold">{sapPo?.supplierName ?? 'MERIDIAN AEROSYSTEMS SAS'}</p>
                    <p className="text-slate-500">Code: {sapPo?.supplierCode ?? 'T70710'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">RFX Details</p>
                    <p className="font-semibold">RFX-{ext?.rfxNumber ?? refNumber}</p>
                    <p className="text-slate-500">{ext?.materialDescription ?? 'N/A'}</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Item</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-right">Qty</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-right">Basic Rate</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-right">Negotiated Rate</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-right">Net Landed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-3 py-1.5">{ext?.materialDescription ?? 'N/A'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right">{ext?.quantity ?? 0} {ext?.unit ?? 'EA'}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right">€{(matchedTicket?.supplierQuotes?.find(s => s.selected)?.basicRate ?? 0).toLocaleString("en-US")}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-bold text-green-700">€{(matchedTicket?.supplierQuotes?.find(s => s.selected)?.negotiatedRate ?? 0).toLocaleString("en-US")}</td>
                      <td className="border border-slate-300 px-3 py-1.5 text-right font-bold">€{(matchedTicket?.supplierQuotes?.find(s => s.selected)?.netLandedRate ?? 0).toLocaleString("en-US")}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2.5 space-y-1">
                  <div className="flex gap-2"><span className="text-slate-500 w-28">Validity</span><span className="font-medium">30 days from quotation date</span></div>
                  <div className="flex gap-2"><span className="text-slate-500 w-28">Payment Terms</span><span className="font-medium">{sapPo?.paymentTerms ?? 'AP02'}</span></div>
                  <div className="flex gap-2"><span className="text-slate-500 w-28">Delivery</span><span className="font-medium">{matchedTicket?.supplierQuotes?.find(s => s.selected)?.deliveryDays ?? 14} days</span></div>
                </div>
              </div>
            )}

            {/* ── Ops Verification ── */}
            {isOpsVerify && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-center gap-3 rounded-md bg-green-50 border border-green-200 px-4 py-3">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-800">Ops Verification Complete — PO {sapPo?.poNumber ?? refNumber}</p>
                    <p className="text-green-700 mt-0.5">All operational checks passed. Cleared for Checker release.</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Check</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Details</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Budget Code', 'SIO allocation verified against Finance records'],
                      ['Cost Centre', 'Mapped to correct plant cost centre'],
                      ['Vendor Master', 'Active in SAP · Payment block cleared'],
                      ['GR/IR Account', 'Goods receipt / Invoice receipt configured'],
                      ['Tax Determination', 'Tax code matches material category'],
                    ].map(([check, detail]) => (
                      <tr key={check}>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium">{check}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-600">{detail}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-center"><span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Verified</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2.5 space-y-1">
                  <div className="flex gap-2"><span className="text-slate-500 w-24">Verified By</span><span className="font-medium">Ops Team — Nacelle Operations</span></div>
                  <div className="flex gap-2"><span className="text-slate-500 w-24">Date</span><span className="font-medium">{today}</span></div>
                </div>
              </div>
            )}

            {/* ── Amendment Details / Request ── */}
            {isAmendmentDetail && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-start gap-3 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800">Amendment Request — PO {sapPo?.poNumber ?? refNumber}</p>
                    <p className="text-amber-700 mt-0.5">{exception?.type === 'post-po-amendment' ? exception.reason : 'Post-PO amendment requested by requester.'}</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Field</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Original</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(exception?.type === 'post-po-amendment' ? exception.amendments : []).map((a: { label: string; originalValue: string; requestedValue: string }) => (
                      <tr key={a.label}>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium">{a.label}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-slate-500">{a.originalValue}</td>
                        <td className="border border-slate-300 px-3 py-1.5 font-bold text-amber-700">{a.requestedValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Requester</span><span className="font-medium">{exception?.type === 'post-po-amendment' ? exception.requesterName : 'N/A'}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Department</span><span className="font-medium">{ext?.plantDescription ?? 'Nacelle Operations'}</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Request Date</span><span className="font-medium">{today}</span></div>
                    <div className="flex gap-2"><span className="text-slate-500 w-28">Priority</span><span className="font-medium text-amber-700">High</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Revised SIO Budget ── */}
            {isRevisedSIO && (
              <div className="space-y-4 text-[11px]">
                <div className="flex items-center gap-3 rounded-md bg-green-50 border border-green-200 px-4 py-3">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-800">Revised SIO Budget Allocation</p>
                    <p className="text-green-700 mt-0.5">Finance has approved additional budget allocation for PO {sapPo?.poNumber ?? refNumber}.</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="border border-slate-300 px-3 py-1.5 text-left">Parameter</th>
                      <th className="border border-slate-300 px-3 py-1.5 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['SIO Code', (exception as any)?.sioCode ?? 'SIO-2026-PMT'],
                      ['Original Budget', `€${((exception as any)?.allocatedBudget ?? 50000).toLocaleString("en-US")}`],
                      ['Additional Allocation', `€${((exception as any)?.shortfall ?? 5000).toLocaleString("en-US")}`],
                      ['Revised Budget', `€${(((exception as any)?.allocatedBudget ?? 50000) + ((exception as any)?.shortfall ?? 5000)).toLocaleString("en-US")}`],
                      ['PO Value', `€${((exception as any)?.poValue ?? sapPo?.totalValue ?? 0).toLocaleString("en-US")}`],
                    ].map(([param, val]) => (
                      <tr key={param}>
                        <td className="border border-slate-300 px-3 py-1.5 font-medium text-slate-700">{param}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right text-slate-600">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2.5 space-y-1">
                  <div className="flex gap-2"><span className="text-slate-500 w-28">Approved By</span><span className="font-medium">Finance Controller</span></div>
                  <div className="flex gap-2"><span className="text-slate-500 w-28">Date</span><span className="font-medium">{today}</span></div>
                  <div className="flex gap-2"><span className="text-slate-500 w-28">Status</span><span className="font-bold text-green-700">Budget Allocated</span></div>
                </div>
              </div>
            )}

            {/* Stamp */}
            <div className="border-t border-slate-200 pt-4 flex items-end justify-between">
              <div className="text-[10px] text-slate-400 space-y-0.5">
                <p>This is a system-generated document.</p>
                <p>Generated by PO Orchestrator AI — AeroCorp S.A.</p>
              </div>
              <div className="flex flex-col items-center gap-1 opacity-35">
                <Stamp size={28} className="text-[#084A90]" />
                <p className="text-[9px] text-slate-500">Digitally Approved</p>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
