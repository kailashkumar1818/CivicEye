import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);

  const categories = [
    { label: 'Pothole', color: 'bg-orange-500' },
    { label: 'Garbage Dump', color: 'bg-green-500' },
    { label: 'Broken Streetlight', color: 'bg-yellow-500' },
    { label: 'Damaged Road', color: 'bg-red-500' },
    { label: 'Other', color: 'bg-slate-500' },
  ];

  const statuses = [
    { label: 'Open (Submitted / Review)', border: 'border-blue-500' },
    { label: 'In Progress / Assigned', border: 'border-amber-500' },
    { label: 'Resolved', border: 'border-emerald-500' },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md border border-slate-200 text-xs text-slate-700 max-w-xs transition-all">
      <div
        className="flex items-center justify-between font-bold cursor-pointer select-none text-slate-900"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          Map Legend
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </div>

      {!collapsed && (
        <div className="mt-2.5 space-y-3 pt-2 border-t border-slate-100">
          <div>
            <p className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
              Marker Color (Category)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((c) => (
                <div key={c.label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${c.color} shadow-xs flex-shrink-0`} />
                  <span className="truncate">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider mb-1.5">
              Marker Ring (Status)
            </p>
            <div className="space-y-1">
              {statuses.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full border-2 ${s.border} bg-white flex-shrink-0`} />
                  <span className="truncate">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

