import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Area, Facility, FacilityCategory, ProposedProject } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
import {
  MapPin,
  School,
  HeartPulse,
  ShoppingBasket,
  Pill,
  Mail,
  Home,
  Map,
  Building2,
  AlertTriangle,
  Compass,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  Filter,
  CheckCircle2,
  Bookmark,
  Share2,
  Navigation
} from 'lucide-react';

export const AreaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [area, setArea] = useState<Area | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [proposedProjects, setProposedProjects] = useState<ProposedProject[]>([]);
  const [infrastructureMetrics, setInfrastructureMetrics] = useState<any>(null);

  // Active Tab: 1. Overview, 2. Map, 3. Facilities, 4. Infrastructure Analysis, 5. Smart Planning
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'facilities' | 'analysis' | 'planning'>('overview');

  // Filters inside Facilities Tab
  const [selectedRadius, setSelectedRadius] = useState<string>('all'); // '0.5', '1', '2', '5', 'all'
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchFacility, setSearchFacility] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (id) {
      loadAreaDetails(id);
    }
  }, [id, selectedRadius, selectedCategoryId]);

  const loadAreaDetails = async (areaId: string) => {
    try {
      setLoading(true);
      const [areaRes, catRes] = await Promise.all([
        api.getArea(areaId, {
          radius_km: selectedRadius !== 'all' ? selectedRadius : undefined,
          category_id: selectedCategoryId !== 'all' ? selectedCategoryId : undefined
        }),
        api.getCategories()
      ]);

      setArea(areaRes.area);
      setFacilities(areaRes.facilities);
      setProposedProjects(areaRes.proposed_projects);
      setInfrastructureMetrics(areaRes.infrastructure_metrics);
      setCategories(catRes.categories);
    } catch (err) {
      console.error('Failed to load area details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!area) return;
    try {
      await api.saveLocation({ item_type: 'area', item_id: area.id, notes: `${area.name} neighborhood` });
      setBookmarked(true);
      alert(`${area.name} saved to your bookmarks!`);
    } catch (err: any) {
      alert(err.message || 'Bookmark updated');
    }
  };

  if (loading && !area) {
    return (
      <div className="py-20 text-center text-slate-400 animate-pulse">
        <MapPin className="w-10 h-10 text-brand-cyan mx-auto mb-3 animate-bounce" />
        <p className="text-sm">Loading locality infrastructure data...</p>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-12 text-center text-slate-400">
        <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Area Not Found</h3>
        <p className="text-xs mb-4">The requested locality could not be located in Tumkur City records.</p>
        <Link to="/areas" className="px-4 py-2 rounded-xl bg-brand-teal text-white font-bold text-xs inline-flex items-center gap-1.5">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Areas Directory</span>
        </Link>
      </div>
    );
  }

  // Filter facilities on client for search and verified-only toggle
  const filteredFacilities = facilities.filter(f => {
    if (verifiedOnly && f.verification_status !== 'Officially Verified' && f.verification_status !== 'Admin Verified') return false;
    if (searchFacility.trim() && !f.name.toLowerCase().includes(searchFacility.toLowerCase()) && !f.sub_type.toLowerCase().includes(searchFacility.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link to="/areas" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-cyan transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Explore All Areas</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmark}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              bookmarked
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-navy-800 border-navy-700 text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{bookmarked ? 'Saved' : 'Save Area'}</span>
          </button>
        </div>
      </div>

      {/* Area Banner Header (matching Section 7: "AREA: SS PURAM") */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-900 to-navy-800 border border-navy-700 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4" />
              <span>Tumkur City Locality Dashboard</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              AREA: {area.name.toUpperCase()}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {area.description || 'Tumkur City locality with surveyed infrastructure facilities and civic amenities.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
              <span>PIN: <strong className="text-white">{area.pin_code || '572101'}</strong></span>
              <span>•</span>
              <span>Population: <strong className="text-white">~{(area.population || 18000).toLocaleString()}</strong></span>
              <span>•</span>
              <span>Coordinates: <strong className="text-slate-300">{area.latitude.toFixed(4)}°N, {area.longitude.toFixed(4)}°E</strong></span>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 text-center">
            <div className="bg-navy-950/70 border border-navy-700/60 rounded-2xl p-3 min-w-[85px]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Schools</span>
              <span className="text-xl font-black text-blue-400">{area.schools_count ?? 0}</span>
            </div>
            <div className="bg-navy-950/70 border border-navy-700/60 rounded-2xl p-3 min-w-[85px]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hospitals</span>
              <span className="text-xl font-black text-red-400">{area.hospitals_count ?? 0}</span>
            </div>
            <div className="bg-navy-950/70 border border-navy-700/60 rounded-2xl p-3 min-w-[85px]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Medicals</span>
              <span className="text-xl font-black text-emerald-400">{area.medical_stores_count ?? 0}</span>
            </div>
            <div className="bg-navy-950/70 border border-navy-700/60 rounded-2xl p-3 min-w-[85px]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Shops</span>
              <span className="text-xl font-black text-amber-400">{(area.provision_stores_count ?? 0) + (area.other_count ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Tabs (Matching Section 7 of Prompt) */}
      <div className="flex items-center gap-2 border-b border-navy-800 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>1. Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'map'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>2. Interactive Map</span>
        </button>

        <button
          onClick={() => setActiveTab('facilities')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'facilities'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>3. Facilities Directory</span>
          <span className="px-1.5 py-0.2 rounded-full bg-navy-800 text-[10px] text-brand-cyan">{facilities.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'analysis'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>4. Infrastructure Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('planning')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'planning'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>5. Smart Planning</span>
          {proposedProjects.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-brand-cyan text-[10px]">{proposedProjects.length}</span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overview Summary */}
            <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-cyan" />
                <span>Area Profile & Infrastructure Summary</span>
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {area.infrastructure_summary || 'This area is an active neighborhood within Tumkur city municipal limits. It provides connectivity to major arterials, public amenities, educational centers, and neighborhood markets.'}
              </p>

              {/* Distance Radar Quick Glance */}
              <div className="pt-4 border-t border-navy-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Critical Distance Radar (from Area Centroid)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-navy-800/60 rounded-2xl p-3 border border-navy-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold">NEAREST HOSPITAL</span>
                    <span className="font-extrabold text-red-400 text-sm mt-0.5 block">
                      {infrastructureMetrics?.nearest_hospital_km != null ? `${infrastructureMetrics.nearest_hospital_km.toFixed(2)} km` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">{infrastructureMetrics?.nearest_hospital_name}</span>
                  </div>

                  <div className="bg-navy-800/60 rounded-2xl p-3 border border-navy-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold">NEAREST SCHOOL</span>
                    <span className="font-extrabold text-blue-400 text-sm mt-0.5 block">
                      {infrastructureMetrics?.nearest_school_km != null ? `${infrastructureMetrics.nearest_school_km.toFixed(2)} km` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">{infrastructureMetrics?.nearest_school_name}</span>
                  </div>

                  <div className="bg-navy-800/60 rounded-2xl p-3 border border-navy-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold">NEAREST PHARMACY</span>
                    <span className="font-extrabold text-emerald-400 text-sm mt-0.5 block">
                      {infrastructureMetrics?.nearest_medical_km != null ? `${infrastructureMetrics.nearest_medical_km.toFixed(2)} km` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">{infrastructureMetrics?.nearest_medical_name}</span>
                  </div>

                  <div className="bg-navy-800/60 rounded-2xl p-3 border border-navy-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold">NEAREST GROCERY</span>
                    <span className="font-extrabold text-amber-400 text-sm mt-0.5 block">
                      {infrastructureMetrics?.nearest_provision_km != null ? `${infrastructureMetrics.nearest_provision_km.toFixed(2)} km` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5">{infrastructureMetrics?.nearest_provision_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Map Preview */}
            <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Map className="w-5 h-5 text-brand-teal" />
                  <span>Geographical Position</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Centered at {area.latitude.toFixed(4)}°N, {area.longitude.toFixed(4)}°E.
                </p>
                <div className="h-44 rounded-2xl overflow-hidden border border-navy-700">
                  <TumakuruMap
                    areas={[area]}
                    selectedArea={area}
                    facilities={facilities.slice(0, 10)}
                    height="176px"
                  />
                </div>
              </div>

              <button
                onClick={() => setActiveTab('map')}
                className="mt-4 w-full py-2.5 rounded-xl bg-navy-800 hover:bg-brand-teal text-slate-200 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Open Full Radius Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key Facilities in this Area */}
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-cyan" />
                <span>Mapped Facilities in {area.name}</span>
              </h3>
              <button
                onClick={() => setActiveTab('facilities')}
                className="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1"
              >
                <span>View All ({facilities.length}) &rarr;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {facilities.slice(0, 6).map((f) => (
                <div
                  key={f.id}
                  className="bg-navy-800/60 border border-navy-700/60 rounded-2xl p-4 hover:border-brand-teal transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-navy-700 text-brand-cyan uppercase">
                        {f.category_name || f.category_id}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {f.distance_km != null ? `${f.distance_km.toFixed(2)} km` : ''}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white leading-tight">{f.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{f.address}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-navy-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-semibold">{f.operational_status}</span>
                    <a
                      href={`https://www.openstreetmap.org/directions?to=${f.latitude},${f.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-cyan hover:underline flex items-center gap-1"
                    >
                      <span>Route</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE MAP WITH RADIUS CIRCLES */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          {/* Radius selector header */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <Compass className="w-4 h-4 text-brand-cyan" />
              <span>Search Radius from {area.name}:</span>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { label: '500 Meters', val: '0.5' },
                { label: '1 Kilometer', val: '1' },
                { label: '2 Kilometers', val: '2' },
                { label: '5 Kilometers', val: '5' },
                { label: 'All Nearby', val: 'all' }
              ].map(r => (
                <button
                  key={r.val}
                  onClick={() => setSelectedRadius(r.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedRadius === r.val
                      ? 'bg-brand-teal text-white shadow-md'
                      : 'bg-navy-800 text-slate-300 hover:text-white border border-navy-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <TumakuruMap
            facilities={facilities}
            areas={[area]}
            selectedArea={area}
            radiusKm={selectedRadius !== 'all' ? parseFloat(selectedRadius) : null}
            height="580px"
            onSelectFacility={(fac) => setSelectedFacility(fac)}
          />
        </div>
      )}

      {/* TAB 3: FACILITIES DIRECTORY */}
      {activeTab === 'facilities' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Category:</span>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
              >
                <option value="all">All 8 Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Radius Filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Radius:</span>
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(e.target.value)}
                className="bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal font-mono"
              >
                <option value="all">All Distances</option>
                <option value="0.5">Within 500 m</option>
                <option value="1">Within 1 km</option>
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
              </select>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search facility name..."
              value={searchFacility}
              onChange={(e) => setSearchFacility(e.target.value)}
              className="bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-1.5 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-teal"
            />

            {/* Verified only checkbox */}
            <label className="flex items-center gap-1.5 text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-navy-700 bg-navy-800 text-brand-teal focus:ring-brand-teal"
              />
              <span>Verified Only</span>
            </label>

            <span className="text-slate-500 font-mono ml-auto">
              {filteredFacilities.length} Facilities
            </span>
          </div>

          {/* Facilities Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFacilities.map((f) => (
              <div
                key={f.id}
                className="bg-navy-900 border border-navy-800 hover:border-brand-teal rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy-800 text-brand-cyan uppercase">
                      {f.category_name || f.category_id}
                    </span>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      {f.distance_km != null ? (f.distance_km < 1 ? `${Math.round(f.distance_km * 1000)} m` : `${f.distance_km.toFixed(2)} km`) : 'N/A'}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-white leading-tight mb-1">{f.name}</h4>
                  <p className="text-xs text-slate-300 font-medium mb-1">{f.sub_type}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{f.address}</p>

                  {f.contact_phone && (
                    <p className="text-[11px] text-slate-300 font-mono mt-2">
                      📞 {f.contact_phone}
                    </p>
                  )}
                  {f.opening_hours && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ⏰ {f.opening_hours}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-navy-800 flex items-center justify-between text-[11px]">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    f.verification_status === 'Officially Verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {f.verification_status}
                  </span>

                  <a
                    href={`https://www.openstreetmap.org/directions?to=${f.latitude},${f.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>Route &rarr;</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredFacilities.length === 0 && (
            <div className="p-12 text-center text-slate-400 bg-navy-900 border border-navy-800 rounded-3xl">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-bold text-white">No facilities found matching filter criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try expanding search radius to 2 km or 5 km.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INFRASTRUCTURE ANALYSIS */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-red-400" />
              <span>Locality Service Coverage & Accessibility Ratios</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Evaluation of physical walking distances and availability of daily civic facilities for residents of {area.name}.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-navy-800/60 rounded-2xl p-4 border border-navy-700">
                <span className="text-xs font-bold text-slate-400 block mb-1">HEALTHCARE ACCESS RADIUS</span>
                <div className="text-xl font-black text-white">
                  {infrastructureMetrics?.nearest_hospital_km != null ? `${infrastructureMetrics.nearest_hospital_km.toFixed(2)} km` : 'No hospital mapped'}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Nearest provider: <strong>{infrastructureMetrics?.nearest_hospital_name}</strong>
                </p>
                <div className="w-full bg-navy-900 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (infrastructureMetrics?.nearest_hospital_km || 9) <= 1.5 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(15, 100 - (infrastructureMetrics?.nearest_hospital_km || 3) * 20))}%` }}
                  />
                </div>
              </div>

              <div className="bg-navy-800/60 rounded-2xl p-4 border border-navy-700">
                <span className="text-xs font-bold text-slate-400 block mb-1">PHARMACY OUTREACH PROXIMITY</span>
                <div className="text-xl font-black text-white">
                  {infrastructureMetrics?.nearest_medical_km != null ? `${infrastructureMetrics.nearest_medical_km.toFixed(2)} km` : 'No pharmacy mapped'}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Nearest chemist: <strong>{infrastructureMetrics?.nearest_medical_name}</strong>
                </p>
                <div className="w-full bg-navy-900 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (infrastructureMetrics?.nearest_medical_km || 9) <= 1.0 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(15, 100 - (infrastructureMetrics?.nearest_medical_km || 3) * 25))}%` }}
                  />
                </div>
              </div>

              <div className="bg-navy-800/60 rounded-2xl p-4 border border-navy-700">
                <span className="text-xs font-bold text-slate-400 block mb-1">PRIMARY & SECONDARY EDUCATION REACH</span>
                <div className="text-xl font-black text-white">
                  {infrastructureMetrics?.nearest_school_km != null ? `${infrastructureMetrics.nearest_school_km.toFixed(2)} km` : 'No school mapped'}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Nearest institution: <strong>{infrastructureMetrics?.nearest_school_name}</strong>
                </p>
                <div className="w-full bg-navy-900 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min(100, Math.max(15, 100 - (infrastructureMetrics?.nearest_school_km || 3) * 20))}%` }}
                  />
                </div>
              </div>

              <div className="bg-navy-800/60 rounded-2xl p-4 border border-navy-700">
                <span className="text-xs font-bold text-slate-400 block mb-1">PROVISION & DAILY NEEDS ACCESSIBILITY</span>
                <div className="text-xl font-black text-white">
                  {infrastructureMetrics?.nearest_provision_km != null ? `${infrastructureMetrics.nearest_provision_km.toFixed(2)} km` : 'No store mapped'}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Nearest essentials store: <strong>{infrastructureMetrics?.nearest_provision_name}</strong>
                </p>
                <div className="w-full bg-navy-900 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${Math.min(100, Math.max(15, 100 - (infrastructureMetrics?.nearest_provision_km || 3) * 25))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SMART PLANNING & GAPS */}
      {activeTab === 'planning' && (
        <div className="space-y-6">
          {/* Automated Gap Alerts */}
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Algorithmic Infrastructure Gap Detection</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Planning Deficits Identified for {area.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Automated detection based on spatial distances to essential healthcare, retail, and public services.
            </p>

            {infrastructureMetrics?.gap_alerts && infrastructureMetrics.gap_alerts.length > 0 ? (
              <div className="space-y-3">
                {infrastructureMetrics.gap_alerts.map((gap: any) => (
                  <div
                    key={gap.id}
                    className="p-4 rounded-2xl bg-navy-800/70 border border-navy-700 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          gap.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {gap.severity} Priority Deficit
                        </span>
                        <h4 className="text-sm font-bold text-white">{gap.type}</h4>
                      </div>
                      <p className="text-xs text-slate-300">{gap.message}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">RECOMMENDATION</span>
                      <span className="text-xs font-bold text-brand-cyan">{gap.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>Good baseline coverage! Primary healthcare, school, pharmacy, and grocery needs are within recommended city walking radii.</span>
              </div>
            )}

            <p className="text-[11px] text-slate-500 italic mt-4">
              * Notice: Preliminary analysis based on available mapped data. This does not confirm the absence of facilities.
            </p>
          </div>

          {/* Proposed Projects for this Area */}
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand-cyan" />
              <span>Proposed Future Capital Works in {area.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Planned development projects submitted for urban review in this locality.
            </p>

            {proposedProjects.length > 0 ? (
              <div className="space-y-3">
                {proposedProjects.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl bg-navy-800/60 border border-navy-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-navy-700 text-brand-cyan">
                          {p.category}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-brand-cyan">
                          {p.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{p.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{p.rationale}</p>
                    </div>

                    <div className="text-right shrink-0 text-xs">
                      <span className="text-[10px] text-slate-400 block font-semibold">ESTIMATED BUDGET</span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        ₹{p.estimated_budget_lakhs ? `${p.estimated_budget_lakhs} Lakhs` : 'TBD'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Target: {p.target_completion_year || 'Ongoing'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No active capital works proposals registered for {area.name} yet.
                <div className="mt-2">
                  <Link to="/planning" className="text-brand-cyan hover:underline font-bold">
                    Propose a project on the Smart City Planning Board &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
