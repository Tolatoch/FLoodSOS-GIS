import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Navigation as NavigationIcon,
  Maximize2,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Phone,
  CheckCircle,
  X,
  ChevronRight,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  RotateCcw as UTurnIcon,
  Home,
  Check,
  Compass,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { EvacuationRoute, Shelter, RouteStep, FloodRiskArea } from '../types';
import { Language } from '../data/translations';
import {
  haversineDistanceMeters,
  snapPointToPolyline,
  splitPolylineAtDistance,
  interpolateAlongPolyline,
  calculatePolylineLengthMeters,
  checkRouteFloodConflicts,
  calculateEvacuationRoute,
} from '../services/routingService';

export interface NavigationState {
  isNavigating: boolean;
  userPosition: [number, number];
  userHeading: number;
  traveledCoordinates: [number, number][];
  remainingCoordinates: [number, number][];
  isFollowingUser: boolean;
  onUserPannedMap?: () => void;
}

interface NavigationScreenProps {
  route: EvacuationRoute;
  alternativeRoute: EvacuationRoute | null;
  shelter: Shelter;
  floodAreas: FloodRiskArea[];
  lang: Language;
  initialUserLocation: { lat: number; lng: number } | null;
  isDemoMode: boolean;
  onExit: () => void;
  onRouteUpdated: (newRoute: EvacuationRoute) => void;
  onNavigationStateChange: (state: NavigationState) => void;
  onRecenterMap: (lat: number, lng: number) => void;
  onOverviewMap: (coords: [number, number][]) => void;
  onProgressUpdate?: (stepIdx: number, remainingMeters: number, remainingMins: number) => void;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({
  route: initialRoute,
  alternativeRoute,
  shelter,
  floodAreas,
  lang,
  initialUserLocation,
  isDemoMode,
  onExit,
  onRouteUpdated,
  onNavigationStateChange,
  onRecenterMap,
  onOverviewMap,
  onProgressUpdate,
}) => {
  const [currentRoute, setCurrentRoute] = useState<EvacuationRoute>(initialRoute);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [distanceToNextManeuver, setDistanceToNextManeuver] = useState<number>(0);
  const [remainingDistanceMeters, setRemainingDistanceMeters] = useState<number>(() =>
    Math.round(initialRoute.distanceKm * 1000)
  );
  const [remainingDurationMinutes, setRemainingDurationMinutes] = useState<number>(
    initialRoute.durationMinutes
  );
  const [currentPosition, setCurrentPosition] = useState<[number, number]>(() => {
    if (initialUserLocation) return [initialUserLocation.lat, initialUserLocation.lng];
    return initialRoute.origin;
  });
  const [currentHeading, setCurrentHeading] = useState<number>(0);

  // Map following state
  const [isFollowingUser, setIsFollowingUser] = useState<boolean>(true);

  // Demo distance tracker (always 2x speed: ~80 km/h)
  const demoDistanceRef = useRef<number>(0);

  // Clean up any previously saved voice setting
  useEffect(() => {
    try {
      localStorage.removeItem('floodsos_nav_voice');
    } catch {}
  }, []);

  // Disclaimer notice (first start only)
  const [showNotice, setShowNotice] = useState<boolean>(() => {
    try {
      return localStorage.getItem('floodsos_nav_disclaimer_dismissed') !== 'true';
    } catch {
      return false;
    }
  });

  // Off-route & rerouting state
  const [offRouteCount, setOffRouteCount] = useState<number>(0);
  const [isRerouting, setIsRerouting] = useState<boolean>(false);
  const [rerouteError, setRerouteError] = useState<boolean>(false);
  const [lastRerouteTime, setLastRerouteTime] = useState<number>(0);
  const rerouteAttemptsRef = useRef<number>(0);

  // GPS signal status
  const [isGpsWeak, setIsGpsWeak] = useState<boolean>(false);

  // Arrival state (within 40m or destination step reached)
  const [hasArrived, setHasArrived] = useState<boolean>(false);

  // Safer route prompt state
  const [showSaferRoutePrompt, setShowSaferRoutePrompt] = useState<boolean>(false);

  const wakeLockRef = useRef<any>(null);
  const stepListContainerRef = useRef<HTMLDivElement>(null);
  const currentStepItemRef = useRef<HTMLDivElement>(null);

  // Compute total route length in meters
  const totalRouteLengthMeters = useMemo(() => {
    return calculatePolylineLengthMeters(currentRoute.coordinates);
  }, [currentRoute.coordinates]);

  // Average driving speed in km/h from route calculation
  const averageSpeedKmH = useMemo(() => {
    const raw = (currentRoute.distanceKm / Math.max(1, currentRoute.durationMinutes)) * 60;
    return Math.max(25, Math.min(80, raw));
  }, [currentRoute]);

  // Screen wake lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    };
    requestWakeLock();

    return () => {
      try {
        if (wakeLockRef.current) {
          wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      } catch {}
    };
  }, []);

  // Dismiss disclaimer notice
  const handleDismissNotice = () => {
    setShowNotice(false);
    try {
      localStorage.setItem('floodsos_nav_disclaimer_dismissed', 'true');
    } catch {}
  };

  // Check if upcoming 500m has flood risk
  const upcomingFloodAlert = useMemo(() => {
    if (!currentRoute.hasFloodHazardOnRoute && currentRoute.floodConflicts.length === 0) {
      return null;
    }
    // Find coordinates within next 500m along route
    const { remaining } = splitPolylineAtDistance(
      currentRoute.coordinates,
      totalRouteLengthMeters - remainingDistanceMeters,
      currentPosition
    );
    const aheadCoords: [number, number][] = [];
    let acc = 0;
    for (let i = 0; i < remaining.length - 1; i++) {
      aheadCoords.push(remaining[i]);
      acc += haversineDistanceMeters(remaining[i], remaining[i + 1]);
      if (acc > 500) break;
    }
    const conflicts = checkRouteFloodConflicts(aheadCoords, floodAreas);
    return conflicts.length > 0 ? conflicts[0] : null;
  }, [currentRoute, remainingDistanceMeters, totalRouteLengthMeters, currentPosition, floodAreas]);

  // Check if safer alternative is available
  useEffect(() => {
    if (
      currentRoute.hasFloodHazardOnRoute &&
      alternativeRoute &&
      !alternativeRoute.hasFloodHazardOnRoute
    ) {
      setShowSaferRoutePrompt(true);
    }
  }, [currentRoute, alternativeRoute]);

  // Recenter handler
  const handleRecenter = () => {
    setIsFollowingUser(true);
    onRecenterMap(currentPosition[0], currentPosition[1]);
  };

  // Overview handler
  const handleOverview = () => {
    setIsFollowingUser(false);
    onOverviewMap(currentRoute.coordinates);
  };

  // Switch to safer route
  const handleSwitchToSaferRoute = () => {
    if (alternativeRoute && !alternativeRoute.hasFloodHazardOnRoute) {
      setCurrentRoute(alternativeRoute);
      onRouteUpdated(alternativeRoute);
      setShowSaferRoutePrompt(false);
    }
  };

  // Trigger Rerouting
  const triggerReroute = async (originPos: [number, number]) => {
    const now = Date.now();
    if (now - lastRerouteTime < 15000) return; // at most once per 15s
    if (rerouteAttemptsRef.current >= 3) {
      setRerouteError(true);
      return;
    }

    setIsRerouting(true);
    setRerouteError(false);
    setLastRerouteTime(now);
    rerouteAttemptsRef.current += 1;

    try {
      const res = await calculateEvacuationRoute(originPos, shelter, floodAreas);
      const newRoute = res.recommended;
      setCurrentRoute(newRoute);
      onRouteUpdated(newRoute);
      setOffRouteCount(0);
      rerouteAttemptsRef.current = 0;
      setIsRerouting(false);
      demoDistanceRef.current = 0;
    } catch (err) {
      console.error('Reroute failed:', err);
      setIsRerouting(false);
      if (rerouteAttemptsRef.current >= 3) {
        setRerouteError(true);
      }
    }
  };

  // Core navigation progress updater
  const updateProgressWithPosition = (pos: [number, number], rawHeading?: number) => {
    // Check arrival to destination shelter
    const distToShelter = haversineDistanceMeters(pos, [shelter.lat, shelter.lng]);
    if (distToShelter <= 40) {
      setHasArrived(true);
      return;
    }

    // Snap position to polyline
    const snapped = snapPointToPolyline(pos, currentRoute.coordinates);
    const snappedPos = snapped.snappedPoint;
    const distOffRoute = snapped.distanceToRouteMeters;
    const progressMeters = snapped.distanceAlongRouteMeters;
    const remainingMeters = Math.max(0, totalRouteLengthMeters - progressMeters);

    setCurrentPosition(snappedPos);
    setCurrentHeading(rawHeading !== undefined && rawHeading > 0 ? rawHeading : snapped.bearing);
    setRemainingDistanceMeters(remainingMeters);

    const remainingMins = Math.max(1, Math.round((remainingMeters / 1000 / averageSpeedKmH) * 60));
    setRemainingDurationMinutes(remainingMins);

    // Split polyline for visual traveled (gray) vs remaining (color)
    const { traveled, remaining } = splitPolylineAtDistance(
      currentRoute.coordinates,
      progressMeters,
      snappedPos
    );

    // Notify MapView
    onNavigationStateChange({
      isNavigating: true,
      userPosition: snappedPos,
      userHeading: rawHeading !== undefined && rawHeading > 0 ? rawHeading : snapped.bearing,
      traveledCoordinates: traveled,
      remainingCoordinates: remaining,
      isFollowingUser,
      onUserPannedMap: () => setIsFollowingUser(false),
    });

    // Off-route logic: distance > 50m for 3 consecutive fixes
    if (distOffRoute > 50) {
      setOffRouteCount((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          triggerReroute(pos);
        }
        return next;
      });
    } else {
      setOffRouteCount(0);
    }

    // Determine current step index based on progress and step distances
    const steps = currentRoute.steps;
    if (steps.length > 0) {
      let cumulativeStepDist = 0;
      let activeIdx = 0;

      for (let i = 0; i < steps.length; i++) {
        const sDist = steps[i].distanceMeters;
        cumulativeStepDist += sDist;

        // If user is within 30m of step maneuver point or passed it, advance step
        if (progressMeters < cumulativeStepDist - 30) {
          activeIdx = i;
          break;
        }
        activeIdx = i;
      }

      // Check if last step reached
      if (activeIdx >= steps.length - 1 && remainingMeters <= 50) {
        setHasArrived(true);
      }

      setCurrentStepIndex(activeIdx);
      onProgressUpdate?.(activeIdx, remainingMeters, remainingMins);

      // Distance to next maneuver
      let distToManeuver = Math.max(0, cumulativeStepDist - progressMeters);
      setDistanceToNextManeuver(distToManeuver);
    }
  };

  // Real GPS watchPosition loop (throttled at most once per second)
  useEffect(() => {
    if (isDemoMode) return;

    if (!navigator.geolocation) {
      setIsGpsWeak(true);
      return;
    }

    let lastUpdateTime = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setIsGpsWeak(false);
        const now = Date.now();
        if (now - lastUpdateTime < 950) return; // update at most once per second
        lastUpdateTime = now;

        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const headingVal = typeof pos.coords.heading === 'number' && !isNaN(pos.coords.heading) && pos.coords.heading >= 0
          ? pos.coords.heading
          : undefined;
        updateProgressWithPosition(coords, headingVal);
      },
      (err) => {
        console.warn('GPS position watch warning:', err.message);
        setIsGpsWeak(true);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isDemoMode, currentRoute, totalRouteLengthMeters, isFollowingUser, shelter]);

  // Demo Simulation Loop (always runs at 2x speed: ~80 km/h)
  useEffect(() => {
    if (!isDemoMode || hasArrived) return;

    // 80 km/h = 22.22 m/s (2x of 40 km/h)
    const tickMs = 500;
    const metersPerSecond = (80 * 1000) / 3600;

    const timer = setInterval(() => {
      const deltaMeters = metersPerSecond * (tickMs / 1000);
      demoDistanceRef.current += deltaMeters;

      if (demoDistanceRef.current >= totalRouteLengthMeters) {
        setHasArrived(true);
        clearInterval(timer);
        return;
      }

      const interp = interpolateAlongPolyline(
        currentRoute.coordinates,
        demoDistanceRef.current
      );

      updateProgressWithPosition(interp.point, interp.bearing);
    }, tickMs);

    return () => clearInterval(timer);
  }, [isDemoMode, totalRouteLengthMeters, currentRoute, hasArrived]);

  // Auto-scroll active step on Desktop left panel
  useEffect(() => {
    if (currentStepItemRef.current) {
      currentStepItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentStepIndex]);

  // ETA calculation
  const etaString = useMemo(() => {
    const etaDate = new Date(Date.now() + remainingDurationMinutes * 60 * 1000);
    return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }, [remainingDurationMinutes]);

  // Format distance display
  const formatManeuverDist = (m: number) => {
    if (m < 1000) return `${Math.round(m)} ${lang === 'th' ? 'ม.' : 'm'}`;
    return `${(m / 1000).toFixed(1)} ${lang === 'th' ? 'กม.' : 'km'}`;
  };

  const formatRemainingDist = (m: number) => {
    return `${(m / 1000).toFixed(1)} ${lang === 'th' ? 'กม.' : 'km'}`;
  };

  const currentStep = currentRoute.steps[currentStepIndex] || currentRoute.steps[0];
  const nextStep = currentRoute.steps[currentStepIndex + 1];

  // Maneuver Icon Renderer
  const renderManeuverIcon = (iconType: string, className = 'w-8 h-8') => {
    switch (iconType) {
      case 'turn-left':
      case 'slight-left':
        return <CornerUpLeft className={className} />;
      case 'turn-right':
      case 'slight-right':
        return <CornerUpRight className={className} />;
      case 'u-turn':
        return <UTurnIcon className={className} />;
      case 'destination':
        return <Home className={className} />;
      default:
        return <ArrowUp className={className} />;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between overflow-hidden">
      {/* ========================================================
          1. TOP NAVIGATION BANNER (Turn instruction & Alert)
          ======================================================== */}
      <div className="pointer-events-auto w-full p-2.5 sm:p-4 max-w-xl mx-auto flex flex-col gap-2">
        {/* First start only notice */}
        {showNotice && (
          <div className="bg-amber-500/95 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl flex items-center justify-between gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-amber-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'th'
                  ? 'ปฏิบัติตามประกาศทางการ สภาพถนนอาจเปลี่ยนแปลง'
                  : 'Follow official alerts. Road conditions may change.'}
              </span>
            </div>
            <button
              onClick={handleDismissNotice}
              className="px-2 py-0.5 bg-black/20 hover:bg-black/30 rounded-lg text-[11px] font-bold"
            >
              {lang === 'th' ? 'รับทราบ' : 'OK'}
            </button>
          </div>
        )}

        {/* GPS Weak Warning */}
        {isGpsWeak && !isDemoMode && (
          <div className="bg-rose-900/90 text-rose-100 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-rose-500/50 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>{lang === 'th' ? 'สัญญาณ GPS อ่อน กำลังใช้ตำแหน่งล่าสุด' : 'Weak GPS signal. Using last location.'}</span>
          </div>
        )}

        {/* Rerouting in progress indicator */}
        {isRerouting && (
          <div className="bg-sky-900/95 text-sky-100 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-sky-400/60 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 animate-spin text-sky-300" />
              <span>{lang === 'th' ? 'กำลังคำนวณเส้นทางใหม่…' : 'Recalculating route...'}</span>
            </div>
          </div>
        )}

        {/* Reroute failure error banner */}
        {rerouteError && (
          <div className="bg-rose-950/95 text-rose-100 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-rose-500/60 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in">
            <span>{lang === 'th' ? 'ไม่สามารถคำนวณเส้นทางใหม่ได้' : 'Could not recompute route'}</span>
            <button
              onClick={() => triggerReroute(currentPosition)}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-bold"
            >
              {lang === 'th' ? 'ลองอีกครั้ง' : 'Retry'}
            </button>
          </div>
        )}

        {/* Flood Awareness Warning (Ahead 500m) */}
        {upcomingFloodAlert && (
          <div className="bg-rose-700/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-rose-400/60 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in shake">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="flex-1 leading-snug">
              {lang === 'th'
                ? `ระวัง: ข้างหน้า 500 ม. เข้าสู่พื้นที่น้ำท่วม (${upcomingFloodAlert.areaTitleTh}) ลึก ${upcomingFloodAlert.waterDepthMeters} ม.`
                : `Warning: Route intersects flood hazard within 500m (${upcomingFloodAlert.areaTitleTh})`}
            </span>
          </div>
        )}

        {/* Safer route switch banner */}
        {showSaferRoutePrompt && (
          <div className="bg-emerald-800/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400/60 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>{lang === 'th' ? 'มีเส้นทางที่ปลอดภัยกว่า' : 'Safer route available'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSwitchToSaferRoute}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-extrabold shadow-sm"
              >
                {lang === 'th' ? 'สลับเส้นทาง' : 'Switch'}
              </button>
              <button
                onClick={() => setShowSaferRoutePrompt(false)}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs"
              >
                {lang === 'th' ? 'ละเว้น' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}

        {/* Main Turn-by-Turn Maneuver Banner */}
        <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-700/60 flex flex-col gap-2">
          <div className="flex items-center gap-3.5">
            {/* Maneuver Icon */}
            <div className="w-13 h-13 min-w-[52px] min-h-[52px] rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/40 shrink-0">
              {renderManeuverIcon(currentStep?.icon || 'straight', 'w-8 h-8')}
            </div>

            {/* Instruction and Distance */}
            <div className="min-w-0 flex-1">
              <div className="text-[26px] sm:text-[30px] font-black font-mono leading-none tracking-tight text-sky-300">
                {formatManeuverDist(distanceToNextManeuver)}
              </div>
              <h2 className="text-[15px] sm:text-[17px] font-bold text-white font-['Prompt'] leading-snug truncate mt-1">
                {lang === 'th' ? currentStep?.instructionTh : currentStep?.instructionEn}
              </h2>
            </div>
          </div>

          {/* "Then..." line for following step */}
          {nextStep && (
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs sm:text-[13px] text-slate-300 truncate">
              <span className="font-semibold text-slate-400 shrink-0">
                {lang === 'th' ? 'แล้ว' : 'Then'}
              </span>
              <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                {renderManeuverIcon(nextStep.icon, 'w-3 h-3 text-sky-400')}
              </div>
              <span className="truncate">
                {lang === 'th' ? nextStep.instructionTh : nextStep.instructionEn}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          2. FLOATING CONTROL BUTTONS (Recenter, Overview, Demo Badge)
          ======================================================== */}
      <div className="pointer-events-auto px-3.5 sm:px-6 flex items-end justify-between w-full max-w-xl mx-auto mb-2">
        {/* Left: DEMO badge unchanged */}
        {isDemoMode ? (
          <div className="bg-amber-900/90 backdrop-blur-md border border-amber-500/80 rounded-2xl px-2.5 py-1.5 shadow-xl flex items-center">
            <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
              DEMO
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Right floating buttons: Recenter, Route Overview (re-spaced without voice button) */}
        <div className="flex flex-col items-center gap-2.5">
          {/* Recenter button (highlighted when user panned away) */}
          <button
            onClick={handleRecenter}
            className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-full shadow-xl border flex items-center justify-center transition-all active:scale-95 ${
              !isFollowingUser
                ? 'bg-sky-600 text-white border-white ring-4 ring-sky-500/30 animate-pulse'
                : 'bg-white/95 text-slate-700 hover:bg-white border-slate-200'
            }`}
            title={lang === 'th' ? 'จัดกึ่งกลาง (ตามตำแหน่งฉัน)' : 'Recenter map'}
            aria-label="Recenter"
          >
            <Crosshair className="w-5 h-5" />
          </button>

          {/* Full route overview */}
          <button
            onClick={handleOverview}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full shadow-xl bg-white/95 text-slate-700 hover:bg-white border border-slate-200 flex items-center justify-center transition-all active:scale-95"
            title={lang === 'th' ? 'ดูภาพรวมเส้นทาง' : 'Route Overview'}
            aria-label="Route Overview"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================
          3. BOTTOM COCKPIT CARD (ETA, Time, Dist, Status & Exit)
          ======================================================== */}
      <div className="pointer-events-auto w-full p-2.5 sm:p-4 max-w-xl mx-auto pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3.5 sm:p-4 shadow-2xl border border-slate-200/90 flex items-center justify-between gap-3">
          {/* Metrics: ETA, remaining time & distance, status chip */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] sm:text-[28px] font-black text-slate-900 font-mono leading-none">
                {etaString}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500">
                {lang === 'th' ? 'ถึงโดยประมาณ' : 'ETA'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm font-bold text-slate-700">
              <span className="text-emerald-700">
                {remainingDurationMinutes} {lang === 'th' ? 'นาที' : 'min'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{formatRemainingDist(remainingDistanceMeters)}</span>
              <span className="text-slate-300">•</span>
              {/* Flood Status Chip */}
              {currentRoute.hasFloodHazardOnRoute ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  {lang === 'th' ? 'ผ่านจุดเสี่ยง' : 'Flood risk'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  {lang === 'th' ? 'ปลอดภัย' : 'Safe'}
                </span>
              )}
            </div>
          </div>

          {/* Red Exit Button */}
          <button
            onClick={onExit}
            className="h-11 sm:h-12 min-h-[44px] px-5 sm:px-6 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm sm:text-base shrink-0"
            title={lang === 'th' ? 'ออกจากการนำทาง' : 'Exit navigation'}
          >
            <X className="w-5 h-5" />
            <span>{lang === 'th' ? 'ออก' : 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          4. ARRIVAL CARD MODAL (Shown when within 40m of shelter)
          ======================================================== */}
      {hasArrived && (
        <div className="fixed inset-0 z-50 pointer-events-auto bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-6 sm:zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3.5 mx-auto border border-emerald-200 shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-center text-slate-900 font-['Prompt'] mb-1">
              {lang === 'th' ? 'ถึงศูนย์พักพิงแล้ว' : 'Arrived at Safe Shelter'}
            </h3>
            <p className="text-sm font-bold text-center text-emerald-700 mb-4 font-['Prompt']">
              {lang === 'th' ? shelter.nameTh : shelter.nameEn}
            </p>

            <div className="bg-slate-50 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-700 space-y-2 mb-5 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{lang === 'th' ? 'ความจุ' : 'Capacity'}</span>
                <span className="font-bold text-slate-900">
                  {shelter.capacity.toLocaleString()} {lang === 'th' ? 'คน' : 'people'} (
                  {lang === 'th' ? 'ว่าง' : 'free'}{' '}
                  {(shelter.capacity - shelter.currentOccupants).toLocaleString()})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{lang === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Facilities'}</span>
                <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">
                  {shelter.facilities.join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{lang === 'th' ? 'พื้นที่' : 'Location'}</span>
                <span className="font-semibold text-slate-800">
                  {shelter.districtTh}, {shelter.province}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="tel:1784"
                className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                <span>{lang === 'th' ? 'โทร 1784' : 'Call 1784'}</span>
              </a>

              <button
                onClick={onExit}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'th' ? 'เสร็จสิ้น' : 'Done'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
