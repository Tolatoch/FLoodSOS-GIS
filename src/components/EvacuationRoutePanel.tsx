import React, { useState } from 'react';
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  RotateCcw,
  CornerDownRight,
  CheckCircle,
  X,
  Compass,
  Mountain,
  AlertOctagon,
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
}) => {
  const t = TRANSLATIONS[lang];
  const [navigating, setNavigating] = useState(false);

  if (!recommendedRoute) return null;

  const currentRoute =
    activeOption === 'recommended' ? recommendedRoute : alternativeRoute || recommendedRoute;

  return (
    <div className="fixed inset-x-0 bottom-14 md:bottom-6 md:inset-x-auto md:left-3 md:w-[440px] z-40 bg-white shadow-2xl rounded-t-3xl md:rounded-2xl border border-slate-200 flex flex-col max-h-[82vh] overflow-hidden animate-in slide-in-from-bottom-4 md:slide-in-from-left-4">
      {/* Drag Handle for Mobile Bottom Sheet */}
      <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 shrink-0 md:hidden" />

      {/* Dedicated Route Tab Header */}
      <div className="p-3.5 bg-gradient-to-r from-sky-800 to-blue-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-600/60 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-sky-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight font-['Prompt']">
              {t.routing.title}
            </h3>
            <p className="text-[11px] text-sky-200">
              {lang === 'th' ? 'คำนวณผ่าน OSM Road Network + เลี่ยงจุดน้ำท่วม GISTDA' : 'OSM Road Network Safe Router'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-sky-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Destination Shelter Summary Banner */}
      {selectedShelter && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between shrink-0 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
              {t.routing.destination}
            </span>
            <p className="font-bold text-slate-900 text-xs truncate max-w-[270px]">
              {lang === 'th' ? selectedShelter.nameTh : selectedShelter.nameEn}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-600 text-white shadow-sm">
            <Mountain className="w-3.5 h-3.5" />
            +{selectedShelter.verificationStamp?.elevationMsl || 340}m MSL
          </span>
        </div>
      )}

      {/* Google Maps-Style Route Option Cards */}
      <div className="p-3 bg-slate-50 border-b border-slate-200/70 shrink-0 space-y-2">
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              {lang === 'th' ? 'แนะนำ (ไม่พบจุดเสี่ยงน้ำท่วม)' : 'Recommended (No flood hazards)'}
            </span>
            <span className="text-sm font-black text-slate-900">
              {recommendedRoute.durationMinutes} นาที / {recommendedRoute.distanceKm} กม.
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                <AlertTriangle className="w-3 h-3" />
                {lang === 'th' ? 'เส้นทางตรง (มีความเสี่ยงน้ำท่วม)' : 'Fastest (Risk Conflict)'}
              </span>
              <span className="text-sm font-black text-slate-900">
                {alternativeRoute.durationMinutes} นาที / {alternativeRoute.distanceKm} กม.
              </span>
            </div>
            {alternativeRoute.floodConflicts.length > 0 ? (
              <p className="text-[11px] text-rose-600 font-medium">
                ⚠️ ตัดผ่าน {alternativeRoute.floodConflicts[0].areaTitleTh} (น้ำท่วม{' '}
                {alternativeRoute.floodConflicts[0].waterDepthMeters} ม. รถเล็กผ่านไม่ได้)
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">เส้นทางลัดปกติ</p>
            )}
          </button>
        )}
      </div>

      {/* Turn-by-Turn Navigation Steps */}
      <div className="p-3 overflow-y-auto space-y-2 flex-1 text-xs">
        <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 font-['Prompt']">
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
              <p className="font-semibold leading-relaxed">
                {lang === 'th' ? step.instructionTh : step.instructionEn}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                <span>{step.distanceMeters} ม.</span>
                <span>•</span>
                <span>{Math.round(step.durationSeconds / 60)} นาที</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Navigation Actions */}
      <div className="p-3 border-t border-slate-200/80 bg-white flex items-center gap-2 shrink-0">
        <button
          onClick={onClearRoute}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
          title={t.routing.clearRoute}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setNavigating(!navigating)}
          className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all ${
            navigating
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-sky-600 hover:bg-sky-700 text-white shadow-md'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>{navigating ? 'กำลังนำทาง (GPS Active)' : t.routing.navigateNow}</span>
        </button>
      </div>
    </div>
  );
};
