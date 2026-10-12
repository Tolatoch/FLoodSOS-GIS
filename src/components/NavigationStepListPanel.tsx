import React, { useEffect, useRef } from 'react';
import {
  Navigation as NavigationIcon,
  ShieldCheck,
  AlertTriangle,
  X,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  RotateCcw as UTurnIcon,
  Home,
  Check,
  Mountain,
} from 'lucide-react';
import { EvacuationRoute, Shelter, RouteStep } from '../types';
import { Language } from '../data/translations';

interface NavigationStepListPanelProps {
  route: EvacuationRoute;
  shelter: Shelter;
  currentStepIndex: number;
  remainingDistanceMeters: number;
  remainingDurationMinutes: number;
  lang: Language;
  onExit: () => void;
}

export const NavigationStepListPanel: React.FC<NavigationStepListPanelProps> = ({
  route,
  shelter,
  currentStepIndex,
  remainingDistanceMeters,
  remainingDurationMinutes,
  lang,
  onExit,
}) => {
  const activeStepRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the active step into view
  useEffect(() => {
    if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentStepIndex]);

  const renderStepIcon = (iconType: string, isCurrent: boolean) => {
    const cls = isCurrent ? 'w-5 h-5 text-white' : 'w-4 h-4 text-slate-600';
    switch (iconType) {
      case 'turn-left':
      case 'slight-left':
        return <CornerUpLeft className={cls} />;
      case 'turn-right':
      case 'slight-right':
        return <CornerUpRight className={cls} />;
      case 'u-turn':
        return <UTurnIcon className={cls} />;
      case 'destination':
        return <Home className={cls} />;
      default:
        return <ArrowUp className={cls} />;
    }
  };

  const etaDate = new Date(Date.now() + remainingDurationMinutes * 60 * 1000);
  const etaString = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden select-text">
      {/* Header */}
      <div className="px-4 py-3 min-h-[64px] bg-gradient-to-r from-sky-800 to-blue-900 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <div className="w-8 h-8 rounded-xl bg-sky-600/60 flex items-center justify-center text-sky-200 shrink-0">
            <NavigationIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[15px] leading-tight font-['Prompt'] truncate">
              {lang === 'th' ? 'การนำทางเลี้ยวต่อเลี้ยว' : 'Turn-by-turn Navigation'}
            </h3>
            <p className="text-[11px] text-sky-200 truncate mt-0.5">
              {lang === 'th' ? shelter.nameTh : shelter.nameEn}
            </p>
          </div>
        </div>

        <button
          onClick={onExit}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
          title={lang === 'th' ? 'ออกจากการนำทาง' : 'Exit Navigation'}
        >
          <X className="w-4 h-4" />
          <span>{lang === 'th' ? 'ออก' : 'Exit'}</span>
        </button>
      </div>

      {/* Destination & Elevation Banner */}
      <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between shrink-0 text-xs">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5 font-['Prompt']">
            {lang === 'th' ? 'ปลายทางปลอดภัย' : 'Destination'}
          </span>
          <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
            {lang === 'th' ? shelter.nameTh : shelter.nameEn}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs shrink-0">
          <Mountain className="w-3.5 h-3.5" />
          +{shelter.verificationStamp?.elevationMsl || 340}m MSL
        </span>
      </div>

      {/* Metrics Bar: ETA, remaining time & distance */}
      <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700 shrink-0">
        <div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {lang === 'th' ? 'เวลาถึงโดยประมาณ' : 'ETA'}
          </span>
          <span className="text-lg font-black font-mono text-slate-900 leading-tight">
            {etaString}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {lang === 'th' ? 'เวลาที่เหลือ' : 'Remaining Time'}
          </span>
          <span className="text-base font-bold text-emerald-700 leading-tight">
            {remainingDurationMinutes} {lang === 'th' ? 'นาที' : 'min'}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-medium block">
            {lang === 'th' ? 'ระยะทาง' : 'Distance'}
          </span>
          <span className="text-base font-bold text-slate-800 leading-tight">
            {(remainingDistanceMeters / 1000).toFixed(1)} {lang === 'th' ? 'กม.' : 'km'}
          </span>
        </div>
      </div>

      {/* Steps List (Scrollable, current highlighted and auto-scrolled) */}
      <div className="p-3 overflow-y-auto space-y-2 flex-1 text-xs">
        <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-2 font-['Prompt']">
          {lang === 'th' ? 'รายการคำสั่งนำทาง' : 'Navigation Steps'}
        </h4>

        {route.steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;

          return (
            <div
              key={idx}
              ref={isCurrent ? activeStepRef : null}
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-start gap-3 ${
                isCurrent
                  ? 'bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-500/20'
                  : isPassed
                  ? 'bg-slate-50 border-slate-200/60 opacity-60'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Step Icon */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isCurrent
                    ? 'bg-sky-600 shadow-sm'
                    : isPassed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isPassed ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  renderStepIcon(step.icon, isCurrent)
                )}
              </div>

              {/* Step Instruction */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs sm:text-[13px] leading-snug font-['Prompt'] ${
                    isCurrent ? 'font-bold text-sky-950' : 'font-medium text-slate-800'
                  }`}
                >
                  {lang === 'th' ? step.instructionTh : step.instructionEn}
                </p>

                {/* Distance & Duration: HIDE "0 นาที" for steps under a minute */}
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{step.distanceMeters} {lang === 'th' ? 'ม.' : 'm'}</span>
                  {step.durationSeconds >= 60 && (
                    <>
                      <span>•</span>
                      <span>
                        {Math.round(step.durationSeconds / 60)} {lang === 'th' ? 'นาที' : 'min'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
