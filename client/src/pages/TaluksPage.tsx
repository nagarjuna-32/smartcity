import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Taluk } from '../types';
import {
  Building2,
  MapPin,
  Users,
  Compass,
  ArrowRight,
  School,
  HeartPulse,
  Mail,
  Home,
  Layers,
  Search
} from 'lucide-react';

export const TaluksPage: React.FC = () => {
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTaluks() {
      try {
        const res = await api.getTaluks();
        setTaluks(res.taluks);
      } catch (err) {
        console.error('Taluks fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTaluks();
  }, []);

  const filteredTaluks = taluks.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.headquarters.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Administrative Divisions
          </div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">
            10 Administrative Taluks of Tumakuru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Explore settlements, civic infrastructure, and public facilities across all verified taluk jurisdictions.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter taluk or HQ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/30 bg-slate-50"
          />
        </div>
      </div>

      {/* Grid of 10 Taluks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTaluks.map(t => (
          <div
            key={t.id}
            className="bg-white rounded-3xl border border-slate-200 hover:border-brand-teal hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Card Header with Map Badge */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-brand-teal uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Taluk Hub
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {t.latitude.toFixed(2)}° N, {t.longitude.toFixed(2)}° E
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-teal transition-colors mb-1">
                  {t.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Headquarters: <strong>{t.headquarters}</strong></span>
                </p>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {t.description}
                </p>

                {/* Demographic & Geographic Pills */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Population</span>
                    <span className="font-bold text-slate-800">{t.population.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Land Area</span>
                    <span className="font-bold text-slate-800">{t.area_sq_km} <span className="text-[10px] font-normal">km²</span></span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Villages</span>
                    <span className="font-bold text-slate-800">{t.total_villages}</span>
                  </div>
                </div>

                {/* Facility Categorical Micro-counts */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-blue-500" />
                      Schools & Colleges:
                    </span>
                    <strong className="text-slate-900">{t.schools_count || 0}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-red-500" />
                      Hospitals & Health:
                    </span>
                    <strong className="text-slate-900">{t.hospitals_count || 0}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                      Post Offices:
                    </span>
                    <strong className="text-slate-900">{t.post_offices_count || 0}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-emerald-500" />
                      Approved Layouts:
                    </span>
                    <strong className="text-slate-900">{t.layouts_count || 0}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Explore Button Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => navigate(`/taluks/${t.id}`)}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-brand-teal text-slate-800 hover:text-white font-bold text-xs border border-slate-200 hover:border-brand-teal shadow-sm transition-all flex items-center justify-center gap-2 group-hover:bg-brand-teal group-hover:text-white group-hover:border-brand-teal"
              >
                <span>Explore {t.name.replace(' Taluk', '')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
