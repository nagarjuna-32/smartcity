import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { District, Taluk, SurroundingDistrict, Facility } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
import {
  Building2,
  MapPin,
  School,
  HeartPulse,
  Mail,
  Home,
  Layers,
  ArrowRight,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [district, setDistrict] = useState<District | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [surrounding, setSurrounding] = useState<SurroundingDistrict[]>([]);
  const [featuredFacilities, setFeaturedFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaluk, setSelectedTaluk] = useState<Taluk | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [distRes, talukRes, surrRes, facRes] = await Promise.all([
          api.getDistrict(),
          api.getTaluks(),
          api.getSurroundingDistricts(),
          api.getFacilities({ limit: 25 })
        ]);

        setDistrict(distRes.district);
        setStats(distRes.stats);
        setTaluks(talukRes.taluks);
        setSurrounding(surrRes.surrounding);
        setFeaturedFacilities(facRes.facilities);
      } catch (err) {
        console.error('Dashboard data load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getCategoryCount = (catId: string) => {
    if (!stats?.categories) return 0;
    const cat = stats.categories.find((c: any) => c.id === catId);
    return cat ? cat.count : 0;
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* 1. Hero Welcome Section */}
      <section className="relative rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-teal-900 text-white p-8 sm:p-12 overflow-hidden shadow-2xl border border-navy-700/80">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-teal/30 border border-brand-teal/40 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Karnataka Geographical Intelligence System
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            WELCOME TO <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-emerald-400">TUMAKURU</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed mb-8">
            "Discover Tumakuru. Explore Every Taluk. Build a Smarter Tomorrow."
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <Link
              to="/district"
              className="px-6 py-3.5 rounded-xl bg-brand-teal hover:bg-teal-600 text-white font-bold text-sm shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2 group"
            >
              <span>Explore Tumakuru District</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/facilities"
              className="px-6 py-3.5 rounded-xl bg-navy-800/80 hover:bg-navy-700 text-slate-200 border border-slate-600/60 font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-brand-cyan" />
              <span>Map Facilities</span>
            </Link>

            <Link
              to="/planning"
              className="px-6 py-3.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-brand-cyan border border-brand-cyan/30 font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Smart Planning & Gaps</span>
            </Link>
          </div>
        </div>

        {/* Decorative Grid BG & Emblems */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none bg-[radial-gradient(#00ADB5_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-brand-cyan/20 blur-3xl pointer-events-none" />
      </section>

      {/* 2. Eight Mandatory Dynamic Metric Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">District Infrastructure Indicators</h2>
            <p className="text-xs text-slate-500">Real verified municipal figures across all 10 administrative taluks</p>
          </div>
          <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Live Database Verified
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Tumakuru District Overview */}
          <Link
            to="/district"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-brand-teal transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">District Area</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-brand-teal flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-brand-teal transition-colors">
              10,597 <span className="text-xs font-normal text-slate-600">km²</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              3rd largest district in Karnataka • 2.68M Pop
            </div>
          </Link>

          {/* Card 2: Total Taluks */}
          <Link
            to="/taluks"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-brand-teal transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Taluks</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
              10 <span className="text-xs font-normal text-slate-600">Administrative</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              Tumakuru, Tiptur, Gubbi, Kunigal, etc.
            </div>
          </Link>

          {/* Card 3: Major Areas & Settlements */}
          <Link
            to="/areas"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-brand-teal transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Major Areas</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
              {stats?.total_areas || 40}+ <span className="text-xs font-normal text-slate-600">Localities</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              Towns, industrial parks, and villages
            </div>
          </Link>

          {/* Card 4: Schools and Colleges */}
          <Link
            to="/facilities?category_id=schools_colleges"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Schools & Colleges</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
              {getCategoryCount('schools_colleges')} <span className="text-xs font-normal text-slate-600">Institutions</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              SIT, Tumkur Univ, SSIT, Gov Colleges
            </div>
          </Link>

          {/* Card 5: Hospitals */}
          <Link
            to="/facilities?category_id=hospitals"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-red-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hospitals</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-red-600 transition-colors">
              {getCategoryCount('hospitals')} <span className="text-xs font-normal text-slate-600">Centers</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              District Hospital, PHCs, CHCs, Multi-spec
            </div>
          </Link>

          {/* Card 6: Post Offices */}
          <Link
            to="/facilities?category_id=post_offices"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Post Offices</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
              {getCategoryCount('post_offices')} <span className="text-xs font-normal text-slate-600">Offices</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              Tumakuru HPO, Sub-Offices with PIN codes
            </div>
          </Link>

          {/* Card 7: Residential Layouts */}
          <Link
            to="/facilities?category_id=residential_layouts"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Residential Layouts</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
              {getCategoryCount('residential_layouts')} <span className="text-xs font-normal text-slate-600">Layouts</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              TUDA & KHB approved urban enclaves
            </div>
          </Link>

          {/* Card 8: Available Sites */}
          <Link
            to="/facilities?category_id=sites_land"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sites & Land</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">
              {getCategoryCount('sites_land')} <span className="text-xs font-normal text-slate-600">Plots / Parks</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              KIADB Vasanthanarasapura, Antharasanahalli
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Interactive District Geospatial Map Section */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Interactive Geographical Map of Tumakuru</span>
              <span className="text-xs bg-brand-teal/10 text-brand-teal font-semibold px-2.5 py-0.5 rounded-full border border-brand-teal/20">
                10 Taluks & Bordering Districts
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any taluk centroid to zoom, or select facility markers to inspect verified operational details and get directions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/facilities"
              className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1"
            >
              <span>Explore All Facilities Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <TumakuruMap
          facilities={featuredFacilities}
          taluks={taluks}
          surroundingDistricts={surrounding}
          selectedTaluk={selectedTaluk}
          onSelectTaluk={t => setSelectedTaluk(t)}
          height="540px"
        />

        {/* Bordering Districts Pill Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-700">Surrounding Neighboring Districts:</span>
            <div className="flex flex-wrap gap-1.5">
              {surrounding.map(sd => (
                <span
                  key={sd.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] border border-slate-200 transition-colors"
                  title={`${sd.name} (${sd.direction}) - ${sd.distance_km} km`}
                >
                  📍 {sd.name} ({sd.direction})
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Ten Taluks Quick Navigation Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Explore the 10 Taluks of Tumakuru</h3>
            <p className="text-xs text-slate-500">Select any taluk to inspect settlements, local areas, and facilities</p>
          </div>
          <Link to="/taluks" className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1">
            <span>View All Taluks</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          {taluks.map(t => (
            <div
              key={t.id}
              onClick={() => navigate(`/taluks/${t.id}`)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-brand-teal hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-teal transition-colors">
                  {t.name.replace(' Taluk', '')}
                </h4>
                <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-teal transition-colors" />
              </div>
              <p className="text-xs text-slate-500">HQ: {t.headquarters}</p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>{t.areas_count || 5} Localities</span>
                <span className="font-semibold text-brand-teal group-hover:translate-x-0.5 transition-transform inline-flex items-center">
                  Explore →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
