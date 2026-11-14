import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { District, Taluk, SurroundingDistrict } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
import {
  MapPin,
  Building2,
  Compass,
  ArrowRight,
  ShieldCheck,
  Navigation,
  Globe2,
  Users,
  Maximize2,
  Layers,
  ChevronRight
} from 'lucide-react';

export const DistrictPage: React.FC = () => {
  const [district, setDistrict] = useState<District | null>(null);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [surrounding, setSurrounding] = useState<SurroundingDistrict[]>([]);
  const [selectedSurrounding, setSelectedSurrounding] = useState<SurroundingDistrict | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [distRes, talukRes, surrRes] = await Promise.all([
          api.getDistrict(),
          api.getTaluks(),
          api.getSurroundingDistricts()
        ]);
        setDistrict(distRes.district);
        setTaluks(talukRes.taluks);
        setSurrounding(surrRes.surrounding);
      } catch (err) {
        console.error('District page error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* 1. Header & Identity */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-brand-teal text-xs font-bold uppercase tracking-wider mb-2">
            <Globe2 className="w-3.5 h-3.5" />
            Administrative District Profile
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight">
            Tumakuru District
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            State: <strong className="text-slate-800">Karnataka</strong> • Country: <strong className="text-slate-800">India</strong> • Administrative Code: <strong className="text-slate-800">KA-TM</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Land Area</span>
            <span className="text-lg font-black text-slate-900">10,597 <span className="text-xs font-normal text-slate-500">km²</span></span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Population</span>
            <span className="text-lg font-black text-slate-900">2.68 Million</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taluks</span>
            <span className="text-lg font-black text-brand-teal">10 Taluks</span>
          </div>
        </div>
      </div>

      {/* 2. District Description & Important Transport Arteries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-brand-teal" />
            <span>Geographical Overview & Strategic Location</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {district?.description}
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
            <strong className="text-slate-900 block mb-1">Key Transport Corridors Traversing Tumakuru:</strong>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><strong>National Highway 48 (Golden Quadrilateral):</strong> Connects Bengaluru, Tumakuru, Sira, Chitradurga, and Pune/Mumbai.</li>
              <li><strong>National Highway 75:</strong> Traverses Kunigal connecting Bengaluru to Hassan and Mangaluru Port.</li>
              <li><strong>National Highway 73 (Old NH-206):</strong> Connects Tumakuru to Gubbi, Tiptur, Arsikere, and Shivamogga.</li>
              <li><strong>Railway Connectivity:</strong> High-density South Western Railway line connecting Bengaluru to Hubballi and Goa via Tumakuru and Tiptur.</li>
            </ul>
          </div>
        </div>

        {/* Selected Surrounding District Insight Card */}
        <div className="bg-gradient-to-br from-navy-900 to-navy-800 text-white rounded-3xl p-6 border border-navy-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-cyan">
                Neighboring District Focus
              </span>
              <Navigation className="w-4 h-4 text-brand-teal" />
            </div>

            {selectedSurrounding ? (
              <div className="space-y-3">
                <h4 className="text-xl font-bold text-white">{selectedSurrounding.name}</h4>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-navy-700 text-xs text-slate-300 font-mono">
                  Orientation: {selectedSurrounding.direction} • {selectedSurrounding.distance_km} km away
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedSurrounding.description}
                </p>
                <div className="pt-2 text-[11px] text-slate-400">
                  State: <strong className="text-white">{selectedSurrounding.state}</strong>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-bold text-white mb-2">Bordering Districts</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Tumakuru is bounded by 7 Karnataka districts and 1 Andhra Pradesh interstate district. Click any district below or map pin to inspect its relation to Tumakuru without confusing it with internal taluks.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {surrounding.slice(0, 5).map(sd => (
                    <button
                      key={sd.id}
                      onClick={() => setSelectedSurrounding(sd)}
                      className="px-2 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs border border-navy-700"
                    >
                      {sd.name.replace(' District', '')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedSurrounding && (
            <button
              onClick={() => setSelectedSurrounding(null)}
              className="mt-4 text-xs text-brand-cyan hover:underline font-semibold"
            >
              ← Back to general overview
            </button>
          )}
        </div>
      </div>

      {/* 3. Interactive District Map with Centroids */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">District Map & Administrative Boundaries</h3>
            <p className="text-xs text-slate-500">10 Taluk centroid hubs and 8 bordering district anchors</p>
          </div>
          <Link to="/facilities" className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1">
            <span>View Fullscreen Facilities Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <TumakuruMap
          taluks={taluks}
          surroundingDistricts={surrounding}
          height="520px"
        />
      </div>

      {/* 4. Complete Surrounding Districts Roster */}
      <section>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Bordering Neighboring Districts
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Surrounding administrative zones verified against Survey of India & Karnataka Department of Revenue
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {surrounding.map(sd => (
            <div
              key={sd.id}
              onClick={() => setSelectedSurrounding(sd)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedSurrounding?.id === sd.id
                  ? 'bg-teal-50/80 border-brand-teal shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {sd.direction}
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {sd.distance_km} km
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">{sd.name}</h4>
              <p className="text-xs text-slate-500 line-clamp-2">{sd.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Direct Link to Taluk Exploration */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-navy-900 via-teal-950 to-navy-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold">Ready to explore individual taluks?</h4>
          <p className="text-xs text-slate-300">Dive into settlements, facilities, and schools under each of the 10 taluks.</p>
        </div>
        <Link
          to="/taluks"
          className="px-5 py-3 rounded-xl bg-brand-teal hover:bg-teal-600 font-bold text-xs text-white shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>Explore 10 Taluks</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
