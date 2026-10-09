import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, Home, Waves } from 'lucide-react';
import { TRANSLATIONS, Language } from '../data/translations';

interface MapLegendProps {
  lang: Language;
}

export const MapLegend: React.FC<MapLegendProps> = ({ lang }) => {
  const [collapsed, setCollapsed] = useState(true);
  const t = TRANSLATIONS[lang];

  return (
    <div className="absolute bottom-20 md:bottom-6 left-3 z-20 max-w-[280px] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden transition-all text-xs">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-100 transition-colors"
        aria-label={t.legend}
      >
        <div className="flex items-center gap-1.5 font-bold text-slate-800 font-['Prompt']">
          <ShieldAlert className="w-4 h-4 text-sky-600" />
          <span>{t.legend}</span>
        </div>
        {collapsed ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="p-3 space-y-2.5">
          {/* Risk Levels */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {t.floodRiskAreas} (5 ระดับ / Levels)
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-purple-700 shadow-sm" />
                  <span className="font-semibold text-purple-900">Very High</span>
                </div>
                <span className="text-[10px] text-purple-700 font-medium">วิกฤต (แดงเข้ม)</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-rose-500 shadow-sm" />
                  <span className="font-semibold text-rose-800">High</span>
                </div>
                <span className="text-[10px] text-rose-600 font-medium">เตือนภัย (แดง)</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 shadow-sm" />
                  <span className="font-semibold text-amber-900">Moderate</span>
                </div>
                <span className="text-[10px] text-amber-700 font-medium">เฝ้าระวัง (ส้ม/เหลือง)</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-yellow-400 shadow-sm" />
                  <span className="font-medium text-slate-700">Low</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">เสี่ยงต่ำ (เหลือง)</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm bg-emerald-400 shadow-sm" />
                  <span className="font-medium text-slate-700">Very Low</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">ปกติ (เขียว)</span>
              </div>
            </div>
          </div>

          {/* Shelters & Rivers */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                <Home className="w-2.5 h-2.5" />
              </span>
              <span className="text-slate-800 font-medium">{t.safeShelters}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-4 h-1 bg-sky-500 rounded-full" />
              <span className="text-slate-800 font-medium">{t.rivers}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-4 h-1 bg-emerald-500 rounded-full" />
              <span className="text-slate-800 font-medium">{t.routing.recommendedRoute}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
