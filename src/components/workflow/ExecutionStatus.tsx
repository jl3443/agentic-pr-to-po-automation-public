import { motion } from 'framer-motion';
import { CheckCircle, Globe, FileText } from 'lucide-react';
import type { SapPoData } from '@/data/types';

interface TicketUpdationProps {
  sapPo: SapPoData;
  ticketId: string;
}

export function ExecutionStatus({ sapPo, ticketId }: TicketUpdationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Ticket Updation Agent
      </h4>

      {/* Success Card */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={18} className="text-green-600" />
          <h5 className="text-sm font-bold text-green-800">PO Released & Ticket Updated</h5>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <FileText size={14} className="text-green-600" />
            <span className="text-green-700/70 w-28">SAP PO</span>
            <span className="font-mono font-medium text-green-800">{sapPo.poNumber}</span>
            <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Released</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Globe size={14} className="text-green-600" />
            <span className="text-green-700/70 w-28">Portal Ticket</span>
            <span className="font-mono font-medium text-green-800">{ticketId.replace('GDC-INC-2026-', 'INC-')}</span>
            <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Resolved</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle size={14} className="text-green-600" />
            <span className="text-green-700/70 w-28">PO Copy</span>
            <span className="font-medium text-green-800">Attached to portal request</span>
          </div>
        </div>
      </div>

      {/* Completion Summary */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h5 className="text-xs font-semibold text-slate-700 mb-2">Agent Pipeline Complete</h5>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-blue-50 p-2">
            <p className="text-lg font-bold text-blue-700">6/6</p>
            <p className="text-[10px] text-blue-600">Agents Run</p>
          </div>
          <div className="rounded-md bg-green-50 p-2">
            <p className="text-lg font-bold text-green-700">100%</p>
            <p className="text-[10px] text-green-600">Success Rate</p>
          </div>
          <div className="rounded-md bg-slate-50 p-2">
            <p className="text-lg font-bold text-slate-700">4.2 min</p>
            <p className="text-[10px] text-slate-500">Total Time</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
