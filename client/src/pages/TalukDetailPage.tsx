import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Taluk, Area, Facility, ProposedProject } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
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
  ChevronLeft,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

export const TalukDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [taluk, setTaluk] = useState<Taluk | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [projects, setProjects] = useState<ProposedProject[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [activeTab, setActiveTab] = useState<'areas' | 'facilities' | 'projects'>('areas');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    async function loadTaluk() {
      try {
        const res = await api.getTaluk(id!);
        setTaluk(res.taluk);
        setAreas(res.areas);
        setFacilities(res.facilities);
        setProjects(res.proposed_projects);
      } catch (err) {
        console.error('Failed to load taluk:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTaluk();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading taluk intelligence...</p>
      </div>
    );
  }

  if (!taluk) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Taluk Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested taluk identifier does not exist in administrative records.</p>
        <Link to="/taluks" className="mt-4 inline-block px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold">
          ← Return to All Taluks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => navigate('/taluks')}
          className="hover:text-slate-800 flex items-center gap-1 font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All Taluks</span>
        </button>
        <span>/</span>
        <span className="text-slate-800 font-bold">{taluk.name}</span>
      </div>

      {/* Taluk Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-brand-teal text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Taluk Administration
          </div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">
            {taluk.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Headquarters: <strong className="text-slate-800">{taluk.headquarters}</strong> • Coordinates: <strong className="text-slate-800">{taluk.latitude.toFixed(4)}° N, {taluk.longitude.toFixed(4)}° E</strong>
          </p>
          <p className="text-xs text-slate-600 mt-3 max-w-2xl leading-relaxed">
            {taluk.description}
          </p>
        </div>

        {/* Quick Numbers */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Population</span>
            <span className="text-lg font-black text-slate-900">{taluk.population.toLocaleString()}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Land Area</span>
            <span className="text-lg font-black text-slate-900">{taluk.area_sq_km} <span className="text-xs font-normal">km²</span></span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Villages</span>
            <span className="text-lg font-black text-brand-teal">{taluk.total_villages}</span>
          </div>
        </div>
      </div>

      {/* Taluk Map */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {taluk.name} Geographical Asset Mapping
            </h3>
            <p className="text-xs text-slate-500">
              Displaying all registered settlements, facilities, and development zones under this taluk
            </p>
          </div>
        </div>

        <TumakuruMap
          facilities={facilities}
          taluks={[taluk]}
          selectedTaluk={taluk}
          selectedFacility={selectedFacility}
          onSelectFacility={f => setSelectedFacility(f)}
          height="480px"
        />
      </div>

      {/* Tabs: Areas, Facilities, Proposed Projects */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('areas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'areas'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Major Areas & Settlements ({areas.length})
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'facilities'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mapped Facilities ({facilities.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'projects'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Proposed Development ({projects.length})
          </button>
        </div>

        {/* Tab 1: Areas List */}
        {activeTab === 'areas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {areas.map(a => (
              <div
                key={a.id}
                onClick={() => navigate(`/areas/${a.id}`)}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand-teal hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {a.category}
                    </span>
                    {a.pin_code && (
                      <span className="text-xs font-mono text-slate-400">PIN: {a.pin_code}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-brand-teal transition-colors text-base mb-1">
                    {a.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {a.infrastructure_summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{a.facilities_count || 0} Registered Facilities</span>
                  <span className="font-bold text-brand-teal group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Explore Area →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Facilities List */}
        {activeTab === 'facilities' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map(f => (
              <div
                key={f.id}
                onClick={() => setSelectedFacility(f)}
                className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer ${
                  selectedFacility?.id === f.id
                    ? 'border-brand-teal ring-2 ring-brand-teal/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">
                    {f.sub_type}
                  </span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {f.operational_status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{f.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{f.address}</p>
                <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span>Source: {f.source_name}</span>
                  <span className="text-brand-teal font-semibold">View On Map</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Proposed Projects */}
        {activeTab === 'projects' && (
          <div className="space-y-3">
            {projects.length > 0 ? (
              projects.map(p => (
                <div key={p.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        p.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.priority} Priority
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Status: {p.status}</span>
                      {p.target_completion_year && (
                        <span className="text-xs text-slate-400">• Target: {p.target_completion_year}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">{p.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">{p.rationale}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 block">Estimated Budget</span>
                    <span className="text-lg font-black text-brand-teal">
                      ₹{p.estimated_budget_lakhs?.toLocaleString()} <span className="text-xs font-normal text-slate-500">Lakhs</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No proposed projects registered specifically for this taluk. Urban planners can add proposals in the Smart City Planning module.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
