import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatLabel = (category) => {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default function ResolutionBar({ data = [], height = 260 }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-slate-400 text-xs">
        No resolution data available yet
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: formatLabel(item.category),
    hours: Number(item.avg_hours) || 0,
    resolvedCount: item.resolved_count,
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
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip
            formatter={(value, name, props) => [
              `${value} hrs (${props.payload.resolvedCount} resolved)`,
              'Avg Resolution Time',
            ]}
            contentStyle={{
              backgroundColor: '#1e293b',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '12px',
              border: 'none',
            }}
          />
          <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

