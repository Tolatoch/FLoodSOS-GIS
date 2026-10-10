import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Home,
  Waves,
  Navigation,
  Info,
  X,
} from 'lucide-react';
import { TRANSLATIONS, Language } from '../data/translations';

interface MapLegendProps {
  lang: Language;
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({ lang, className = '' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  // Close legend on click outside or Esc
  useEffect(() => {
    if (!open) return;
    const handleDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('touchstart', handleDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('touchstart', handleDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Collapsed 44px round info button on ALL screen sizes */}
      <button
        onClick={() => setOpen(!open)}
        className="w-11 h-11 min-h-[44px] min-w-[44px] bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-xl border border-slate-200/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group backdrop-blur-md"
        title={t.legend}
        aria-label={t.legend}
        aria-expanded={open}
      >
        <Info className="w-5 h-5 text-sky-600 transition-transform group-hover:scale-110" />
      </button>

      {/* Compact card (max 280px on phone/tablet, 320px on desktop) closing on tap outside */}
      {open && (
        <div className="absolute bottom-full mb-3 left-0 w-[280px] lg:w-[320px] max-w-[85vw] bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden text-xs animate-in fade-in zoom-in-95 z-30">
          <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 font-['Prompt'] text-sm">
              <ShieldAlert className="w-4 h-4 text-sky-600" />
              <span>{t.legend}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              aria-label="Close Legend"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-3 text-[12px] lg:text-[13px]">
            {/* 3 Risk Levels Section */}
            <div>
              <span className="block text-[11px] lg:text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-['Prompt']">
                {lang === 'th' ? 'พื้นที่เสี่ยงอุทกภัย (3 ระดับ)' : 'Flood Risk Areas (3 Levels)'}
              </span>
              <div className="space-y-2">
                {/* 1. ปกติ (สีเขียว) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-emerald-800">
                      {lang === 'th' ? 'ปกติ (สีเขียว)' : 'Normal (Green)'}
                    </span>
                  </div>
                  <span className="text-[10px] lg:text-[11px] text-slate-400 font-medium">Low / Safe</span>
                </div>

                {/* 2. แจ้งเตือน (สีเหลือง) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-amber-900">
                      {lang === 'th' ? 'แจ้งเตือน (สีเหลือง)' : 'Warning (Yellow)'}
                    </span>
                  </div>
                  <span className="text-[10px] lg:text-[11px] text-slate-400 font-medium">Moderate</span>
                </div>

                {/* 3. อันตราย (สีแดง) with soft pulse animation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-rose-600 text-white border-2 border-white shadow-sm flex items-center justify-center shrink-0 animate-pulse-danger">
                      <AlertOctagon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-rose-800">
                      {lang === 'th' ? 'อันตราย (สีแดง)' : 'Danger (Red)'}
                    </span>
                  </div>
                  <span className="text-[10px] lg:text-[11px] text-rose-600 font-bold">Critical</span>
                </div>
              </div>
            </div>

            {/* Other Map Features using matching round badge style */}
            <div className="pt-2.5 border-t border-slate-100 space-y-2">
              {/* Safe Shelters */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                  <Home className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-800 font-medium">{t.safeShelters}</span>
              </div>

              {/* Major Rivers */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-white border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                  <Waves className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-800 font-medium">{t.rivers}</span>
              </div>

              {/* Recommended Route */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-800 font-medium">{t.routing.recommendedRoute}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
