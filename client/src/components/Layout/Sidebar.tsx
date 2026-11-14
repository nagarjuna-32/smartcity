import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Navigation2,
  Layers,
  Compass,
  BarChart3,
  Lightbulb,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight
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
    { label: 'Explore District', to: '/district', icon: MapPin },
    { label: 'Taluks', to: '/taluks', icon: Building2 },
    { label: 'Areas & Villages', to: '/areas', icon: Navigation2 },
    { label: 'Facility Mapping', to: '/facilities', icon: Layers },
    { label: 'Smart City Planning', to: '/planning', icon: Compass },
    { label: 'Infrastructure Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Proposed Projects', to: '/projects', icon: Lightbulb },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin Management', to: '/admin', icon: ShieldAlert });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy-900 border-r border-navy-800 text-slate-300">
      {/* Header / Collapse Toggle */}
      <div className="p-4 flex items-center justify-between border-b border-navy-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tumakuru GIS Portal
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 hidden lg:flex items-center justify-center transition-colors ml-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-teal to-teal-700 text-white shadow-md font-semibold'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer & Sign out */}
      <div className="p-3 border-t border-navy-800 bg-navy-900/50">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2 rounded-lg bg-navy-800/80 border border-navy-700/60">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-brand-cyan font-mono truncate">{user.department || user.role}</p>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-30 transition-all duration-300 ${
          collapsed ? 'w-18' : 'w-64'
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
            className="w-72 h-full bg-navy-900 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
