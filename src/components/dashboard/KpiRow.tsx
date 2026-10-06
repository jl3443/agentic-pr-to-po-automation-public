import { FileCheck, Clock, Zap, AlertTriangle, ClipboardList, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { DemoScenario } from '@/data/types';

interface KpiRowProps {
  stats: DemoScenario['dashboardStats'];
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Tooltip content per KPI — definition + baseline
const kpiTooltips = {
  activeTickets: {
    title: 'Active Tickets',
    description: 'RFX tickets currently in the agent pipeline across all stages.',
    baseline: 'Daily avg: 15 tickets',
  },
  autoCreatedPO: {
    title: 'Auto-Created POs',
    description: 'Purchase orders created end-to-end by AI agents without manual intervention.',
    baseline: 'Target: 900/month',
  },
  avgPoCreationTime: {
    title: 'Avg PO Creation Time',
    description: 'Average time from ticket intake to PO created in SAP, measured across all completed tickets.',
    baseline: 'Manual baseline: 45 min',
  },
  zeroTouchRate: {
    title: 'Zero-Touch PO Rate',
    description: 'Percentage of POs completed end-to-end without any human intervention — no exceptions, no holds.',
    baseline: 'Industry avg: ~35%',
  },
  exceptionRate: {
    title: 'Exception Rate',
    description: 'Percentage of tickets that triggered a validation hold — mismatch, missing doc, or amendment.',
    baseline: 'Target: below 10%',
  },
};

function KpiTooltip({ tip }: { tip: { title: string; description: string; baseline: string } }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="ml-1 inline-flex items-center text-slate-300 hover:text-slate-500 transition-colors">
          <Info size={10} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="max-w-[220px] bg-slate-900 text-white rounded-lg px-3 py-2.5 shadow-xl border-0"
      >
        <p className="text-[11px] font-semibold mb-1">{tip.title}</p>
        <p className="text-[10px] text-slate-300 leading-relaxed">{tip.description}</p>
        <div className="mt-1.5 pt-1.5 border-t border-slate-700">
          <p className="text-[10px] text-slate-400">{tip.baseline}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function KpiRow({ stats }: KpiRowProps) {
  return (
    <motion.div
      className="grid grid-cols-5 gap-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Card 1: Ticket Overview (merged) */}
      <motion.div variants={item} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Active Tickets
              <KpiTooltip tip={kpiTooltips.activeTickets} />
            </p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">
              {stats.totalTickets}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-0.5 text-amber-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                {stats.inProgress} active
              </span>
              <span className="flex items-center gap-0.5 text-red-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                {stats.onHold} hold
              </span>
              <span className="flex items-center gap-0.5 text-green-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                {stats.completed} done
              </span>
            </div>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <ClipboardList size={14} className="text-blue-600" />
          </div>
        </div>
      </motion.div>

      {/* Card 2: Auto-Created PO */}
      <motion.div variants={item} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Auto-Created PO
              <KpiTooltip tip={kpiTooltips.autoCreatedPO} />
            </p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">
              {stats.autoCreatedPO}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-green-600" />
              <span className="text-[10px] font-medium text-green-600">
                +23 this week
              </span>
            </div>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-green-100">
            <FileCheck size={14} className="text-green-600" />
          </div>
        </div>
      </motion.div>

      {/* Card 3: Avg PO Creation Time */}
      <motion.div variants={item} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Avg PO Creation Time
              <KpiTooltip tip={kpiTooltips.avgPoCreationTime} />
            </p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">
              {stats.avgPoCreationTime}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <TrendingDown size={12} className="text-green-600" />
              <span className="text-[10px] font-medium text-green-600">
                45min vs manual
              </span>
            </div>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <Clock size={14} className="text-blue-600" />
          </div>
        </div>
      </motion.div>

      {/* Card 4: Zero-Touch PO Rate */}
      <motion.div variants={item} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Zero-Touch PO Rate
              <KpiTooltip tip={kpiTooltips.zeroTouchRate} />
            </p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">
              {stats.zeroTouchRate}%
            </p>
            <div className="mt-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-green-600" />
              <span className="text-[10px] font-medium text-green-600">
                +3.2% this month
              </span>
            </div>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-100">
            <Zap size={14} className="text-purple-600" />
          </div>
        </div>
      </motion.div>

      {/* Card 5: Exception Rate */}
      <motion.div variants={item} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Exception Rate
              <KpiTooltip tip={kpiTooltips.exceptionRate} />
            </p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">
              {stats.exceptionRate}%
            </p>
            <div className="mt-1 flex items-center gap-1">
              <TrendingDown size={12} className="text-green-600" />
              <span className="text-[10px] font-medium text-green-600">
                -1.4% this week
              </span>
            </div>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <AlertTriangle size={14} className="text-amber-600" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
