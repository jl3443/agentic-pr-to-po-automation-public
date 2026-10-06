import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Minus, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { scenarios } from '@/data/scenarios';
import type { RfxTicket } from '@/data/types';

// Scenario → type metadata
const scenarioMeta: Record<string, {
  type: 'exception' | 'amendment' | 'standard';
  label: string;
  dotColor: string;
  badgeClass: string;
  icon: React.ElementType;
}> = {
  'scenario-2': { type: 'exception', label: 'Exception',  dotColor: 'bg-red-500',   badgeClass: 'bg-red-50 text-red-600 ring-red-200',     icon: AlertTriangle },
  'scenario-3': { type: 'amendment', label: 'Amendment',  dotColor: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-600 ring-amber-200', icon: TrendingUp    },
  'scenario-1': { type: 'standard',  label: 'Standard',   dotColor: 'bg-blue-500',  badgeClass: 'bg-blue-50 text-blue-600 ring-blue-200',    icon: Minus         },
};

const statusLabel: Record<string, string> = {
  new: 'New', extracting: 'Extracting', identifying: 'Identifying',
  validating: 'Validating', hold: 'On Hold', 'po-creating': 'Creating PO',
  'po-created': 'PO Created', 'pending-qc': 'Pending QC', releasing: 'Releasing',
  released: 'Released', 'updating-ticket': 'Updating', completed: 'Completed', rejected: 'Rejected',
};

const statusDot: Record<string, string> = {
  new: 'bg-slate-400', extracting: 'bg-blue-400', identifying: 'bg-indigo-400',
  validating: 'bg-violet-400', hold: 'bg-amber-400', 'po-creating': 'bg-blue-500',
  'po-created': 'bg-green-400', 'pending-qc': 'bg-amber-500', releasing: 'bg-blue-600',
  released: 'bg-green-500', 'updating-ticket': 'bg-teal-400', completed: 'bg-green-600',
  rejected: 'bg-red-500',
};

interface OrderRow {
  ticket: RfxTicket;
  scenarioId: string;
  orderType: 'exception' | 'amendment' | 'standard' | 'completed';
}

interface OrdersViewProps {
  completedScenarioIds: string[];
  activeScenarioId: string;
  onOpenTicket: (scenarioId: string, ticketId: string) => void;
}

export function OrdersView({ completedScenarioIds, activeScenarioId, onOpenTicket }: OrdersViewProps) {
  const rows = useMemo((): OrderRow[] => {
    const seen = new Set<string>();
    const all: OrderRow[] = [];

    // Process scenarios in priority order: exception, amendment, standard
    // so the primary scenario "owns" each ticket ID
    const ordered = ['scenario-2', 'scenario-3', 'scenario-1']
      .map(id => scenarios.find(s => s.id === id))
      .filter(Boolean) as typeof scenarios;

    for (const scenario of ordered) {
      const meta = scenarioMeta[scenario.id];
      const isCompleted = completedScenarioIds.includes(scenario.id);
      for (const ticket of scenario.tickets) {
        if (seen.has(ticket.id)) continue;
        seen.add(ticket.id);
        all.push({
          ticket,
          scenarioId: scenario.id,
          orderType: isCompleted ? 'completed' : (meta?.type ?? 'standard'),
        });
      }
    }
    // Sort chronologically newest first
    return all.sort((a, b) =>
      new Date(b.ticket.createdAt).getTime() - new Date(a.ticket.createdAt).getTime()
    );
  }, [completedScenarioIds]);

  const typeMeta = {
    exception: { label: 'Exception',  dotColor: 'bg-red-500',   badgeClass: 'bg-red-50 text-red-600 ring-1 ring-red-200',        icon: AlertTriangle },
    amendment: { label: 'Amendment',  dotColor: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',   icon: TrendingUp    },
    standard:  { label: 'Standard',   dotColor: 'bg-blue-500',  badgeClass: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',      icon: Minus         },
    completed: { label: 'Completed',  dotColor: 'bg-slate-400', badgeClass: 'bg-slate-50 text-slate-500 ring-1 ring-slate-200',   icon: CheckCircle2  },
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">All Orders</h2>
          <p className="text-sm text-slate-500 mt-0.5">{rows.length} tickets · sorted by date</p>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(typeMeta).map(([key, m]) => (
            <span key={key} className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium', m.badgeClass)}>
              <div className={cn('h-1.5 w-1.5 rounded-full', m.dotColor)} />
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Header row */}
        <div className="grid grid-cols-[140px_130px_1fr_160px_100px_100px_36px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          <span>Type</span>
          <span>Ticket ID</span>
          <span>Material</span>
          <span>Supplier</span>
          <span className="text-right">Value</span>
          <span>Status</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {rows.map((row, i) => {
            const { ticket, scenarioId, orderType } = row;
            const tm = typeMeta[orderType];
            const Icon = tm.icon;
            const isActive = scenarioId === activeScenarioId;
            const shortId = ticket.id.replace('GDC-INC-2026-', 'INC-');
            const supplier = ticket.sapPo?.supplierName ?? ticket.supplierQuotes.find(s => s.selected)?.supplierName ?? '—';
            const shortSupplier = supplier.split(' ').slice(0, 2).join(' ');
            const sDot = statusDot[ticket.status] ?? 'bg-slate-400';
            const sLabel = statusLabel[ticket.status] ?? ticket.status;

            return (
              <motion.button
                key={ticket.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                onClick={() => onOpenTicket(scenarioId, ticket.id)}
                className={cn(
                  'grid grid-cols-[140px_130px_1fr_160px_100px_100px_36px] gap-4 w-full px-5 py-3.5 text-left transition-colors',
                  isActive ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                )}
              >
                {/* Type badge */}
                <span className={cn('inline-flex items-center gap-1.5 self-center rounded-md px-2 py-0.5 text-[11px] font-semibold w-fit', tm.badgeClass)}>
                  <Icon size={10} />
                  {tm.label}
                </span>

                {/* Ticket ID */}
                <span className="self-center font-mono text-xs text-slate-600">{shortId}</span>

                {/* Material */}
                <div className="self-center min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{ticket.extractedData.materialDescription}</p>
                  <p className="text-[11px] text-slate-400 truncate">{ticket.extractedData.materialNumber} · Plant {ticket.extractedData.plant}</p>
                </div>

                {/* Supplier */}
                <span className="self-center text-xs text-slate-600 truncate">{shortSupplier}</span>

                {/* Value */}
                <span className="self-center text-right text-sm font-semibold text-slate-800">
                  ${ticket.totalValue.toLocaleString("en-US")}
                </span>

                {/* Status */}
                <div className="self-center flex items-center gap-1.5">
                  <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', sDot)} />
                  <span className="text-xs text-slate-600">{sLabel}</span>
                </div>

                {/* Arrow */}
                <div className="self-center flex items-center justify-center">
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer date note */}
        <div className="border-t border-slate-100 px-5 py-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock size={11} />
          Sorted by creation date · newest first
        </div>
      </div>
    </div>
  );
}
