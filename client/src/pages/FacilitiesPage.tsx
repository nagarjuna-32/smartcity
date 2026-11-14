import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Facility, FacilityCategory, Taluk } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
import {
  Layers,
  Search,
  Filter,
  MapPin,
  ExternalLink,
  Navigation,
  School,
  HeartPulse,
  Mail,
  Home,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Compass,
  Phone,
  Globe,
  Calendar,
  ShieldCheck
} from 'lucide-react';

export const FacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || 'all');
  const [selectedTaluk, setSelectedTaluk] = useState(searchParams.get('taluk_id') || 'all');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('operational_status') || 'all');
  const [selectedVerification, setSelectedVerification] = useState(searchParams.get('verification_status') || 'all');

  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [inspectModalFacility, setInspectModalFacility] = useState<Facility | null>(null);

  // Proximity filter state
  const [useProximity, setUseProximity] = useState(false);
  const [radiusKm, setRadiusKm] = useState(15);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [catsRes, talukRes] = await Promise.all([
          api.getCategories(),
          api.getTaluks()
        ]);
        setCategories(catsRes.categories);
        setTaluks(talukRes.taluks);
      } catch (err) {
        console.error('Initial load error:', err);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadFacilities() {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          limit: 150
        };

        if (selectedCategory !== 'all') params.category_id = selectedCategory;
        if (selectedTaluk !== 'all') params.taluk_id = selectedTaluk;
        if (selectedStatus !== 'all') params.operational_status = selectedStatus;
        if (selectedVerification !== 'all') params.verification_status = selectedVerification;
        if (search.trim()) params.search = search.trim();

        if (useProximity && userCoords) {
          params.user_lat = userCoords.lat;
          params.user_lng = userCoords.lng;
          params.radius_km = radiusKm;
        }

        const res = await api.getFacilities(params);
        setFacilities(res.facilities);

        // Check if query parameter has pre-selected facility ID
        const targetId = searchParams.get('id');
        if (targetId) {
          const match = res.facilities.find(f => f.id === targetId);
          if (match) {
            setSelectedFacility(match);
            setInspectModalFacility(match);
          }
        }
      } catch (err) {
        console.error('Facilities fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFacilities();
  }, [selectedCategory, selectedTaluk, selectedStatus, selectedVerification, search, useProximity, radiusKm, userCoords]);

  // Request browser GPS or use Tumakuru City default
  const handleEnableGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setUseProximity(true);
        },
        () => {
          // Default to Tumakuru City Central coordinates
          setUserCoords({ lat: 13.3400, lng: 77.1000 });
          setUseProximity(true);
        }
      );
    } else {
      setUserCoords({ lat: 13.3400, lng: 77.1000 });
      setUseProximity(true);
    }
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'schools_colleges': return <School className="w-4 h-4 text-blue-500" />;
      case 'hospitals': return <HeartPulse className="w-4 h-4 text-red-500" />;
      case 'post_offices': return <Mail className="w-4 h-4 text-amber-500" />;
      case 'residential_layouts': return <Home className="w-4 h-4 text-emerald-500" />;
      case 'sites_land': return <Layers className="w-4 h-4 text-purple-500" />;
      default: return <MapPin className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Header with Counters */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-brand-teal text-xs font-bold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            Core GIS Infrastructure Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
            Tumakuru Interactive Facility Mapping
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Search, filter by administrative taluks, calculate distances, and view verified OpenStreetMap facilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Matching Records</span>
            <span className="text-xl font-black text-slate-900">{facilities.length}</span>
          </div>
          <button
            onClick={handleEnableGPS}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              useProximity
                ? 'bg-brand-teal text-white border-brand-teal shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{useProximity ? 'Proximity Active' : 'Calculate My Distance'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search facility name or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>

          {/* Taluk Dropdown */}
          <select
            value={selectedTaluk}
            onChange={e => setSelectedTaluk(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All 10 Taluks</option>
            {taluks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Operational Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Operational Statuses</option>
            <option value="Operational">Operational (Confirmed active)</option>
            <option value="Under Construction">Under Construction</option>
            <option value="Proposed">Proposed / Planned</option>
            <option value="Temporarily Closed">Temporarily Closed</option>
            <option value="Unknown / Unverified">Unknown / Unverified</option>
          </select>

          {/* Verification Status */}
          <select
            value={selectedVerification}
            onChange={e => setSelectedVerification(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Verification Levels</option>
            <option value="Officially Verified">Officially Verified</option>
            <option value="Admin Verified">Admin Verified</option>
            <option value="OpenStreetMap Listed">OpenStreetMap Listed</option>
            <option value="Community Reported">Community Reported</option>
          </select>
        </div>

        {/* 5 Core Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({facilities.length})
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({cat.count})</span>
            </button>
          ))}

          {useProximity && (
            <div className="ml-auto flex items-center gap-2 text-xs bg-teal-50 text-teal-800 px-3 py-1 rounded-xl border border-teal-200">
              <span>Radius: <strong>{radiusKm} km</strong></span>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={radiusKm}
                onChange={e => setRadiusKm(Number(e.target.value))}
                className="w-20 accent-brand-teal"
              />
              <button onClick={() => setUseProximity(false)} className="text-red-500 font-bold ml-1">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Side-by-Side: Interactive Map (Left) & Filterable List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Panel (7 Cols) */}
        <div className="lg:col-span-7 sticky top-20">
          <TumakuruMap
            facilities={facilities}
            taluks={taluks}
            selectedFacility={selectedFacility}
            onSelectFacility={f => {
              setSelectedFacility(f);
              setInspectModalFacility(f);
            }}
            height="620px"
          />
        </div>

        {/* Directory List Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[620px] overflow-y-auto pr-1">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Querying facilities...</p>
            </div>
          ) : facilities.length > 0 ? (
            facilities.map(f => (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedFacility(f);
                }}
                className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedFacility?.id === f.id
                    ? 'border-brand-teal ring-2 ring-brand-teal/20 shadow-md bg-teal-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal bg-teal-50 px-2 py-0.5 rounded">
                      {f.sub_type}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      f.verification_status === 'Officially Verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {f.verification_status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1 leading-snug">
                    {f.name}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                    {f.address}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 mb-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">📍 {f.taluk_name || 'Tumakuru'}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">🚦 {f.operational_status}</span>
                    {f.distance_km != null && (
                      <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-100">
                        📏 {f.distance_km} km away
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectModalFacility(f);
                    }}
                    className="font-bold text-brand-teal hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Details</span>
                  </button>

                  <a
                    href={`https://www.openstreetmap.org/directions?to=${f.latitude},${f.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[11px]"
                  >
                    <span>Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
              <p className="text-sm font-medium">No facilities found for this filter criteria.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTaluk('all');
                  setSelectedStatus('all');
                  setSelectedVerification('all');
                  setSearch('');
                }}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-brand-teal text-white text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Complete Facility Details Modal */}
      {inspectModalFacility && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                  {inspectModalFacility.sub_type} • {inspectModalFacility.taluk_name}
                </span>
                <h3 className="text-xl font-bold text-navy-900 mt-1">
                  {inspectModalFacility.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectModalFacility(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-900 block mb-0.5">Physical Address</span>
                <p className="text-slate-600 leading-relaxed">{inspectModalFacility.address}</p>
                {inspectModalFacility.pin_code && (
                  <p className="text-slate-500 font-mono mt-1">PIN: {inspectModalFacility.pin_code}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Operational Status</span>
                  <span className="font-bold text-slate-900">🚦 {inspectModalFacility.operational_status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Verification Level</span>
                  <span className="font-bold text-emerald-700">🛡️ {inspectModalFacility.verification_status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Geographic Coords</span>
                  <span className="font-mono text-slate-800">{inspectModalFacility.latitude.toFixed(4)}, {inspectModalFacility.longitude.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Data Origin</span>
                  <span className="font-medium text-slate-800">{inspectModalFacility.data_origin}</span>
                </div>
              </div>

              {/* Contact Details if available */}
              {(inspectModalFacility.contact_phone || inspectModalFacility.contact_email || inspectModalFacility.website) && (
                <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1">
                  <strong className="text-blue-900 block mb-1">Official Contact & Web:</strong>
                  {inspectModalFacility.contact_phone && (
                    <p className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>{inspectModalFacility.contact_phone}</span>
                    </p>
                  )}
                  {inspectModalFacility.website && (
                    <p className="flex items-center gap-2 text-slate-700">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <a href={inspectModalFacility.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {inspectModalFacility.website}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {/* Extended Details Attributes */}
              {inspectModalFacility.details && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <strong className="text-slate-900 block mb-1.5">Verified Institutional Attributes:</strong>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {Object.entries(inspectModalFacility.details).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                        <strong className="text-slate-800">{String(value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Provenance and Verification Rationale */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div><strong>Data Source Authority:</strong> {inspectModalFacility.source_name}</div>
                {inspectModalFacility.source_url && (
                  <div>
                    <strong>Source Link:</strong>{' '}
                    <a href={inspectModalFacility.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline truncate inline-block max-w-xs">
                      {inspectModalFacility.source_url}
                    </a>
                  </div>
                )}
                {inspectModalFacility.last_verified_at && (
                  <div><strong>Last Verification Date:</strong> {inspectModalFacility.last_verified_at}</div>
                )}
                {inspectModalFacility.verification_notes && (
                  <div><strong>Staff Verification Notes:</strong> {inspectModalFacility.verification_notes}</div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <a
                href={`https://www.openstreetmap.org/directions?to=${inspectModalFacility.latitude},${inspectModalFacility.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs text-center flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>🧭 Open Directions in OpenStreetMap</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setInspectModalFacility(null)}
                className="py-3 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
