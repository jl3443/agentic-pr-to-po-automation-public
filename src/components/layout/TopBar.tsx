import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, UserCircle, ChevronDown, Mail, Inbox, Send, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewTab, Persona } from '@/data/types';

interface TopBarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  scenarios: { id: string; name: string }[];
  activeScenario: string;
  onScenarioChange: (id: string) => void;
  onAiToggle: () => void;
  aiPanelOpen: boolean;
  activePersona: Persona;
  onPersonaChange: (persona: Persona) => void;
  onCheckerLoginRequest?: () => void;
  inboxUnread?: number;
  completedScenarioIds?: string[];
  onOrderTierSelect?: (level: string) => void;
  activeOrderTier?: string | null;
}

// Scenario priority mapping (base — before completion)
const scenarioPriority: Record<string, { level: string }> = {
  'scenario-2': { level: 'critical' },
  'scenario-3': { level: 'high'     },
  'scenario-1': { level: 'medium'   },
};

const priorityGroups = [
  { level: 'critical', label: 'Exception', dotColor: 'bg-red-500',   activeClass: 'bg-red-50 border-red-200 text-red-700'     },
  { level: 'high',     label: 'Amendment', dotColor: 'bg-amber-500', activeClass: 'bg-amber-50 border-amber-200 text-amber-700' },
  { level: 'medium',   label: 'Standard',  dotColor: 'bg-blue-500',  activeClass: 'bg-blue-50 border-blue-200 text-blue-700'   },
] as const;

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return { open, setOpen, ref };
}

export function TopBar({
  activeTab,
  onTabChange,
  scenarios,
  onScenarioChange,
  onAiToggle,
  aiPanelOpen,
  activePersona,
  onPersonaChange,
  onCheckerLoginRequest,
  inboxUnread = 0,
  completedScenarioIds = [],
  onOrderTierSelect,
  activeOrderTier = null,
}: TopBarProps) {
  const dashboard = useDropdown();
  const orders = useDropdown();
  const email = useDropdown();

  const isDashboardActive = activeTab === 'dashboard' || activeTab === 'analytics';
  const isEmailActive = activeTab === 'inbox' || activeTab === 'sent';

  // Animate badge on unread count change
  const [badgeBounce, setBadgeBounce] = useState(false);
  const prevUnread = useRef(inboxUnread);
  useEffect(() => {
    if (inboxUnread > prevUnread.current) {
      setBadgeBounce(true);
      const timer = setTimeout(() => setBadgeBounce(false), 600);
      return () => clearTimeout(timer);
    }
    prevUnread.current = inboxUnread;
  }, [inboxUnread]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shrink-0">
      {/* Left: Logo */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg text-[#084A90]">✦</span>
          <span className="text-lg font-bold text-[#084A90] tracking-tight">PO Orchestrator</span>
        </div>

        {/* Dashboard dropdown */}
        <div className="relative" ref={dashboard.ref}>
          <button
            onClick={() => { dashboard.setOpen(p => !p); orders.setOpen(false); email.setOpen(false); }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              isDashboardActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            Dashboard
            <ChevronDown size={13} className={cn('transition-transform', dashboard.open && 'rotate-180')} />
          </button>
          {dashboard.open && (
            <div className="absolute left-0 top-full mt-1.5 w-44 rounded-xl border border-slate-200 bg-white shadow-xl z-[100] overflow-hidden">
              <div className="px-2 py-1.5">
                <button
                  onClick={() => { onTabChange('dashboard'); dashboard.setOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                    activeTab === 'dashboard' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  Overview
                </button>
                <button
                  onClick={() => { onTabChange('analytics'); dashboard.setOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                    activeTab === 'analytics' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <BarChart2 size={13} className="text-slate-500" />
                  Analytics
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders dropdown */}
        <div className="relative" ref={orders.ref}>
          <button
            onClick={() => { orders.setOpen(p => !p); dashboard.setOpen(false); email.setOpen(false); }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              !isDashboardActive && !isEmailActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            Orders
            <ChevronDown size={13} className={cn('transition-transform', orders.open && 'rotate-180')} />
          </button>
          {orders.open && (
            <div className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-slate-200 bg-white shadow-xl z-[100] overflow-hidden">
              <div className="px-2 py-1.5 space-y-0.5">
                {/* Exception / Amendment / Standard — always active, never greyed */}
                {priorityGroups.map(group => {
                  const matched = scenarios.find(s =>
                    scenarioPriority[s.id]?.level === group.level
                  );
                  const isActive = activeOrderTier === group.level;
                  return (
                    <button
                      key={group.level}
                      onClick={() => {
                        if (matched) {
                          onOrderTierSelect?.(group.level);
                          onScenarioChange(matched.id);
                          onTabChange('dashboard');
                        }
                        orders.setOpen(false);
                      }}
                      disabled={!matched}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive ? cn('border font-semibold', group.activeClass)
                          : matched ? 'text-slate-700 hover:bg-slate-50'
                          : 'text-slate-300 cursor-default'
                      )}
                    >
                      <div className={cn('h-2 w-2 rounded-full shrink-0', group.dotColor, !matched && 'opacity-30')} />
                      <span className="font-semibold leading-tight">{group.label}</span>
                      {isActive && <div className={cn('ml-auto h-1.5 w-1.5 rounded-full shrink-0', group.dotColor)} />}
                    </button>
                  );
                })}

                {/* Completed — green when populated */}
                {(() => {
                  const first = scenarios.find(s => completedScenarioIds.includes(s.id));
                  const isActive = activeOrderTier === 'low';
                  return (
                    <button
                      key="completed"
                      onClick={() => {
                        if (first) {
                          onOrderTierSelect?.('low');
                          onScenarioChange(first.id);
                          onTabChange('dashboard');
                        }
                        orders.setOpen(false);
                      }}
                      disabled={!first}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive ? 'bg-green-50 border border-green-200 font-semibold text-green-700'
                          : first ? 'text-green-700 hover:bg-green-50'
                          : 'text-slate-300 cursor-default'
                      )}
                    >
                      <div className={cn('h-2 w-2 rounded-full shrink-0', first ? 'bg-green-500' : 'bg-slate-400 opacity-30')} />
                      <span className="font-semibold leading-tight">Completed</span>
                      {first && (
                        <span className="ml-auto text-[10px] font-medium text-green-500">
                          {completedScenarioIds.length}
                        </span>
                      )}
                      {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full shrink-0 bg-green-500" />}
                    </button>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Email dropdown */}
        <div className="relative" ref={email.ref}>
          <button
            onClick={() => { email.setOpen(p => !p); dashboard.setOpen(false); orders.setOpen(false); }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              isEmailActive
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <Mail size={13} />
            Email
            <AnimatePresence>
              {inboxUnread > 0 && (
                <motion.span
                  key="inbox-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: badgeBounce ? [1, 1.4, 1] : 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-[#084A90] text-[9px] font-bold text-white"
                >
                  {inboxUnread}
                </motion.span>
              )}
            </AnimatePresence>
            <ChevronDown size={13} className={cn('transition-transform', email.open && 'rotate-180')} />
          </button>
          {email.open && (
            <div className="absolute left-0 top-full mt-1.5 w-44 rounded-xl border border-slate-200 bg-white shadow-xl z-[100] overflow-hidden">
              <div className="px-2 py-1.5">
                <button
                  onClick={() => { onTabChange('inbox'); email.setOpen(false); }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                    activeTab === 'inbox' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Inbox size={13} className="text-slate-500" />
                    Inbox
                  </div>
                  {inboxUnread > 0 && (
                    <span className="rounded-full bg-[#084A90] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {inboxUnread}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { onTabChange('sent'); email.setOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                    activeTab === 'sent' ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <Send size={13} className="text-slate-500" />
                  Sent
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Persona + AI + Ticket */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
          <button
            onClick={() => onCheckerLoginRequest ? onCheckerLoginRequest() : onPersonaChange('maker')}
            className={cn(
              'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all capitalize',
              activePersona === 'maker'
                ? 'bg-[#084A90] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <UserCircle size={12} />
            Maker
          </button>
          <button
            onClick={() => onCheckerLoginRequest ? onCheckerLoginRequest() : onPersonaChange('checker')}
            className={cn(
              'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all capitalize',
              activePersona === 'checker'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <UserCircle size={12} />
            Checker
          </button>
        </div>

        <button
          onClick={onAiToggle}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
            aiPanelOpen
              ? 'bg-[#084A90] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <Sparkles size={14} />
          AI
        </button>

      </div>
    </header>
  );
}
