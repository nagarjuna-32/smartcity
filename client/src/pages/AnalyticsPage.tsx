import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Area, FacilityCategory } from '../types';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Download,
  Building2,
  School,
  HeartPulse,
  ShoppingBasket,
  Pill,
  Mail,
  Home,
  Map,
  ArrowRight,
  Info
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [areasRes, catRes, analyticsRes] = await Promise.all([
        api.getAreas(),
        api.getCategories(),
        api.getPlanningAnalytics()
      ]);
      setAreas(areasRes.areas);
      setCategories(catRes.categories);
      setAnalyticsData(analyticsRes);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!areas.length) return;
    const headers = [
      'Area Name',
      'PIN Code',
      'Approx Population',
      'Total Facilities',
      'Schools',
      'Hospitals',
      'Provision Stores',
      'Medical Stores',
      'Post Offices',
      'Residential Layouts',
      'Sites & Land'
    ];
    const rows = areas.map(a => [
      `"${a.name}"`,
      `"${a.pin_code || '572101'}"`,
      a.population || 18000,
      a.facilities_count || 0,
      a.schools_count || 0,
      a.hospitals_count || 0,
      a.provision_stores_count || 0,
      a.medical_stores_count || 0,
      a.post_offices_count || 0,
      a.layouts_count || 0,
      a.sites_count || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tumkur_City_Area_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalFacilities = areas.reduce((sum, a) => sum + (a.facilities_count || 0), 0);
  const sortedByFacilitiesDesc = [...areas].sort((a, b) => (b.facilities_count || 0) - (a.facilities_count || 0));
  const sortedByFacilitiesAsc = [...areas].sort((a, b) => (a.facilities_count || 0) - (b.facilities_count || 0));
  const lowestCoverageAreas = sortedByFacilitiesAsc.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>TUMKUR CITY URBAN TELEMETRY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Infrastructure Analytics
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Statistical comparisons across all 15 Tumkur city localities, facility density distribution, and low-coverage priority zones.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-cyan hover:opacity-95 text-white font-bold text-xs shadow-md shadow-brand-teal/25 flex items-center gap-2 self-start md:self-center transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* High-Level Indicator Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">TOTAL MAPPED FACILITIES</span>
          <div className="text-3xl font-black text-white">{totalFacilities}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 15 preloaded localities</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">HIGHEST COVERAGE AREA</span>
          <div className="text-lg font-black text-emerald-400 truncate mt-1">
            {sortedByFacilitiesDesc[0]?.name || 'SS Puram'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{sortedByFacilitiesDesc[0]?.facilities_count || 0} facilities mapped</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">LOWEST COVERAGE LOCALITY</span>
          <div className="text-lg font-black text-rose-400 truncate mt-1">
            {sortedByFacilitiesAsc[0]?.name || 'Yellapur'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{sortedByFacilitiesAsc[0]?.facilities_count || 0} facilities mapped</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">DETECTED SERVICE DEFICITS</span>
          <div className="text-3xl font-black text-amber-400">
            {analyticsData?.infrastructure_gaps?.length || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Identified across city wards</p>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Locality Infrastructure Ranking */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-cyan" />
              <span>Facility Count by Area (Click to Explore)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">15 Tumkur Localities</span>
          </div>

          <div className="space-y-3">
            {sortedByFacilitiesDesc.map((ar) => {
              const count = ar.facilities_count || 0;
              const maxCount = sortedByFacilitiesDesc[0]?.facilities_count || 1;
              const pct = Math.round((count / maxCount) * 100);

              return (
                <div
                  key={ar.id}
                  onClick={() => navigate(`/areas/${ar.id}`)}
                  className="p-3 rounded-2xl bg-navy-800/50 hover:bg-navy-800 border border-navy-700/60 hover:border-brand-teal transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white group-hover:text-brand-cyan transition-colors">
                        {ar.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">PIN {ar.pin_code || '572101'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-cyan font-mono">{count} Facilities</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-cyan group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-teal to-brand-cyan h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span>Schools: <strong className="text-blue-300">{ar.schools_count || 0}</strong></span>
                    <span>•</span>
                    <span>Hospitals: <strong className="text-red-300">{ar.hospitals_count || 0}</strong></span>
                    <span>•</span>
                    <span>Medicals: <strong className="text-emerald-300">{ar.medical_stores_count || 0}</strong></span>
                    <span>•</span>
                    <span>Shops: <strong className="text-amber-300">{(ar.provision_stores_count || 0) + (ar.other_count || 0)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Share & Lowest Coverage Priority Box */}
        <div className="space-y-6">
          {/* Category Distribution */}
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-teal" />
              <span>Facility Share by Category</span>
            </h3>
            <div className="space-y-3">
              {categories.map((c) => {
                const count = c.count || 0;
                const pct = totalFacilities > 0 ? Math.round((count / totalFacilities) * 100) : 0;
                return (
                  <Link
                    key={c.id}
                    to={`/facilities?category_id=${c.id}`}
                    className="block hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span>{c.name}</span>
                      </span>
                      <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-navy-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: c.color }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section 12: Areas with Lowest Facility Coverage */}
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Areas with Lowest Facility Coverage</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Priority investment zones needing public dispensaries, schools, and commercial convenience outlets.
            </p>

            <div className="space-y-2.5">
              {lowestCoverageAreas.map((ar) => (
                <div
                  key={ar.id}
                  onClick={() => navigate(`/areas/${ar.id}`)}
                  className="p-3 rounded-2xl bg-navy-800/60 hover:bg-navy-800 border border-navy-700/60 hover:border-rose-500/50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-bold text-white text-xs">{ar.name}</h5>
                    <span className="text-[10px] text-slate-400">PIN: {ar.pin_code || '572101'}</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                      {ar.facilities_count || 0} facilities
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
