import React, { useState, useEffect } from 'react';
import {
  Compass,
  AlertTriangle,
  RefreshCw,
  Lock,
  ShieldCheck,
  ArrowLeft,
  Navigation as NavigationIcon,
  Layers as LayersIcon,
  Eye,
  Info,
} from 'lucide-react';
import {
  ProvinceId,
  FloodRiskArea,
  Shelter,
  EvacuationRoute,
  LayerVisibility,
  BasemapType,
  AppViewMode,
  User,
  TemporalExtent,
} from './types';
import {
  INITIAL_FLOOD_RISK_AREAS,
  INITIAL_SHELTERS,
  PROVINCES,
} from './data/geoData';
import { TRANSLATIONS, Language } from './data/translations';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { LayerControl } from './components/LayerControl';
import { MapLegend } from './components/MapLegend';
import { FloodDetailModal } from './components/FloodDetailModal';
import { ShelterFinderPanel } from './components/ShelterFinderPanel';
import { EvacuationRoutePanel } from './components/EvacuationRoutePanel';
import { DashboardView } from './components/DashboardView';
import { AIAgentDrawer } from './components/AIAgentDrawer';
import { AuthModal } from './components/AuthModal';
import { AdminLayout } from './components/Admin/AdminLayout';
import { EmergencyWizardModal } from './components/EmergencyWizardModal';
import { api } from './services/api';
import { calculateEvacuationRoute, findNearestShelters } from './services/routingService';

export default function App() {
  // Localization & View State
  const [lang, setLang] = useState<Language>('th');
  const [viewMode, setViewMode] = useState<AppViewMode>('map');
  const [activePanel, setActivePanel] = useState<'none' | 'shelters' | 'route' | 'agent'>('none');
  const [selectedProvince, setSelectedProvince] = useState<ProvinceId | 'all'>('all');

  // GISTDA Temporal and Verification State
  const [temporalExtent, setTemporalExtent] = useState<TemporalExtent>('1_day');
  const [showFrequencyZones, setShowFrequencyZones] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);

  // GIS Data State with Loading, Error and Empty states for GISTDA Flood Layer
  const [floodAreas, setFloodAreas] = useState<FloodRiskArea[]>(INITIAL_FLOOD_RISK_AREAS);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [floodLoading, setFloodLoading] = useState<boolean>(false);
  const [floodError, setFloodError] = useState<string | null>(null);

  // Selected Entities
  const [selectedFloodArea, setSelectedFloodArea] = useState<FloodRiskArea | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [nearestShelterToArea, setNearestShelterToArea] = useState<Shelter | null>(null);

  // Routing State
  const [recommendedRoute, setRecommendedRoute] = useState<EvacuationRoute | null>(null);
  const [alternativeRoute, setAlternativeRoute] = useState<EvacuationRoute | null>(null);
  const [activeRouteOption, setActiveRouteOption] = useState<'recommended' | 'alternative'>('recommended');
  const [isRoutingLoading, setIsRoutingLoading] = useState<boolean>(false);

  // Map Controls State (Clean layers without fake closures)
  const [layers, setLayers] = useState<LayerVisibility>({
    floodAreas: true,
    shelters: true,
    rivers: true,
    roads: true,
    adminBoundaries: true,
  });
  const [basemap, setBasemap] = useState<BasemapType>('osm');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'guest-01',
    name: 'Guest User',
    email: 'guest@floodsos.local',
    role: 'guest',
    createdAt: new Date().toISOString(),
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Check URL pathname or hash for protected /admin route
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#admin') {
        setViewMode('admin');
      }
    };
    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Update URL history when viewMode changes
  const handleViewModeChange = (mode: AppViewMode) => {
    setViewMode(mode);
    if (mode === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else {
      window.history.pushState(null, '', '/');
    }
  };

  // Load data from REST API with loading, empty, and error tracking
  const refreshData = async () => {
    setFloodLoading(true);
    setFloodError(null);
    try {
      const [areasData, sheltersData] = await Promise.all([
        api.getFloodRiskAreas({ province: selectedProvince }),
        api.getShelters({ province: selectedProvince }),
      ]);
      setFloodAreas(areasData);
      setShelters(sheltersData);
    } catch (err: any) {
      console.warn('GISTDA data fetch failed, using verified cache:', err);
      setFloodError(lang === 'th' ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล GISTDA' : 'Failed to connect to live GISTDA API feed');
    } finally {
      setFloodLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedProvince]);

  // Geolocation trigger
  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
        },
        () => {
          // Default to Chiang Mai center Pa Daet / Chang Khlan
          setUserLocation({ lat: 18.783, lng: 99.002 });
        }
      );
    } else {
      setUserLocation({ lat: 18.783, lng: 99.002 });
    }
  };

  // Click on flood area
  const handleSelectFloodArea = (area: FloodRiskArea | null) => {
    setSelectedFloodArea(area);
    if (area) {
      const nearest = findNearestShelters(area.center, shelters, 1)[0] || null;
      setNearestShelterToArea(nearest);
    }
  };

  // Plan evacuation route to a shelter using real road network
  const handlePlanRoute = async (targetShelter: Shelter) => {
    setIsRoutingLoading(true);
    try {
      const origin: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : selectedFloodArea
        ? selectedFloodArea.center
        : [18.783, 99.002]; // Chiang Mai origin default

      const result = await calculateEvacuationRoute(origin, targetShelter, floodAreas);
      setSelectedShelter(targetShelter);
      setRecommendedRoute(result.recommended);
      setAlternativeRoute(result.alternative);
      setActiveRouteOption('recommended');
      setActivePanel('route');
      setSelectedFloodArea(null);
    } catch (err) {
      console.error('Route calculation error:', err);
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // 3-Step Wizard Completion
  const handleCompleteWizard = async (
    location: [number, number],
    shelter: Shelter,
    threatInfo: { isFlooded: boolean; maxDepth: number; areaTitle: string }
  ) => {
    setUserLocation({ lat: location[0], lng: location[1] });
    setIsRoutingLoading(true);
    try {
      const result = await calculateEvacuationRoute(location, shelter, floodAreas);
      setSelectedShelter(shelter);
      setRecommendedRoute(result.recommended);
      setAlternativeRoute(result.alternative);
      setActiveRouteOption('recommended');
      setActivePanel('route');
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // Inspect coordinate on map click
  const handleMapClick = async (lat: number, lng: number) => {
    const riskCheck = await api.getFloodRiskAt(lat, lng);
    if (riskCheck.isInsideFloodZone && riskCheck.matchingAreas.length > 0) {
      handleSelectFloodArea(riskCheck.matchingAreas[0]);
    } else {
      if (activePanel === 'route') {
        setUserLocation({ lat, lng });
        if (selectedShelter) {
          const result = await calculateEvacuationRoute([lat, lng], selectedShelter, floodAreas);
          setRecommendedRoute(result.recommended);
          setAlternativeRoute(result.alternative);
        }
      }
    }
  };

  // Handle map action from AI Agent
  const handleExecuteMapAction = (action: any) => {
    if (!action) return;

    if (action.type === 'show_route' && action.payload) {
      setRecommendedRoute(action.payload);
      setActiveRouteOption('recommended');
      setActivePanel('route');
      setViewMode('map');
    } else if (action.type === 'highlight_shelter' && action.payload) {
      const s = shelters.find((item) => item.id === action.payload.shelterId);
      if (s) {
        setSelectedShelter(s);
        setViewMode('map');
      }
    } else if (action.type === 'highlight_flood' && action.payload) {
      const a = floodAreas.find((item) => item.id === action.payload.areaId);
      if (a) {
        handleSelectFloodArea(a);
        setViewMode('map');
      }
    }
  };

  // Search items collection
  const searchItems = [
    ...floodAreas.map((a) => ({
      id: a.id,
      title: `${a.titleTh} (${a.districtTh})`,
      type: 'flood' as const,
      lat: a.center[0],
      lng: a.center[1],
    })),
    ...shelters.map((s) => ({
      id: s.id,
      title: `${s.nameTh} (${s.districtTh})`,
      type: 'shelter' as const,
      lat: s.lat,
      lng: s.lng,
    })),
    ...Object.keys(PROVINCES).map((k) => {
      const p = PROVINCES[k as ProvinceId];
      return {
        id: p.id,
        title: `จังหวัด${p.nameTh} (${p.nameEn})`,
        type: 'province' as const,
        lat: p.center[0],
        lng: p.center[1],
      };
    }),
  ];

  const handleSearchSelect = (item: any) => {
    if (item.type === 'flood') {
      const a = floodAreas.find((x) => x.id === item.id);
      if (a) handleSelectFloodArea(a);
    } else if (item.type === 'shelter') {
      const s = shelters.find((x) => x.id === item.id);
      if (s) {
        setSelectedShelter(s);
        setActivePanel('shelters');
      }
    } else if (item.type === 'province') {
      setSelectedProvince(item.id as ProvinceId);
    }
  };

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none font-['Roboto','Noto_Sans_Thai',sans-serif] ${
        basemap === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-900 text-slate-900'
      }`}
    >
      {/* 1. Global Navigation Bar with mobile bottom tab bar */}
      <Navbar
        selectedProvince={selectedProvince}
        onSelectProvince={(p) => setSelectedProvince(p)}
        lang={lang}
        onToggleLang={() => setLang(lang === 'th' ? 'en' : 'th')}
        viewMode={viewMode}
        onChangeViewMode={handleViewModeChange}
        activePanel={activePanel}
        onTogglePanel={(panel) => setActivePanel(panel)}
        onOpenEmergencyWizard={() => setIsWizardOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={() =>
          setCurrentUser({
            id: 'guest-01',
            name: 'Guest User',
            email: 'guest@floodsos.local',
            role: 'guest',
            createdAt: new Date().toISOString(),
          })
        }
        onSearchSelect={handleSearchSelect}
        searchItems={searchItems}
        basemap={basemap}
        onChangeBasemap={setBasemap}
      />

      {/* 2. Main GIS Leaflet Map View */}
      <div className="w-full h-full">
        <MapView
          floodAreas={floodAreas}
          shelters={shelters}
          selectedFloodArea={selectedFloodArea}
          selectedShelter={selectedShelter}
          activeRoute={
            activeRouteOption === 'recommended' ? recommendedRoute : alternativeRoute
          }
          layers={layers}
          basemap={basemap}
          selectedProvince={selectedProvince}
          temporalExtent={temporalExtent}
          showFrequencyZones={showFrequencyZones}
          onSelectFloodArea={handleSelectFloodArea}
          onSelectShelter={(shelter) => {
            setSelectedShelter(shelter);
            if (activePanel === 'route') {
              handlePlanRoute(shelter!);
            }
          }}
          onMapClick={handleMapClick}
          userLocation={userLocation}
          lang={lang}
        />
      </div>

      {/* 3. Floating Map Controls (Right Side FAB Stack - With enough bottom margin to clear tab bar and legend) */}
      {viewMode === 'map' && (
        <>
          {/* Bottom-Right Floating Action Buttons Stack (Layer & Locate GPS - Touch Targets >= 44px) */}
          <div className="absolute bottom-20 md:bottom-8 right-3.5 z-[25] flex flex-col gap-2.5">
            {/* Layer Control FAB with GISTDA Feed 1D/3D/7D controls inside sheet */}
            <LayerControl
              layers={layers}
              onChangeLayers={setLayers}
              basemap={basemap}
              onChangeBasemap={setBasemap}
              temporalExtent={temporalExtent}
              onChangeTemporalExtent={setTemporalExtent}
              showFrequencyZones={showFrequencyZones}
              onToggleFrequencyZones={() => setShowFrequencyZones(!showFrequencyZones)}
              lang={lang}
            />

            {/* My Location GPS Button FAB */}
            <button
              onClick={handleLocateUser}
              className="w-12 h-12 bg-white/95 hover:bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group backdrop-blur-md min-h-[44px] min-w-[44px]"
              title={lang === 'th' ? 'ตำแหน่งปัจจุบันของฉัน' : 'Locate My Position'}
              aria-label={lang === 'th' ? 'ตำแหน่งปัจจุบันของฉัน' : 'Locate My Position'}
            >
              <NavigationIcon className="w-5 h-5 text-sky-600 transition-transform group-hover:rotate-45" />
            </button>
          </div>

          {/* Map Legend (Collapsed by default, sits bottom-left clearing bottom bar) */}
          <MapLegend lang={lang} />
        </>
      )}

      {/* 4. GISTDA Flood Layer Status Indicators (Loading, Empty, Error) - positioned below province chips */}
      {viewMode === 'map' && (
        <div className="absolute top-[176px] md:top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5 max-w-sm w-full px-4">
          {/* Loading State */}
          {floodLoading && (
            <div className="pointer-events-auto bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-sky-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              <span>{lang === 'th' ? 'กำลังดึงข้อมูลดาวเทียม GISTDA...' : 'Loading GISTDA Satellite Feed...'}</span>
            </div>
          )}

          {/* Error State */}
          {floodError && (
            <div className="pointer-events-auto bg-rose-900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-rose-500/60 text-xs flex items-center gap-2.5 animate-in shake">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="flex-1 font-medium">{floodError}</span>
              <button
                onClick={refreshData}
                className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-[11px]"
              >
                {lang === 'th' ? 'ลองใหม่' : 'Retry'}
              </button>
            </div>
          )}

          {/* Empty State */}
          {!floodLoading && !floodError && floodAreas.length === 0 && (
            <div className="pointer-events-auto bg-slate-900/90 text-emerald-300 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-emerald-500/40 text-xs flex items-center gap-2 animate-in fade-in">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {lang === 'th'
                  ? selectedProvince === 'all'
                    ? 'ไม่พบพื้นที่เสี่ยงน้ำท่วมใน 5 จังหวัดภาคเหนือตอนบน (ข้อมูล GISTDA)'
                    : `ไม่พบพื้นที่เสี่ยงน้ำท่วมในจังหวัด${PROVINCES[selectedProvince]?.nameTh || ''} ณ เวลานี้ (ข้อมูล GISTDA)`
                  : 'No active flood risk reported (GISTDA data)'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 5. Clicked Flood Risk Area Detail Modal */}
      {selectedFloodArea && viewMode === 'map' && (
        <FloodDetailModal
          area={selectedFloodArea}
          nearestShelter={nearestShelterToArea}
          onClose={() => setSelectedFloodArea(null)}
          onRouteToShelter={(shelter) => handlePlanRoute(shelter)}
          lang={lang}
        />
      )}

      {/* 6. Find Safe Shelter Panel */}
      {activePanel === 'shelters' && viewMode === 'map' && (
        <ShelterFinderPanel
          shelters={shelters}
          selectedProvince={selectedProvince}
          onSelectShelter={(shelter) => setSelectedShelter(shelter)}
          onPlanRoute={(shelter) => handlePlanRoute(shelter)}
          onLocateUser={handleLocateUser}
          onClose={() => setActivePanel('none')}
          lang={lang}
        />
      )}

      {/* 7. Evacuation Routing Panel */}
      {activePanel === 'route' && viewMode === 'map' && recommendedRoute && (
        <EvacuationRoutePanel
          recommendedRoute={recommendedRoute}
          alternativeRoute={alternativeRoute}
          selectedShelter={selectedShelter}
          onSelectRouteOption={(opt) => setActiveRouteOption(opt)}
          activeOption={activeRouteOption}
          onClearRoute={() => {
            setRecommendedRoute(null);
            setAlternativeRoute(null);
            setActivePanel('none');
          }}
          onClose={() => setActivePanel('none')}
          lang={lang}
        />
      )}

      {/* 8. AI Disaster Agent Chat Drawer */}
      {activePanel === 'agent' && (
        <AIAgentDrawer
          onClose={() => setActivePanel('none')}
          onExecuteMapAction={handleExecuteMapAction}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          userLocation={userLocation}
          lang={lang}
        />
      )}

      {/* 9. Statistical Dashboard View */}
      {viewMode === 'dashboard' && (
        <DashboardView
          floodAreas={floodAreas}
          shelters={shelters}
          selectedProvince={selectedProvince}
          onSelectProvince={setSelectedProvince}
          lang={lang}
        />
      )}

      {/* 10. Protected Admin Portal View */}
      {viewMode === 'admin' && (
        <>
          {currentUser.role === 'admin' ? (
            <AdminLayout
              onBackToMap={() => handleViewModeChange('map')}
              floodAreas={floodAreas}
              shelters={shelters}
              onRefreshData={refreshData}
              currentUser={currentUser}
              lang={lang}
            />
          ) : (
            /* Protected Admin Access Denied Screen */
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Prompt']">
                    {lang === 'th' ? 'พื้นที่ควบคุมเฉพาะผู้ดูแลระบบ (Protected Route)' : 'Protected Admin Portal'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {lang === 'th'
                      ? 'หน้านี้สงวนไว้สำหรับเจ้าหน้าที่ ปภ. และผู้ดูแลระบบ GIS เท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชี Admin เพื่อจัดการข้อมูล'
                      : 'This portal requires Admin credentials. Please sign in with an authorized administrator account to manage geospatial datasets.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                  >
                    {lang === 'th' ? 'เข้าสู่ระบบในฐานะ Admin' : 'Sign In as Admin'}
                  </button>
                  <button
                    onClick={() => handleViewModeChange('map')}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{lang === 'th' ? 'กลับสู่หน้าแผนที่หลัก' : 'Back to Main Map'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 11. 3-Step Citizen SOS Evacuation Wizard Modal */}
      <EmergencyWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        userLocation={userLocation}
        onLocateUser={handleLocateUser}
        floodAreas={floodAreas}
        shelters={shelters}
        onCompleteWizard={handleCompleteWizard}
        lang={lang}
      />

      {/* 12. Authentication Dialog */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthOpen(false);
        }}
        lang={lang}
      />
    </div>
  );
}
