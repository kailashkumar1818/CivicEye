import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CATEGORY_COLORS = {
  pothole: '#f97316',
  garbage: '#16a34a',
  broken_streetlight: '#eab308',
  damaged_road: '#dc2626',
  other: '#64748b',
};

const formatLabel = (category) => {
  return category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default function CategoryPie({ data = [], height = 300 }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400 text-xs">
        No category breakdown available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: formatLabel(item.category),
    value: Number(item.count) || 0,
    rawCategory: item.category,
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.rawCategory}`}
                fill={CATEGORY_COLORS[entry.rawCategory] || '#94a3b8'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} reports`, name]}
            contentStyle={{
              backgroundColor: '#1e293b',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '12px',
              border: 'none',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

