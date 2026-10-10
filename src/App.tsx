import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Compass,
  Home,
  Navigation,
  BarChart3,
  Bot,
  AlertTriangle,
  RefreshCw,
  Navigation as NavigationIcon,
  Info,
  Plus,
  Minus,
} from 'lucide-react';
import {
  ProvinceId,
  FloodRiskArea,
  Shelter,
  EvacuationRoute,
  LayerVisibility,
  BasemapType,
  AppViewMode,
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
import { ProvinceFilterButton } from './components/ProvinceFilterButton';
import { FloodDetailModal } from './components/FloodDetailModal';
import { ShelterFinderPanel } from './components/ShelterFinderPanel';
import { EvacuationRoutePanel } from './components/EvacuationRoutePanel';
import { DashboardView } from './components/DashboardView';
import { AIAgentDrawer } from './components/AIAgentDrawer';
import { AuthModal } from './components/AuthModal';
import { AdminLayout, AdminTab } from './components/Admin/AdminLayout';
import { AdminLoginPage } from './components/Admin/AdminLoginPage';
import { UserProfileModal } from './components/UserProfileModal';
import { api } from './services/api';
import { calculateEvacuationRoute, findNearestShelters } from './services/routingService';
import { AuthProvider, useAuth } from './context/AuthContext';

type DesktopTab = 'map' | 'shelters' | 'route' | 'stats' | 'agent';

function FloodSosApp() {
  const { currentUser, signOut, addRouteHistory } = useAuth();

  // Localization & View State
  const [lang, setLang] = useState<Language>('th');
  const [viewMode, setViewMode] = useState<AppViewMode>('map');
  const [activePanel, setActivePanel] = useState<'none' | 'shelters' | 'route' | 'agent'>('none');
  const [selectedProvince, setSelectedProvince] = useState<ProvinceId | 'all'>('all');

  // Desktop layout (Google Maps style, >= 1024px)
  const [desktopTab, setDesktopTab] = useState<DesktopTab>('map');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState<boolean>(false);
  const [hoveredShelterId, setHoveredShelterId] = useState<string | null>(null);

  // GISTDA Temporal and Verification State
  const [temporalExtent, setTemporalExtent] = useState<TemporalExtent>('1_day');
  const [showFrequencyZones, setShowFrequencyZones] = useState<boolean>(false);
  const mapRef = useRef<any>(null);

  // GIS Data State
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

  // Map Controls State
  const [layers, setLayers] = useState<LayerVisibility>({
    floodAreas: true,
    shelters: true,
    rivers: true,
    roads: true,
    adminBoundaries: true,
  });
  const [basemap, setBasemap] = useState<BasemapType>('osm');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Auth Dialog & Profile Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'saved_shelters' | 'route_history'>('profile');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // URL Path Routing State
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  // Determine admin sub-tab from path
  const getAdminTabFromPath = (path: string): AdminTab => {
    if (path.includes('flood-risk')) return 'flood_risk';
    if (path.includes('shelters')) return 'shelters';
    if (path.includes('users')) return 'users';
    if (path.includes('audit')) return 'audit';
    return 'dashboard';
  };

  const [adminTab, setAdminTab] = useState<AdminTab>(() => getAdminTabFromPath(window.location.pathname));

  // Sync route and enforce access rules
  const handleRouteSync = useCallback(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (path === '/admin/login') {
      if (currentUser.role === 'admin') {
        window.history.replaceState(null, '', '/admin');
        setCurrentPath('/admin');
        setViewMode('admin');
      } else {
        setCurrentPath('/admin/login');
      }
      return;
    }

    if (path.startsWith('/admin') || hash === '#admin') {
      if (currentUser.role === 'guest') {
        window.history.replaceState(null, '', '/admin/login');
        setCurrentPath('/admin/login');
      } else if (currentUser.role === 'user') {
        window.history.replaceState(null, '', '/');
        setCurrentPath('/');
        setViewMode('map');
      } else if (currentUser.role === 'admin') {
        setCurrentPath(path);
        setViewMode('admin');
        setAdminTab(getAdminTabFromPath(path));
      }
      return;
    }

    setCurrentPath(path);
  }, [currentUser.role]);

  useEffect(() => {
    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    return () => window.removeEventListener('popstate', handleRouteSync);
  }, [handleRouteSync]);

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    if (path === '/admin' || path.startsWith('/admin/')) {
      setViewMode('admin');
      setAdminTab(getAdminTabFromPath(path));
    } else if (path === '/dashboard') {
      setViewMode('dashboard');
    } else if (path === '/') {
      setViewMode('map');
    }
  };

  const handleViewModeChange = (mode: AppViewMode) => {
    setViewMode(mode);
    if (mode === 'admin') {
      if (currentUser.role === 'admin') {
        navigate('/admin');
      } else if (currentUser.role === 'guest') {
        navigate('/admin/login');
      } else {
        navigate('/');
      }
    } else if (mode === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  // Load data from REST API
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

  // Select shelter (from marker click or list click)
  const handleSelectShelter = (shelter: Shelter | null) => {
    setSelectedShelter(shelter);
    if (shelter) {
      if (window.innerWidth >= 1024) {
        setDesktopTab('shelters');
        setIsPanelCollapsed(false);
      } else {
        setActivePanel('shelters');
      }
    }
    if (activePanel === 'route' || desktopTab === 'route') {
      if (shelter) handlePlanRoute(shelter);
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
        : [18.783, 99.002];

      const result = await calculateEvacuationRoute(origin, targetShelter, floodAreas);
      setSelectedShelter(targetShelter);
      setRecommendedRoute(result.recommended);
      setAlternativeRoute(result.alternative);
      setActiveRouteOption('recommended');
      setSelectedFloodArea(null);

      // On desktop, switch to route tab and open panel
      if (window.innerWidth >= 1024) {
        setDesktopTab('route');
        setIsPanelCollapsed(false);
      } else {
        setActivePanel('route');
      }

      addRouteHistory(result.recommended, targetShelter);
    } catch (err) {
      console.error('Route calculation error:', err);
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
      if (activePanel === 'route' || desktopTab === 'route') {
        setUserLocation({ lat, lng });
        if (selectedShelter) {
          const result = await calculateEvacuationRoute([lat, lng], selectedShelter, floodAreas);
          setRecommendedRoute(result.recommended);
          setAlternativeRoute(result.alternative);
          addRouteHistory(result.recommended, selectedShelter);
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
      if (window.innerWidth >= 1024) {
        setDesktopTab('route');
        setIsPanelCollapsed(false);
      } else {
        setActivePanel('route');
      }
      setViewMode('map');
    } else if (action.type === 'highlight_shelter' && action.payload) {
      const s = shelters.find((item) => item.id === action.payload.shelterId);
      if (s) {
        setSelectedShelter(s);
        if (window.innerWidth >= 1024) {
          setDesktopTab('shelters');
          setIsPanelCollapsed(false);
        } else {
          setActivePanel('shelters');
        }
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

  // Desktop Rail tab switcher: tapping active rail item reopens panel if collapsed
  const handleSelectDesktopTab = (tab: DesktopTab) => {
    if (tab === 'map') {
      setDesktopTab('map');
      setIsPanelCollapsed(true);
      return;
    }

    if (desktopTab === tab) {
      // Tapping active rail item toggles collapse / reopen
      setIsPanelCollapsed(!isPanelCollapsed);
    } else {
      setDesktopTab(tab);
      setIsPanelCollapsed(false);
    }
  };

  // ==========================================
  // Dedicated Admin Login Page at /admin/login
  // ==========================================
  if (currentPath === '/admin/login') {
    return (
      <AdminLoginPage
        onSuccess={() => {
          showToast(lang === 'th' ? 'ยินดีต้อนรับ, ผู้ดูแลระบบ' : 'Welcome, Admin');
          navigate('/admin');
        }}
        onBackToMap={() => {
          navigate('/');
        }}
        lang={lang}
        onToggleLang={() => setLang(lang === 'th' ? 'en' : 'th')}
      />
    );
  }

  // ==========================================
  // Protected Admin Portal at /admin/*
  // ==========================================
  if (currentPath.startsWith('/admin') && currentUser.role === 'admin') {
    return (
      <AdminLayout
        onBackToMap={() => navigate('/')}
        floodAreas={floodAreas}
        shelters={shelters}
        onRefreshData={refreshData}
        currentUser={currentUser}
        lang={lang}
        initialTab={adminTab}
        onTabChange={(tab) => {
          setAdminTab(tab);
          const newPath = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
          window.history.pushState(null, '', newPath);
          setCurrentPath(newPath);
        }}
      />
    );
  }

  // Determine if desktop left panel is actively open
  const isDesktopPanelOpen = desktopTab !== 'map' && !isPanelCollapsed;

  // ==========================================
  // Main GIS Application
  // ==========================================
  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none font-['Roboto','Noto_Sans_Thai',sans-serif] ${
        basemap === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-900 text-slate-900'
      }`}
    >
      {/* 1. Global Navigation Bar:
             - Floating buttons in top-right corner only (No top header bar)
             - Mobile bottom navigation bar on <1024px */}
      <Navbar
        lang={lang}
        onToggleLang={() => setLang(lang === 'th' ? 'en' : 'th')}
        viewMode={viewMode}
        onChangeViewMode={handleViewModeChange}
        activePanel={activePanel}
        onTogglePanel={(panel) => setActivePanel(panel)}
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'signin');
          setIsAuthOpen(true);
        }}
        onSignOut={() => {
          signOut();
          navigate('/');
          setViewMode('map');
          setActivePanel('none');
          showToast(lang === 'th' ? 'ออกจากระบบแล้ว' : 'Signed out');
        }}
        onOpenProfile={() => {
          setProfileInitialTab('profile');
          setIsProfileOpen(true);
        }}
        onOpenSavedShelters={() => {
          setProfileInitialTab('saved_shelters');
          setIsProfileOpen(true);
        }}
      />

      {/* 2. Main Layout Container:
             - On desktop (>=1024px): 72px icon rail + 400px panel + full-width map
             - On mobile/tablet (<1024px): full-screen map with bottom sheets */}
      <div className="flex w-full h-full overflow-hidden">
        {/* DESKTOP VERTICAL ICON RAIL (72px wide, >=1024px) */}
        <aside
          className="hidden lg:flex w-[72px] h-full bg-white border-r border-slate-200/90 z-30 flex-col items-center py-4 justify-between shrink-0 shadow-xs"
          aria-label="Desktop Navigation Rail"
        >
          {/* Top 5 Navigation Tabs */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            {([
              { id: 'map' as const, labelTh: 'แผนที่', labelEn: 'Map', icon: Compass },
              { id: 'shelters' as const, labelTh: 'ศูนย์พักพิง', labelEn: 'Shelters', icon: Home },
              { id: 'route' as const, labelTh: 'เส้นทาง', labelEn: 'Route', icon: Navigation },
              { id: 'stats' as const, labelTh: 'สถิติ', labelEn: 'Stats', icon: BarChart3 },
              { id: 'agent' as const, labelTh: 'AI', labelEn: 'AI', icon: Bot },
            ]).map((tab) => {
              const isActive = desktopTab === tab.id;
              const IconComponent = tab.icon;
              const label = lang === 'th' ? tab.labelTh : tab.labelEn;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectDesktopTab(tab.id)}
                  className="group relative w-16 py-1.5 flex flex-col items-center justify-center rounded-xl transition-transform duration-200 ease-out active:scale-95 active:bg-slate-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-1 select-none"
                  title={label}
                  aria-label={label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Pill behind icon: rounded, ~56px wide x 32px high */}
                  <div
                    className={`w-14 h-8 rounded-full flex items-center justify-center mb-1 transition-all duration-200 ease-out ${
                      isActive
                        ? 'bg-sky-100 text-sky-600 group-active:bg-sky-200/80'
                        : 'bg-transparent text-slate-500 group-hover:bg-slate-100/90 group-active:bg-slate-100'
                    }`}
                  >
                    <IconComponent
                      className={`w-[22px] h-[22px] transition-all duration-200 ease-out ${
                        isActive
                          ? 'stroke-[2.5] text-sky-600'
                          : 'stroke-[1.75] text-slate-500 group-hover:text-slate-700'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[12px] leading-tight truncate transition-colors duration-200 ease-out ${
                      isActive
                        ? 'text-sky-700 font-bold'
                        : 'text-slate-500 font-normal group-hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* DESKTOP LEFT PANEL (400px wide, full height, >=1024px) */}
        {isDesktopPanelOpen && (
          <aside className="hidden lg:flex w-[400px] h-full bg-white shadow-xl z-25 border-r border-slate-200/90 shrink-0 flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
            {desktopTab === 'shelters' && (
              <ShelterFinderPanel
                shelters={shelters}
                selectedProvince={selectedProvince}
                onSelectShelter={handleSelectShelter}
                onPlanRoute={handlePlanRoute}
                onLocateUser={handleLocateUser}
                onClose={() => setIsPanelCollapsed(true)}
                onOpenAuth={() => {
                  setAuthMode('signin');
                  setIsAuthOpen(true);
                }}
                lang={lang}
                isDesktopPanel={true}
                onHoverShelter={setHoveredShelterId}
                selectedShelter={selectedShelter}
                onCollapse={() => setIsPanelCollapsed(true)}
              />
            )}

            {desktopTab === 'route' && (
              <EvacuationRoutePanel
                recommendedRoute={recommendedRoute}
                alternativeRoute={alternativeRoute}
                selectedShelter={selectedShelter}
                onSelectRouteOption={(opt) => setActiveRouteOption(opt)}
                activeOption={activeRouteOption}
                onClearRoute={() => {
                  setRecommendedRoute(null);
                  setAlternativeRoute(null);
                }}
                onClose={() => setIsPanelCollapsed(true)}
                lang={lang}
                isDesktopPanel={true}
                onCollapse={() => setIsPanelCollapsed(true)}
                onBrowseShelters={() => setDesktopTab('shelters')}
              />
            )}

            {desktopTab === 'stats' && (
              <DashboardView
                floodAreas={floodAreas}
                shelters={shelters}
                selectedProvince={selectedProvince}
                onSelectProvince={setSelectedProvince}
                lang={lang}
                isPanelMode={true}
                onToggleExpand={() => setIsStatsExpanded(true)}
                onCollapsePanel={() => setIsPanelCollapsed(true)}
                onClose={() => setIsPanelCollapsed(true)}
              />
            )}

            {desktopTab === 'agent' && (
              <AIAgentDrawer
                onClose={() => setIsPanelCollapsed(true)}
                onExecuteMapAction={handleExecuteMapAction}
                currentUser={currentUser}
                onOpenAuth={() => {
                  setAuthMode('signin');
                  setIsAuthOpen(true);
                }}
                userLocation={userLocation}
                lang={lang}
                isDesktopPanel={true}
                onCollapse={() => setIsPanelCollapsed(true)}
              />
            )}
          </aside>
        )}

        {/* 3. Main Leaflet Map View */}
        <div className="flex-1 h-full relative overflow-hidden">
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
            onSelectShelter={handleSelectShelter}
            onMapClick={handleMapClick}
            userLocation={userLocation}
            lang={lang}
            hoveredShelterId={hoveredShelterId}
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />
        </div>
      </div>

      {/* 4. Bottom-Right Floating Controls Stack:
             - Phone stack: province filter, layers, locate (12px gaps)
             - Tablet & Desktop stack: province filter, layers, locate, zoom in, zoom out (12px gaps)
             - Sits above the bump: bottom = --nav-h + --nav-bump + 12px + safe-area */}
      <div className="fixed bottom-[calc(var(--nav-h)+var(--nav-bump)+12px+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(var(--nav-h)+var(--nav-bump)+12px+env(safe-area-inset-bottom,0px))] lg:bottom-6 right-3.5 sm:right-4 lg:right-6 z-25 flex flex-col items-center gap-3">
        {/* 1) Province Filter Button (top of the right-side floating stack) */}
        <ProvinceFilterButton
          selectedProvince={selectedProvince}
          onSelectProvince={setSelectedProvince}
          lang={lang}
        />

        {/* 2) Layer Control FAB (44px on phone/tablet, 52px on desktop) */}
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

        {/* 3) My Location GPS FAB (44px on phone/tablet, 52px on desktop) */}
        <button
          onClick={handleLocateUser}
          className="w-11 h-11 sm:w-11 sm:h-11 lg:w-[52px] lg:h-[52px] min-h-[44px] min-w-[44px] lg:min-h-[52px] lg:min-w-[52px] bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-xl border border-slate-200/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group backdrop-blur-md"
          title={lang === 'th' ? 'ตำแหน่งปัจจุบันของฉัน' : 'Locate My Position'}
          aria-label={lang === 'th' ? 'ตำแหน่งปัจจุบันของฉัน' : 'Locate My Position'}
        >
          <NavigationIcon className="w-5 h-5 lg:w-6 lg:h-6 text-sky-600 transition-transform group-hover:rotate-45" />
        </button>

        {/* 4) Custom Zoom In FAB (Tablet & Desktop: 44px tablet, 52px desktop) */}
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="hidden sm:flex w-11 h-11 sm:w-11 sm:h-11 lg:w-[52px] lg:h-[52px] min-h-[44px] min-w-[44px] lg:min-h-[52px] lg:min-w-[52px] bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-xl border border-slate-200/90 items-center justify-center transition-all hover:scale-105 active:scale-95 group backdrop-blur-md"
          title={lang === 'th' ? 'ขยายแผนที่ (+)' : 'Zoom In (+)'}
          aria-label={lang === 'th' ? 'ขยายแผนที่ (+)' : 'Zoom In (+)'}
        >
          <Plus className="w-5 h-5 lg:w-6 lg:h-6 text-slate-700" />
        </button>

        {/* 5) Custom Zoom Out FAB (Tablet & Desktop: 44px tablet, 52px desktop) */}
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="hidden sm:flex w-11 h-11 sm:w-11 sm:h-11 lg:w-[52px] lg:h-[52px] min-h-[44px] min-w-[44px] lg:min-h-[52px] lg:min-w-[52px] bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-xl border border-slate-200/90 items-center justify-center transition-all hover:scale-105 active:scale-95 group backdrop-blur-md"
          title={lang === 'th' ? 'ย่อแผนที่ (-)' : 'Zoom Out (-)'}
          aria-label={lang === 'th' ? 'ย่อแผนที่ (-)' : 'Zoom Out (-)'}
        >
          <Minus className="w-5 h-5 lg:w-6 lg:h-6 text-slate-700" />
        </button>
      </div>

      {/* 5. Bottom-Left Map Legend:
             - Collapsed 44px round info button on all screens
             - Sits above the bump: bottom = --nav-h + --nav-bump + 12px + safe-area
             - Shifted right of rail/panel on desktop so it never overlaps */}
      <div
        className={`fixed z-25 transition-all duration-200 ${
          isDesktopPanelOpen
            ? 'bottom-[calc(var(--nav-h)+var(--nav-bump)+12px+env(safe-area-inset-bottom,0px))] left-3.5 sm:bottom-[calc(var(--nav-h)+var(--nav-bump)+12px+env(safe-area-inset-bottom,0px))] sm:left-4 lg:bottom-6 lg:left-[496px]'
            : 'bottom-[calc(var(--nav-h)+var(--nav-bump)+12px+env(safe-area-inset-bottom,0px))] left-3.5 sm:bottom-[calc(var(--nav-h)+var(--nav-bump)+12px+env(safe-area-inset-bottom,0px))] sm:left-4 lg:bottom-6 lg:left-[96px]'
        }`}
      >
        <MapLegend lang={lang} />
      </div>

      {/* 6. GISTDA Satellite Status Indicator */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5 max-w-sm w-full px-4">
        {floodLoading && (
          <div className="pointer-events-auto bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-sky-500/40 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
            <span>{lang === 'th' ? 'กำลังดึงข้อมูลดาวเทียม GISTDA...' : 'Loading GISTDA Satellite Feed...'}</span>
          </div>
        )}

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

      {/* 7. Clicked Flood Risk Area Detail Modal */}
      {selectedFloodArea && (
        <FloodDetailModal
          area={selectedFloodArea}
          nearestShelter={nearestShelterToArea}
          onClose={() => setSelectedFloodArea(null)}
          onRouteToShelter={(shelter) => handlePlanRoute(shelter)}
          lang={lang}
        />
      )}

      {/* 8. Mobile/Tablet Bottom Sheets (Shown only on <1024px screens) */}
      <div className="lg:hidden">
        {/* Shelter Finder Sheet */}
        {activePanel === 'shelters' && (
          <ShelterFinderPanel
            shelters={shelters}
            selectedProvince={selectedProvince}
            onSelectShelter={handleSelectShelter}
            onPlanRoute={handlePlanRoute}
            onLocateUser={handleLocateUser}
            onClose={() => setActivePanel('none')}
            onOpenAuth={() => {
              setAuthMode('signin');
              setIsAuthOpen(true);
            }}
            lang={lang}
            selectedShelter={selectedShelter}
          />
        )}

        {/* Evacuation Route Sheet */}
        {activePanel === 'route' && recommendedRoute && (
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

        {/* AI Disaster Agent Drawer */}
        {activePanel === 'agent' && (
          <AIAgentDrawer
            onClose={() => setActivePanel('none')}
            onExecuteMapAction={handleExecuteMapAction}
            currentUser={currentUser}
            onOpenAuth={() => {
              setAuthMode('signin');
              setIsAuthOpen(true);
            }}
            userLocation={userLocation}
            lang={lang}
          />
        )}
      </div>

      {/* 9. Full-Width Stats View:
             - On mobile/tablet when viewMode === 'dashboard'
             - On desktop when user clicks "Expand" on the Stats panel */}
      {(viewMode === 'dashboard' || (isStatsExpanded && desktopTab === 'stats')) && (
        <DashboardView
          floodAreas={floodAreas}
          shelters={shelters}
          selectedProvince={selectedProvince}
          onSelectProvince={setSelectedProvince}
          lang={lang}
          isExpanded={isStatsExpanded}
          onToggleExpand={() => {
            setIsStatsExpanded(false);
            if (viewMode === 'dashboard') {
              setViewMode('map');
            }
          }}
          onClose={() => {
            setIsStatsExpanded(false);
            setViewMode('map');
          }}
        />
      )}

      {/* 10. Public User Authentication Dialog */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setIsAuthOpen(false);
          const welcomeName = user.name || (lang === 'th' ? 'ผู้ใช้งาน' : 'User');
          const welcomeText = lang === 'th' ? `ยินดีต้อนรับ, ${welcomeName}` : `Welcome, ${welcomeName}`;
          showToast(welcomeText);
        }}
        lang={lang}
      />

      {/* 12. User Profile & Saved Shelters Dialog */}
      <UserProfileModal
        isOpen={isProfileOpen}
        initialTab={profileInitialTab}
        onClose={() => setIsProfileOpen(false)}
        allShelters={shelters}
        onSelectShelter={(shelter) => {
          handleSelectShelter(shelter);
          setViewMode('map');
          setActivePanel('none');
        }}
        onPlanRoute={(shelter) => {
          handlePlanRoute(shelter);
          setViewMode('map');
        }}
        lang={lang}
      />

      {/* 13. Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-sky-500/40 text-xs font-semibold flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FloodSosApp />
    </AuthProvider>
  );
}
