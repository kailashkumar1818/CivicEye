import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '../../api/admin';
import analyticsApi from '../../api/analytics';
import StatusBadge from '../../components/reports/StatusBadge';
import CategoryBadge from '../../components/reports/CategoryBadge';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  ThumbsUp,
  Flame,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  Bot,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ReportsTable() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Filters state initialized from query params
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [severity, setSeverity] = useState(searchParams.get('severity') || '');
  const [needsReview, setNeedsReview] = useState(searchParams.get('needsReview') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || 'created_at:desc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('under_review');
  const [bulkNote, setBulkNote] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await analyticsApi.downloadExportCsv({
        status: status || undefined,
        category: category || undefined,
      });
      toast.success('Filtered reports exported as CSV!', { icon: '📊' });
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch reports with TanStack Query
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'reports', { search, status, category, severity, needsReview, sort, page }],
    queryFn: () =>
      adminApi.getReports({
        q: search || undefined,
        status: status || undefined,
        category: category || undefined,
        severity: severity || undefined,
        needsReview: needsReview ? true : undefined,
        sort,
        page,
        limit: 15,
      }),
  });

  const reports = data?.reports || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 15, totalPages: 1 };

  // Sync URL search params
  useEffect(() => {
    const params = {};
    if (search) params.q = search;
    if (status) params.status = status;
    if (category) params.category = category;
    if (severity) params.severity = severity;
    if (needsReview) params.needsReview = 'true';
    if (sort !== 'created_at:desc') params.sort = sort;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [search, status, category, severity, needsReview, sort, page, setSearchParams]);

  // Bulk update mutation
  const bulkMutation = useMutation({
    mutationFn: () =>
      adminApi.bulkUpdateStatus({
        ids: selectedIds,
        status: bulkStatus,
        note: bulkNote || `Bulk status update to ${bulkStatus}`,
      }),
    onSuccess: (res) => {
      toast.success(`Successfully updated ${res.data?.updatedCount || selectedIds.length} reports!`);
      setSelectedIds([]);
      setBulkNote('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to apply bulk updates');
    },
  });

  const handleSelectAll = () => {
    if (selectedIds.length === reports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reports.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Complaint Triage & Workflow
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review, prioritize, assign, and update civic problem reports ({meta.total} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            title="Download CSV export matching current filters"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Download className="w-4 h-4 text-slate-500" />
            )}
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search box (4 cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ID, title, citizen or area..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Category filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="pothole">Pothole</option>
              <option value="garbage">Garbage</option>
              <option value="broken_streetlight">Streetlight</option>
              <option value="damaged_road">Damaged Road</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Sort selector (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at:desc">Newest First</option>
              <option value="created_at:asc">Oldest First</option>
              <option value="priority:desc">Highest Priority</option>
              <option value="confirmation_count:desc">Most Confirmed</option>
            </select>
          </div>

          {/* Needs Review Toggle (2 cols) */}
          <div className="lg:col-span-2 flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 w-full transition-colors">
              <input
                type="checkbox"
                checked={needsReview}
                onChange={(e) => {
                  setNeedsReview(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1 text-rose-700 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Needs Review
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
              {selectedIds.length}
            </span>
            <span>reports selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-blue-300 bg-white font-medium"
            >
              <option value="under_review">Mark Under Review</option>
              <option value="assigned">Mark Assigned</option>
              <option value="in_progress">Mark In Progress</option>
              <option value="resolved">Mark Resolved</option>
              <option value="rejected">Mark Rejected</option>
            </select>

            <button
              onClick={() => bulkMutation.mutate()}
              disabled={bulkMutation.isPending}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {bulkMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Apply Bulk Status'
              )}
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {selectedIds.length > 0 && selectedIds.length === reports.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Complaint</th>
                <th className="py-3 px-4">Category / AI</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4">Location / Area</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading triage reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    No complaints matching current filters found.
                  </td>
                </tr>
              ) : (
                reports.map((report) => {
                  const isSelected = selectedIds.includes(report.id);
                  const isAiMismatched =
                    report.ai_category && report.ai_category !== report.category;

                  return (
                    <tr
                      key={report.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(report.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Complaint ID & Title */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          {report.primary_image_url ? (
                            <img
                              src={report.primary_image_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[9px] shrink-0">
                              No Pic
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-mono text-[11px] font-bold text-blue-600 block">
                              {report.complaint_no}
                            </span>
                            <span className="font-semibold text-slate-900 truncate block">
                              {report.title}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category + AI Status */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <CategoryBadge category={report.category} />
                          {report.needs_review && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              Review
                            </span>
                          )}
                          {isAiMismatched && (
                            <span className="text-[10px] text-slate-500 block">
                              AI: <span className="capitalize">{report.ai_category}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={report.status} />
                        {report.department_name && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {report.department_name}
                          </span>
                        )}
                      </td>

                      {/* Priority / Upvotes */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>{report.priority}</span>
                          <span className="text-slate-400 text-[10px]">
                            (+{report.confirmation_count || 1})
                          </span>
                        </div>
                      </td>

                      {/* Location / Area */}
                      <td className="py-3 px-4 max-w-[160px] truncate">
                        <p className="text-slate-800 font-medium truncate">
                          {report.area || report.city || 'Metro Area'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{report.address}</p>
                      </td>

                      {/* Submission Date */}
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {report.created_at
                          ? format(new Date(report.created_at), 'MMM d, yyyy')
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/reports/${report.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong>{(meta.page - 1) * meta.limit + 1}</strong> to{' '}
            <strong>{Math.min(meta.page * meta.limit, meta.total)}</strong> of{' '}
            <strong>{meta.total}</strong> complaints
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <span className="font-semibold text-slate-800">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
