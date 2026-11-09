import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import analyticsApi from '../../api/analytics';
import adminApi from '../../api/admin';
import CategoryPie from '../../components/charts/CategoryPie';
import TrendLine from '../../components/charts/TrendLine';
import StatusBadge from '../../components/reports/StatusBadge';
import CategoryBadge from '../../components/reports/CategoryBadge';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  PieChart,
  ShieldAlert,
  Loader2,
  Users,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.getSummary(),
  });

  const { data: categoryData, isLoading: loadingCategory } = useQuery({
    queryKey: ['analytics', 'by-category'],
    queryFn: () => analyticsApi.getByCategory(),
  });

  const { data: trendData, isLoading: loadingTrend } = useQuery({
    queryKey: ['analytics', 'trend'],
    queryFn: () => analyticsApi.getTrend({ interval: 'day' }),
  });

  const { data: urgentReports, isLoading: loadingUrgent } = useQuery({
    queryKey: ['admin', 'reports', 'urgent'],
    queryFn: () => adminApi.getReports({ needsReview: true, limit: 5 }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time civic complaint monitoring, AI verification, and field assignment
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            Triage Reports
          </Link>
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Full Analytics
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition-colors"
          >
            <Users className="w-4 h-4 text-slate-500" />
            Users
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Complaints
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loadingSummary ? '...' : summary?.total || 0}
          </p>
          <p className="text-[11px] text-slate-400">All recorded citizen issues</p>
        </div>

        {/* Open */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Open / In Progress
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loadingSummary ? '...' : summary?.open || 0}
          </p>
          <p className="text-[11px] text-amber-600 font-medium">Pending field resolution</p>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Resolved
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loadingSummary ? '...' : summary?.resolved || 0}
          </p>
          <p className="text-[11px] text-slate-400">
            {summary?.total ? `${Math.round(((summary.resolved || 0) / summary.total) * 100)}% resolution rate` : '0%'}
          </p>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Avg Turnaround
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {loadingSummary ? '...' : `${summary?.avg_resolution_hours || 0}h`}
          </p>
          <p className="text-[11px] text-slate-400">From filing to completion</p>
        </div>

        {/* Needs Review */}
        <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-5 shadow-sm space-y-2 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Needs Review
            </span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-900">
            {loadingSummary ? '...' : summary?.needs_review || 0}
          </p>
          <p className="text-[11px] text-rose-700 font-medium">Low AI conf or override</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Reporting & Resolution Velocity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Complaints filed vs complaints resolved</p>
            </div>
            <Link
              to="/admin/analytics"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingTrend ? (
            <div className="h-[280px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <TrendLine data={trendData || []} height={280} />
          )}
        </div>

        {/* Problem Category Pie Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                Complaints by Category
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution across civic departments</p>
            </div>
          </div>

          {loadingCategory ? (
            <div className="h-[280px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <CategoryPie data={categoryData || []} height={280} />
          )}
        </div>
      </div>

      {/* Urgent Action Queue: Reports Flagged for Review */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Action Required: Reports Flagged for Administrative Review
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Issues where AI confidence was under 40% or citizen manually altered the detected category
              </p>
            </div>
          </div>
          <Link
            to="/admin/reports?needsReview=true"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all ({summary?.needs_review || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {loadingUrgent ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : !urgentReports?.reports?.length ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No reports currently require review. All submissions are verified!
            </div>
          ) : (
            urgentReports.reports.map((r) => (
              <div
                key={r.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {r.primary_image_url ? (
                    <img
                      src={r.primary_image_url}
                      alt={r.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                      No Photo
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-600">
                        {r.complaint_no}
                      </span>
                      <CategoryBadge category={r.category} />
                      <StatusBadge status={r.status} />
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700">
                        Needs Review
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {r.title}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {r.address || r.area || 'Location logged'}
                      </span>
                      <span>By: {r.citizen_name || 'Citizen'}</span>
                      {r.ai_category && (
                        <span className="text-slate-600">
                          AI: <strong className="capitalize">{r.ai_category.replace('_', ' ')}</strong> ({Math.round((r.ai_confidence || 0) * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Link
                    to={`/admin/reports/${r.id}`}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    Review & Triage
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
