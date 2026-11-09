import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = {
  submitted: '#64748b',
  under_review: '#3b82f6',
  assigned: '#6366f1',
  in_progress: '#f59e0b',
  resolved: '#10b981',
  rejected: '#f43f5e',
};

const formatLabel = (status) => {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default function StatusBarChart({ data = [], height = 260 }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-slate-400 text-xs">
        No status records available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: formatLabel(item.status),
    count: Number(item.count) || 0,
    rawStatus: item.status,
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
          />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip
            formatter={(value) => [`${value} complaints`, 'Count']}
            contentStyle={{
              backgroundColor: '#1e293b',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '12px',
              border: 'none',
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={`bar-${entry.rawStatus}`}
                fill={STATUS_COLORS[entry.rawStatus] || '#94a3b8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

