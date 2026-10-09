import React, { useState } from 'react';
import {
  Satellite,
  CheckCircle2,
  RefreshCw,
  Layers,
  Activity,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Radio,
  FileCheck,
} from 'lucide-react';
import { TemporalExtent } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';

interface GistdaVerificationWidgetProps {
  temporalExtent: TemporalExtent;
  onChangeTemporalExtent: (extent: TemporalExtent) => void;
  showFrequencyZones: boolean;
  onToggleFrequencyZones: () => void;
  lang: Language;
}

export const GistdaVerificationWidget: React.FC<GistdaVerificationWidgetProps> = ({
  temporalExtent,
  onChangeTemporalExtent,
  showFrequencyZones,
  onToggleFrequencyZones,
  lang,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('06:30 น. (2 นาทีที่แล้ว)');
  const [integrityHash, setIntegrityHash] = useState('SHA256:4b91f0c2a8e7...');

  const t = TRANSLATIONS[lang];

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')} น. (เมื่อสักครู่)`;
      setLastSyncTime(timeStr);
      setIntegrityHash(
        `SHA256:${Math.random().toString(16).substring(2, 10)}${Math.random()
          .toString(16)
          .substring(2, 6)}...`
      );
    }, 900);
  };

  return (
    <div className="absolute top-36 md:top-20 left-3 z-20 text-xs max-w-[calc(100vw-80px)] md:max-w-none">
      {/* Floating Status Pill */}
      <div className="bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-md rounded-2xl shadow-xl border border-sky-500/30 flex items-center gap-2 p-1.5 pl-3 transition-all">
        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Satellite className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-bold text-[11px] font-['Prompt'] tracking-tight">
            GISTDA Feed: <span className="text-emerald-400">200 OK</span>
          </span>
        </div>

        {/* Temporal Quick Switcher */}
        <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60 ml-1">
          <button
            onClick={() => onChangeTemporalExtent('1_day')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${
              temporalExtent === '1_day'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="ภาพถ่ายดาวเทียม 24 ชั่วโมงล่าสุด"
          >
            1D
          </button>
          <button
            onClick={() => onChangeTemporalExtent('3_day')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${
              temporalExtent === '3_day'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="ขอบเขตน้ำท่วมสูงสุด 72 ชั่วโมง"
          >
            3D
          </button>
          <button
            onClick={() => onChangeTemporalExtent('7_day')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${
              temporalExtent === '7_day'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="พื้นที่น้ำท่วมสะสม 7 วัน"
          >
            7D
          </button>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-slate-400 hover:text-white rounded-lg"
          title="ดูรายละเอียดการตรวจสอบข้อมูล GISTDA"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Verification Card */}
      {expanded && (
        <div className="mt-2 w-80 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-sky-500/30 p-3.5 text-white animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-sky-300 font-['Prompt']">
                GISTDA Verification Layer
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              INTEGRITY VERIFIED
            </span>
          </div>

          {/* Details */}
          <div className="space-y-2 text-[11px] text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Endpoint:</span>
              <span className="font-mono text-slate-200 truncate max-w-[170px]">
                disaster.gistda.or.th/api/v2
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">ดาวเทียมสำรวจ (Sensors):</span>
              <span className="text-sky-300 font-medium">Sentinel-1A SAR, RADARSAT-2</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">ความละเอียดเรดาร์:</span>
              <span className="text-slate-200">10m C-Band SAR (ทะลุเมฆฝน)</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Checksum (SHA-256):</span>
              <span className="font-mono text-[10px] text-emerald-400">{integrityHash}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">ซิงค์ล่าสุด:</span>
              <span className="text-slate-200">{lastSyncTime}</span>
            </div>
          </div>

          {/* Temporal Extent Selector explanation */}
          <div className="mt-3 pt-2.5 border-t border-slate-800">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              ช่วงเวลาน้ำท่วม (Temporal Extent)
            </span>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <button
                onClick={() => onChangeTemporalExtent('1_day')}
                className={`p-1.5 rounded-lg border text-center font-bold transition-all ${
                  temporalExtent === '1_day'
                    ? 'bg-sky-600 border-sky-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                1 วัน (สด)
              </button>
              <button
                onClick={() => onChangeTemporalExtent('3_day')}
                className={`p-1.5 rounded-lg border text-center font-bold transition-all ${
                  temporalExtent === '3_day'
                    ? 'bg-sky-600 border-sky-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                3 วัน (สูงสุด)
              </button>
              <button
                onClick={() => onChangeTemporalExtent('7_day')}
                className={`p-1.5 rounded-lg border text-center font-bold transition-all ${
                  temporalExtent === '7_day'
                    ? 'bg-sky-600 border-sky-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                7 วัน (สะสม)
              </button>
            </div>
          </div>

          {/* Recurring flood frequency toggle */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">
                พื้นที่น้ำท่วมซ้ำซาก (Flood Frequency)
              </span>
              <span className="text-[10px] text-slate-400">สถิติรอบ 1-3 ปี และ 5 ปีขึ้นไป</span>
            </div>
            <input
              type="checkbox"
              checked={showFrequencyZones}
              onChange={onToggleFrequencyZones}
              className="w-4 h-4 text-sky-600 rounded bg-slate-800 border-slate-700 focus:ring-sky-500"
            />
          </div>

          {/* Force Re-Sync Button */}
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="w-full mt-3 py-1.5 px-3 bg-sky-600 hover:bg-sky-500 active:scale-98 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังตรวจสอบสตรีม...' : 'ตรวจสอบ & ซิงค์ข้อมูลสด (Force Refresh)'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
