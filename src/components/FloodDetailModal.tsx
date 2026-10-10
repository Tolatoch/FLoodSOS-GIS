import React from 'react';
import {
  AlertTriangle,
  Waves,
  Users,
  Compass,
  Home,
  Navigation,
  ExternalLink,
  Clock,
  Database,
  X,
} from 'lucide-react';
import { FloodRiskArea, Shelter } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';

interface FloodDetailModalProps {
  area: FloodRiskArea;
  nearestShelter: Shelter | null;
  onClose: () => void;
  onRouteToShelter: (shelter: Shelter) => void;
  lang: Language;
}

export const FloodDetailModal: React.FC<FloodDetailModalProps> = ({
  area,
  nearestShelter,
  onClose,
  onRouteToShelter,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  const getRiskBadgeInfo = (level: string) => {
    switch (level) {
      case 'very_high':
      case 'high':
        return {
          className: 'bg-rose-600 text-white',
          label: lang === 'th' ? 'อันตราย (สีแดง)' : 'Danger (Red)',
        };
      case 'moderate':
        return {
          className: 'bg-amber-500 text-white',
          label: lang === 'th' ? 'แจ้งเตือน (สีเหลือง)' : 'Warning (Yellow)',
        };
      default:
        return {
          className: 'bg-emerald-600 text-white',
          label: lang === 'th' ? 'ปกติ (สีเขียว)' : 'Normal (Green)',
        };
    }
  };

  const riskBadge = getRiskBadgeInfo(area.riskLevel);

  return (
    <div className="fixed inset-x-0 bottom-14 md:bottom-6 md:inset-x-auto md:left-3 md:w-[420px] z-40 bg-white shadow-2xl rounded-t-3xl md:rounded-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 md:slide-in-from-left-4 max-h-[82vh] flex flex-col">
      {/* Drag Handle for Mobile Bottom Sheet */}
      <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 shrink-0 md:hidden" />

      {/* Header */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${riskBadge.className}`}
            >
              {riskBadge.label}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">{area.code}</span>
          </div>
          <h3 className="text-[15px] sm:text-base font-bold leading-snug font-['Prompt']">
            {lang === 'th' ? area.titleTh : area.titleEn}
          </h3>
          <p className="text-[12px] sm:text-[13px] text-slate-300">
            {lang === 'th' ? `${area.districtTh}, ${area.subdistrictTh}` : `${area.districtEn}, ${area.subdistrictEn}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content: Card padding 12px phone / 16px tablet */}
      <div className="p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 text-xs sm:text-sm flex-1">
        {/* Warning Bulletin Alert */}
        {(area.alertNoteTh || area.alertNoteEn) && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900 block mb-0.5 text-xs sm:text-sm">
                {t.floodDetail.alertWarning}
              </span>
              <p className="text-rose-800 leading-relaxed text-[12px] sm:text-[13px]">
                {lang === 'th' ? area.alertNoteTh : area.alertNoteEn}
              </p>
            </div>
          </div>
        )}

        {/* Vital Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1 text-[12px] sm:text-[13px]">
              <Waves className="w-3.5 h-3.5 text-sky-600" />
              <span>{t.floodDetail.waterDepth}</span>
            </div>
            <p className="text-[18px] sm:text-xl font-extrabold text-slate-900 font-mono">
              {area.waterDepthMeters} <span className="text-[12px] font-normal text-slate-500 font-sans">ม. (m)</span>
            </p>
          </div>

          <div className="p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1 text-[12px] sm:text-[13px]">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.floodDetail.affectedHouseholds}</span>
            </div>
            <p className="text-[18px] sm:text-xl font-extrabold text-slate-900 font-mono">
              {area.affectedHouseholds.toLocaleString()}{' '}
              <span className="text-[12px] font-normal text-slate-500 font-sans">หลัง</span>
            </p>
          </div>
        </div>

        {/* Spatial Coordinates & Source */}
        <div className="space-y-1.5 text-slate-600 border-t border-slate-100 pt-3 text-[12px] sm:text-[13px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-500">
              <Compass className="w-3.5 h-3.5" />
              {t.floodDetail.coordinates}
            </span>
            <span className="font-mono text-slate-800 font-semibold">
              {area.center[0].toFixed(4)}, {area.center[1].toFixed(4)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-500">
              <Database className="w-3.5 h-3.5" />
              {t.floodDetail.dataSource}
            </span>
            <span className="font-medium text-slate-800 truncate max-w-[160px]">
              {area.source}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {t.floodDetail.updatedAt}
            </span>
            <span className="text-slate-500">{area.updatedAt}</span>
          </div>
        </div>

        {/* Nearest Safe Shelter Card & Quick Evacuation Routing */}
        {nearestShelter && (
          <div className="p-3 sm:p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-emerald-900 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                {t.floodDetail.nearestShelter}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                พร้อมรองรับ
              </span>
            </div>

            <p className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
              {lang === 'th' ? nearestShelter.nameTh : nearestShelter.nameEn}
            </p>
            <p className="text-slate-600 text-[12px] sm:text-[13px] truncate">
              {lang === 'th' ? nearestShelter.addressTh : nearestShelter.addressEn}
            </p>

            {/* Main Action: 44px min height */}
            <button
              onClick={() => onRouteToShelter(nearestShelter)}
              className="w-full mt-1.5 h-11 min-h-[44px] px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm sm:text-[15px] transition-all"
            >
              <Navigation className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <span>{t.floodDetail.routeHere}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
