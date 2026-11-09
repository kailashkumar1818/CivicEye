import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export default function MapFilterBar({
  category,
  status,
  onCategoryChange,
  onStatusChange,
  onReset,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-slate-700 flex items-center gap-1.5 pr-1">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          Filter:
        </span>

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Categories</option>
          <option value="pothole">Potholes</option>
          <option value="garbage">Garbage Dumps</option>
          <option value="broken_streetlight">Broken Streetlights</option>
          <option value="damaged_road">Damaged Roads</option>
          <option value="other">Other Issues</option>
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {(category || status) && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center text-rose-600 hover:text-rose-700 font-semibold"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset Filters
        </button>
      )}
    </div>
  );
}

