// Chart color palette aligned with the app's design system
export const chartColors = {
  primary: '#084A90',
  secondary: '#3b82f6',
  tertiary: '#06b6d4',
  quaternary: '#8b5cf6',
  quinary: '#f97316',

  critical: '#b91c1c',
  high: '#ea580c',
  medium: '#d97706',
  low: '#64748b',

  funnel: ['#084A90', '#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd'],
  aging: ['#16a34a', '#eab308', '#f97316', '#ea580c', '#b91c1c'],
};

// Shared dark tooltip style for all Recharts tooltips
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '12px',
    fontFamily: 'Barlow, system-ui, sans-serif',
    padding: '8px 12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  },
  itemStyle: { color: '#cbd5e1', fontSize: '11px' },
  labelStyle: { color: '#f8fafc', fontWeight: 600 as const, marginBottom: '4px' },
};

// Shared axis tick style
export const axisStyle = {
  fontSize: 11,
  fontFamily: 'Barlow, system-ui, sans-serif',
  fill: '#64748b',
};
