import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Layers,
  Compass,
  BarChart3,
  Lightbulb,
  Bookmark,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose
}) => {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Explore Areas', to: '/areas', icon: MapPin },
    { label: 'Facility Explorer', to: '/facilities', icon: Layers },
    { label: 'Smart City Planning', to: '/planning', icon: Compass },
    { label: 'Infrastructure Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Proposed Projects', to: '/projects', icon: Lightbulb },
    { label: 'Saved Locations', to: '/saved', icon: Bookmark },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin Panel', to: '/admin', icon: ShieldAlert });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy-900 border-r border-navy-800 text-slate-300">
      {/* Header / Collapse Toggle */}
      <div className="p-4 flex items-center justify-between border-b border-navy-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tumkur City GIS
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 hidden lg:flex items-center justify-center transition-colors ml-auto"
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-teal to-brand-cyan text-white shadow-md shadow-brand-teal/20'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/80'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-navy-800 bg-navy-950/40">
        {user ? (
          <div className="space-y-2">
            {!collapsed && (
              <div className="px-2 py-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white truncate">
                  <UserCheck className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                  <span className="truncate">{user.name}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      user.role === 'Admin'
                        ? 'bg-rose-500/20 text-rose-400'
                        : user.role === 'Planner'
                        ? 'bg-brand-teal/20 text-brand-cyan'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {user.role}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {user.department || 'Citizen'}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-brand-teal text-white hover:bg-brand-cyan transition-colors"
          >
            Sign In
          </NavLink>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onMobileClose}
        >
          <div
            className="w-64 h-full bg-navy-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
