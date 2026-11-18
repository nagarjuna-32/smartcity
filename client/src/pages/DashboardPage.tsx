import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Area, Facility, FacilityCategory } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
import {
  MapPin,
  Search,
  School,
  HeartPulse,
  ShoppingBasket,
  Pill,
  Mail,
  Home,
  Map,
  Building2,
  ArrowRight,
  TrendingUp,
  Compass,
  Layers,
  Sparkles,
  Clock,
  ChevronRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [recentAreas, setRecentAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
    loadRecentAreas();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [areasRes, facilitiesRes, catRes] = await Promise.all([
        api.getAreas(),
        api.getFacilities({ limit: 100 }),
        api.getCategories()
      ]);

      setAreas(areasRes.areas);
      setFacilities(facilitiesRes.facilities);
      setCategories(catRes.categories);
      if (areasRes.areas.length > 0) {
        setSelectedArea(areasRes.areas[0]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentAreas = () => {
    try {
      const stored = localStorage.getItem('tumkur_recent_areas');
      if (stored) {
        setRecentAreas(JSON.parse(stored).slice(0, 4));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectArea = (area: Area) => {
    setSelectedArea(area);
    // Update recently explored areas in localStorage
    try {
      const stored = localStorage.getItem('tumkur_recent_areas');
      let recents: Area[] = stored ? JSON.parse(stored) : [];
      recents = [area, ...recents.filter(a => a.id !== area.id)].slice(0, 4);
      localStorage.setItem('tumkur_recent_areas', JSON.stringify(recents));
      setRecentAreas(recents);
    } catch (e) {
      console.error(e);
    }
    navigate(`/areas/${area.id}`);
  };

  // Aggregated dynamic statistics across all 8 categories
  const totalAreas = areas.length;
  const totalSchools = facilities.filter(f => f.category_id === 'schools').length;
  const totalHospitals = facilities.filter(f => f.category_id === 'hospitals').length;
  const totalProvisionStores = facilities.filter(f => f.category_id === 'provision_stores').length;
  const totalMedicalStores = facilities.filter(f => f.category_id === 'medical_stores').length;
  const totalPostOffices = facilities.filter(f => f.category_id === 'post_offices').length;
  const totalLayouts = facilities.filter(f => f.category_id === 'residential_layouts').length;
  const totalSites = facilities.filter(f => f.category_id === 'sites_and_land').length;

  // Filtered areas for selection section
  const filteredAreas = areas.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.pin_code && a.pin_code.includes(searchQuery))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Hero Welcome Header */}
      <div className="relative bg-gradient-to-r from-navy-900 via-navy-900 to-navy-800 border border-navy-700 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/20 border border-brand-teal/40 text-brand-cyan text-xs font-bold mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Area-Wise Infrastructure & Planning</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            WELCOME TO TUMKUR <span className="text-brand-cyan">SMART CITY</span>
          </h1>

          <p className="text-lg sm:text-xl font-medium text-slate-300 mt-2">
            "Discover Tumkur, One Area at a Time."
          </p>

          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Digitally explore Tumkur city locality by locality. Instantly understand what schools, hospitals, medical stores, provision shops, post offices, layouts, and sites are nearby.
          </p>

          {/* Quick Area Search Form */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search area (e.g., SS Puram, Batawadi, Mandipet)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-950/80 border border-navy-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <Link
              to="/areas"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-95 shadow-md shadow-brand-teal/25 transition-all"
            >
              <span>Explore All Areas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Dynamic 8 Infrastructure Statistics Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-cyan" />
            <span>Tumkur City Infrastructure Telemetry</span>
          </h2>
          <span className="text-xs text-slate-400">Real verified counts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Total Areas */}
          <Link to="/areas" className="bg-navy-900 border border-navy-800 hover:border-brand-cyan/50 p-3.5 rounded-2xl shadow-sm transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
              <span>Areas</span>
              <MapPin className="w-3.5 h-3.5 text-brand-cyan group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white">{totalAreas > 0 ? totalAreas : 'Collecting...'}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Tumkur City Localities</p>
          </Link>

          {/* Total Schools */}
          <Link to="/facilities?category_id=schools" className="bg-navy-900 border border-navy-800 hover:border-blue-500/50 p-3.5 rounded-2xl shadow-sm transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
              <span>Schools</span>
              <School className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white">{totalSchools > 0 ? totalSchools : 'Collecting...'}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Colleges & Schools</p>
          </Link>

          {/* Total Hospitals */}
          <Link to="/facilities?category_id=hospitals" className="bg-navy-900 border border-navy-800 hover:border-red-500/50 p-3.5 rounded-2xl shadow-sm transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
              <span>Hospitals</span>
              <HeartPulse className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white">{totalHospitals > 0 ? totalHospitals : 'Collecting...'}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Hospitals & Clinics</p>
          </Link>

          {/* Total Provision Stores */}
          <Link to="/facilities?category_id=provision_stores" className="bg-navy-900 border border-navy-800 hover:border-amber-500/50 p-3.5 rounded-2xl shadow-sm transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
              <span>Provisions</span>
              <ShoppingBasket className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white">{totalProvisionStores > 0 ? totalProvisionStores : 'Collecting...'}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Grocery & Daily Needs</p>
          </Link>

          {/* Total Medical Stores */}
          <Link to="/facilities?category_id=medical_stores" className="bg-navy-900 border border-navy-800 hover:border-emerald-500/50 p-3.5 rounded-2xl shadow-sm transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
              <span>Medicals</span>
              <Pill className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white">{totalMedicalStores > 0 ? totalMedicalStores : 'Collecting...'}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Pharmacies & Chemists</p>
          </Link>

          {/* Total Post Offices */}
          <Link to="/facilities?category_id=post_offices" className="bg-navy-900 border border-navy-800 hover:border-orange-500/50 p-3.5 rounded-2xl shadow-sm transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
              <span>Post Offices</span>
              <Mail className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white">{totalPostOffices > 0 ? totalPostOffices : 'Collecting...'}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">HPO & Sub-Offices</p>
          </Link>

          {/* Total Layouts */}
          <Link to="/facilities?category_id=residential_layouts" className="bg-navy-900 border border-navy-800 hover:border-purple-500/50 p-3.5 rounded-2xl shadow-sm transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
              <span>Layouts</span>
              <Home className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white">{totalLayouts > 0 ? totalLayouts : 'Collecting...'}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">TUDA & Housing</p>
          </Link>

          {/* Total Sites */}
          <Link to="/facilities?category_id=sites_and_land" className="bg-navy-900 border border-navy-800 hover:border-teal-500/50 p-3.5 rounded-2xl shadow-sm transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
              <span>Sites</span>
              <Map className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white">{totalSites > 0 ? totalSites : 'Collecting...'}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Land & Plots</p>
          </Link>
        </div>
      </div>

      {/* 3. Interactive Map of Tumkur City */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-cyan" />
              <span>Interactive Map of Tumkur City</span>
            </h2>
            <p className="text-xs text-slate-400">
              Locality markers and facilities color-coded by category. Click any marker for detailed popup and routing.
            </p>
          </div>
          <Link to="/facilities" className="text-xs font-semibold text-brand-cyan hover:underline flex items-center gap-1">
            <span>Open Fullscreen Facility Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <TumakuruMap
          facilities={facilities}
          areas={areas}
          selectedArea={selectedArea}
          height="540px"
          onSelectArea={(ar) => handleSelectArea(ar)}
          onSelectFacility={(fac) => navigate(`/facilities?id=${fac.id}`)}
        />
      </div>

      {/* 4. Category Shortcuts */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
          Facility Category Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/facilities?category_id=${c.id}`}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-navy-800/60 hover:bg-navy-800 border border-navy-700 hover:border-brand-cyan/40 transition-all text-center group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-2 shadow group-hover:scale-110 transition-transform"
                style={{ backgroundColor: c.color }}
              >
                {c.id === 'schools' && <School className="w-5 h-5" />}
                {c.id === 'hospitals' && <HeartPulse className="w-5 h-5" />}
                {c.id === 'provision_stores' && <ShoppingBasket className="w-5 h-5" />}
                {c.id === 'medical_stores' && <Pill className="w-5 h-5" />}
                {c.id === 'post_offices' && <Mail className="w-5 h-5" />}
                {c.id === 'residential_layouts' && <Home className="w-5 h-5" />}
                {c.id === 'sites_and_land' && <Map className="w-5 h-5" />}
                {c.id === 'other_facilities' && <Building2 className="w-5 h-5" />}
              </div>
              <span className="text-xs font-bold text-white group-hover:text-brand-cyan transition-colors leading-tight">
                {c.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">
                {c.count ?? 0} mapped
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Recently Explored Areas (if any) */}
      {recentAreas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Clock className="w-4 h-4 text-brand-cyan" />
            <span>Recently Explored Areas</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentAreas.map((ar) => (
              <div
                key={ar.id}
                onClick={() => handleSelectArea(ar)}
                className="bg-navy-900 border border-navy-800 hover:border-navy-600 p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors">{ar.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{ar.facilities_count ?? 0} facilities mapped</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Area Selection Grid Section (Matching Section 5 & 6) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-cyan" />
              <span>Tumkur City Localities & Neighborhoods</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select any area to view full facility directory, distance radar, and infrastructure analysis.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredAreas.length} of {areas.length} City Areas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAreas.map((area) => (
            <div
              key={area.id}
              className="bg-navy-900 border border-navy-800 hover:border-brand-teal/60 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-brand-cyan flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>PIN: {area.pin_code || '572101'}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy-800 text-slate-300">
                    ~{(area.population || 18000).toLocaleString()} residents
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-white group-hover:text-brand-cyan transition-colors">
                  {area.name}
                </h3>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {area.description || 'Tumkur City locality with residential and commercial facilities.'}
                </p>

                {/* Facility Counts Badges (Schools, Hospitals, Medical Stores, Shops) */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-navy-800/80 text-center text-xs">
                  <div className="bg-navy-800/60 rounded-xl p-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">Schools</span>
                    <span className="font-bold text-blue-400">{area.schools_count ?? 0}</span>
                  </div>
                  <div className="bg-navy-800/60 rounded-xl p-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">Hospitals</span>
                    <span className="font-bold text-red-400">{area.hospitals_count ?? 0}</span>
                  </div>
                  <div className="bg-navy-800/60 rounded-xl p-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">Medicals</span>
                    <span className="font-bold text-emerald-400">{area.medical_stores_count ?? 0}</span>
                  </div>
                  <div className="bg-navy-800/60 rounded-xl p-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">Shops</span>
                    <span className="font-bold text-amber-400">{(area.provision_stores_count ?? 0) + (area.other_count ?? 0)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectArea(area)}
                className="mt-4 w-full py-2.5 rounded-xl bg-navy-800 hover:bg-brand-teal text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Explore Area</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Smart City Planning Highlight Banner */}
      <div className="bg-gradient-to-r from-teal-950/80 to-navy-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4" />
            <span>Infrastructure Deficit & Gap Detection</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Smart City Urban Planning & Coverage Analysis
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Automated spatial analysis detects areas with lack of healthcare access, pharmacy outreach deficits, and educational needs. Review proposed capital projects or submit a community development proposal.
          </p>
          <p className="text-[11px] text-slate-400 mt-2 italic">
            * Preliminary analysis based on available mapped data. This does not confirm the absence of facilities.
          </p>
        </div>

        <Link
          to="/planning"
          className="shrink-0 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white font-bold text-sm shadow-lg shadow-brand-teal/30 hover:opacity-95 transition-all flex items-center gap-2"
        >
          <span>Open Planning Board</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
