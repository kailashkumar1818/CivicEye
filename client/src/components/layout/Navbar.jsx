import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  MapPin,
  Search,
  PlusCircle,
  Shield,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Zap,
  Activity,
  FileText,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [demoDropdown, setDemoDropdown] = useState(false);
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleQuickLogin = async (email, password, roleLabel) => {
    try {
      setDemoDropdown(false);
      setIsOpen(false);
      await login({ email, password });
      toast.success(`Logged in as ${roleLabel}!`, { icon: '⚡' });
      if (email.includes('admin')) {
        navigate('/admin');
      } else if (email.includes('officer')) {
        navigate('/admin/reports');
      } else {
        navigate('/my-reports');
      }
    } catch {
      // toast error handled in AuthContext
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Live Map', path: '/map', icon: MapPin },
    { name: 'Track Issue', path: '/track', icon: Search },
    ...(isAuthenticated ? [{ name: 'My Reports', path: '/my-reports', icon: FileText }] : []),
    ...(isAdmin ? [{ name: 'Command Center', path: '/admin', icon: Shield, badge: 'Staff' }] : []),
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                👁
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                  Civic<span className="text-blue-600">Eye</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Smart City AI
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'text-blue-600 bg-blue-50/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 mr-1.5 text-slate-500" />}
                  {link.name}
                  {link.badge && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Prominent Report Issue CTA */}
            <Link
              to="/report/new"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/25 transition-all hover:scale-102 ml-1"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Report Hazard
            </Link>

            <div className="h-5 w-px bg-slate-200 mx-2" />

            {/* Quick Demo Personas Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setDemoDropdown(!demoDropdown);
                  setUserDropdown(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-200/80 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 text-xs font-bold transition-colors"
                title="Switch demo personas with 1 click"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Demo Personas</span>
                <ChevronDown className="w-3 h-3 text-amber-700" />
              </button>

              {demoDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      1-Click Instant Login
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@civiceye.gov', 'AdminPassword123!', 'Municipal Admin')}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                        🛡️ Municipal Admin
                      </p>
                      <p className="text-[10px] text-slate-500">Triage, analytics & CSV export</p>
                    </div>
                    <span className="text-[10px] font-mono text-blue-600 font-semibold">Switch →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('officer.roads@civiceye.gov', 'OfficerPassword123!', 'Field Officer')}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                        👷 Roads Field Officer
                      </p>
                      <p className="text-[10px] text-slate-500">Department review & repair photos</p>
                    </div>
                    <span className="text-[10px] font-mono text-blue-600 font-semibold">Switch →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('citizen@civiceye.local', 'CitizenPassword123!', 'Citizen Reporter')}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                        👤 Jane Citizen
                      </p>
                      <p className="text-[10px] text-slate-500">Report hazards & tracking</p>
                    </div>
                    <span className="text-[10px] font-mono text-blue-600 font-semibold">Switch →</span>
                  </button>
                </div>
              )}
            </div>

            {/* Authenticated user menu vs guest sign in */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserDropdown(!userDropdown);
                      setDemoDropdown(false);
                    }}
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block mt-0.5">
                        {user?.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdown && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 uppercase">
                          Role: {user?.role}
                        </span>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        My Profile
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Shield className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                          Municipal Command Center
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100/70 rounded-xl transition-colors"
                >
                  <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-black text-white rounded-xl shadow-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center space-x-1.5 md:hidden">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 px-4 pt-3 pb-5 space-y-2 bg-white/95 backdrop-blur-md">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive(link.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 mr-3 text-slate-500" />}
                {link.name}
              </Link>
            );
          })}

          <Link
            to="/report/new"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Report Civic Hazard
          </Link>

          {/* Mobile Quick Persona Switcher */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 px-1 mb-2">
              ⚡ 1-Click Demo Login
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@civiceye.gov', 'AdminPassword123!', 'Admin')}
                className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold text-center border border-amber-200/60"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('officer.roads@civiceye.gov', 'OfficerPassword123!', 'Officer')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-bold text-center border border-blue-200/60"
              >
                Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('citizen@civiceye.local', 'CitizenPassword123!', 'Citizen')}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold text-center border border-emerald-200/60"
              >
                Citizen
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-1">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <User className="w-4 h-4 mr-3 text-slate-400" />
                  My Profile ({user?.name})
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                  >
                    <Shield className="w-4 h-4 mr-3 text-indigo-500" />
                    Municipal Command Center
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full text-left flex items-center px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
