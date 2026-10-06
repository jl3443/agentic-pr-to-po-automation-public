import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
    positive: boolean;
  };
  suffix?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  trend,
  suffix,
}: KpiCardProps) {
  const isPositive = trend ? trend.positive : true;
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-0.5 text-xl font-bold text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {value}
            {suffix && <span className="text-base font-semibold text-slate-500">{suffix}</span>}
          </p>
          {trend && (
            <div className={`mt-1 flex items-center gap-1 ${trendColor}`}>
              {trend.direction === 'up' ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span className="text-[11px] font-medium">{trend.value}</span>
              <span className="text-[10px] text-slate-400">vs last week</span>
            </div>
          )}
        </div>
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${iconBgColor}`}>
          <Icon size={14} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
