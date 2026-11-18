import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Facility, FacilityCategory, Area } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
import {
  Layers,
  Search,
  Filter,
  MapPin,
  ExternalLink,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Map as MapIcon,
  X,
  Plus,
  Navigation
} from 'lucide-react';

export const FacilitiesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category_id') || 'all';
  const initialFacilityId = searchParams.get('id') || null;

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  const [selectedRadius, setSelectedRadius] = useState<string>('all'); // '0.5', '1', '2', '5', 'all'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [operationalStatus, setOperationalStatus] = useState<string>('all');

  // View state
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetaAndFacilities();
  }, [selectedCategory, selectedAreaId, selectedRadius, verifiedOnly, operationalStatus]);

  const loadMetaAndFacilities = async () => {
    try {
      setLoading(true);
      const [catRes, areasRes] = await Promise.all([
        api.getCategories(),
        api.getAreas()
      ]);
      setCategories(catRes.categories);
      setAreas(areasRes.areas);

      // Coordinates of selected area if any
      let lat: number | undefined;
      let lng: number | undefined;

      if (selectedAreaId && selectedAreaId !== 'all') {
        const ar = areasRes.areas.find(a => a.id === selectedAreaId);
        if (ar) {
          lat = ar.latitude;
          lng = ar.longitude;
        }
      }

      const params: Record<string, any> = {
        category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        area_id: selectedAreaId !== 'all' ? selectedAreaId : undefined,
        verified_only: verifiedOnly ? 'true' : undefined,
        operational_status: operationalStatus !== 'all' ? operationalStatus : undefined,
        limit: 150
      };

      if (lat != null && lng != null) {
        params.lat = lat;
        params.lng = lng;
        if (selectedRadius !== 'all') {
          params.radius_km = selectedRadius;
        }
      }

      const facRes = await api.getFacilities(params);
      setFacilities(facRes.facilities);

      if (initialFacilityId) {
        const found = facRes.facilities.find(f => f.id === initialFacilityId);
        if (found) setSelectedFacility(found);
      }
    } catch (err) {
      console.error('Failed to load facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter(f => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.sub_type.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedAreaObj = areas.find(a => a.id === selectedAreaId) || null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>TUMKUR CITY FACILITY DIRECTORY & RADAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Facility Explorer
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Locate nearby schools, hospitals, pharmacies, grocery stores, post offices, layouts, and public amenities across Tumkur city.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="bg-navy-800 p-1 rounded-xl flex items-center border border-navy-700 text-xs">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'both' ? 'bg-brand-teal text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'map' ? 'bg-brand-teal text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Map Only
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'list' ? 'bg-brand-teal text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              List Only
            </button>
          </div>
        </div>
      </div>

      {/* 8 Category Filter Pills (Matching Section 8 of prompt) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-2xl font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 border border-navy-800 text-slate-300 hover:text-white hover:bg-navy-800'
          }`}
        >
          All Categories ({facilities.length})
        </button>

        {categories.map((c) => {
          const isSelected = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-navy-900 border border-navy-800 text-slate-300 hover:text-white hover:bg-navy-800'
              }`}
              style={isSelected ? { backgroundColor: c.color } : {}}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isSelected ? 'white' : c.color }}
              />
              <span>{c.name}</span>
              {c.count != null && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-black/20 text-white' : 'bg-navy-800 text-slate-400'}`}>
                  {c.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Search & Radius Filters */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search facility name, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-teal"
          />
        </div>

        {/* Filter Area */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold">Area:</span>
          <select
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
          >
            <option value="all">Entire Tumkur City</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Proximity Radius */}
        {selectedAreaId !== 'all' && (
          <div className="flex items-center gap-1.5">
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
        )}

        {/* Operational status */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold">Status:</span>
          <select
            value={operationalStatus}
            onChange={(e) => setOperationalStatus(e.target.value)}
            className="bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
          >
            <option value="all">All Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Under Construction">Under Construction</option>
            <option value="Proposed">Proposed</option>
            <option value="Unknown / Unverified">Unverified</option>
          </select>
        </div>

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
          {filteredFacilities.length} Results
        </span>
      </div>

      {/* Main Content Area: Split View / Map / List */}
      <div className={`grid gap-6 ${viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Map View */}
        {(viewMode === 'both' || viewMode === 'map') && (
          <div className={viewMode === 'both' ? 'lg:col-span-7' : 'w-full'}>
            <TumakuruMap
              facilities={filteredFacilities}
              areas={areas}
              selectedFacility={selectedFacility}
              selectedArea={selectedAreaObj}
              radiusKm={selectedRadius !== 'all' ? parseFloat(selectedRadius) : null}
              height={viewMode === 'both' ? '680px' : '750px'}
              onSelectFacility={(f) => setSelectedFacility(f)}
            />
          </div>
        )}

        {/* List View */}
        {(viewMode === 'both' || viewMode === 'list') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-5' : 'w-full'} space-y-3 max-h-[680px] overflow-y-auto pr-1`}>
            {filteredFacilities.map((f) => {
              const isSelected = selectedFacility?.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFacility(f)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-navy-800/90 border-brand-cyan shadow-lg'
                      : 'bg-navy-900 border-navy-800 hover:border-navy-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase text-white shadow-sm"
                      style={{ backgroundColor: f.category_color || '#087E8B' }}
                    >
                      {f.category_name || f.category_id}
                    </span>

                    {f.distance_km != null && (
                      <span className="text-xs font-black text-amber-400 font-mono">
                        {f.distance_km < 1 ? `${Math.round(f.distance_km * 1000)} m` : `${f.distance_km.toFixed(2)} km`}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-extrabold text-white leading-tight mb-1">{f.name}</h4>
                  <p className="text-xs text-brand-cyan font-medium">{f.sub_type}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{f.address}</p>

                  <div className="mt-3 pt-2.5 border-t border-navy-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        f.operational_status === 'Operational' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                      <span className="text-slate-300 font-medium">{f.operational_status}</span>
                    </div>

                    <a
                      href={`https://www.openstreetmap.org/directions?to=${f.latitude},${f.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-brand-cyan hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Route &rarr;</span>
                    </a>
                  </div>
                </div>
              );
            })}

            {filteredFacilities.length === 0 && (
              <div className="p-12 text-center text-slate-400 bg-navy-900 border border-navy-800 rounded-3xl">
                <Layers className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-bold text-white">No facilities match your active filters.</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting category or selecting 'Entire Tumkur City'.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Facility Inspector Drawer (if facility clicked) */}
      {selectedFacility && (
        <div className="bg-navy-900 border border-brand-teal/50 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase text-white shadow-sm"
                style={{ backgroundColor: selectedFacility.category_color || '#087E8B' }}
              >
                {selectedFacility.category_name}
              </span>
              <span className="text-xs text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10">
                {selectedFacility.verification_status}
              </span>
            </div>

            <h3 className="text-xl font-black text-white">{selectedFacility.name}</h3>
            <p className="text-xs text-brand-cyan font-semibold mt-0.5">{selectedFacility.sub_type} • {selectedFacility.area_name || 'Tumkur City'}</p>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedFacility.address}</p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
              {selectedFacility.contact_phone && (
                <span>📞 Phone: <strong className="text-white">{selectedFacility.contact_phone}</strong></span>
              )}
              {selectedFacility.opening_hours && (
                <span>⏰ Hours: <strong className="text-white">{selectedFacility.opening_hours}</strong></span>
              )}
              <span>Coordinates: <strong>{selectedFacility.latitude.toFixed(4)}, {selectedFacility.longitude.toFixed(4)}</strong></span>
            </div>

            <div className="text-[11px] text-slate-400 mt-2">
              Source: <strong className="text-slate-300">{selectedFacility.source_name}</strong> • Last Verified: {selectedFacility.last_verified_at || 'Recent Survey'}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://www.openstreetmap.org/directions?to=${selectedFacility.latitude},${selectedFacility.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-cyan hover:opacity-95 text-white text-xs font-bold shadow-md shadow-brand-teal/25 flex items-center gap-1.5 transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Directions</span>
            </a>

            <button
              onClick={() => setSelectedFacility(null)}
              className="p-2.5 rounded-2xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white border border-navy-700"
              title="Close Details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
