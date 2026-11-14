import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Taluk, FacilityCategory } from '../types';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Building2,
  GraduationCap,
  HeartPulse,
  Mail,
  Home,
  MapPin,
  CheckCircle2,
  Download,
  Filter,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedTalukId, setSelectedTalukId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedTalukId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taluksRes, catRes, analyticsRes] = await Promise.all([
        api.getTaluks(),
        api.getCategories(),
        api.getPlanningAnalytics(selectedTalukId || undefined)
      ]);
      setTaluks(taluksRes.taluks);
      setCategories(catRes.categories);
      setAnalyticsData(analyticsRes);
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!taluks.length) return;
    const headers = [
      'Taluk Name',
      'Headquarters',
      'Area (sq km)',
      'Population',
      'Total Facilities',
      'Schools & Colleges',
      'Hospitals',
      'Post Offices',
      'Residential Layouts',
      'Sites'
    ];
    const rows = taluks.map(t => [
      `"${t.name}"`,
      `"${t.headquarters}"`,
      t.area_sq_km,
      t.population,
      t.facilities_count || 0,
      t.schools_count || 0,
      t.hospitals_count || 0,
      t.post_offices_count || 0,
      t.layouts_count || 0,
      t.sites_count || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tumakuru_District_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations
  const totalFacilities = taluks.reduce((sum, t) => sum + (t.facilities_count || 0), 0);
  const totalPopulation = taluks.reduce((sum, t) => sum + t.population, 0);
  const totalArea = taluks.reduce((sum, t) => sum + t.area_sq_km, 0);
  const totalSchools = taluks.reduce((sum, t) => sum + (t.schools_count || 0), 0);
  const totalHospitals = taluks.reduce((sum, t) => sum + (t.hospitals_count || 0), 0);
  const totalPostOffices = taluks.reduce((sum, t) => sum + (t.post_offices_count || 0), 0);

  const highestFacilityTaluk = [...taluks].sort((a, b) => (b.facilities_count || 0) - (a.facilities_count || 0))[0];
  const lowestFacilityTaluk = [...taluks].sort((a, b) => (a.facilities_count || 0) - (b.facilities_count || 0))[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-brand-cyan text-sm font-semibold mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>DISTRICT TELEMETRY & PLANNING METRICS</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Infrastructure & GIS Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Statistical comparisons across all 10 taluks, facility density ratios, and service equity indicators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedTalukId}
              onChange={(e) => setSelectedTalukId(e.target.value)}
              className="bg-navy-800 border border-navy-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              <option value="">All 10 Taluks (District-wide)</option>
              {taluks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} Taluk
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white text-sm font-semibold shadow hover:opacity-95 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-Level Indicator Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>TOTAL MAPPED FACILITIES</span>
            <Layers className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="text-2xl font-black text-white">{totalFacilities}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {taluks.length} taluks & 40+ areas
          </p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>HEALTHCARE ACCESS RATIO</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {totalPopulation > 0 ? (totalPopulation / Math.max(totalHospitals, 1) / 1000).toFixed(1) : 0}k
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Citizens per hospital facility
          </p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>EDUCATION DENSITY</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {totalArea > 0 ? (totalSchools / (totalArea / 1000)).toFixed(1) : 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Colleges/Schools per 1,000 km²
          </p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>POSTAL COVERAGE</span>
            <Mail className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalPostOffices}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Key delivery hubs registered
          </p>
        </div>
      </div>

      {/* Disparity & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Taluk Infrastructure Comparison Table */}
        <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-cyan" />
              Taluk-wise Infrastructure Breakdown
            </h2>
            <span className="text-xs text-slate-400">10 Administrative Taluks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-navy-700 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-3">Taluk</th>
                  <th className="py-3 px-2 text-right">Population</th>
                  <th className="py-3 px-2 text-right">Area (km²)</th>
                  <th className="py-3 px-2 text-center text-blue-400">Schools</th>
                  <th className="py-3 px-2 text-center text-rose-400">Hospitals</th>
                  <th className="py-3 px-2 text-center text-amber-400">Post</th>
                  <th className="py-3 px-2 text-center text-emerald-400">Layouts</th>
                  <th className="py-3 px-3 text-right text-brand-cyan">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {taluks.map((t) => {
                  const facilityCount = t.facilities_count || 0;
                  const maxCount = highestFacilityTaluk?.facilities_count || 1;
                  const percentage = Math.round((facilityCount / maxCount) * 100);

                  return (
                    <tr key={t.id} className="hover:bg-navy-800/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">
                        <Link to={`/taluks/${t.id}`} className="hover:text-brand-cyan flex items-center gap-1.5">
                          {t.name}
                          <ArrowUpRight className="w-3 h-3 text-slate-500" />
                        </Link>
                        <span className="text-[10px] text-slate-400 font-normal block">{t.headquarters} HQ</span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono">{t.population.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-mono">{t.area_sq_km}</td>
                      <td className="py-3 px-2 text-center font-bold text-blue-300">{t.schools_count || 0}</td>
                      <td className="py-3 px-2 text-center font-bold text-rose-300">{t.hospitals_count || 0}</td>
                      <td className="py-3 px-2 text-center font-bold text-amber-300">{t.post_offices_count || 0}</td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-300">{t.layouts_count || 0}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-brand-teal/20 text-brand-cyan font-bold font-mono">
                          {facilityCount}
                        </span>
                        <div className="w-16 bg-navy-800 h-1 rounded-full mt-1.5 ml-auto overflow-hidden">
                          <div
                            className="bg-brand-cyan h-full rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spatial Disparity & Insights */}
        <div className="space-y-6">
          {/* Equity Highlights */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Regional Disparity Index
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Urban concentration vs peripheral taluk coverage balance analysis.
            </p>

            <div className="space-y-4">
              <div className="bg-navy-800/70 border border-navy-700 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">Highest Infrastructure Density</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-white">{highestFacilityTaluk?.name} Taluk</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                    {highestFacilityTaluk?.facilities_count || 0} facilities
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  High concentration of higher education (SIT, Tumkur Univ) and tertiary healthcare.
                </p>
              </div>

              <div className="bg-navy-800/70 border border-navy-700 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">Priority Deficit Taluk</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-white">{lowestFacilityTaluk?.name} Taluk</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold">
                    {lowestFacilityTaluk?.facilities_count || 0} facilities
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Requires accelerated public investment in primary healthcare and technical education centers.
                </p>
              </div>
            </div>
          </div>

          {/* Category Distribution Card */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-cyan" />
              Category Share
            </h3>
            <div className="space-y-3">
              {categories.map((cat) => {
                const count = cat.count || 0;
                const pct = totalFacilities > 0 ? Math.round((count / totalFacilities) * 100) : 0;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">{cat.name}</span>
                      <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-navy-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.color || '#087E8B'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Infrastructure Gaps List */}
      {analyticsData?.infrastructure_gaps && analyticsData.infrastructure_gaps.length > 0 && (
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Planning Gap Detection System
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated algorithmic detection of service deficiencies based on population and spatial distances.
              </p>
            </div>
            <Link
              to="/planning"
              className="text-xs text-brand-cyan hover:underline flex items-center gap-1 font-semibold"
            >
              Propose Project on Planning Board &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsData.infrastructure_gaps.map((gap: any) => (
              <div
                key={gap.id}
                className="bg-navy-800/60 border border-navy-700 hover:border-navy-600 rounded-xl p-4 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-cyan">{gap.taluk_name} Taluk</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        gap.severity === 'High'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {gap.severity} Priority Gap
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5">{gap.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {gap.supporting_data}
                  </p>
                </div>

                <div className="pt-3 border-t border-navy-700/60">
                  <div className="text-[11px] text-slate-400 font-semibold mb-1">
                    RECOMMENDED ACTION:
                  </div>
                  <p className="text-xs text-brand-cyan font-medium">
                    {gap.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Methodology & Traceability Note */}
      <div className="bg-navy-900/60 border border-navy-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Data Integrity Notice: </span>
          All density calculations use the 2011/2021 verified Census baseline and validated administrative boundaries from the Karnataka State Remote Sensing Applications Centre (KSRSAC) and Survey of India. All facility coordinates are ground-verified or linked to OpenStreetMap Overpass geometries.
        </div>
      </div>
    </div>
  );
};
