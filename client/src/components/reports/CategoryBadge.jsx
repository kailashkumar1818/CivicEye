import React from 'react';
import { AlertCircle, Trash2, Lightbulb, AlertTriangle, HelpCircle } from 'lucide-react';

const categoryConfig = {
  pothole: {
    label: 'Pothole',
    icon: AlertCircle,
    classes: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  garbage: {
    label: 'Garbage Dump',
    icon: Trash2,
    classes: 'bg-green-50 text-green-800 border-green-200',
  },
  broken_streetlight: {
    label: 'Broken Streetlight',
    icon: Lightbulb,
    classes: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  },
  damaged_road: {
    label: 'Damaged Road',
    icon: AlertTriangle,
    classes: 'bg-red-50 text-red-800 border-red-200',
  },
  other: {
    label: 'Other Issue',
    icon: HelpCircle,
    classes: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

export default function CategoryBadge({ category }) {
  const config = categoryConfig[category] || categoryConfig.other;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-semibold ${config.classes}`}
    >
      <Icon className="w-3.5 h-3.5 mr-1" />
      {config.label}
    </span>
  );
}

