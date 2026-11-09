import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReportMap from '../../components/map/ReportMap';
import MapFilterBar from '../../components/map/MapFilterBar';
import { MapPin, PlusCircle, Sparkles } from 'lucide-react';

export default function PublicMap() {
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const handleReset = () => {
    setCategory('');
    setStatus('');
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 space-y-3">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
              <MapPin className="w-5 h-5" />
            </div>
            <span>Live Civic Problems Map</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PostGIS Spatial View
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pan and zoom across the city to view live geotagged hazard clusters and resolution statuses.
          </p>
        </div>

        <Link
          to="/report/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Hazard</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0">
        <MapFilterBar
          category={category}
          status={status}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onReset={handleReset}
        />
      </div>

      {/* Interactive Map View */}
      <div className="flex-1 min-h-[450px] w-full">
        <ReportMap category={category} status={status} />
      </div>
    </div>
  );
}
