import React, { useState } from 'react';
import {
  Layers,
  Check,
  Map,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Satellite,
  ShieldCheck,
  Clock,
  Radio,
  X,
  RefreshCw,
} from 'lucide-react';
import { LayerVisibility, BasemapType, TemporalExtent } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';

interface LayerControlProps {
  layers: LayerVisibility;
  onChangeLayers: (layers: LayerVisibility) => void;
  basemap: BasemapType;
  onChangeBasemap: (basemap: BasemapType) => void;
  temporalExtent: TemporalExtent;
  onChangeTemporalExtent: (extent: TemporalExtent) => void;
  showFrequencyZones: boolean;
  onToggleFrequencyZones: () => void;
  lang: Language;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  layers,
  onChangeLayers,
  basemap,
  onChangeBasemap,
  temporalExtent,
  onChangeTemporalExtent,
  showFrequencyZones,
  onToggleFrequencyZones,
  lang,
}) => {
  const [open, setOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('06:30 น. (2 นาทีที่แล้ว)');
  const t = TRANSLATIONS[lang];

  const toggle = (key: keyof LayerVisibility) => {
    onChangeLayers({ ...layers, [key]: !layers[key] });
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncText(
        `${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')} น. (เมื่อสักครู่)`
      );
    }, 800);
  };

  return (
    <div className="relative">
      {/* Floating Action Button (FAB) - Touch Target >= 44px */}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 bg-white/95 hover:bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group backdrop-blur-md min-h-[44px] min-w-[44px]"
        title={t.layers}
        aria-label={t.layers}
      >
        <Layers className={`w-5 h-5 text-sky-600 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded Layer & GISTDA Feed Sheet */}
      {open && (
        <div className="fixed inset-x-3 bottom-20 md:bottom-auto md:absolute md:right-0 md:inset-x-auto md:top-full mt-0 md:mt-2 w-auto md:w-80 max-h-[75vh] md:max-h-[85vh] bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 p-4 z-50 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-2 no-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 font-['Prompt']">
                  {t.layers}
                </span>
                <p className="text-[10px] text-slate-500">
                  {lang === 'th' ? 'จัดการชั้นข้อมูลและสถานะดาวเทียม' : 'Map Layers & Satellite Feed'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ========================================================
              1. GISTDA Satellite Feed & 1D/3D/7D Extent Switcher
              (Moved into Layer Sheet as requested)
              ======================================================== */}
          <div className="p-3 bg-slate-900 text-white rounded-2xl mb-3.5 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <Satellite className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-xs font-['Prompt'] text-slate-100">
                  GISTDA Flood Feed
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                200 OK LIVE
              </span>
            </div>

            {/* Temporal Extent 1D / 3D / 7D Chips */}
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 mb-1">
                {lang === 'th' ? 'ช่วงเวลาภาพถ่ายดาวเทียม (Temporal Filter):' : 'Satellite Observation Window:'}
              </span>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => onChangeTemporalExtent('1_day')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] flex flex-col items-center justify-center ${
                    temporalExtent === '1_day'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>1D</span>
                  <span className="text-[9px] font-normal opacity-80">24 ชม.</span>
                </button>
                <button
                  onClick={() => onChangeTemporalExtent('3_day')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] flex flex-col items-center justify-center ${
                    temporalExtent === '3_day'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>3D</span>
                  <span className="text-[9px] font-normal opacity-80">72 ชม.</span>
                </button>
                <button
                  onClick={() => onChangeTemporalExtent('7_day')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all min-h-[38px] flex flex-col items-center justify-center ${
                    temporalExtent === '7_day'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>7D</span>
                  <span className="text-[9px] font-normal opacity-80">7 วัน</span>
                </button>
              </div>
            </div>

            {/* Satellite Metadata & Manual Refresh */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              <span className="truncate max-w-[190px]">
                {lang === 'th' ? `อัปเดต: ${lastSyncText}` : `Synced: ${lastSyncText}`}
              </span>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 p-1"
                title="ซิงค์ข้อมูลสดจาก GISTDA API"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              2. Vector GIS Layer Toggles
              ======================================================== */}
          <div className="space-y-1 mb-3.5 text-xs">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {lang === 'th' ? 'ชั้นข้อมูลแผนที่ (GIS Layers)' : 'Map Layers'}
            </span>

            {/* Flood Risk Areas */}
            <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer min-h-[44px]">
              <span className="flex items-center gap-2.5 text-slate-800 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm" />
                <span>{t.floodRiskAreas} (5 ระดับ)</span>
              </span>
              <input
                type="checkbox"
                checked={layers.floodAreas}
                onChange={() => toggle('floodAreas')}
                className="w-5 h-5 text-sky-600 rounded-md focus:ring-sky-500 cursor-pointer"
              />
            </label>

            {/* Safe Shelters */}
            <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer min-h-[44px]">
              <span className="flex items-center gap-2.5 text-slate-800 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm" />
                <span>{t.safeShelters} (ที่ดอนสูง)</span>
              </span>
              <input
                type="checkbox"
                checked={layers.shelters}
                onChange={() => toggle('shelters')}
                className="w-5 h-5 text-sky-600 rounded-md focus:ring-sky-500 cursor-pointer"
              />
            </label>

            {/* Major Rivers */}
            <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer min-h-[44px]">
              <span className="flex items-center gap-2.5 text-slate-800 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shadow-sm" />
                <span>{t.rivers} (ปิง/กก/น่าน/วัง)</span>
              </span>
              <input
                type="checkbox"
                checked={layers.rivers}
                onChange={() => toggle('rivers')}
                className="w-5 h-5 text-sky-600 rounded-md focus:ring-sky-500 cursor-pointer"
              />
            </label>

            {/* Flood Frequency (น้ำท่วมซ้ำซาก) */}
            <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer min-h-[44px]">
              <span className="flex items-center gap-2.5 text-slate-800 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm" />
                <span>พื้นที่น้ำท่วมซ้ำซาก (1-3 ปี)</span>
              </span>
              <input
                type="checkbox"
                checked={showFrequencyZones}
                onChange={onToggleFrequencyZones}
                className="w-5 h-5 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
              />
            </label>

            {/* Administrative Boundaries */}
            <label className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer min-h-[44px]">
              <span className="flex items-center gap-2.5 text-slate-800 font-medium">
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-400 shadow-sm" />
                <span>{t.adminBoundaries} (5 จังหวัด)</span>
              </span>
              <input
                type="checkbox"
                checked={layers.adminBoundaries}
                onChange={() => toggle('adminBoundaries')}
                className="w-5 h-5 text-sky-600 rounded-md focus:ring-sky-500 cursor-pointer"
              />
            </label>
          </div>

          {/* ========================================================
              3. Basemap Selector
              ======================================================== */}
          <div className="pt-2.5 border-t border-slate-100">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t.basemap}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => onChangeBasemap('osm')}
                className={`py-2 px-1 text-[11px] font-semibold rounded-xl border text-center transition-all min-h-[44px] flex flex-col items-center justify-center ${
                  basemap === 'osm'
                    ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                OSM
              </button>
              <button
                onClick={() => onChangeBasemap('dark')}
                className={`py-2 px-1 text-[11px] font-semibold rounded-xl border text-center transition-all min-h-[44px] flex flex-col items-center justify-center ${
                  basemap === 'dark'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => onChangeBasemap('terrain')}
                className={`py-2 px-1 text-[11px] font-semibold rounded-xl border text-center transition-all min-h-[44px] flex flex-col items-center justify-center ${
                  basemap === 'terrain'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Terrain
              </button>
              <button
                onClick={() => onChangeBasemap('satellite')}
                className={`py-2 px-1 text-[11px] font-semibold rounded-xl border text-center transition-all min-h-[44px] flex flex-col items-center justify-center ${
                  basemap === 'satellite'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Sat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
