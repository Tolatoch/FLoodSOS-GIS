import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  FloodRiskArea,
  Shelter,
  EvacuationRoute,
  LayerVisibility,
  BasemapType,
  ProvinceId,
  TemporalExtent,
} from '../types';
import {
  NORTHERN_BOUNDS,
  PROVINCES,
  MAJOR_RIVERS,
} from '../data/geoData';
import { Language } from '../data/translations';

interface MapViewProps {
  floodAreas: FloodRiskArea[];
  shelters: Shelter[];
  selectedFloodArea: FloodRiskArea | null;
  selectedShelter: Shelter | null;
  activeRoute: EvacuationRoute | null;
  layers: LayerVisibility;
  basemap: BasemapType;
  selectedProvince: ProvinceId | 'all';
  temporalExtent: TemporalExtent;
  showFrequencyZones: boolean;
  onSelectFloodArea: (area: FloodRiskArea | null) => void;
  onSelectShelter: (shelter: Shelter | null) => void;
  onMapClick: (lat: number, lng: number) => void;
  userLocation: { lat: number; lng: number } | null;
  lang: Language;
}

export const MapView: React.FC<MapViewProps> = ({
  floodAreas,
  shelters,
  selectedFloodArea,
  selectedShelter,
  activeRoute,
  layers,
  basemap,
  selectedProvince,
  temporalExtent,
  showFrequencyZones,
  onSelectFloodArea,
  onSelectShelter,
  onMapClick,
  userLocation,
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(9);

  // Layer groups refs
  const basemapLayerRef = useRef<L.TileLayer | null>(null);
  const floodLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const shelterLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const riverLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userLocLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: [18.9, 99.8],
      zoom: 9,
      minZoom: 8,
      maxZoom: 18,
      maxBounds: NORTHERN_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomSnap: 1,
      zoomDelta: 1,
      zoomControl: false,
    });

    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    floodLayerGroupRef.current = L.layerGroup().addTo(map);
    shelterLayerGroupRef.current = L.layerGroup().addTo(map);
    riverLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);
    userLocLayerGroupRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Basemap Switch (including CartoDB Dark Matter for emergency night mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (basemapLayerRef.current) {
      map.removeLayer(basemapLayerRef.current);
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; OpenStreetMap contributors';

    if (basemap === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; CartoDB Dark Matter';
    } else if (basemap === 'satellite') {
      url =
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri World Imagery';
    } else if (basemap === 'terrain') {
      url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenTopoMap';
    }

    const tileLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19,
    }).addTo(map);

    basemapLayerRef.current = tileLayer;
  }, [basemap]);

  // Handle Province Zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedProvince === 'all') {
      map.flyToBounds(NORTHERN_BOUNDS, { duration: 1.2 });
    } else {
      const p = PROVINCES[selectedProvince];
      if (p) {
        map.flyToBounds(p.bounds, { duration: 1.2, padding: [40, 40] });
      }
    }
  }, [selectedProvince]);

  // Render Rivers
  useEffect(() => {
    const group = riverLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.rivers) return;

    MAJOR_RIVERS.forEach((river) => {
      const poly = L.polyline(river.path, {
        color: basemap === 'dark' ? '#38bdf8' : '#0284c7',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '8, 4',
      });
      poly.bindTooltip(lang === 'th' ? river.nameTh : river.nameEn, {
        permanent: false,
        direction: 'center',
        className: 'bg-slate-900 text-sky-200 px-2 py-1 rounded shadow text-xs font-semibold',
      });
      group.addLayer(poly);
    });
  }, [layers.rivers, basemap, lang]);

  // Render Flood Risk Areas & Temporal/Frequency extent filters
  useEffect(() => {
    const group = floodLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.floodAreas) return;

    // Filter by temporal extent if configured
    const activeAreas = floodAreas.filter((a) => {
      if (!temporalExtent) return true;
      if (temporalExtent === '1_day') return a.temporalExtent === '1_day';
      if (temporalExtent === '3_day') return a.temporalExtent === '1_day' || a.temporalExtent === '3_day';
      return true; // 7-day includes all
    });

    activeAreas.forEach((area) => {
      const isSelected = selectedFloodArea?.id === area.id;

      let color = '#ea580c'; // moderate
      let fillOpacity = 0.40;
      if (area.riskLevel === 'very_high') {
        color = '#9333ea'; // purple critical
        fillOpacity = 0.60;
      } else if (area.riskLevel === 'high') {
        color = '#ef4444'; // red
        fillOpacity = 0.50;
      } else if (area.riskLevel === 'low') {
        color = '#eab308';
        fillOpacity = 0.30;
      } else if (area.riskLevel === 'very_low') {
        color = '#22c55e';
        fillOpacity = 0.25;
      }

      // If frequency zones active, highlight recurrence
      if (showFrequencyZones && area.floodFrequency === '1-3_years') {
        fillOpacity = Math.min(0.85, fillOpacity + 0.2);
      }

      const polygon = L.polygon(area.polygon, {
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 3.5 : 2,
        fillColor: color,
        fillOpacity: isSelected ? 0.75 : fillOpacity,
        dashArray: area.riskLevel === 'very_high' ? '4, 4' : undefined,
      });

      polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectFloodArea(area);
      });

      // Clean tooltip
      polygon.bindTooltip(
        `<b>${lang === 'th' ? area.titleTh : area.titleEn}</b><br/>🌊 ระดับน้ำ: ${area.waterDepthMeters} ม.`,
        { direction: 'top', sticky: true, className: 'bg-slate-900 text-white rounded-lg px-2 py-1 text-xs' }
      );

      group.addLayer(polygon);
    });
  }, [
    floodAreas,
    selectedFloodArea,
    layers.floodAreas,
    temporalExtent,
    showFrequencyZones,
    lang,
    onSelectFloodArea,
  ]);

  // Render Shelters with low-zoom clustering and selective name/elevation reveal
  useEffect(() => {
    const group = shelterLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.shelters) return;

    // 1. Cluster at low zoom (zoomLevel <= 10) if no specific shelter is actively selected
    if (zoomLevel <= 10 && !selectedShelter) {
      const clusters: Record<string, Shelter[]> = {};
      shelters.forEach((s) => {
        if (!clusters[s.province]) clusters[s.province] = [];
        clusters[s.province].push(s);
      });

      Object.entries(clusters).forEach(([provId, items]) => {
        const avgLat = items.reduce((sum, item) => sum + item.lat, 0) / items.length;
        const avgLng = items.reduce((sum, item) => sum + item.lng, 0) / items.length;
        const count = items.length;
        const provInfo = PROVINCES[provId as ProvinceId];
        const provName = provInfo ? (lang === 'th' ? provInfo.nameTh : provInfo.nameEn) : provId;

        const clusterIcon = L.divIcon({
          className: 'shelter-cluster-icon',
          html: `
            <div style="
              background: #059669;
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border: 2.5px solid white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(5,150,105,0.45);
              cursor: pointer;
              font-family: inherit;
              user-select: none;
            ">
              <span style="font-size: 11px; line-height: 1;">🏠</span>
              <span style="font-size: 10px; font-weight: 800; line-height: 1; margin-top: 1px;">${count}</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const clusterMarker = L.marker([avgLat, avgLng], { icon: clusterIcon });
        clusterMarker.bindTooltip(
          `<b>${provName}</b>: ศูนย์พักพิง ${count} แห่ง (คลิกเพื่อซูมเข้า)`,
          { direction: 'top', className: 'bg-emerald-950 text-white rounded-lg px-2 py-1 text-xs' }
        );

        clusterMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (provInfo && mapRef.current) {
            mapRef.current.flyToBounds(provInfo.bounds, { duration: 0.8, padding: [40, 40] });
          }
        });

        group.addLayer(clusterMarker);
      });
      return;
    }

    // 2. Individual Shelter Markers (Zoom > 10 OR a shelter is selected)
    shelters.forEach((shelter) => {
      const isSelected = selectedShelter?.id === shelter.id;
      const freeSlots = shelter.capacity - shelter.currentOccupants;

      // When unselected: compact 24x24 dot without text
      // When selected: full name + elevation badge
      const customHtml = isSelected
        ? `
          <div style="
            background: #0284c7;
            color: white;
            padding: 4px 8px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 6px 18px rgba(2,132,199,0.55);
            border: 2.5px solid white;
            cursor: pointer;
            white-space: nowrap;
            font-size: 11px;
            font-weight: 800;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>${lang === 'th' ? shelter.nameTh : shelter.nameEn}</span>
            <span style="background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 8px; font-size: 10px;">+${shelter.verificationStamp.elevationMsl}m MSL</span>
          </div>
        `
        : `
          <div style="
            background: #059669;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        `;

      const customIcon = L.divIcon({
        className: isSelected ? 'shelter-marker-selected' : 'shelter-marker-dot',
        html: customHtml,
        iconSize: isSelected ? [140, 30] : [24, 24],
        iconAnchor: isSelected ? [70, 15] : [12, 12],
      });

      const marker = L.marker([shelter.lat, shelter.lng], { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectShelter(shelter);
      });

      marker.bindTooltip(
        `<b>${lang === 'th' ? shelter.nameTh : shelter.nameEn}</b><br/>+${shelter.verificationStamp.elevationMsl}m MSL | ว่าง ${freeSlots.toLocaleString()} ที่`,
        { direction: 'top', className: 'bg-emerald-950 text-white rounded-lg px-2 py-1 text-xs' }
      );

      group.addLayer(marker);
    });

    // Keep selected marker inside viewport
    if (selectedShelter && mapRef.current) {
      const map = mapRef.current;
      const pt = L.latLng(selectedShelter.lat, selectedShelter.lng);
      const bounds = map.getBounds().pad(-0.08);
      if (!bounds.contains(pt)) {
        map.panTo(pt, { animate: true });
      }
    }
  }, [shelters, selectedShelter, layers.shelters, zoomLevel, lang, onSelectShelter]);

  // Render Evacuation Route
  useEffect(() => {
    const group = routeLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeRoute) return;

    const isSafe = !activeRoute.hasFloodHazardOnRoute;
    const polyline = L.polyline(activeRoute.coordinates, {
      color: isSafe ? '#10b981' : '#f43f5e',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    });

    group.addLayer(polyline);

    // Origin Marker (User location)
    const originIcon = L.divIcon({
      className: 'origin-marker',
      html: `
        <div style="
          background: #2563eb;
          color: white;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37,99,235,0.5);
          font-weight: 800;
          font-size: 11px;
        ">
          A
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    const originMarker = L.marker(activeRoute.origin, { icon: originIcon });
    originMarker.bindTooltip(lang === 'th' ? 'จุดเริ่มต้น (ผู้ประสบภัย)' : 'Start Location');
    group.addLayer(originMarker);

    // Destination Marker (Verified Safe Shelter)
    const destIcon = L.divIcon({
      className: 'dest-marker',
      html: `
        <div style="
          background: #059669;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(5,150,105,0.6);
          font-weight: 900;
          font-size: 14px;
        ">
          ★
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const destMarker = L.marker(activeRoute.destination, { icon: destIcon });
    destMarker.bindTooltip(lang === 'th' ? 'ศูนย์พักพิงปลอดภัย (Verified Safe)' : 'Safe Shelter');
    group.addLayer(destMarker);

    if (mapRef.current) {
      mapRef.current.fitBounds(polyline.getBounds(), {
        padding: [60, 60],
        maxZoom: 14,
      });
    }
  }, [activeRoute, lang]);

  // Render User Location
  useEffect(() => {
    const group = userLocLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!userLocation) return;

    const radar = L.circle([userLocation.lat, userLocation.lng], {
      radius: 500,
      color: '#0284c7',
      fillColor: '#38bdf8',
      fillOpacity: 0.22,
      weight: 1.5,
    });
    group.addLayer(radar);

    const pin = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8,
      color: '#ffffff',
      fillColor: '#0284c7',
      fillOpacity: 1,
      weight: 3,
    });
    pin.bindTooltip(lang === 'th' ? 'ตำแหน่งปัจจุบันของคุณ' : 'Your Location');
    group.addLayer(pin);
  }, [userLocation, lang]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
