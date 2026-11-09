import React from 'react';

const statusConfig = {
  submitted: {
    label: 'Submitted',
    classes: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-500',
  },
  under_review: {
    label: 'Under Review',
    classes: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
  },
  assigned: {
    label: 'Assigned',
    classes: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    classes: 'bg-gray-100 text-gray-800 border-gray-200',
    dot: 'bg-gray-500',
  };

  const sizeClasses =
    size === 'lg'
      ? 'px-3 py-1 text-sm font-semibold'
      : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.classes} ${sizeClasses} shadow-sm`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
      {config.label}
    </span>
  );
}

