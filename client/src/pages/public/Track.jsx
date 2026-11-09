import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import reportsApi from '../../api/reports';
import StatusBadge from '../../components/reports/StatusBadge';
import CategoryBadge from '../../components/reports/CategoryBadge';
import Timeline from '../../components/reports/Timeline';
import BeforeAfterCompare from '../../components/reports/BeforeAfterCompare';
import {
  Search,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

const statusSteps = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];

export default function Track() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [complaintNo, setComplaintNo] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchComplaint = async (targetNo) => {
    const formatted = targetNo.trim().toUpperCase();
    if (!formatted) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const data = await reportsApi.trackComplaint(formatted);
      setReport(data);
      setSearchParams({ id: formatted });
    } catch (err) {
      setError(
        err.response?.status === 404
          ? `No complaint found with number "${formatted}". Please verify the complaint ID.`
          : err.message || 'Could not fetch complaint details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchComplaint(initialId);
    }
  }, [initialId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchComplaint(complaintNo);
  };

  // Determine current active step index in standard pipeline
  const currentStepIndex = statusSteps.findIndex((s) => s.key === report?.status);
  const isRejected = report?.status === 'rejected';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header & Search Bar */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Track Complaint Status
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Enter your unique complaint reference number (e.g.,{' '}
          <span className="font-mono font-semibold text-slate-800">CE-2026-000001</span>) to see
          live progress updates and official resolution timeline.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={complaintNo}
              onChange={(e) => setComplaintNo(e.target.value)}
              placeholder="e.g. CE-2026-000001"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !complaintNo.trim()}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Tracking...
              </>
            ) : (
              'Check Status'
            )}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 max-w-2xl mx-auto text-rose-800">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-semibold text-rose-900">Record Not Found</h4>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Report Status Content */}
      {report && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {/* Header Card */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-blue-600 tracking-wider">
                  {report.complaint_no}
                </span>
                <h2 className="text-2xl font-bold text-slate-900">{report.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <CategoryBadge category={report.category} />
                <StatusBadge status={report.status} size="lg" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  Submitted on{' '}
                  {report.created_at
                    ? format(new Date(report.created_at), 'MMMM d, yyyy')
                    : 'Recently'}
                </span>
              </div>
              {(report.address || report.area || report.city) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{report.address || `${report.area || ''}, ${report.city || ''}`}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="p-6 sm:p-8 bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Resolution Progress
            </h3>

            {isRejected ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">This complaint was rejected as invalid or out of jurisdiction.</h4>
                  <p className="text-xs text-rose-700 mt-0.5">Please check the timeline below for official remarks.</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Horizontal progress bar */}
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 -z-0" />
                <div
                  className="hidden sm:block absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 -z-0 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%`,
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                  {statusSteps.map((step, idx) => {
                    const isCompleted = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div
                        key={step.key}
                        className="flex sm:flex-col items-center gap-3 sm:gap-2 text-center"
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md scale-110'
                              : isCompleted
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <div className="text-left sm:text-center">
                          <p
                            className={`text-xs font-semibold ${
                              isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Details & Public Timeline */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left: Photos & Description */}
            <div className="md:col-span-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Complaint Details</h3>
              {report.resolved_image_url ? (
                <BeforeAfterCompare
                  beforeUrl={report.primary_image_url}
                  afterUrl={report.resolved_image_url}
                  createdAt={report.created_at}
                  resolvedAt={report.resolved_at}
                  title="Official Resolution Evidence"
                />
              ) : report.primary_image_url ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                  <img
                    src={report.primary_image_url}
                    alt={report.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              {report.description ? (
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                  {report.description}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">No description provided.</p>
              )}
            </div>

            {/* Right: Public Status History Timeline */}
            <div className="md:col-span-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Official Status History
              </h3>
              <Timeline events={report.timeline} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
