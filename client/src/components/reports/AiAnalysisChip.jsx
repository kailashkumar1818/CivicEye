import React from 'react';
import { Bot, CheckCircle2, AlertTriangle, Loader2, Sparkles, RefreshCw } from 'lucide-react';

export default function AiAnalysisChip({
  loading = false,
  aiResult = null,
  userCategory = '',
  onReanalyze = null,
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs shadow-sm">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        <span className="font-semibold">Analyzing image with AI detection model...</span>
      </div>
    );
  }

  if (!aiResult) return null;

  if (aiResult.ai_status === 'unavailable') {
    return (
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-slate-400" />
          <span>AI service currently unavailable; please manually select the category.</span>
        </div>
        {onReanalyze && (
          <button
            type="button"
            onClick={onReanalyze}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
    );
  }

  const { category, confidence, severity } = aiResult;
  const confPct = Math.round((confidence || 0) * 100);
  const isOverridden = userCategory && category && userCategory !== category;

  const severityColor =
    severity === 'high'
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : severity === 'medium'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>AI Detection Result</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                {confPct}% confidence
              </span>
            </h4>
            <p className="text-[11px] text-slate-600">
              Suggested: <strong className="capitalize">{category?.replace('_', ' ')}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${severityColor}`}>
            {severity} Severity
          </span>
        </div>
      </div>

      {isOverridden ? (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>You selected <strong>{userCategory.replace('_', ' ')}</strong> (manual override flagged for review).</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Category confirmed matching AI detection.</span>
        </div>
      )}
    </div>
  );
}

