import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Shield, 
  User, 
  Briefcase,
  Loader2, 
  Eye, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || null;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await login(data);
      const user = response.user;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin' || user.role === 'officer') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/my-reports', { replace: true });
      }
    } catch {
      // Error handled by AuthContext toast
    } finally {
      setSubmitting(false);
    }
  };

  const autofillAndSubmit = async (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    await onSubmit({ email, password });
  };

  return (
    <div className="max-w-md mx-auto my-10 sm:my-16 px-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8">
        
        {/* Brand & Heading */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/20">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to CivicEye
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access AI hazard triage, map tracking, and municipal dispatch
          </p>
        </div>

        {/* 1-Click Demo Personas */}
        <div className="mb-6 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Click Demo Sign-In
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Instant Access</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => autofillAndSubmit('admin@civiceye.gov', 'AdminPassword123!')}
              className="inline-flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-purple-800 font-semibold transition-all group disabled:opacity-50"
            >
              <Shield className="w-4 h-4 text-purple-600 mb-0.5 group-hover:scale-110 transition-transform" />
              <span className="text-[11px]">Admin</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => autofillAndSubmit('officer.roads@civiceye.gov', 'OfficerPassword123!')}
              className="inline-flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 font-semibold transition-all group disabled:opacity-50"
            >
              <Briefcase className="w-4 h-4 text-amber-600 mb-0.5 group-hover:scale-110 transition-transform" />
              <span className="text-[11px]">Officer</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => autofillAndSubmit('citizen@civiceye.local', 'CitizenPassword123!')}
              className="inline-flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-800 font-semibold transition-all group disabled:opacity-50"
            >
              <User className="w-4 h-4 text-blue-600 mb-0.5 group-hover:scale-110 transition-transform" />
              <span className="text-[11px]">Citizen</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                  errors.email
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                  errors.password
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
          New to CivicEye?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            Register as a Citizen
          </Link>
        </div>
      </div>
    </div>
  );
}
