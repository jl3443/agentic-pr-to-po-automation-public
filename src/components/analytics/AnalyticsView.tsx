import { useRef } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import { Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCurrency } from '@/context/CurrencyContext';

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const cycleTimeTrend = (() => {
  const points: { day: string; hours: number }[] = [];
  const base = [
    5.2, 5.1, 5.0, 4.9, 4.8, 4.7, 4.6, 4.5, 4.4, 4.3,
    4.2, 4.2, 4.1, 4.0, 4.0, 3.9, 3.9, 3.8, 3.9, 3.8,
    3.8, 3.7, 3.8, 3.8, 3.7, 3.8, 3.8, 3.8, 3.7, 3.8,
  ];
  base.forEach((h, i) => { points.push({ day: `Mar ${i + 1}`, hours: h }); });
  return points;
})();

const acceptanceData = [
  { week: 'W1', accepted: 82, modified: 10, rejected: 8 },
  { week: 'W2', accepted: 84, modified: 9,  rejected: 7 },
  { week: 'W3', accepted: 85, modified: 9,  rejected: 6 },
  { week: 'W4', accepted: 87, modified: 8,  rejected: 5 },
];

const exceptionTypes = [
  { name: 'Capacity',  value: 40, color: '#dc2626' },
  { name: 'Contract',  value: 25, color: '#f59e0b' },
  { name: 'Lead Time', value: 20, color: '#084A90' },
  { name: 'Quality',   value: 10, color: '#6366f1' },
  { name: 'Other',     value: 5,  color: '#64748b' },
];

// sorted best → worst
const supplierPerf = [
  { name: 'Supplier B', otif: 95 },
  { name: 'Supplier A', otif: 91 },
  { name: 'Supplier C', otif: 88 },
  { name: 'Supplier D', otif: 82 },
];

const costSavingsK = [
  { category: 'Stockout Avoided', amount: 340 },
  { category: 'Bad PO Prevented', amount: 120 },
  { category: 'Expedite Saved',   amount: 45 },
];

// Monthly Volume data
const requestSourceData = [
  { name: 'PR Creation', value: 69, color: '#084A90' },
  { name: 'Amendment-K', value: 11, color: '#f59e0b' },
  { name: 'Others',      value: 20, color: '#64748b' },
];

const toolDistributionData = [
  { name: 'RMS',    value: 97, color: '#084A90' },
  { name: 'SAMPARK', value: 1,  color: '#f59e0b' },
  { name: 'VCMS',   value: 2,  color: '#64748b' },
];

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label, suffix = '' }: {
  active?: boolean; payload?: any[]; label?: string; suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-slate-500 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-slate-800">
          {p.name ? `${p.name}: ` : ''}{p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

const axisStyle = { fontSize: 11, fill: '#64748b', fontFamily: 'Barlow, system-ui, sans-serif' };

function supplierBarColor(index: number, total: number): string {
  if (index === 0) return '#16a34a';
  if (index === total - 1) return '#dc2626';
  return '#084A90';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyticsView() {
  const exceptionTotal = exceptionTypes.reduce((s, d) => s + d.value, 0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { fmt } = useCurrency();

  return (
    <div ref={contentRef} className="space-y-3 p-4">
      {/* Top bar with Export button */}
      <div className="flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
        >
          <Download size={13} />
          Export PDF
        </button>
      </div>

      {/* Monthly Volume Row */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Request Source Pie */}
        <Card>
          <CardHeader><CardTitle>Request Source</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 170 }} className="relative">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={requestSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {requestSourceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [`${value}%`, String(name)]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Source</p>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {requestSourceData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-[11px] text-slate-600">
                    {entry.name} <span className="font-medium text-slate-800">{entry.value}%</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tool Distribution Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Tool Distribution</CardTitle>
            <p className="text-[11px] text-slate-400 mt-0.5">Total: 1,68,001 PO/SA</p>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 170 }}>
              <ResponsiveContainer>
                <BarChart data={toolDistributionData} layout="vertical" margin={{ left: 10, right: 40, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [`${value}%`, String(name)]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {toolDistributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Direct vs Indirect Table */}
        <Card>
          <CardHeader>
            <CardTitle>Direct vs Indirect</CardTitle>
            <p className="text-[11px] text-slate-400 mt-0.5">FY25 Actual Data</p>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-2 text-left text-[11px] font-medium text-slate-500"></th>
                  <th className="pb-2 text-right text-[11px] font-medium text-slate-500">Requests</th>
                  <th className="pb-2 text-right text-[11px] font-medium text-slate-500">PO/SA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td className="py-3 text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#084A90]" />
                    Direct
                  </td>
                  <td className="py-3 text-right text-sm font-bold text-slate-800">8,538</td>
                  <td className="py-3 text-right text-sm font-bold text-slate-800">1,19,314</td>
                </tr>
                <tr>
                  <td className="py-3 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                      Indirect
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm font-bold text-slate-800">9,356</td>
                  <td className="py-3 text-right text-sm font-bold text-slate-800">16,670</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="pt-3 text-xs font-semibold text-slate-500">Total</td>
                  <td className="pt-3 text-right text-sm font-bold text-slate-900">17,894</td>
                  <td className="pt-3 text-right text-sm font-bold text-slate-900">1,35,984</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* PR→PO Cycle Time */}
        <Card>
          <CardHeader><CardTitle>PR→PO Cycle Time (30 Days)</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={cycleTimeTrend} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="ctGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#084A90" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#084A90" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} interval={4} />
                  <YAxis domain={[2, 6]} tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                  <Tooltip content={<CustomTooltip suffix="h" />} />
                  <ReferenceLine y={4} stroke="#16a34a" strokeDasharray="6 4"
                    label={{ value: 'Target 4h', position: 'insideBottomLeft', fill: '#16a34a', fontSize: 10 }} />
                  <Area type="monotone" dataKey="hours" stroke="#084A90" strokeWidth={2}
                    fill="url(#ctGradient)" dot={false} activeDot={{ r: 4, fill: '#084A90', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Acceptance Rate */}
        <Card>
          <CardHeader><CardTitle>AI Acceptance Rate</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={acceptanceData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Bar dataKey="accepted" stackId="a" fill="#084A90" radius={[0,0,0,0]} barSize={32} name="Accepted" />
                  <Bar dataKey="modified"  stackId="a" fill="#f59e0b" radius={[0,0,0,0]} barSize={32} name="Modified" />
                  <Bar dataKey="rejected"  stackId="a" fill="#dc2626" radius={[4,4,0,0]} barSize={32} name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex justify-center gap-4">
              {[{ label: 'Accepted', color: '#084A90' }, { label: 'Modified', color: '#f59e0b' }, { label: 'Rejected', color: '#dc2626' }].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* Exception Types — Donut (fixed overlap) */}
        <Card>
          <CardHeader><CardTitle>Exception Types</CardTitle></CardHeader>
          <CardContent>
            {/* Reduced height so chart + legend fit comfortably */}
            <div style={{ width: '100%', height: 190 }} className="relative">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={exceptionTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {exceptionTypes.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      `${Math.round((Number(value) / exceptionTotal) * 100)}%`,
                      String(name),
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text — small to avoid overlap */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">Types</p>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {exceptionTypes.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-[11px] text-slate-600">
                    {entry.name} <span className="font-medium text-slate-800">{Math.round((entry.value / exceptionTotal) * 100)}%</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Performance — best=green, worst=red */}
        <Card>
          <CardHeader><CardTitle>Supplier Performance</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={supplierPerf} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" domain={[70, 100]} tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={75} />
                  <Tooltip content={<CustomTooltip suffix="% OTIF" />} />
                  <Bar dataKey="otif" radius={[0, 4, 4, 0]} barSize={20}>
                    {supplierPerf.map((_, index) => (
                      <Cell key={index} fill={supplierBarColor(index, supplierPerf.length)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex justify-center gap-4">
              {[{ label: 'Best', color: '#16a34a' }, { label: 'Average', color: '#084A90' }, { label: 'Worst', color: '#dc2626' }].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Savings */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Savings (€K)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={costSavingsK} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="category" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `€${v}K`}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [
                      `€${fmt(Number(value) * 1000)}`,
                      'Savings',
                    ]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
