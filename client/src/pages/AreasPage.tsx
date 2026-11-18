import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Area } from '../types';
import {
  MapPin,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  School,
  HeartPulse,
  Pill,
  ShoppingBasket,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

export const AreasPage: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'facilities_desc' | 'population_desc'>('name_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadAreas();
  }, [sortBy]);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const res = await api.getAreas({ sort: sortBy });
      setAreas(res.areas);
    } catch (err) {
      console.error('Failed to load areas:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAreas = areas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.pin_code && a.pin_code.includes(search)) ||
    (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>TUMKUR CITY LOCALITIES DIRECTORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Explore Tumkur Areas
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Browse all major localities and neighborhoods in Tumkur city. Select any area to inspect its local infrastructure and nearby facilities.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="bg-navy-800 p-1 rounded-xl flex items-center border border-navy-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search locality name or PIN code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort By:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-navy-800 border border-navy-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium"
          >
            <option value="name_asc">Name (A &rarr; Z)</option>
            <option value="name_desc">Name (Z &rarr; A)</option>
            <option value="facilities_desc">Most Facilities</option>
            <option value="population_desc">Highest Population</option>
          </select>

          <span className="text-slate-500 font-mono ml-2 hidden sm:inline-block">
            {filteredAreas.length} Areas
          </span>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAreas.map((area) => (
            <div
              key={area.id}
              className="bg-navy-900 border border-navy-800 hover:border-brand-teal/60 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Tag & Population */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-brand-cyan flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>PIN {area.pin_code || '572101'}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy-800 text-slate-300">
                    ~{(area.population || 18000).toLocaleString()} residents
                  </span>
                </div>

                {/* Area Name */}
                <h3 className="text-xl font-black text-white group-hover:text-brand-cyan transition-colors">
                  {area.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {area.description || 'Tumkur City locality with registered schools, healthcare centers, and neighborhood shops.'}
                </p>

                {/* Coordinate mini tag */}
                <div className="text-[10px] text-slate-500 font-mono mt-2">
                  Coordinates: {area.latitude.toFixed(4)}°N, {area.longitude.toFixed(4)}°E
                </div>

                {/* Facility Counts Grid (matching Section 6 of prompt) */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-navy-800/80 text-center">
                  <div className="bg-navy-800/70 rounded-xl p-2 border border-navy-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold flex items-center justify-center gap-1">
                      <School className="w-3 h-3 text-blue-400" />
                      <span>Schools</span>
                    </span>
                    <span className="font-extrabold text-white text-sm mt-0.5 block">{area.schools_count ?? 0}</span>
                  </div>

                  <div className="bg-navy-800/70 rounded-xl p-2 border border-navy-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold flex items-center justify-center gap-1">
                      <HeartPulse className="w-3 h-3 text-red-400" />
                      <span>Hospitals</span>
                    </span>
                    <span className="font-extrabold text-white text-sm mt-0.5 block">{area.hospitals_count ?? 0}</span>
                  </div>

                  <div className="bg-navy-800/70 rounded-xl p-2 border border-navy-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold flex items-center justify-center gap-1">
                      <Pill className="w-3 h-3 text-emerald-400" />
                      <span>Medicals</span>
                    </span>
                    <span className="font-extrabold text-white text-sm mt-0.5 block">{area.medical_stores_count ?? 0}</span>
                  </div>

                  <div className="bg-navy-800/70 rounded-xl p-2 border border-navy-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold flex items-center justify-center gap-1">
                      <ShoppingBasket className="w-3 h-3 text-amber-400" />
                      <span>Shops</span>
                    </span>
                    <span className="font-extrabold text-white text-sm mt-0.5 block">
                      {(area.provision_stores_count ?? 0) + (area.other_count ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Total Facilities: <strong className="text-white">{area.facilities_count ?? 0}</strong></span>
                  <span>Layouts: <strong className="text-purple-400">{area.layouts_count ?? 0}</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate(`/areas/${area.id}`)}
                className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-teal/20 transition-all"
              >
                <span>Explore Area</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold bg-navy-950/60">
                  <th className="py-3 px-4">Area / Locality</th>
                  <th className="py-3 px-3">PIN Code</th>
                  <th className="py-3 px-3 text-right">Population</th>
                  <th className="py-3 px-2 text-center text-blue-400">Schools</th>
                  <th className="py-3 px-2 text-center text-red-400">Hospitals</th>
                  <th className="py-3 px-2 text-center text-emerald-400">Medicals</th>
                  <th className="py-3 px-2 text-center text-amber-400">Shops</th>
                  <th className="py-3 px-3 text-center text-brand-cyan">Total Facilities</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {filteredAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white text-sm">
                      <Link to={`/areas/${area.id}`} className="hover:text-brand-cyan flex items-center gap-1.5">
                        <span>{area.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{area.pin_code || '572101'}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {(area.population || 18000).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-blue-300">{area.schools_count ?? 0}</td>
                    <td className="py-3 px-2 text-center font-bold text-red-300">{area.hospitals_count ?? 0}</td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-300">{area.medical_stores_count ?? 0}</td>
                    <td className="py-3 px-2 text-center font-bold text-amber-300">
                      {(area.provision_stores_count ?? 0) + (area.other_count ?? 0)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-teal/20 text-brand-cyan font-bold font-mono">
                        {area.facilities_count ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/areas/${area.id}`}
                        className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-brand-teal text-slate-200 hover:text-white font-bold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <span>Explore</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredAreas.length === 0 && !loading && (
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-12 text-center text-slate-400">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Localities Found</h3>
          <p className="text-sm">Try adjusting your search query or check spelling.</p>
        </div>
      )}
    </div>
  );
};
