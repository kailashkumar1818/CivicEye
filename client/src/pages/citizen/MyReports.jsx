import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import reportsApi from '../../api/reports';
import StatusBadge from '../../components/reports/StatusBadge';
import CategoryBadge from '../../components/reports/CategoryBadge';
import { PlusCircle, MapPin, Calendar, ArrowRight, Loader2, FileQuestion } from 'lucide-react';

const statusTabs = [
  { id: '', label: 'All' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'rejected', label: 'Rejected' },
];

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const loadReports = async (statusFilter = selectedStatus) => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const data = await reportsApi.getMyReports(params);
      setReports(data.reports);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(selectedStatus);
  }, [selectedStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Reported Complaints</h1>
          <p className="text-sm text-slate-600 mt-1">
            Track status updates and resolution progress for all your filed civic issues.
          </p>
        </div>
        <Link
          to="/report/new"
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Report New Issue
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 pb-2">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading your complaints...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No complaints found</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {selectedStatus
              ? `You don't have any complaints with status "${selectedStatus.replace('_', ' ')}".`
              : "You haven't reported any civic problems yet. Be an active citizen and report issues in your neighborhood!"}
          </p>
          <Link
            to="/report/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            Report an Issue Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const dateStr = report.created_at
              ? format(new Date(report.created_at), 'MMM d, yyyy')
              : 'Recently';

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all group"
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  {report.primary_image_url ? (
                    <img
                      src={report.primary_image_url}
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No Photo
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5">
                    <CategoryBadge category={report.category} />
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={report.status} />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-blue-600">
                      {report.complaint_no}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mt-0.5">
                      {report.title}
                    </h3>
                    {report.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {report.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{report.address || report.city || 'Location recorded'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dateStr}</span>
                      </div>
                      <Link
                        to={`/reports/${report.id}`}
                        className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
