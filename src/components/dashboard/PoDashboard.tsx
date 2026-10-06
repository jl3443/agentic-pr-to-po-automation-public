import { useMemo } from 'react';
import { AiHeroCard } from './AiHeroCard';
import { KpiRow } from './KpiRow';
import { PrQueueTable } from './PrQueueTable';
import { DashboardCharts } from './DashboardCharts';
import { scenarios } from '@/data/scenarios';
import type { DemoScenario, RfxTicket } from '@/data/types';

interface PoDashboardProps {
  scenario: DemoScenario;
  selectedTicketId?: string;
  onSelectTicket: (id: string) => void;
  completedTicketIds?: string[];
  primaryPriority?: string;
}

export function PoDashboard({ scenario, selectedTicketId, onSelectTicket, completedTicketIds, primaryPriority }: PoDashboardProps) {
  // Combine tickets from all scenarios, deduplicate by ID, sort newest first
  const allTickets = useMemo((): RfxTicket[] => {
    const seen = new Set<string>();
    const combined: RfxTicket[] = [];
    // Process in priority order so each ticket ID is claimed by the right scenario type
    const order = ['scenario-2', 'scenario-3', 'scenario-1'];
    for (const id of order) {
      const s = scenarios.find(sc => sc.id === id);
      if (!s) continue;
      for (const t of s.tickets) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          combined.push(t);
        }
      }
    }
    return combined.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  return (
    <div className="space-y-3 p-4">
      <AiHeroCard summary={scenario.aiHeroSummary} chips={scenario.aiHeroChips} />

      <KpiRow stats={scenario.dashboardStats} />

      {/* Visual separator between KPI metrics and operational queue */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      </div>

      <PrQueueTable
        tickets={primaryPriority ? scenario.tickets : allTickets}
        selectedTicketId={selectedTicketId}
        onSelectTicket={onSelectTicket}
        completedTicketIds={completedTicketIds}
        primaryPriority={primaryPriority}
      />

      <DashboardCharts />
    </div>
  );
}
