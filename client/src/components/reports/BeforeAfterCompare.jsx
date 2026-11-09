import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function BeforeAfterCompare({
  beforeUrl,
  afterUrl,
  createdAt,
  resolvedAt,
  title = 'Hazard Resolution Proof',
}) {
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'tabs'
  const [activeTab, setActiveTab] = useState('after');

  if (!beforeUrl && !afterUrl) return null;

  return (
    <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-sm overflow-hidden space-y-4">
      {/* Header */}
      <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              {title}
            </h3>
            <p className="text-[11px] text-emerald-700">
              Verified Before & After Municipal Repair Evidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-lg border border-emerald-200 text-[11px] font-semibold text-slate-600 sm:flex">
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'side-by-side' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50'
            }`}
          >
            Side by Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tabs')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'tabs' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-50'
            }`}
          >
            Tab View
          </button>
        </div>
      </div>

      <div className="p-5 pt-1">
        {viewMode === 'side-by-side' ? (
          /* Side-by-Side View */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  BEFORE: Citizen Report
                </span>
                {createdAt && (
                  <span className="text-[11px] text-slate-400">
                    {format(new Date(createdAt), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border border-rose-200/60 flex items-center justify-center">
                {beforeUrl ? (
                  <img
                    src={beforeUrl}
                    alt="Before repair"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No original photo</span>
                )}
              </div>
            </div>

            {/* After */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  AFTER: Municipal Resolution
                </span>
                {resolvedAt && (
                  <span className="text-[11px] text-slate-400">
                    {format(new Date(resolvedAt), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm flex items-center justify-center relative">
                {afterUrl ? (
                  <>
                    <img
                      src={afterUrl}
                      alt="After resolution"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Resolved
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">No resolution proof photo</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Tabbed View */
          <div className="space-y-3">
            <div className="flex gap-2 border-b border-slate-100 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('after')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'after'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                After (Resolved)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('before')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'before'
                    ? 'bg-rose-100 text-rose-800'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Before (Initial Hazard)
              </button>
            </div>

            <div className="aspect-video max-h-80 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={activeTab === 'after' ? afterUrl : beforeUrl}
                alt={activeTab}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

