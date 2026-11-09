import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Activity, 
  Camera, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  Database,
  Cpu,
  Server,
  AlertTriangle,
  Search,
  Shield,
  Briefcase,
  User,
  Sparkles,
  Layers,
  ChevronRight,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function Home() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [trackQuery, setTrackQuery] = useState('');
  const [switchingUser, setSwitchingUser] = useState(null);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/health', {
        validateStatus: (status) => status < 600,
      });
      const payload = data.data || data;
      setHealth(payload);
      if (payload.db === 'down') {
        setError('PostgreSQL / PostGIS database is currently offline (port 5432). Running with smart in-memory fallback for instant zero-config testing.');
      } else {
        setError(null);
      }
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      if (err.response?.data) {
        const payload = err.response.data.data || err.response.data;
        setHealth(payload);
        if (payload.db === 'down') {
          setError('PostgreSQL / PostGIS is offline. Running with smart in-memory fallback for instant zero-config testing.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err.message || 'Failed to reach API server');
        setHealth({
          status: 'down',
          db: 'down',
          ai: 'down',
        });
      }
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const q = trackQuery.trim();
    if (q) {
      navigate(`/track?id=${encodeURIComponent(q)}`);
    } else {
      navigate('/track');
    }
  };

  const handleQuickLogin = async (personaKey, email, password, targetRoute) => {
    try {
      setSwitchingUser(personaKey);
      await login({ email, password });
      navigate(targetRoute);
    } catch (err) {
      console.error('Quick login failed:', err);
    } finally {
      setSwitchingUser(null);
    }
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-14 lg:pb-20 border-b border-slate-200/80 bg-gradient-to-b from-blue-50/50 via-white to-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200/80 text-blue-700 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
              <span>AI-Powered Municipal Operations &amp; PostGIS Spatial Triage</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Report Civic Issues. <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                AI Triage. Faster Resolution.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Empowering citizens to capture geotagged photos of potholes, garbage, and street hazards.
              YOLOv8 vision AI classifies severity, PostGIS stops duplicates, and city teams resolve them.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/report/new"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98] transition-all"
              >
                <Camera className="w-5 h-5" />
                <span>Report Civic Hazard</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                to="/map"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs active:scale-[0.98] transition-all"
              >
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Explore City Map</span>
              </Link>
            </div>

            {/* Hero Quick Search / Track Box */}
            <div className="pt-6 max-w-xl mx-auto">
              <form 
                onSubmit={handleTrackSubmit}
                className="flex items-center p-1.5 rounded-2xl bg-white border border-slate-300 shadow-lg shadow-slate-200/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
              >
                <div className="pl-3.5 pr-2 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Track complaint by ID (e.g. CE-2026-000001)..."
                  className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide uppercase transition-colors shrink-0"
                >
                  Track Status
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* 1-Click Interactive Demo Persona Switcher */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl">
          <div className="max-w-2xl">
            <span className="text-xs uppercase font-mono tracking-widest text-blue-400 font-bold">
              Instant 1-Click Evaluation
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
              Test Any Role Without Passwords
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Select any role below to automatically authenticate and test the full municipal workflow immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {/* Admin Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/50 hover:bg-slate-800 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    ROLE: ADMIN
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    Municipal Admin
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Full triage control, priority escalation, user management, and PostGIS spatial analytics.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  admin@civiceye.gov
                </div>
              </div>

              <button
                onClick={() => handleQuickLogin('admin', 'admin@civiceye.gov', 'AdminPassword123!', '/admin')}
                disabled={switchingUser !== null}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {switchingUser === 'admin' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Enter Admin Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Officer Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/50 hover:bg-slate-800 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    ROLE: OFFICER
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    Field Officer (Roads)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Assigned department queue, dispatch updates, and Before/After resolution photo proof upload.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  officer.roads@civiceye.gov
                </div>
              </div>

              <button
                onClick={() => handleQuickLogin('officer', 'officer.roads@civiceye.gov', 'OfficerPassword123!', '/admin/reports')}
                disabled={switchingUser !== null}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {switchingUser === 'officer' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Open Field Worklist</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Citizen Card */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/50 hover:bg-slate-800 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    ROLE: CITIZEN
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    Citizen Reporter
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Submit geotagged camera reports, view AI detection previews, and monitor progress history.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                  citizen@civiceye.local
                </div>
              </div>

              <button
                onClick={() => handleQuickLogin('citizen', 'citizen@civiceye.local', 'CitizenPassword123!', '/my-reports')}
                disabled={switchingUser !== null}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {switchingUser === 'citizen' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>View Citizen Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* System Health Status Monitor */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Municipal Architecture Status
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                    Live Probe
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time health telemetry across the 3 microservices
                </p>
              </div>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="inline-flex items-center self-start sm:self-auto px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>

          {error && (
            <div
              className={`my-6 p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                health?.db === 'down' && health?.status !== 'down'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  health?.db === 'down' && health?.status !== 'down'
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              />
              <div>
                <strong className="block font-semibold">
                  {health?.db === 'down' && health?.status !== 'down'
                    ? 'Smart In-Memory Database Fallback Active'
                    : 'Connection Notice'}
                </strong>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
            {/* Server API */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:bg-white transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span>API Gateway</span>
                </div>
                {health && health.status !== 'down' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {health ? (health.status !== 'down' ? 'Online' : 'Offline') : 'Loading...'}
                </div>
                <p className="text-xs text-slate-500 mt-1">Express 4 + Node.js (Port 5000)</p>
              </div>
            </div>

            {/* PostGIS Database */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:bg-white transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Spatial Database</span>
                </div>
                {health?.db === 'up' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {health ? (health.db === 'up' ? 'Connected' : 'In-Memory Mock') : 'Checking...'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {health?.db === 'up' ? 'PostGIS 3.4 (Port 5432)' : 'Instant Fallback Active'}
                </p>
              </div>
            </div>

            {/* AI Service */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:bg-white transition-colors">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>Vision AI</span>
                </div>
                {health?.ai === 'up' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {health ? (health.ai === 'up' ? 'Online' : 'Offline') : 'Checking...'}
                </div>
                <p className="text-xs text-slate-500 mt-1">FastAPI + YOLOv8 (Port 8000)</p>
              </div>
            </div>
          </div>

          {lastChecked && (
            <div className="mt-5 flex justify-end">
              <span className="text-[11px] text-slate-400 font-mono">
                Telemetry refreshed at {lastChecked}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 4-Step Civic Lifecycle Pipeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Automated Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            How CivicEye Resolves Hazards in 4 Steps
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            From camera snapshot to verified city fix with complete transparent auditing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-2xl font-mono font-black text-slate-200">01</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Geotagged Photo</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Citizen captures the issue with mobile or desktop. GPS coordinates and EXIF metadata locate the hazard accurately.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-blue-600">
              <span>Automatic EXIF &amp; GPS</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="text-2xl font-mono font-black text-slate-200">02</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">YOLOv8 AI Detection</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Computer vision classifies category (pothole, garbage, streetlight) and scores severity confidence in &lt; 500ms.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-indigo-600">
              <span>94%+ Classification Confidence</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-2xl font-mono font-black text-slate-200">03</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Spatial Triage</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                PostGIS suppresses duplicates within a 30m radius, clusters reports on GIS maps, and alerts department officers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-amber-600">
              <span>30m Radius Spatial Deduplication</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-2xl font-mono font-black text-slate-200">04</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">Verified Fix</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Officer attaches resolution photo. Interactive Before/After slider proves completion, updating citizen timeline.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-medium text-emerald-600">
              <span>Visual Before/After Proof</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Impact Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-lg">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-mono">
                94.2%
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                AI Vision Detection Rate
              </p>
            </div>

            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400 font-mono">
                30m
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                PostGIS Duplicate Radius
              </p>
            </div>

            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                &lt; 24h
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                Target Resolution Dispatch
              </p>
            </div>

            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">
                100%
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                Open Status Transparency
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Launchpad Action Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/report/new"
            className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition-colors">
                Submit a Hazard Report
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Take or upload a photo with automatic GPS positioning and YOLOv8 real-time AI category inference.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-blue-600">
              <span>Start Reporting</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/map"
            className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-emerald-600 transition-colors">
                Public Interactive GIS Map
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                View all municipal incidents, filter by status or department, and explore viewport-clustered pins.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-emerald-600">
              <span>Open Public Map</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/admin/analytics"
            className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4 group-hover:text-purple-600 transition-colors">
                Spatial Analytics &amp; CSV Export
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Department resolution times, category breakdown, duplicate density, and one-click municipal CSV export.
              </p>
            </div>
            <div className="mt-5 flex items-center text-xs font-semibold text-purple-600">
              <span>View Analytics</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

    </div>
  );
}
