import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import analyticsApi from '../../api/analytics';
import CategoryPie from '../../components/charts/CategoryPie';
import TrendLine from '../../components/charts/TrendLine';
import StatusBarChart from '../../components/charts/StatusBarChart';
import ResolutionBar from '../../components/charts/ResolutionBar';
import HeatLayer from '../../components/map/HeatLayer';
import { MapContainer, TileLayer } from 'react-leaflet';
import {
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  PieChart,
  BarChart3,
  Layers,
  Loader2,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [trendInterval, setTrendInterval] = useState('day');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await analyticsApi.downloadExportCsv();
      toast.success('Municipal reports CSV downloaded successfully!', { icon: '📊' });
    } catch (err) {
      toast.error(err.message || 'Failed to export CSV report');
    } finally {
      setIsExporting(false);
    }
  };

  // Queries
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.getSummary(),
  });

  const { data: categoryData } = useQuery({
    queryKey: ['analytics', 'by-category'],
    queryFn: () => analyticsApi.getByCategory(),
  });

  const { data: statusData } = useQuery({
    queryKey: ['analytics', 'by-status'],
    queryFn: () => analyticsApi.getByStatus(),
  });

  const { data: trendData } = useQuery({
    queryKey: ['analytics', 'trend', trendInterval],
    queryFn: () => analyticsApi.getTrend({ interval: trendInterval }),
  });

  const { data: hotspots = [], isLoading: loadingHotspots } = useQuery({
    queryKey: ['analytics', 'hotspots'],
    queryFn: () => analyticsApi.getHotspots({ limit: 100 }),
  });

  const { data: topAreas = [] } = useQuery({
    queryKey: ['analytics', 'top-areas'],
    queryFn: () => analyticsApi.getTopAreas({ limit: 8 }),
  });

  const { data: resolutionData = [] } = useQuery({
    queryKey: ['analytics', 'resolution-time'],
    queryFn: () => analyticsApi.getResolutionTime(),
  });

  const { data: aiAccuracy } = useQuery({
    queryKey: ['analytics', 'ai-accuracy'],
    queryFn: () => analyticsApi.getAiAccuracy(),
  });

  // Default city center (Hyderabad / Metro fallback)
  const mapCenter = hotspots.length > 0 ? [hotspots[0].lat, hotspots[0].lng] : [17.385, 78.4867];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Civic Intelligence & Hotspot Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Spatial density mapping, municipal resolution turnaround, and AI accuracy metrics
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating CSV...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-emerald-400" />
              Export Reports CSV
            </>
          )}
        </button>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Resolution Efficiency
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {summary?.total
              ? `${Math.round(((summary.resolved || 0) / summary.total) * 100)}%`
              : '0%'}
          </p>
          <span className="text-[11px] text-slate-500">
            {summary?.resolved || 0} of {summary?.total || 0} resolved
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Avg Turnaround Time
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">
            {summary?.avg_resolution_hours || 0}h
          </p>
          <span className="text-[11px] text-slate-500">Across all categories</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            AI Model Accuracy
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
            {aiAccuracy?.accuracy_percentage ?? 0}%
          </p>
          <span className="text-[11px] text-slate-500">
            {aiAccuracy?.accurate_count || 0} matched of {aiAccuracy?.total_analyzed || 0}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            High Priority Active
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {summary?.high_priority || 0}
          </p>
          <span className="text-[11px] text-slate-500">Urgent or heavily upvoted</span>
        </div>
      </div>

      {/* PostGIS Hotspot Heatmap Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Civic Issue Spatial Heatmap (PostGIS Grid Clustering)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated ~500m coordinate density clusters of all unresolved and active municipal complaints
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Low
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High Density
            </span>
          </div>
        </div>

        <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200 relative">
          {loadingHotspots ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
              <TileLayer
                url={import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
              />
              <HeatLayer points={hotspots} radius={30} blur={20} />
            </MapContainer>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reporting Velocity Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Intake & Resolution Velocity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Time series trend across the municipality</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTrendInterval('day')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  trendInterval === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTrendInterval('week')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  trendInterval === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          <TrendLine data={trendData || []} height={280} />
        </div>

        {/* Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              Category Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Complaints by infrastructure problem</p>
          </div>
          <CategoryPie data={categoryData || []} height={280} />
        </div>

        {/* Resolution Time by Category (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Average Resolution Hours by Problem
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Turnaround hours from creation to resolved</p>
          </div>
          <ResolutionBar data={resolutionData} height={260} />
        </div>

        {/* Status Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Workflow Pipeline Status Counts
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Active distribution across stages</p>
          </div>
          <StatusBarChart data={statusData || []} height={260} />
        </div>
      </div>

      {/* Two Column Footer: Top Problem Areas + AI Validation Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Problem Areas (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Top Problem Localities
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by volume of active unresolved complaints</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-6">Locality / Ward</th>
                  <th className="py-2.5 px-4 text-center">Open Issues</th>
                  <th className="py-2.5 px-4 text-center">Resolved</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topAreas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No locality data aggregated yet.
                    </td>
                  </tr>
                ) : (
                  topAreas.map((area, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-6 font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        {area.area}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          {area.open_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-semibold">
                        {area.resolved_count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                        {area.total}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Performance Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                YOLOv8 AI Detection Benchmark
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Agreement with finalized human reviews</p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-xs font-bold">
              {aiAccuracy?.accuracy_percentage ?? 0}% Precision
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {(aiAccuracy?.byCategory || []).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 capitalize">
                    {cat.category.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-slate-500 font-semibold">
                    {cat.match_rate}% ({cat.accurate}/{cat.total})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, cat.match_rate || 0)}%` }}
                  />
                </div>
              </div>
            ))}

            {(!aiAccuracy?.byCategory || aiAccuracy.byCategory.length === 0) && (
              <p className="text-xs text-slate-400 py-6 text-center">
                AI accuracy benchmarks will display once reports are analyzed and reviewed.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
