import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, ShieldCheck, UserCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'User' | 'Planner' | 'Admin'>('User');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await register({ name, email, password, role });
      } else {
        await login({ email, password });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsRegistering(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-navy-900 overflow-hidden">
      {/* Visual GIS Background Map Overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center filter saturate-150"
        style={{
          backgroundImage: `radial-gradient(#087E8B 1px, transparent 1px), radial-gradient(#00ADB5 1px, #0A192F 1px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px'
        }}
      />

      {/* Radial Gradient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 p-8 sm:p-10 z-10 animate-fade-in">
        {/* Header Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-teal to-brand-cyan flex items-center justify-center text-white shadow-lg mb-3">
            <Building className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-navy-900 tracking-tight flex items-center justify-center gap-1.5">
            TUMAKURU <span className="text-brand-teal">SMART CITY</span>
          </h1>

          <p className="text-xs font-bold text-slate-800 tracking-wider uppercase mt-1">
            "Explore. Analyze. Plan. Develop."
          </p>

          <p className="text-xs text-slate-500 mt-1 font-medium">
            A Smart Digital Platform for Tumakuru District
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal bg-slate-50/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. admin@tumakuru.gov.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal bg-slate-50/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password *
              </label>
              {!isRegistering && (
                <button
                  type="button"
                  onClick={() => alert('For demonstration, use password: "Tumakuru@2026" or "Planner@2026"')}
                  className="text-[11px] text-brand-teal hover:underline font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal bg-slate-50/50"
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Designated Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal bg-slate-50/50"
              >
                <option value="User">Citizen / Public User</option>
                <option value="Planner">Urban Development Planner</option>
              </select>
            </div>
          )}

          {!isRegistering && (
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-brand-teal focus:ring-brand-teal"
                />
                <span>Remember me on this browser</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-navy-800 to-brand-teal hover:from-navy-900 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isRegistering ? 'Create Citizen Account' : 'Access Digital Platform'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="mt-6 text-center text-xs text-slate-600">
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="font-bold text-brand-teal hover:underline ml-1"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="font-bold text-brand-teal hover:underline ml-1"
              >
                Create Account
              </button>
            </>
          )}
        </div>

        {/* One-Click Fast Demo Credentials Pill */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Instant Demo Sign-in
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@tumakuru.gov.in', 'Tumakuru@2026')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold hover:bg-purple-100 transition-colors"
            >
              👑 Admin (Full Access)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('planner@tumakuru.gov.in', 'Planner@2026')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition-colors"
            >
              📐 Urban Planner
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen@tumakuru.gov.in', 'Citizen@2026')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors"
            >
              👤 Citizen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
