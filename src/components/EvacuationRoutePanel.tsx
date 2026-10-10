import React, { useState } from 'react';
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CornerDownRight,
  Mountain,
  X,
  ChevronLeft,
  Home,
} from 'lucide-react';
import { EvacuationRoute, Shelter } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';

interface EvacuationRoutePanelProps {
  recommendedRoute: EvacuationRoute | null;
  alternativeRoute: EvacuationRoute | null;
  selectedShelter: Shelter | null;
  onSelectRouteOption: (type: 'recommended' | 'alternative') => void;
  activeOption: 'recommended' | 'alternative';
  onClearRoute: () => void;
  onClose: () => void;
  lang: Language;
  isDesktopPanel?: boolean;
  onCollapse?: () => void;
  onBrowseShelters?: () => void;
}

export const EvacuationRoutePanel: React.FC<EvacuationRoutePanelProps> = ({
  recommendedRoute,
  alternativeRoute,
  selectedShelter,
  onSelectRouteOption,
  activeOption,
  onClearRoute,
  onClose,
  lang,
  isDesktopPanel = false,
  onCollapse,
  onBrowseShelters,
}) => {
  const t = TRANSLATIONS[lang];
  const [navigating, setNavigating] = useState(false);

  // 3 Bottom Sheet States on Phone
  const [sheetState, setSheetState] = useState<'peek' | 'half' | 'full'>('half');

  const cycleSheetState = () => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('peek');
  };

  const getSheetHeightClass = () => {
    switch (sheetState) {
      case 'peek':
        return 'h-[96px] max-h-[96px]';
      case 'half':
        return 'h-[50dvh] max-h-[50dvh]';
      case 'full':
        return 'h-[calc(100dvh-var(--nav-h)-var(--nav-bump)-env(safe-area-inset-bottom,0px)-16px)] max-h-[calc(100dvh-var(--nav-h)-var(--nav-bump)-env(safe-area-inset-bottom,0px)-16px)]';
    }
  };

  const containerClasses = isDesktopPanel
    ? 'w-full h-full flex flex-col bg-white overflow-hidden select-text'
    : `fixed inset-x-0 bottom-[calc(var(--nav-h)+var(--nav-bump)+env(safe-area-inset-bottom,0px))] md:bottom-[calc(var(--nav-h)+var(--nav-bump)+env(safe-area-inset-bottom,0px))] md:inset-x-auto md:left-3 md:w-[440px] z-40 bg-white shadow-2xl rounded-t-3xl md:rounded-2xl border border-slate-200 flex flex-col md:max-h-[calc(100dvh-var(--nav-h)-var(--nav-bump)-env(safe-area-inset-bottom,0px)-24px)] overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-4 md:slide-in-from-left-4 ${getSheetHeightClass()} md:h-auto`;

  // Empty state when no route has been calculated yet
  if (!recommendedRoute) {
    return (
      <div className={containerClasses}>
        {/* Header */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 h-14 bg-gradient-to-r from-sky-800 to-blue-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-600/60 flex items-center justify-center text-sky-200">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[15px] sm:text-base leading-tight font-['Prompt']">
                {t.routing.title}
              </h3>
              <p className="text-[11px] sm:text-[12px] text-sky-200 truncate">
                {lang === 'th' ? 'ระบบนำทางอพยพเลี่ยงจุดเสี่ยง' : 'Safe Evacuation Router'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isDesktopPanel ? (
              <button
                onClick={onCollapse || onClose}
                className="text-sky-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10"
                title={lang === 'th' ? 'ยุบแผงด้านข้าง' : 'Collapse Panel'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-sky-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10"
                title={lang === 'th' ? 'ปิด' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Empty Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 border border-sky-100 shadow-inner">
            <Navigation className="w-8 h-8" />
          </div>
          <h4 className="text-[17px] font-bold text-slate-800 font-['Prompt'] mb-1.5">
            {lang === 'th' ? 'ยังไม่ได้วางแผนเส้นทาง' : 'No Evacuation Route Active'}
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mb-5 leading-relaxed">
            {lang === 'th'
              ? 'กรุณาเลือกศูนย์พักพิงที่คุณต้องการเดินทางไป เพื่อให้ระบบคำนวณเส้นทางปลอดภัยที่หลีกเลี่ยงน้ำท่วม'
              : 'Please choose a destination shelter from the list to calculate the safest route avoiding flood risk zones.'}
          </p>
          {onBrowseShelters && (
            <button
              onClick={onBrowseShelters}
              className="px-5 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
            >
              <Home className="w-4 h-4" />
              <span>{lang === 'th' ? 'เลือกศูนย์พักพิง' : 'Browse Safe Shelters'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentRoute =
    activeOption === 'recommended' ? recommendedRoute : alternativeRoute || recommendedRoute;

  return (
    <div className={containerClasses}>
      {/* Draggable Handle for Mobile Bottom Sheet */}
      {!isDesktopPanel && (
        <button
          onClick={cycleSheetState}
          className="w-full flex flex-col items-center justify-center pt-2 pb-1 shrink-0 md:hidden hover:bg-slate-50 active:bg-slate-100"
          aria-label="Toggle Route Sheet Height"
        >
          <div className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors" />
        </button>
      )}

      {/* Route Tab Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 h-14 bg-gradient-to-r from-sky-800 to-blue-900 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div
          className={`flex items-center gap-2.5 ${!isDesktopPanel ? 'cursor-pointer md:cursor-default' : ''}`}
          onClick={!isDesktopPanel ? cycleSheetState : undefined}
        >
          <div className="w-8 h-8 rounded-xl bg-sky-600/60 flex items-center justify-center text-sky-200">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] sm:text-base leading-tight font-['Prompt']">
              {t.routing.title}
            </h3>
            <p className="text-[11px] sm:text-[12px] text-sky-200 truncate">
              {lang === 'th' ? 'คำนวณผ่าน OSM Road Network + เลี่ยงจุดน้ำท่วม GISTDA' : 'OSM Road Network Safe Router'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isDesktopPanel ? (
            <button
              onClick={onCollapse || onClose}
              className="text-sky-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title={lang === 'th' ? 'ยุบแผงด้านข้าง' : 'Collapse Panel'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-sky-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title={lang === 'th' ? 'ปิด' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Destination Shelter Summary Banner */}
      {selectedShelter && (
        <div className="p-2.5 sm:p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between shrink-0 text-xs sm:text-sm">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5 font-['Prompt']">
              {t.routing.destination}
            </span>
            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[270px]">
              {lang === 'th' ? selectedShelter.nameTh : selectedShelter.nameEn}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-extrabold bg-emerald-600 text-white shadow-sm">
            <Mountain className="w-3.5 h-3.5" />
            +{selectedShelter.verificationStamp?.elevationMsl || 340}m MSL
          </span>
        </div>
      )}

      {/* Google Maps-Style Route Option Cards */}
      <div className="p-2.5 sm:p-3 bg-slate-50 border-b border-slate-200/70 shrink-0 space-y-2">
        {/* Recommended Safe Option */}
        <button
          onClick={() => onSelectRouteOption('recommended')}
          className={`w-full text-left p-3 rounded-2xl border transition-all ${
            activeOption === 'recommended'
              ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white/70 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              {lang === 'th' ? 'แนะนำ (ไม่พบจุดเสี่ยงน้ำท่วม)' : 'Recommended (No flood hazards)'}
            </span>
            <span className="text-sm sm:text-[15px] font-black text-slate-900">
              {recommendedRoute.durationMinutes} นาที / {recommendedRoute.distanceKm} กม.
            </span>
          </div>
          <p className="text-[12px] sm:text-[13px] text-emerald-700 font-medium leading-relaxed">
            ✓ {lang === 'th' ? recommendedRoute.statusMessageTh : recommendedRoute.statusMessageEn}
          </p>
        </button>

        {/* Alternative Direct Option */}
        {alternativeRoute && (
          <button
            onClick={() => onSelectRouteOption('alternative')}
            className={`w-full text-left p-3 rounded-2xl border transition-all ${
              activeOption === 'alternative'
                ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/20'
                : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-rose-100 text-rose-800">
                <AlertTriangle className="w-3 h-3" />
                {lang === 'th' ? 'เส้นทางตรง (มีความเสี่ยงน้ำท่วม)' : 'Fastest (Risk Conflict)'}
              </span>
              <span className="text-sm sm:text-[15px] font-black text-slate-900">
                {alternativeRoute.durationMinutes} นาที / {alternativeRoute.distanceKm} กม.
              </span>
            </div>
            {alternativeRoute.floodConflicts.length > 0 ? (
              <p className="text-[12px] sm:text-[13px] text-rose-600 font-medium">
                ⚠️ ตัดผ่าน {alternativeRoute.floodConflicts[0].areaTitleTh} (น้ำท่วม{' '}
                {alternativeRoute.floodConflicts[0].waterDepthMeters} ม. รถเล็กผ่านไม่ได้)
              </p>
            ) : (
              <p className="text-[12px] sm:text-[13px] text-slate-500">เส้นทางลัดปกติ</p>
            )}
          </button>
        )}
      </div>

      {/* Turn-by-Turn Navigation Steps */}
      <div className="p-2.5 sm:p-3 overflow-y-auto space-y-2 flex-1 text-xs sm:text-sm">
        <h4 className="font-bold text-slate-800 text-[11px] sm:text-xs uppercase tracking-wider mb-2 font-['Prompt']">
          {t.routing.stepByStep}
        </h4>

        {currentRoute.steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
              step.floodWarning
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-white border-slate-100 text-slate-800'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                step.floodWarning ? 'bg-rose-200 text-rose-800' : 'bg-sky-100 text-sky-700'
              }`}
            >
              {step.floodWarning ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <CornerDownRight className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold leading-relaxed text-xs sm:text-sm">
                {lang === 'th' ? step.instructionTh : step.instructionEn}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-[11px] text-slate-400">
                <span>{step.distanceMeters} ม.</span>
                <span>•</span>
                <span>{Math.round(step.durationSeconds / 60)} นาที</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Navigation Actions */}
      <div className="p-2.5 sm:p-3 border-t border-slate-200/80 bg-white flex items-center gap-2 shrink-0">
        <button
          onClick={onClearRoute}
          className="h-11 w-11 min-h-[44px] min-w-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors"
          title={t.routing.clearRoute}
        >
          <RotateCcw className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        </button>

        <button
          onClick={() => setNavigating(!navigating)}
          className={`flex-1 h-11 min-h-[44px] px-4 font-bold text-sm sm:text-[15px] rounded-xl flex items-center justify-center gap-2 transition-all ${
            navigating
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-sky-600 hover:bg-sky-700 text-white shadow-md'
          }`}
        >
          <Navigation className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <span>{navigating ? 'กำลังนำทาง (GPS Active)' : t.routing.navigateNow}</span>
        </button>
      </div>
    </div>
  );
};
