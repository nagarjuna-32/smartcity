import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Facility, Area, ProposedProject } from '../../types';
import { ExternalLink, Compass, Layers, ShieldCheck, MapPin, Eye } from 'lucide-react';

interface TumakuruMapProps {
  facilities?: Facility[];
  areas?: Area[];
  proposedProjects?: ProposedProject[];
  selectedFacility?: Facility | null;
  selectedArea?: Area | null;
  radiusKm?: number | null;
  onSelectFacility?: (facility: Facility) => void;
  onSelectArea?: (area: Area) => void;
  height?: string;
  enableDistanceTool?: boolean;
}

// Marker Icon SVG Generators for all 8 Categories
const createCategoryIcon = (category: string, operationalStatus: string, isSelected: boolean) => {
  let bgColor = '#2563EB'; // schools - blue
  let iconSvg = '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>'; // cap

  if (category === 'hospitals') {
    bgColor = '#DC2626'; // red
    iconSvg = '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>';
  } else if (category === 'provision_stores') {
    bgColor = '#D97706'; // amber
    iconSvg = '<path d="m5 11 4-7"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.6-7.4"/><path d="m9 11 1 9"/><path d="m15 11-1 9"/>'; // basket
  } else if (category === 'medical_stores') {
    bgColor = '#059669'; // emerald
    iconSvg = '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>'; // pill
  } else if (category === 'post_offices') {
    bgColor = '#EA580C'; // orange
    iconSvg = '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'; // mail
  } else if (category === 'residential_layouts') {
    bgColor = '#7C3AED'; // purple
    iconSvg = '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'; // home
  } else if (category === 'sites_and_land' || category === 'sites_land') {
    bgColor = '#087E8B'; // teal
    iconSvg = '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>'; // map
  } else if (category === 'other_facilities') {
    bgColor = '#475569'; // slate
    iconSvg = '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>'; // building
  }

  // Halo status ring
  let ringColor = '#10B981'; // Operational
  if (operationalStatus === 'Under Construction') ringColor = '#F59E0B';
  else if (operationalStatus === 'Temporarily Closed') ringColor = '#EF4444';
  else if (operationalStatus === 'Proposed') ringColor = '#3B82F6';
  else if (operationalStatus === 'Unknown / Unverified') ringColor = '#94A3B8';

  const size = isSelected ? 40 : 32;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      ${isSelected ? `<div style="position: absolute; inset: -5px; border-radius: 9999px; border: 3px solid #00ADB5; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        background-color: ${bgColor};
        border: 2.5px solid ${ringColor};
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 20 : 16}" height="${isSelected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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

// Area centroid marker
const createAreaIcon = (name: string, count: number, isSelected: boolean) => {
  const html = `
    <div style="
      background: ${isSelected ? '#087E8B' : '#0A192F'};
      color: white;
      border: 2px solid ${isSelected ? '#00ADB5' : '#64748B'};
      border-radius: 12px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      transform: translate(-50%, -50%);
    ">
      <span style="display: inline-block; width: 7px; height: 7px; border-radius: 9999px; background: #00ADB5;"></span>
      <span>${name}</span>
      <span style="background: rgba(255,255,255,0.2); padding: 1px 5px; border-radius: 8px; font-size: 10px;">${count}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'area-marker-pin',
    iconSize: [120, 26],
    iconAnchor: [60, 13],
    popupAnchor: [0, -14]
  });
};

// Proposed Project Marker
const createProposedProjectIcon = (category: string) => {
  const html = `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <div style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px dashed #00ADB5; animation: spin 8s linear infinite;"></div>
      <div style="
        width: 100%;
        height: 100%;
        border-radius: 9999px;
        background-color: #0F172A;
        border: 2px solid #00ADB5;
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00ADB5;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
          <path d="M9 18h6"/><path d="M10 22h4"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'proposed-project-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

export const TumakuruMap: React.FC<TumakuruMapProps> = ({
  facilities = [],
  areas = [],
  proposedProjects = [],
  selectedFacility = null,
  selectedArea = null,
  radiusKm = null,
  onSelectFacility,
  onSelectArea,
  height = '520px',
  enableDistanceTool = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const facilityLayerGroup = useRef<L.LayerGroup | null>(null);
  const areaLayerGroup = useRef<L.LayerGroup | null>(null);
  const projectLayerGroup = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Tumkur City Center Coordinates
  const TUMKUR_CENTER = { lat: 13.3400, lng: 77.1000 };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // Already initialized

    const map = L.map(mapContainerRef.current, {
      center: [TUMKUR_CENTER.lat, TUMKUR_CENTER.lng],
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap Carto Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • Tumkur Smart City'
    }).addTo(map);

    // Layers
    facilityLayerGroup.current = L.layerGroup().addTo(map);
    areaLayerGroup.current = L.layerGroup().addTo(map);
    projectLayerGroup.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render Areas Markers
  useEffect(() => {
    const map = mapRef.current;
    const group = areaLayerGroup.current;
    if (!map || !group) return;

    group.clearLayers();

    areas.forEach((area) => {
      const isSelected = selectedArea?.id === area.id;
      const count = area.facilities_count ?? 0;
      const marker = L.marker([area.latitude, area.longitude], {
        icon: createAreaIcon(area.name, count, isSelected),
        zIndexOffset: isSelected ? 500 : 200
      });

      marker.on('click', () => {
        if (onSelectArea) onSelectArea(area);
      });

      marker.bindTooltip(`<b>${area.name}</b><br/>${count} facilities mapped`, {
        direction: 'top',
        offset: [0, -10]
      });

      group.addLayer(marker);
    });
  }, [areas, selectedArea, onSelectArea]);

  // Render Radius Circle Overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    if (selectedArea && radiusKm && radiusKm > 0) {
      const circle = L.circle([selectedArea.latitude, selectedArea.longitude], {
        radius: radiusKm * 1000,
        color: '#00ADB5',
        weight: 2,
        fillColor: '#087E8B',
        fillOpacity: 0.1,
        dashArray: '6, 8'
      }).addTo(map);

      radiusCircleRef.current = circle;
    }
  }, [selectedArea, radiusKm]);

  // Render Facilities Markers
  useEffect(() => {
    const map = mapRef.current;
    const group = facilityLayerGroup.current;
    if (!map || !group) return;

    group.clearLayers();

    facilities.forEach((f) => {
      const isSelected = selectedFacility?.id === f.id;
      const marker = L.marker([f.latitude, f.longitude], {
        icon: createCategoryIcon(f.category_id, f.operational_status, isSelected),
        zIndexOffset: isSelected ? 1000 : 300
      });

      // Interactive Popup Content
      const distInfo = f.distance_km != null ? `<b>Distance:</b> ${f.distance_km < 1 ? `${Math.round(f.distance_km * 1000)} m` : `${f.distance_km.toFixed(2)} km`}<br/>` : '';
      const phoneInfo = f.contact_phone ? `<b>Phone:</b> ${f.contact_phone}<br/>` : '';
      const hoursInfo = f.opening_hours ? `<b>Hours:</b> ${f.opening_hours}<br/>` : '';
      const dirLink = `https://www.openstreetmap.org/directions?to=${f.latitude},${f.longitude}`;

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #1E293B; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #087E8B;">${f.category_name || f.category_id}</span>
            <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: ${f.operational_status === 'Operational' ? '#DCFCE7; color: #15803D;' : '#FEF3C7; color: #B45309;'}">${f.operational_status}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 4px 0; color: #0F172A;">${f.name}</h4>
          <p style="margin: 0 0 6px 0; color: #64748B; font-size: 11px;">${f.address}</p>
          <div style="margin: 4px 0; font-size: 11px;">
            ${distInfo}
            ${phoneInfo}
            ${hoursInfo}
            <b>Source:</b> ${f.source_name || 'Municipal Survey'}
          </div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between;">
            <a href="${dirLink}" target="_blank" rel="noopener noreferrer" style="color: #087E8B; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 3px;">
              Directions &rarr;
            </a>
            <span style="font-size: 9px; color: #94A3B8;">${f.verification_status}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectFacility) onSelectFacility(f);
      });

      group.addLayer(marker);
    });

    // If selected facility exists, pan to it
    if (selectedFacility && map) {
      map.setView([selectedFacility.latitude, selectedFacility.longitude], 15, { animate: true });
    } else if (selectedArea && map) {
      map.setView([selectedArea.latitude, selectedArea.longitude], 14, { animate: true });
    }
  }, [facilities, selectedFacility, selectedArea, onSelectFacility]);

  // Render Proposed Projects
  useEffect(() => {
    const map = mapRef.current;
    const group = projectLayerGroup.current;
    if (!map || !group) return;

    group.clearLayers();

    proposedProjects.forEach((proj) => {
      const marker = L.marker([proj.latitude, proj.longitude], {
        icon: createProposedProjectIcon(proj.category),
        zIndexOffset: 450
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #0F172A; min-width: 200px;">
          <div style="font-size: 10px; font-weight: 700; color: #087E8B; text-transform: uppercase;">PROPOSED INFRASTRUCTURE</div>
          <h4 style="font-size: 13px; font-weight: 800; margin: 2px 0;">${proj.title}</h4>
          <p style="font-size: 11px; color: #64748B; margin: 4px 0;">${proj.rationale}</p>
          <div style="font-size: 11px; margin-top: 4px;">
            <b>Budget:</b> ₹${proj.estimated_budget_lakhs ? `${proj.estimated_budget_lakhs} Lakhs` : 'TBD'}<br/>
            <b>Status:</b> ${proj.status} • <b>Priority:</b> ${proj.priority}
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);
      group.addLayer(marker);
    });
  }, [proposedProjects]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-navy-700 shadow-xl bg-navy-900" style={{ height }}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Legend / Quick Map Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-navy-900/90 backdrop-blur-md border border-navy-700/80 rounded-xl p-2.5 text-xs text-white shadow-lg pointer-events-auto flex flex-col gap-1.5">
        <div className="flex items-center gap-2 font-bold text-[11px] text-brand-cyan uppercase">
          <Layers className="w-3.5 h-3.5" />
          <span>Tumkur City Legend</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Schools & Colleges</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Hospitals & Health</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            <span>Provision Stores</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Medical Stores</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
            <span>Post Offices</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            <span>Residential Layouts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <span>Sites & Land</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-teal-400 border-dashed bg-slate-800"></span>
            <span>Proposed Projects</span>
          </div>
        </div>
      </div>
    </div>
  );
};
