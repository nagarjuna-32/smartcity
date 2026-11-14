import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Area, Facility, ProposedProject } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
import {
  MapPin,
  Building2,
  ChevronLeft,
  Navigation2,
  School,
  HeartPulse,
  Mail,
  Home,
  Layers,
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';

export const AreaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [area, setArea] = useState<Area | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [projects, setProjects] = useState<ProposedProject[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    async function loadArea() {
      try {
        const res = await api.getArea(id!);
        setArea(res.area);
        setFacilities(res.facilities);
        setProjects(res.proposed_projects);
      } catch (err) {
        console.error('Failed to load area detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadArea();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold">Loading settlement infrastructure...</p>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Area Not Found</h3>
        <Link to="/areas" className="mt-3 inline-block text-xs font-bold text-brand-teal">
          ← Return to All Areas
        </Link>
      </div>
    );
  }

  const filteredFacilities = selectedCategory === 'all'
    ? facilities
    : facilities.filter(f => f.category_id === selectedCategory);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => navigate('/areas')} className="hover:text-slate-800 flex items-center gap-1 font-semibold">
          <ChevronLeft className="w-4 h-4" />
          <span>All Settlements</span>
        </button>
        <span>/</span>
        <Link to={`/taluks/${area.taluk_id}`} className="hover:text-slate-800 font-semibold">{area.taluk_name}</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">{area.name}</span>
      </div>

      {/* Area Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Navigation2 className="w-3.5 h-3.5" />
            {area.category} • {area.taluk_name}
          </div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">
            {area.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Geographic Coordinates: <strong className="text-slate-800">{area.latitude.toFixed(4)}° N, {area.longitude.toFixed(4)}° E</strong>
            {area.pin_code && <> • Postal PIN: <strong className="text-slate-800">{area.pin_code}</strong></>}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 mt-3 max-w-3xl leading-relaxed">
            {area.infrastructure_summary}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Population</span>
            <span className="text-lg font-black text-slate-900">{area.population ? area.population.toLocaleString() : 'N/A'}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Facilities</span>
            <span className="text-lg font-black text-brand-teal">{facilities.length}</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Centered on this Area */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {area.name} Local Infrastructure Map
            </h3>
            <p className="text-xs text-slate-500">
              All registered schools, hospitals, post offices, layouts, and industrial sites in this settlement
            </p>
          </div>
        </div>

        <TumakuruMap
          facilities={filteredFacilities}
          selectedFacility={selectedFacility}
          onSelectFacility={f => setSelectedFacility(f)}
          height="460px"
        />
      </div>

      {/* Category Filter Pills & Facilities List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-bold text-slate-900">
            Registered Facilities in {area.name} ({filteredFacilities.length})
          </h3>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Facilities ({facilities.length})
            </button>
            <button
              onClick={() => setSelectedCategory('schools_colleges')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'schools_colleges'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Schools & Colleges
            </button>
            <button
              onClick={() => setSelectedCategory('hospitals')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'hospitals'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Hospitals
            </button>
            <button
              onClick={() => setSelectedCategory('post_offices')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'post_offices'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Post Offices
            </button>
            <button
              onClick={() => setSelectedCategory('residential_layouts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'residential_layouts'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Layouts
            </button>
            <button
              onClick={() => setSelectedCategory('sites_land')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedCategory === 'sites_land'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Sites & Land
            </button>
          </div>
        </div>

        {/* Facility Cards Grid */}
        {filteredFacilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFacilities.map(f => (
              <div
                key={f.id}
                onClick={() => setSelectedFacility(f)}
                className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedFacility?.id === f.id
                    ? 'border-brand-teal ring-2 ring-brand-teal/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">
                      {f.sub_type}
                    </span>
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                      {f.verification_status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1">{f.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{f.address}</p>

                  <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600 mb-3">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">🚦 {f.operational_status}</span>
                    {f.contact_phone && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded">📞 {f.contact_phone}</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <a
                    href={`https://www.openstreetmap.org/directions?to=${f.latitude},${f.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="font-bold text-brand-teal hover:underline flex items-center gap-1"
                  >
                    <span>🧭 Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-[11px] text-slate-400">
                    Source: {f.source_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-400 text-xs">
            No registered facilities found in this specific category for {area.name}.
          </div>
        )}
      </div>
    </div>
  );
};
