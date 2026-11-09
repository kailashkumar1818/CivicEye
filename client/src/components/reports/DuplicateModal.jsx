import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import reportsApi from '../../api/reports';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';
import {
  AlertTriangle,
  ThumbsUp,
  ArrowRight,
  MapPin,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DuplicateModal({
  isOpen,
  duplicates = [],
  onClose,
  onSubmitAnyway,
  submittingAnyway = false,
}) {
  const navigate = useNavigate();
  const [confirmingId, setConfirmingId] = useState(null);

  if (!isOpen || duplicates.length === 0) return null;

  const handleConfirmDuplicate = async (report) => {
    setConfirmingId(report.id);
    try {
      await reportsApi.confirmReport(report.id);
      toast.success(
        `Added your vote to complaint #${report.complaint_no}! Priority boosted.`,
        { icon: '👍' }
      );
      onClose();
      navigate(`/reports/${report.id}`);
    } catch (err) {
      if (err.response?.status === 409 || err.message?.includes('already')) {
        toast('You have already confirmed this issue.', { icon: 'ℹ️' });
        onClose();
        navigate(`/reports/${report.id}`);
      } else {
        toast.error(err.message || 'Failed to confirm report.');
      }
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Similar Problem Already Reported Nearby!
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                We found {duplicates.length} open {duplicates.length === 1 ? 'report' : 'reports'} within 30 meters.
                Help resolve it faster by upvoting rather than creating a duplicate.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicates List */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-slate-100 flex-1">
          {duplicates.map((dup) => {
            const distance = Math.round(Number(dup.distance_meters) || 0);
            const firstImage = dup.images?.[0]?.image_url;

            return (
              <div
                key={dup.id}
                className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={dup.title}
                      className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 text-xs text-center p-2">
                      No Photo
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {dup.complaint_no}
                      </span>
                      <CategoryBadge category={dup.category} />
                      <StatusBadge status={dup.status} />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        ~{distance}m away
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {dup.title}
                    </h4>

                    {(dup.address || dup.area) && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{dup.address || dup.area}</span>
                      </p>
                    )}

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Confirmed by <strong>{dup.confirmation_count || 1}</strong> citizens</span>
                      {dup.priority > 0 && (
                        <span className="text-amber-700 font-medium">Priority score: {dup.priority}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={confirmingId === dup.id}
                    onClick={() => handleConfirmDuplicate(dup)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {confirmingId === dup.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Upvoting...
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-4 h-4" />
                        Same Issue (+1 Vote)
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Is this completely different? You can still proceed to submit a separate complaint.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submittingAnyway}
              onClick={onSubmitAnyway}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {submittingAnyway ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Anyway as New
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

