import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye, 
  MapPin, 
  PhoneCall, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Server, 
  CheckCircle2, 
  ExternalLink,
  LifeBuoy
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      {/* Upper Footer: Branding & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Brand Info (Cols 1-2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  CivicEye
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Smart City
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 -mt-1 font-medium">
                  AI-Powered Municipal Triage
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed pr-4">
              CivicEye bridges citizens and city administrators with real-time geotagged hazard 
              reporting, automated YOLOv8 computer vision triage, and PostGIS spatial clustering.
            </p>

            {/* Helpline badges */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-300">
                <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                <span>Municipal Helpline: <strong className="text-white font-mono font-semibold">1913</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-300">
                <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
                <span>Emergency: <strong className="text-white font-mono font-semibold">112</strong></span>
              </div>
            </div>
          </div>

          {/* Column 1: Citizen Services */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Citizen Services
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/report/new" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  Report a Hazard
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  Live Public Map
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  Track Complaint
                </Link>
              </li>
              <li>
                <Link to="/my-reports" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  My Reports History
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Municipal Command */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Municipal Console
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/admin" className="text-slate-400 hover:text-white transition-colors">
                  Operations Overview
                </Link>
              </li>
              <li>
                <Link to="/admin/reports" className="text-slate-400 hover:text-white transition-colors">
                  Triage Queue
                </Link>
              </li>
              <li>
                <Link to="/admin/analytics" className="text-slate-400 hover:text-white transition-colors">
                  Spatial Analytics
                </Link>
              </li>
              <li>
                <Link to="/admin/users" className="text-slate-400 hover:text-white transition-colors">
                  Staff & Officers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Architecture & Capabilities */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Tech Stack
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>FastAPI + YOLOv8 AI</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>PostgreSQL 16 + PostGIS</span>
              </li>
              <li className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Express 4 REST Gateway</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Leaflet.js + Nominatim</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Live Architecture Status Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-300">Live Infrastructure Health:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              API :5000 Online
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              AI :8000 Ready
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              PostGIS Ready
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Sub-footer */}
      <div className="bg-slate-950/70 border-t border-slate-800/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} CivicEye Municipal Smart City Platform. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Open Data API</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Citizen Charter</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
