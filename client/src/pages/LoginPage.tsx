import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-navy-950 overflow-hidden font-sans">
      {/* Background GIS Grid & Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(#087E8B_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-cyan/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-teal/20 blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Container */}
      <div className="relative z-10 w-full max-w-md bg-navy-900/80 backdrop-blur-xl border border-navy-700/80 rounded-3xl p-8 shadow-2xl text-white animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-teal to-brand-cyan shadow-lg shadow-brand-teal/30 mb-4 transform hover:scale-105 transition-transform">
            <Building className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            TUMKUR <span className="text-brand-cyan">SMART CITY</span>
          </h1>

          <p className="text-xs text-brand-cyan font-medium mt-1 uppercase tracking-wider">
            Area-Wise Infrastructure & Planning
          </p>

          <p className="text-xs text-slate-400 mt-2 italic">
            "Explore Your Area. Discover Infrastructure. Plan a Smarter City."
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@tumkur.gov.in"
                className="w-full bg-navy-800/80 border border-navy-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-navy-800/80 border border-navy-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-navy-700 bg-navy-800 text-brand-teal focus:ring-brand-teal focus:ring-offset-navy-900"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => alert('For password reset, please contact Tumkur City Municipal Corporation IT Cell (admin@tumkur.gov.in).')}
              className="text-brand-cyan hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan hover:from-teal-600 hover:to-cyan-600 text-white font-bold text-sm shadow-lg shadow-brand-teal/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Tumkur GIS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Fast-Access Pills */}
        <div className="mt-6 pt-5 border-t border-navy-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Instant Demo Sign-in
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin@tumkur.gov.in', 'Tumkur@2026')}
              className="py-1.5 px-2 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-[11px] font-semibold text-rose-300 text-center transition-colors truncate"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('planner@tumkur.gov.in', 'Planner@2026')}
              className="py-1.5 px-2 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-[11px] font-semibold text-cyan-300 text-center transition-colors truncate"
            >
              📐 Planner
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('citizen@tumkur.gov.in', 'Citizen@2026')}
              className="py-1.5 px-2 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 text-[11px] font-semibold text-emerald-300 text-center transition-colors truncate"
            >
              🏡 Citizen
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center text-[11px] text-slate-500">
          <span>Tumkur Smart City Planning Platform • Karnataka, India</span>
        </div>
      </div>
    </div>
  );
};
