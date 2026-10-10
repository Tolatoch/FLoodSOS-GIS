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
  hoveredShelterId?: string | null;
  onMapReady?: (map: L.Map) => void;
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
  hoveredShelterId,
  onMapReady,
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
    if (onMapReady) {
      onMapReady(map);
    }

    // ResizeObserver to smoothly adapt whenever the desktop left panel expands/collapses
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
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
      updateWhenZooming: false,
      keepBuffer: 4,
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

  // Render Flood Risk Badge Markers (Replaces polygon overlays)
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

    // 1. While an area is open/selected, draw that area's original outline in the level color (2px line, 15% fill)
    if (selectedFloodArea) {
      let outlineColor = '#16a34a';
      if (selectedFloodArea.riskLevel === 'very_high' || selectedFloodArea.riskLevel === 'high') {
        outlineColor = '#dc2626';
      } else if (selectedFloodArea.riskLevel === 'moderate') {
        outlineColor = '#eab308';
      }

      const outlinePolygon = L.polygon(selectedFloodArea.polygon, {
        color: outlineColor,
        weight: 2,
        fillColor: outlineColor,
        fillOpacity: 0.15,
        interactive: false,
      });
      group.addLayer(outlinePolygon);
    }

    // 2. When zoomed out (zoomLevel <= 10) and no specific flood area is selected:
    // Cluster nearby risk icons into a count badge colored by the highest level inside
    if (zoomLevel <= 10 && !selectedFloodArea) {
      const clusters: Record<string, FloodRiskArea[]> = {};
      activeAreas.forEach((a) => {
        if (!clusters[a.province]) clusters[a.province] = [];
        clusters[a.province].push(a);
      });

      Object.entries(clusters).forEach(([provId, items]) => {
        const avgLat = items.reduce((sum, item) => sum + item.center[0], 0) / items.length;
        const avgLng = items.reduce((sum, item) => sum + item.center[1], 0) / items.length;
        const count = items.length;

        // Determine highest risk level inside
        let highestColor = '#16a34a';
        let isDanger = false;
        if (items.some((i) => i.riskLevel === 'very_high' || i.riskLevel === 'high')) {
          highestColor = '#dc2626';
          isDanger = true;
        } else if (items.some((i) => i.riskLevel === 'moderate')) {
          highestColor = '#eab308';
        }

        const provInfo = PROVINCES[provId as ProvinceId];
        const provName = provInfo ? (lang === 'th' ? provInfo.nameTh : provInfo.nameEn) : provId;

        const clusterHtml = `
          <div class="flood-risk-cluster ${isDanger ? 'animate-pulse-danger' : ''}" style="background-color: ${highestColor};">
            <span>${count}</span>
          </div>
        `;

        const clusterIcon = L.divIcon({
          className: 'flood-risk-icon-wrapper',
          html: clusterHtml,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([avgLat, avgLng], {
          icon: clusterIcon,
          zIndexOffset: -500, // Below shelter markers
        });

        marker.bindTooltip(
          `<b>${provName}</b><br/>${count} ${lang === 'th' ? 'จุดเสี่ยงน้ำท่วม' : 'flood risk areas'}`,
          { direction: 'top', className: 'bg-slate-900 text-white rounded-lg px-2 py-1 text-xs' }
        );

        marker.on('click', () => {
          const map = mapRef.current;
          if (map) {
            const lats = items.map((i) => i.center[0]);
            const lngs = items.map((i) => i.center[1]);
            const bounds = L.latLngBounds(
              [Math.min(...lats), Math.min(...lngs)],
              [Math.max(...lats), Math.max(...lngs)]
            );
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
          }
        });

        group.addLayer(marker);
      });
      return;
    }

    // 3. Individual Flood Risk Badge Markers (zoomLevel > 10 or when an area is selected)
    // Sizing: 28px phone, 32px tablet, 36px desktop via CSS .flood-risk-badge
    const width = window.innerWidth;
    const isMobile = width < 640;
    const isDesktop = width >= 1024;
    const markerDim = isMobile ? 28 : (isDesktop ? 36 : 32);
    const anchorDim = markerDim / 2;

    activeAreas.forEach((area) => {
      const isSelected = selectedFloodArea?.id === area.id;

      // 5-to-3 level mapping:
      // Very Low and Low -> ปกติ (green)
      // Moderate -> แจ้งเตือน (yellow)
      // High and Very High -> อันตราย (red)
      let color = '#16a34a';
      let labelTh = 'ปกติ';
      let labelEn = 'Normal';
      let isDanger = false;
      let svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      `;

      if (area.riskLevel === 'very_high' || area.riskLevel === 'high') {
        color = '#dc2626';
        labelTh = 'อันตราย';
        labelEn = 'Danger';
        isDanger = true;
        svgIcon = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        `;
      } else if (area.riskLevel === 'moderate') {
        color = '#eab308';
        labelTh = 'แจ้งเตือน';
        labelEn = 'Warning';
        svgIcon = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        `;
      }

      const badgeHtml = `
        <div class="flood-risk-badge ${isDanger ? 'animate-pulse-danger' : ''} ${isSelected ? 'scale-125 ring-2 ring-white' : ''}" style="background-color: ${color};">
          ${svgIcon}
        </div>
      `;

      const badgeIcon = L.divIcon({
        className: 'flood-risk-icon-wrapper',
        html: badgeHtml,
        iconSize: [markerDim, markerDim],
        iconAnchor: [anchorDim, anchorDim],
      });

      const marker = L.marker(area.center, {
        icon: badgeIcon,
        zIndexOffset: isSelected ? 200 : -500, // Below shelter markers
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectFloodArea(area);
      });

      marker.bindTooltip(
        `<b>${lang === 'th' ? area.titleTh : area.titleEn}</b><br/>
         <span style="color: ${color}; font-weight: bold;">● ${lang === 'th' ? labelTh : labelEn}</span><br/>
         🌊 ระดับน้ำ: ${area.waterDepthMeters} ม.`,
        { direction: 'top', className: 'bg-slate-900 text-white rounded-lg px-2 py-1 text-xs', offset: [0, -14] }
      );

      group.addLayer(marker);
    });
  }, [
    floodAreas,
    selectedFloodArea,
    layers.floodAreas,
    temporalExtent,
    showFrequencyZones,
    lang,
    zoomLevel,
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

        const clusterMarker = L.marker([avgLat, avgLng], { icon: clusterIcon, zIndexOffset: 600 });
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
    // Responsive marker sizing: 28px phone, 32px tablet, 36px desktop
    const width = window.innerWidth;
    const isMobile = width < 640;
    const isDesktop = width >= 1024;
    const markerDim = isMobile ? 28 : (isDesktop ? 36 : 32);
    const iconAnchorDim = markerDim / 2;

    shelters.forEach((shelter) => {
      const isSelected = selectedShelter?.id === shelter.id;
      const isHovered = hoveredShelterId === shelter.id;
      const freeSlots = shelter.capacity - shelter.currentOccupants;

      // When selected or hovered: highlighted card/glow
      const customHtml = isSelected || isHovered
        ? `
          <div style="
            background: ${isSelected ? '#0284c7' : '#059669'};
            color: white;
            padding: 4px 8px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 6px 20px ${isSelected ? 'rgba(2,132,199,0.7)' : 'rgba(5,150,105,0.7)'};
            border: 2.5px solid white;
            cursor: pointer;
            white-space: nowrap;
            font-size: 11px;
            font-weight: 800;
            transform: scale(${isHovered && !isSelected ? '1.15' : '1'});
            transition: transform 0.15s ease;
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
            width: ${markerDim}px;
            height: ${markerDim}px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <svg width="${isMobile ? 14 : 16}" height="${isMobile ? 14 : 16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        `;

      const customIcon = L.divIcon({
        className: isSelected || isHovered ? 'shelter-marker-selected' : 'shelter-marker-dot',
        html: customHtml,
        iconSize: isSelected || isHovered ? [140, 30] : [markerDim, markerDim],
        iconAnchor: isSelected || isHovered ? [70, 15] : [iconAnchorDim, iconAnchorDim],
      });

      const marker = L.marker([shelter.lat, shelter.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : isHovered ? 900 : 500,
      });

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

    // Center map on selected shelter
    if (selectedShelter && mapRef.current) {
      const map = mapRef.current;
      const pt = L.latLng(selectedShelter.lat, selectedShelter.lng);
      map.panTo(pt, { animate: true });
    }
  }, [shelters, selectedShelter, hoveredShelterId, layers.shelters, zoomLevel, lang, onSelectShelter]);

  // Render Evacuation Route
  useEffect(() => {
    const group = routeLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!activeRoute) return;

    const isSafe = !activeRoute.hasFloodHazardOnRoute;
    const isDesktop = window.innerWidth >= 1024;
    const polyline = L.polyline(activeRoute.coordinates, {
      color: isSafe ? '#10b981' : '#f43f5e',
      weight: isDesktop ? 6 : 5,
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

    // Destination Marker with small anchored pill label (max-width 200px, 14px text on desktop, 12px on phone/tablet, ellipsis)
    const destName = selectedShelter
      ? (lang === 'th' ? selectedShelter.nameTh : selectedShelter.nameEn)
      : (lang === 'th' ? 'ศูนย์พักพิงปลายทาง' : 'Destination Shelter');

    const destFontSize = isDesktop ? '14px' : '12px';
    const destPinDim = isDesktop ? 36 : 32;

    const destIcon = L.divIcon({
      className: 'dest-marker-container',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <!-- Anchored small pill destination label (max-width 200px, 14px on desktop / 12px on phone, one line ellipsis) -->
          <div style="
            position: absolute;
            bottom: calc(100% + 4px);
            background: rgba(15, 23, 42, 0.92);
            color: #ffffff;
            font-size: ${destFontSize};
            font-weight: 700;
            line-height: 1.2;
            padding: 3px 8px;
            border-radius: 9999px;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: 1px solid rgba(255,255,255,0.25);
            pointer-events: auto;
            text-align: center;
          " title="${destName}">
            ${destName}
          </div>

          <!-- Destination Star Pin -->
          <div style="
            background: #059669;
            color: white;
            width: ${destPinDim}px;
            height: ${destPinDim}px;
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(5,150,105,0.6);
            font-weight: 900;
            font-size: ${isDesktop ? '16px' : '14px'};
          ">
            ★
          </div>
        </div>
      `,
      iconSize: [destPinDim, destPinDim],
      iconAnchor: [destPinDim / 2, destPinDim / 2],
    });
    const destMarker = L.marker(activeRoute.destination, { icon: destIcon });
    destMarker.bindTooltip(destName, {
      direction: 'top',
      className: 'bg-emerald-950 text-white rounded-lg px-2.5 py-1 text-xs font-semibold'
    });
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
