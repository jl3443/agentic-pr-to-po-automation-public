import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import type { RfxTicket, RfxStatus } from '@/data/types';

interface PrQueueTableProps {
  tickets: RfxTicket[];
  selectedTicketId?: string;
  onSelectTicket: (id: string) => void;
  primaryPriority?: string;
  completedTicketIds?: string[];
}

const priorityConfig: Record<string, { label: string; dot: string; text: string }> = {
  critical: { label: 'Exception', dot: 'bg-red-500',    text: 'text-red-700' },
  high:     { label: 'Amendment', dot: 'bg-amber-500',  text: 'text-amber-700' },
  medium:   { label: 'Standard',  dot: 'bg-blue-500',   text: 'text-blue-700' },
  low:      { label: 'Completed', dot: 'bg-green-500',  text: 'text-green-700' },
};

const agentStageLabels: Record<number, string> = {
  0: 'Extracting',
  1: 'Identifying',
  2: 'Validating',
  3: 'Creating PO',
  4: 'Checker QC',
  5: 'Updating',
};

function getStatusDisplay(ticket: RfxTicket) {
  const s = ticket.status;
  if (s === 'hold')       return { label: 'On Hold',    color: 'text-red-600' };
  if (s === 'completed')  return { label: 'Completed',  color: 'text-green-600' };
  if (s === 'released')   return { label: 'Released',   color: 'text-green-600' };
  if (s === 'pending-qc') return { label: 'Pending QC', color: 'text-blue-600' };
  if (s === 'po-created') return { label: 'PO Created', color: 'text-blue-600' };
  if (s === 'rejected')   return { label: 'Rejected',   color: 'text-red-600' };
  const stage = agentStageLabels[ticket.workflowStage] ?? 'Processing';
  return { label: stage, color: 'text-amber-600' };
}

// ---------------------------------------------------------------------------
// Fake placeholder rows (non-clickable) per priority type
// ---------------------------------------------------------------------------

interface FakeRow {
  id: string;
  material: string;
  materialNum: string;
  supplier: string;
  value: number;
  statusLabel: string;
  statusColor: string;
}

const fakeRowsMap: Record<string, FakeRow[]> = {
  critical: [
    { id: 'INC-08836', material: 'HYDRAULIC SEAL KIT AS568-50', materialNum: '889000088210', supplier: 'RHONE HYDRAULICS SAS', value: 18420, statusLabel: 'On Hold', statusColor: 'text-red-600' },
    { id: 'INC-08837', material: 'MAINSHAFT BEARING CFM56-3', materialNum: '889000088315', supplier: 'SKF Aerospace', value: 32100, statusLabel: 'Validating', statusColor: 'text-amber-600' },
    { id: 'INC-08838', material: 'FUEL PUMP COUPLING M88', materialNum: '889000088420', supplier: 'Liebherr-Aerospace', value: 76800, statusLabel: 'On Hold', statusColor: 'text-red-600' },
    { id: 'INC-08839', material: 'BLEED PRESSURE VALVE 3/4"', materialNum: '889000088531', supplier: 'Meggitt Aero', value: 9870, statusLabel: 'On Hold', statusColor: 'text-red-600' },
    { id: 'INC-08835', material: 'OIL SEAL 40×55 FKM AERO', materialNum: '889000088192', supplier: 'Freudenberg Aero', value: 6250, statusLabel: 'On Hold', statusColor: 'text-red-600' },
    { id: 'INC-08840', material: 'BLEED CONTROL SOLENOID 28V', materialNum: '889000088617', supplier: 'Eaton Aerospace', value: 41300, statusLabel: 'Extracting', statusColor: 'text-amber-600' },
    { id: 'INC-08834', material: 'PROXIMITY SENSOR APU 10A', materialNum: '889000088085', supplier: 'Crane Aerospace', value: 14700, statusLabel: 'On Hold', statusColor: 'text-red-600' },
    { id: 'INC-08833', material: 'RESOLVER DISK 500 PPR', materialNum: '889000087972', supplier: 'Moog Aero', value: 58900, statusLabel: 'Validating', statusColor: 'text-amber-600' },
  ],
  high: [
    { id: 'INC-08841', material: 'ACTUATOR REPAIR KIT V80', materialNum: '889000089101', supplier: 'MERIDIAN AEROSYSTEMS SAS', value: 28350, statusLabel: 'Pending QC', statusColor: 'text-blue-600' },
    { id: 'INC-08842', material: 'BLEED VALVE BODY 1"', materialNum: '889000089215', supplier: 'Honeywell Aero', value: 15200, statusLabel: 'PO Created', statusColor: 'text-blue-600' },
    { id: 'INC-08843', material: 'NACELLE GASKET SET CL2', materialNum: '889000089320', supplier: 'Trelleborg Aero', value: 8900, statusLabel: 'Released', statusColor: 'text-green-600' },
    { id: 'INC-08844', material: 'THRUST REVERSER ARM CL3', materialNum: '889000089430', supplier: 'Collins Aerospace', value: 44750, statusLabel: 'Pending QC', statusColor: 'text-blue-600' },
    { id: 'INC-08845', material: 'FUEL PUMP IMPELLER 65mm', materialNum: '889000089542', supplier: 'Woodward Aero', value: 33600, statusLabel: 'Pending QC', statusColor: 'text-blue-600' },
    { id: 'INC-08846', material: 'SEAL RING KIT AS3209', materialNum: '889000089657', supplier: 'Freudenberg Aero', value: 7400, statusLabel: 'PO Created', statusColor: 'text-blue-600' },
    { id: 'INC-08847', material: 'ACCESSORY GEARBOX COUPLING', materialNum: '889000089763', supplier: 'GKN Aerospace', value: 19800, statusLabel: 'Pending QC', statusColor: 'text-blue-600' },
    { id: 'INC-08848', material: 'HYDRAULIC FILTER HF3551', materialNum: '889000089871', supplier: 'Pall Aerospace', value: 11250, statusLabel: 'PO Created', statusColor: 'text-blue-600' },
  ],
  medium: [
    { id: 'INC-08822', material: 'TITANIUM BOLT M8X25 NAS', materialNum: '889000087510', supplier: 'AERONORM FASTENERS SAS', value: 1240, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08823', material: 'WASHER FLAT M10 INCONEL', materialNum: '889000087625', supplier: 'PROVENCE AERO COMPONENTS SAS', value: 680, statusLabel: 'Released', statusColor: 'text-green-600' },
    { id: 'INC-08824', material: 'LOCK WASHER M6 NAS1149', materialNum: '889000087730', supplier: 'AERONORM FASTENERS SAS', value: 450, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08825', material: 'SET SCREW M5X8 A286', materialNum: '889000087845', supplier: 'PROVENCE AERO COMPONENTS SAS', value: 320, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08826', material: 'LOCKNUT M10 MS21042', materialNum: '889000087960', supplier: 'AERONORM FASTENERS SAS', value: 290, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08827', material: 'HELICOIL INSERT M8 NAS1130', materialNum: '889000088075', supplier: 'Bollhoff Aero', value: 510, statusLabel: 'Released', statusColor: 'text-green-600' },
    { id: 'INC-08828', material: 'DOWEL PIN 6×20 NAS561', materialNum: '889000088183', supplier: 'PROVENCE AERO COMPONENTS SAS', value: 380, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08829', material: 'GRUB SCREW M6×12 A286', materialNum: '889000088291', supplier: 'AERONORM FASTENERS SAS', value: 175, statusLabel: 'Completed', statusColor: 'text-green-600' },
  ],
  low: [
    { id: 'INC-08816', material: 'RIVET MONEL 4mm NAS1097', materialNum: '889000087955', supplier: 'Cherry Aerospace', value: 280, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08817', material: 'LACING CORD 200mm AERO', materialNum: '889000088060', supplier: 'HellermannTyton Aero', value: 145, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08818', material: 'SEALANT PR-1422 B-2', materialNum: '889000088175', supplier: 'PPG Aerospace', value: 890, statusLabel: 'Released', statusColor: 'text-green-600' },
    { id: 'INC-08819', material: 'WIRE MARKER SLEEVE 25mm', materialNum: '889000088280', supplier: 'TE Connectivity Aero', value: 210, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08815', material: 'SILICONE GASKET 3mm AMS', materialNum: '889000087848', supplier: 'Trelleborg Aero', value: 660, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08814', material: 'PTFE TAPE 12mm AMS', materialNum: '889000087741', supplier: 'Saint-Gobain Aero', value: 95, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08813', material: 'HOOK & LOOP 25mm AERO', materialNum: '889000087634', supplier: 'Velcro Aerospace', value: 125, statusLabel: 'Completed', statusColor: 'text-green-600' },
    { id: 'INC-08812', material: 'CABLE MOUNT ADHESIVE AERO', materialNum: '889000087527', supplier: 'Panduit Aero', value: 78, statusLabel: 'Completed', statusColor: 'text-green-600' },
  ],
};

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const row = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrQueueTable({ tickets, selectedTicketId, onSelectTicket, primaryPriority, completedTicketIds = [] }: PrQueueTableProps) {
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'value' | 'status'>('time');
  const [filter, setFilter] = useState<'all' | 'hold'>('all');
  const [showMore, setShowMore] = useState(false);
  const { fmt, symbol } = useCurrency();

  // Filter to primary priority if set; 'low' = completed tickets
  const effectivePriority = primaryPriority;
  const primaryFiltered = effectivePriority === 'low'
    ? tickets.filter((t) => completedTicketIds.includes(t.id))
    : effectivePriority
    ? tickets.filter((t) => t.priority === effectivePriority)
    : tickets;

  const filtered = filter === 'hold' ? primaryFiltered.filter((t) => t.status === 'hold') : primaryFiltered;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'time') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'priority') {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const holdBonus = (t: RfxTicket) => t.status === 'hold' ? -1 : 0;
      const completedBonus = (t: RfxTicket) => completedTicketIds.includes(t.id) ? 10 : 0;
      return (order[a.priority] + holdBonus(a) + completedBonus(a)) - (order[b.priority] + holdBonus(b) + completedBonus(b));
    }
    if (sortBy === 'value') return b.totalValue - a.totalValue;
    const statusOrder: Record<RfxStatus, number> = {
      hold: 0, new: 1, extracting: 2, identifying: 3, validating: 4,
      'po-creating': 5, 'po-created': 6, 'pending-qc': 7, releasing: 8,
      released: 9, 'updating-ticket': 10, completed: 11, rejected: 12,
    };
    return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
  });

  // Fake rows — all types mixed when no primaryPriority, or just matching type
  const allFakeRows = useMemo(() => {
    if (effectivePriority) {
      return (fakeRowsMap[effectivePriority] ?? []).map(r => ({ ...r, priority: effectivePriority }));
    }
    // Mix all types for combined view
    return [
      ...fakeRowsMap.critical.map(r => ({ ...r, priority: 'critical' as const })),
      ...fakeRowsMap.high.map(r => ({ ...r, priority: 'high' as const })),
      ...fakeRowsMap.medium.map(r => ({ ...r, priority: 'medium' as const })),
    ];
  }, [effectivePriority]);

  const fakeFiltered = filter === 'hold'
    ? allFakeRows.filter((r) => r.statusLabel === 'On Hold')
    : allFakeRows;

  const priorityForFakes = effectivePriority ? (priorityConfig[effectivePriority] ?? priorityConfig.medium) : null;

  // 5-row initial display
  const INITIAL_LIMIT = 5;
  const visibleSorted = showMore ? sorted : sorted.slice(0, INITIAL_LIMIT);
  const fakeSliceCount = showMore ? fakeFiltered.length : Math.max(0, INITIAL_LIMIT - visibleSorted.length);
  const visibleFake = effectivePriority ? fakeFiltered.slice(0, fakeSliceCount) : [];
  const hiddenCount = (sorted.length - visibleSorted.length) + (effectivePriority ? fakeFiltered.length - visibleFake.length : 0);
  const hasMore = hiddenCount > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 mr-1.5">Sort:</span>
          {(['time', 'priority', 'value', 'status'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-medium transition-all capitalize',
                sortBy === s ? 'bg-[#084A90] text-white' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 mr-1.5">Filter:</span>
            {(['all', 'hold'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[11px] font-medium transition-all capitalize',
                  filter === f ? 'bg-[#084A90] text-white' : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                {f === 'hold' ? 'On Hold' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[100px_100px_1fr_90px_90px_140px] gap-2 border-b border-slate-100 px-4 py-2">
        {['Type', 'Ticket ID', 'Material', 'Supplier', 'Value', 'Agent Status'].map((h) => (
          <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {h}
          </span>
        ))}
      </div>

      {/* Real rows */}
      <motion.div variants={container} initial="hidden" animate="show">
        {visibleSorted.map((ticket) => {
          const isCompleted = completedTicketIds.includes(ticket.id);
          const effectivePriority = isCompleted ? 'low' : ticket.priority;
          const priority = priorityConfig[effectivePriority] || priorityConfig.medium;
          const status = isCompleted ? { label: 'Completed', color: 'text-green-600' } : getStatusDisplay(ticket);
          const isSelected = ticket.id === selectedTicketId;

          return (
            <motion.button
              key={ticket.id}
              variants={row}
              onClick={() => onSelectTicket(ticket.id)}
              className={cn(
                'grid w-full grid-cols-[100px_100px_1fr_90px_90px_140px] gap-2 items-center border-b border-slate-50 px-4 py-2.5 text-left transition-all hover:bg-slate-50',
                isSelected && 'border-l-2 border-l-[#084A90] bg-blue-50/50',
                ticket.status === 'hold' && 'bg-red-50/30'
              )}
            >
              {/* Type */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={cn('h-2 w-2 shrink-0 rounded-full', priority.dot)} />
                <span className={cn('text-[11px] font-semibold truncate', priority.text)}>
                  {priority.label}
                </span>
              </div>

              {/* Ticket ID */}
              <span className="font-mono text-[11px] font-medium text-slate-800">
                {ticket.id.replace('SAF-INC-2026-', 'INC-')}
              </span>

              {/* Material */}
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-800">
                  {ticket.extractedData.materialDescription}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {ticket.extractedData.materialNumber} · Plant {ticket.extractedData.plant}
                </p>
              </div>

              {/* Supplier */}
              <span className="truncate text-[11px] text-slate-700">
                {ticket.supplierQuotes.find(s => s.selected)?.supplierName?.split(' ')[0] ?? '—'}
              </span>

              {/* Value */}
              <span className="text-xs font-medium text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {symbol}{fmt(ticket.totalValue)}
              </span>

              {/* Agent Status + Persona Indicator */}
              <div className="flex items-center gap-1.5">
                <span className={cn('text-[11px] font-semibold', status.color)}>
                  {status.label}
                </span>
                {(() => {
                  if (isCompleted || ticket.status === 'released' || ticket.status === 'completed')
                    return <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" title="Completed" />;
                  if (ticket.status === 'rejected')
                    return <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" title="Rejected" />;
                  if (ticket.exception?.type === 'checker-data-issue' || ticket.exception?.type === 'checker-budget-issue')
                    return <div className="h-2 w-2 rounded-full bg-yellow-400 shrink-0" title="Pending at Checker" />;
                  if (ticket.exception?.type === 'rfx-mismatch' || ticket.exception?.type === 'post-po-amendment')
                    return <div className="h-2 w-2 rounded-full bg-orange-500 shrink-0" title="Pending at Maker" />;
                  return null;
                })()}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Fake rows */}
      {visibleFake.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {visibleFake.map((fake) => {
            const fakePri = priorityForFakes ?? (priorityConfig[fake.priority] || priorityConfig.medium);
            return (
              <div
                key={fake.id}
                className="grid w-full grid-cols-[100px_100px_1fr_90px_90px_140px] gap-2 items-center border-b border-slate-50 px-4 py-2.5"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={cn('h-2 w-2 shrink-0 rounded-full', fakePri.dot)} />
                  <span className={cn('text-[11px] font-semibold truncate', fakePri.text)}>{fakePri.label}</span>
                </div>
                <span className="font-mono text-[11px] font-medium text-slate-800">{fake.id}</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-800">{fake.material}</p>
                  <p className="truncate text-[10px] text-slate-500">{fake.materialNum} · Plant 3158</p>
                </div>
                <span className="truncate text-[11px] text-slate-700">{fake.supplier.split(' ')[0]}</span>
                <span className="text-xs font-medium text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {symbol}{fmt(fake.value)}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-[11px] font-semibold', fake.statusColor)}>{fake.statusLabel}</span>
                  <div className={cn('h-2 w-2 rounded-full shrink-0',
                    fake.statusLabel === 'Completed' || fake.statusLabel === 'Released' ? 'bg-green-500' :
                    fake.statusLabel === 'On Hold' ? 'bg-orange-500' :
                    fake.statusLabel === 'Pending QC' ? 'bg-yellow-400' :
                    'bg-orange-500'
                  )} />
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Show More / Show Less */}
      {hasMore && (
        <button
          onClick={() => setShowMore((p) => !p)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          {showMore ? (
            <>Show Less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Show {hiddenCount} More <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
    </div>
  );
}
