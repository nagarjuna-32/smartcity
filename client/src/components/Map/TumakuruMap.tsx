import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Facility, Taluk, SurroundingDistrict } from '../../types';
import { ExternalLink, Navigation, Compass, Layers, ShieldCheck, MapPin, Eye } from 'lucide-react';

interface TumakuruMapProps {
  facilities?: Facility[];
  taluks?: Taluk[];
  surroundingDistricts?: SurroundingDistrict[];
  selectedFacility?: Facility | null;
  selectedTaluk?: Taluk | null;
  onSelectFacility?: (facility: Facility) => void;
  onSelectTaluk?: (taluk: Taluk) => void;
  height?: string;
  enableDistanceTool?: boolean;
}

// Marker Icon SVG Generators
const createCategoryIcon = (category: string, operationalStatus: string, isSelected: boolean) => {
  let bgColor = '#3B82F6';
  let iconSvg = '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>'; // Graduation cap

  if (category === 'hospitals') {
    bgColor = '#EF4444';
    iconSvg = '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'; // Heart
  } else if (category === 'post_offices') {
    bgColor = '#F59E0B';
    iconSvg = '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'; // Mail
  } else if (category === 'residential_layouts') {
    bgColor = '#10B981';
    iconSvg = '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'; // Home
  } else if (category === 'sites_land') {
    bgColor = '#8B5CF6';
    iconSvg = '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'; // Pin
  }

  // Ring status color
  let ringColor = '#10B981'; // Operational
  if (operationalStatus === 'Under Construction') ringColor = '#F59E0B';
  else if (operationalStatus === 'Temporarily Closed') ringColor = '#EF4444';
  else if (operationalStatus === 'Proposed') ringColor = '#3B82F6';
  else if (operationalStatus === 'Unknown / Unverified') ringColor = '#94A3B8';

  const size = isSelected ? 42 : 34;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      ${isSelected ? `<div style="position: absolute; inset: -6px; border-radius: 9999px; border: 3px solid #087E8B; animation: pulse-ring 1.8s infinite ease-out;"></div>` : ''}
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        background-color: ${bgColor};
        border: 3px solid ${ringColor};
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 22 : 17}" height="${isSelected ? 22 : 17}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4]
  });
};

export const TumakuruMap: React.FC<TumakuruMapProps> = ({
  facilities = [],
  taluks = [],
  surroundingDistricts = [],
  selectedFacility = null,
  selectedTaluk = null,
  onSelectFacility,
  onSelectTaluk,
  height = '620px',
  enableDistanceTool = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const boundariesLayerRef = useRef<L.LayerGroup | null>(null);
  const measureLineRef = useRef<L.Polyline | null>(null);

  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [activeLayer, setActiveLayer] = useState<'osm' | 'satellite'>('osm');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Tumakuru District
    const map = L.map(mapContainerRef.current, {
      center: [13.3379, 77.1010],
      zoom: 10,
      minZoom: 7,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Standard OpenStreetMap Tile Layer
    const osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Tumakuru Smart City',
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const boundariesGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = markersGroup;
    boundariesLayerRef.current = boundariesGroup;

    // Optional click handler for measuring distance
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (e.originalEvent.shiftKey) {
        setMeasurePoints(prev => {
          const next = [...prev, e.latlng];
          if (next.length > 2) return [e.latlng];
          return next;
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Distance Measurement Line
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (measureLineRef.current) {
      measureLineRef.current.remove();
      measureLineRef.current = null;
    }

    if (measurePoints.length === 2) {
      const line = L.polyline(measurePoints, {
        color: '#EF4444',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.8
      }).addTo(mapInstanceRef.current);
      measureLineRef.current = line;

      const d = measurePoints[0].distanceTo(measurePoints[1]) / 1000;
      setDistanceKm(Math.round(d * 100) / 100);
    } else {
      setDistanceKm(null);
    }
  }, [measurePoints]);

  // Update Taluks & Surrounding Districts
  useEffect(() => {
    if (!mapInstanceRef.current || !boundariesLayerRef.current) return;
    boundariesLayerRef.current.clearLayers();

    // 1. Surrounding Districts (Bordering Karnataka & Andhra Pradesh districts)
    surroundingDistricts.forEach(sd => {
      const marker = L.circleMarker([sd.latitude, sd.longitude], {
        radius: 10,
        fillColor: '#94A3B8',
        color: '#475569',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.5
      });

      marker.bindTooltip(`
        <div style="font-family: inherit; font-size: 12px; font-weight: 600;">
          📍 ${sd.name} (${sd.direction})<br/>
          <span style="font-size: 11px; color: #64748B;">${sd.state} • ${sd.distance_km} km away</span>
        </div>
      `, { direction: 'top' });

      boundariesLayerRef.current?.addLayer(marker);
    });

    // 2. Ten Taluks of Tumakuru District
    taluks.forEach(t => {
      const isCurrentTaluk = selectedTaluk?.id === t.id;

      // Circle representing taluk administrative jurisdiction
      const talukAreaCircle = L.circle([t.latitude, t.longitude], {
        radius: isCurrentTaluk ? 12000 : 9000,
        color: isCurrentTaluk ? '#087E8B' : '#0F2744',
        weight: isCurrentTaluk ? 3 : 1.5,
        fillColor: isCurrentTaluk ? '#087E8B' : '#38BDF8',
        fillOpacity: isCurrentTaluk ? 0.16 : 0.06,
        dashArray: isCurrentTaluk ? undefined : '5, 5'
      });

      // Taluk centroid badge pin
      const talukIcon = L.divIcon({
        html: `
          <div style="
            background: ${isCurrentTaluk ? '#0A192F' : '#0F2744'};
            color: white;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 1px solid ${isCurrentTaluk ? '#00ADB5' : '#38BDF8'};
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
          ">
            <span>🏛️</span>
            <span>${t.name}</span>
          </div>
        `,
        className: 'taluk-label-icon',
        iconAnchor: [45, 12]
      });

      const talukMarker = L.marker([t.latitude, t.longitude], { icon: talukIcon });

      talukMarker.on('click', () => {
        if (onSelectTaluk) onSelectTaluk(t);
        mapInstanceRef.current?.flyTo([t.latitude, t.longitude], 12, { duration: 1.2 });
      });

      boundariesLayerRef.current?.addLayer(talukAreaCircle);
      boundariesLayerRef.current?.addLayer(talukMarker);
    });
  }, [taluks, surroundingDistricts, selectedTaluk, onSelectTaluk]);

  // Update Facility Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    facilities.forEach(f => {
      const isSelected = selectedFacility?.id === f.id;
      const icon = createCategoryIcon(f.category_id, f.operational_status, isSelected);

      const marker = L.marker([f.latitude, f.longitude], { icon });

      // Custom rich popup
      const popupHtml = `
        <div style="font-family: inherit; width: 280px; padding: 14px; color: #1E293B;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${f.category_color || '#087E8B'}; letter-spacing: 0.5px;">
              ${f.sub_type}
            </span>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #E2E8F0; color: #334155; font-weight: 600;">
              ${f.verification_status}
            </span>
          </div>

          <h4 style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #0A192F; line-height: 1.3;">
            ${f.name}
          </h4>

          <p style="margin: 0 0 8px; font-size: 12px; color: #64748B; line-height: 1.4;">
            ${f.address}
          </p>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; font-size: 11px;">
            <span style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; color: #475569;">
              📍 ${f.taluk_name || 'Tumakuru'}
            </span>
            <span style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; color: #475569;">
              🚦 ${f.operational_status}
            </span>
            ${f.pin_code ? `<span style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; color: #475569;">PIN: ${f.pin_code}</span>` : ''}
            ${f.distance_km != null ? `<span style="background: #E0F2FE; color: #0369A1; font-weight: 600; padding: 2px 6px; border-radius: 4px;">📏 ${f.distance_km} km away</span>` : ''}
          </div>

          <div style="border-top: 1px solid #E2E8F0; padding-top: 8px; display: flex; gap: 8px; align-items: center;">
            <a href="https://www.openstreetmap.org/directions?to=${f.latitude},${f.longitude}"
               target="_blank" rel="noopener noreferrer"
               style="flex: 1; text-align: center; background: #087E8B; color: white; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
              <span>🧭 Directions</span>
            </a>
            ${f.source_url ? `
              <a href="${f.source_url}" target="_blank" rel="noopener noreferrer"
                 title="View OpenStreetMap / Authority Source"
                 style="background: #F8FAFC; border: 1px solid #CBD5E1; color: #475569; padding: 6px 8px; border-radius: 6px; font-size: 11px; text-decoration: none;">
                🔗 Source
              </a>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'custom-facility-popup' });

      marker.on('click', () => {
        if (onSelectFacility) onSelectFacility(f);
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // If a specific facility is selected, fly to it
    if (selectedFacility && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedFacility.latitude, selectedFacility.longitude], 15, { duration: 1 });
    }
  }, [facilities, selectedFacility, onSelectFacility]);

  // Recenter map function
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (selectedTaluk) {
      mapInstanceRef.current.flyTo([selectedTaluk.latitude, selectedTaluk.longitude], 12);
    } else {
      mapInstanceRef.current.flyTo([13.3379, 77.1010], 10);
    }
  };

  const handleClearMeasurement = () => {
    setMeasurePoints([]);
    setDistanceKm(null);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
      {/* Map Element */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Floating Control Bar Top Left */}
      <div className="absolute top-4 left-4 z-[500] flex items-center gap-2">
        <button
          onClick={handleRecenter}
          className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 shadow-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-all"
        >
          <Compass className="w-3.5 h-3.5 text-brand-teal" />
          <span>Center Tumakuru</span>
        </button>

        {enableDistanceTool && (
          <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg text-xs font-medium text-slate-700 shadow-lg border border-slate-200 flex items-center gap-2">
            <span>Shift + Click 2 points to measure distance</span>
            {distanceKm != null && (
              <span className="font-bold text-brand-teal bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {distanceKm} km
              </span>
            )}
            {measurePoints.length > 0 && (
              <button
                onClick={handleClearMeasurement}
                className="text-red-500 hover:text-red-700 text-[10px] font-bold"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Map Legend Floating Bottom Left */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg text-xs text-slate-700 max-w-[240px]">
        <div className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-teal" />
          <span>Category Legend</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm"></span>
            <span>Schools & Colleges</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm"></span>
            <span>Hospitals & Health</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
            <span>Post Offices</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
            <span>Residential Layouts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block shadow-sm"></span>
            <span>Sites & Industrial Land</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TumakuruMap;
