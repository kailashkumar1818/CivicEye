import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import reportsApi from '../../api/reports';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/reports/StatusBadge';
import CategoryBadge from '../../components/reports/CategoryBadge';
import Timeline from '../../components/reports/Timeline';
import BeforeAfterCompare from '../../components/reports/BeforeAfterCompare';
import {
  MapPin,
  Calendar,
  ArrowLeft,
  Loader2,
  FileText,
  Clock,
  Layers,
  Compass,
  Sparkles,
  Bot,
  AlertTriangle,
  ThumbsUp,
  RotateCcw,
  ExternalLink,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [reopening, setReopening] = useState(false);

  const loadReport = async () => {
    try {
      const data = await reportsApi.getReportById(id);
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadReport();
  }, [id]);

  const handleConfirm = async () => {
    if (!report) return;
    setConfirming(true);
    try {
      const res = await reportsApi.confirmReport(report.id);
      toast.success('Your confirmation vote has been added! Priority increased.', { icon: '👍' });
      // Update local confirmation count
      setReport((prev) => ({
        ...prev,
        confirmation_count: (prev.confirmation_count || 1) + 1,
        priority: (prev.priority || 0) + 1,
      }));
    } catch (err) {
      if (err.response?.status === 409 || err.message?.includes('already')) {
        toast('You have already confirmed this issue.', { icon: 'ℹ️' });
      } else {
        toast.error(err.message || 'Failed to confirm report.');
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleReopen = async () => {
    if (!window.confirm('Are you sure you want to reopen this issue? It will be marked under review for the municipal team.')) {
      return;
    }

    setReopening(true);
    try {
      await reportsApi.reopenReport(report.id);
      toast.success('Issue reopened and returned to under review status.', { icon: '🔄' });
      await loadReport();
    } catch (err) {
      toast.error(err.message || 'Failed to reopen complaint.');
    } finally {
      setReopening(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading complaint details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-200 rounded-2xl text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Complaint Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'This report does not exist or you do not have permission to view it.'}</p>
        <Link
          to="/my-reports"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Complaints
        </Link>
      </div>
    );
  }

  const images = report.images || [];
  const currentImage = images[activeImage] || images[0];

  const isOwner = user?.id === report.user_id;
  const isResolved = report.status === 'resolved';
  const resolvedDate = report.resolved_at ? new Date(report.resolved_at) : new Date(report.updated_at);
  const daysSinceResolved = (Date.now() - resolvedDate.getTime()) / (1000 * 60 * 60 * 24);
  const canReopen = isOwner && isResolved && daysSinceResolved <= 7;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/my-reports"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to My Complaints
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-blue-600 tracking-wider">
              {report.complaint_no}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {report.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <CategoryBadge category={report.category} />
            <StatusBadge status={report.status} size="lg" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Filed on{' '}
                {report.created_at
                  ? format(new Date(report.created_at), 'MMMM d, yyyy · h:mm a')
                  : 'Recently'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{report.address || report.city || 'Coordinates on file'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>
                Confirmed by <strong>{report.confirmation_count || 1}</strong> citizen{report.confirmation_count === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Confirm / Upvote Button */}
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/50 text-slate-700 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              title="Add your confirmation vote to prioritize this issue"
            >
              <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
              <span>I Have This Issue (+1)</span>
            </button>

            {/* Reopen button (if resolved <= 7 days) */}
            {canReopen && (
              <button
                type="button"
                disabled={reopening}
                onClick={handleReopen}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-amber-200 hover:border-amber-300 bg-amber-50 hover:bg-amber-100/60 text-amber-800 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Reopen issue within 7 days of resolution"
              >
                {reopening ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>Reopen Issue</span>
              </button>
            )}

            {/* Public Tracking Link */}
            <Link
              to={`/track?id=${report.complaint_no}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium shadow-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Public Tracking</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Photos + Details & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Photos Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Resolution Before/After Comparison Card (shown when resolved photo exists) */}
          {report.resolved_image_url && (
            <BeforeAfterCompare
              beforeUrl={currentImage?.url}
              afterUrl={report.resolved_image_url}
              createdAt={report.created_at}
              resolvedAt={report.resolved_at}
              title="Hazard Resolution Proof"
            />
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
              <Layers className="w-4 h-4 text-blue-600" />
              Evidence Photos ({images.length})
            </h2>

            {currentImage ? (
              <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={currentImage.url}
                  alt={report.title}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                No images attached
              </div>
            )}

            {/* AI Analysis Assessment Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  AI Model Assessment
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold uppercase">
                  Status: {report.ai_status || 'unavailable'}
                </span>
              </div>

              {report.ai_status === 'ok' ? (
                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Detected</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {report.ai_category?.replace('_', ' ') || 'None'}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Confidence</span>
                    <span className="font-bold text-slate-800">
                      {report.ai_confidence ? `${Math.round(report.ai_confidence * 100)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Severity</span>
                    <span className="font-bold text-slate-800 capitalize">
                      {report.ai_severity || 'Low'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 pt-1">
                  AI service was offline or image lacked clear detections. Human confirmation applied.
                </p>
              )}

              {report.needs_review && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Flagged for administrative review (confidence &lt; 40% or manual category override).</span>
                </div>
              )}
            </div>

            {/* Thumbnails row */}
            {images.length > 1 && (
              <div className="flex gap-2 pt-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === idx ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location & Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Description & Location
            </h2>

            {report.description ? (
              <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {report.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No additional description provided.</p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Latitude</span>
                <span className="font-mono font-semibold text-slate-800">{report.lat}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Longitude</span>
                <span className="font-mono font-semibold text-slate-800">{report.lng}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status Tracking Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Status Timeline
              </h2>
              <span className="text-[11px] text-slate-400">Audit trail</span>
            </div>

            <Timeline events={report.timeline} />
          </div>
        </div>
      </div>
    </div>
  );
}
