import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const decisionQualityData = [
  { name: 'AI Accepted', value: 87, color: '#084A90' },
  { name: 'Modified', value: 8, color: '#f59e0b' },
  { name: 'Rejected', value: 5, color: '#dc2626' },
];

const exceptionTypesData = [
  { type: 'Capacity', pct: 40, color: '#dc2626' },
  { type: 'Contract', pct: 25, color: '#f59e0b' },
  { type: 'Lead Time', pct: 20, color: '#084A90' },
  { type: 'Quality', pct: 10, color: '#6366f1' },
  { type: 'Other', pct: 5, color: '#64748b' },
];

const cycleTimeData = [
  { day: 'Mon', hours: 5.0 },
  { day: 'Tue', hours: 4.8 },
  { day: 'Wed', hours: 4.2 },
  { day: 'Thu', hours: 4.0 },
  { day: 'Fri', hours: 3.9 },
  { day: 'Sat', hours: 3.8 },
  { day: 'Sun', hours: 3.8 },
];

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-slate-500 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-slate-800">
          {p.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}

const axisStyle = {
  fontSize: 11,
  fill: '#64748b',
  fontFamily: 'Barlow, system-ui, sans-serif',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardCharts() {
  const total = decisionQualityData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* PO Decision Quality — Donut */}
      <Card>
        <CardHeader>
          <CardTitle>PO Decision Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 200 }} className="relative">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={decisionQualityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {decisionQualityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [`${Math.round((Number(value) / total) * 100)}%`, String(name)]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">87%</p>
                <p className="text-[10px] font-medium text-slate-500">AI Accept</p>
              </div>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {decisionQualityData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] text-slate-600">
                  {entry.name} <span className="font-medium text-slate-800">{entry.value}%</span>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exception Types — Horizontal Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Exception Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart
                data={exceptionTypesData}
                layout="vertical"
                margin={{ left: 10, right: 30, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 50]}
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="type"
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={18}>
                  {exceptionTypesData.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cycle Time Trend — Line */}
      <Card>
        <CardHeader>
          <CardTitle>Cycle Time Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={cycleTimeData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[2, 6]}
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip content={<CustomTooltip suffix="h" />} />
                <ReferenceLine
                  y={4}
                  stroke="#16a34a"
                  strokeDasharray="6 4"
                  label={{
                    value: 'Target 4h',
                    position: 'insideBottomLeft',
                    fill: '#16a34a',
                    fontSize: 10,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#084A90"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#084A90', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#084A90', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
