import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearchModal } from '../Search/GlobalSearchModal';
import {
  Search,
  Building,
  Menu,
  LogOut,
  ShieldAlert,
  Compass,
  Layers,
  MapPin,
  Bookmark
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin, isPlanner } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy-900 border-b border-navy-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 lg:hidden focus:outline-none"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2.5 group text-decoration-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-teal to-brand-cyan flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Building className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-wide text-white flex items-center gap-1.5">
                  TUMKUR <span className="text-brand-cyan font-normal">SMART CITY</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase -mt-0.5">
                  Area-Wise Infrastructure & Planning
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Global Search Trigger Button */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full bg-navy-800/80 hover:bg-navy-800 text-slate-400 hover:text-slate-200 border border-navy-700 rounded-xl px-4 py-2 text-xs flex items-center justify-between shadow-inner transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-cyan transition-colors" />
                <span>Search areas (SS Puram, Batawadi), hospitals, schools...</span>
              </div>
              <kbd className="hidden sm:inline-block bg-navy-700 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-navy-600">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right: Quick Links & User Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-slate-300 hover:text-white md:hidden"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              to="/areas"
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Explore Areas</span>
            </Link>

            <Link
              to="/facilities"
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-brand-teal" />
              <span>Facility Explorer</span>
            </Link>

            <Link
              to="/planning"
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-brand-cyan border border-teal-500/30 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Smart Planning</span>
            </Link>

            {/* User Profile Chip */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-teal flex items-center justify-center font-bold text-xs text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-white leading-tight">{user.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-brand-cyan font-mono leading-tight">{user.role}</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-fade-in"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-bold text-sm text-slate-900 leading-tight">{user.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{user.email}</p>
                      <div className="mt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAdmin
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : isPlanner
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {user.role} • {user.department || 'Citizen'}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/areas"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Explore City Areas</span>
                    </Link>

                    <Link
                      to="/saved"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                      <span>Saved Locations</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-brand-teal hover:bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
