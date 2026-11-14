import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Area, Taluk } from '../types';
import {
  Navigation2,
  MapPin,
  Building2,
  Search,
  Filter,
  ArrowRight,
  Users,
  Compass
} from 'lucide-react';

export const AreasPage: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTalukId = searchParams.get('taluk_id') || 'all';
  const selectedCategory = searchParams.get('category') || 'all';
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const navigate = useNavigate();

  useEffect(() => {
    async function loadTaluks() {
      try {
        const res = await api.getTaluks();
        setTaluks(res.taluks);
      } catch (err) {
        console.error('Taluks load error:', err);
      }
    }
    loadTaluks();
  }, []);

  useEffect(() => {
    async function loadAreas() {
      setLoading(true);
      try {
        const res = await api.getAreas({
          taluk_id: selectedTalukId !== 'all' ? selectedTalukId : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery.trim() || undefined
        });
        setAreas(res.areas);
      } catch (err) {
        console.error('Areas load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAreas();
  }, [selectedTalukId, selectedCategory, searchQuery]);

  const handleTalukChange = (talukId: string) => {
    const next = new URLSearchParams(searchParams);
    if (talukId === 'all') next.delete('taluk_id');
    else next.set('taluk_id', talukId);
    setSearchParams(next);
  };

  const handleCategoryChange = (category: string) => {
    const next = new URLSearchParams(searchParams);
    if (category === 'all') next.delete('category');
    else next.set('category', category);
    setSearchParams(next);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Navigation2 className="w-3.5 h-3.5" />
            Settlements & Localities
          </div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">
            Major Towns, Villages & Local Areas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Dynamic settlement repository spanning 10 taluks, industrial corridors, and educational clusters.
          </p>
        </div>

        {/* Global Total */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Areas Displayed</span>
          <span className="text-xl font-black text-brand-teal">{areas.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between flex-wrap">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search area name or PIN code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <select
            value={selectedTalukId}
            onChange={e => handleTalukChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Taluks (10)</option>
            {taluks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={e => handleCategoryChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Settlement Types</option>
            <option value="City / Urban">City / Urban</option>
            <option value="Town">Town</option>
            <option value="Village">Village</option>
            <option value="Industrial Zone">Industrial Zone</option>
            <option value="Educational Hub">Educational Hub</option>
            <option value="Suburban">Suburban</option>
          </select>

          {(selectedTalukId !== 'all' || selectedCategory !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSearchParams({});
                setSearchQuery('');
              }}
              className="text-xs text-red-500 hover:underline font-bold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid of Areas */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Filtering areas & settlements...</p>
        </div>
      ) : areas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {areas.map(a => (
            <div
              key={a.id}
              onClick={() => navigate(`/areas/${a.id}`)}
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-brand-teal hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    {a.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    📍 {a.taluk_name}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-teal transition-colors mb-1">
                  {a.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                  {a.infrastructure_summary}
                </p>

                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                  {a.population && (
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-medium">
                      👥 {a.population.toLocaleString()} Pop
                    </span>
                  )}
                  {a.pin_code && (
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-mono">
                      PIN {a.pin_code}
                    </span>
                  )}
                  <span className="bg-teal-50 text-brand-teal px-2 py-0.5 rounded border border-teal-100 font-bold ml-auto">
                    {a.facilities_count || 0} Facilities
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-teal group-hover:translate-x-1 transition-transform">
                <span>View Infrastructure & Map</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
          <MapPin className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
          <p className="text-sm font-medium">No settlements found matching current filter parameters.</p>
        </div>
      )}
    </div>
  );
};
