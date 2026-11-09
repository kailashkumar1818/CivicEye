import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import mapApi from '../../api/map';
import StatusBadge from '../reports/StatusBadge';
import CategoryBadge from '../reports/CategoryBadge';
import MapLegend from './MapLegend';
import { ArrowRight, Loader2 } from 'lucide-react';

const tileUrl =
  import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Category background colors
const categoryHex = {
  pothole: '#f97316',        // orange
  garbage: '#22c55e',        // green
  broken_streetlight: '#eab308', // yellow
  damaged_road: '#ef4444',   // red
  other: '#64748b',          // slate
};

// Status border colors
const statusBorderHex = {
  submitted: '#94a3b8',      // slate-400
  under_review: '#3b82f6',   // blue-500
  assigned: '#6366f1',       // indigo-500
  in_progress: '#f59e0b',    // amber-500
  resolved: '#10b981',       // emerald-500
  rejected: '#f43f5e',       // rose-500
};

// Create a custom category pin with status ring
function createReportIcon(category, status) {
  const bg = categoryHex[category] || categoryHex.other;
  const ring = statusBorderHex[status] || statusBorderHex.submitted;

  return L.divIcon({
    className: 'report-map-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${bg};
          border: 3px solid ${ring};
          border-radius: 50%;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// Bounding box fetcher component on map moveend (debounced 400ms)
function ViewportReportsFetcher({ onBoundsChange }) {
  const timerRef = useRef(null);

  useMapEvents({
    moveend(e) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const bounds = e.target.getBounds();
        const west = parseFloat(bounds.getWest().toFixed(6));
        const south = parseFloat(bounds.getSouth().toFixed(6));
        const east = parseFloat(bounds.getEast().toFixed(6));
        const north = parseFloat(bounds.getNorth().toFixed(6));
        const bbox = `${west},${south},${east},${north}`;
        onBoundsChange(bbox);
      }, 400);
    },
  });

  return null;
}

export default function ReportMap({
  category = '',
  status = '',
  initialCenter = [17.385, 78.4867],
  initialZoom = 13,
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBbox, setCurrentBbox] = useState('');

  const fetchReports = useCallback(
    async (bbox = currentBbox) => {
      setLoading(true);
      try {
        const params = {};
        if (bbox) params.bbox = bbox;
        if (category) params.category = category;
        if (status) params.status = status;

        const data = await mapApi.getReports(params);
        setReports(data || []);
      } catch (err) {
        console.error('Failed to load map reports:', err);
      } finally {
        setLoading(false);
      }
    },
    [currentBbox, category, status]
  );

  useEffect(() => {
    fetchReports(currentBbox);
  }, [category, status, fetchReports, currentBbox]);

  const handleBoundsChange = (bbox) => {
    setCurrentBbox(bbox);
  };

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-300 shadow-sm">
      {/* Loading pill */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 px-3 py-1.5 rounded-full shadow-md text-xs font-semibold text-blue-600 flex items-center gap-1.5 border border-slate-200">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading reports in view...
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 left-4 z-[1000]">
        <MapLegend />
      </div>

      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className="h-full w-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileUrl}
        />

        <ViewportReportsFetcher onBoundsChange={handleBoundsChange} />

        {reports.map((report) => {
          if (!report.lat || !report.lng) return null;
          const icon = createReportIcon(report.category, report.status);

          return (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={icon}
            >
              <Popup className="civiceye-map-popup">
                <div className="w-60 p-1 space-y-2 text-slate-900">
                  {report.image_url && (
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={report.image_url}
                        alt={report.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold text-blue-600">
                      {report.complaint_no}
                    </span>
                    <StatusBadge status={report.status} size="sm" />
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1 leading-snug">
                    {report.title}
                  </h4>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <CategoryBadge category={report.category} />
                    <Link
                      to={`/reports/${report.id}`}
                      className="inline-flex items-center font-bold text-blue-600 hover:text-blue-700"
                    >
                      View <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

