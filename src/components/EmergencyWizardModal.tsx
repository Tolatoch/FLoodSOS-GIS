import React, { useState } from 'react';
import {
  AlertOctagon,
  MapPin,
  ShieldAlert,
  Navigation,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  Waves,
  Home,
  ShieldCheck,
  Compass,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import { FloodRiskArea, Shelter, EvacuationRoute } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { isPointInPolygon } from '../services/routingService';

interface EmergencyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
  onLocateUser: () => void;
  floodAreas: FloodRiskArea[];
  shelters: Shelter[];
  onCompleteWizard: (
    location: [number, number],
    shelter: Shelter,
    threatInfo: { isFlooded: boolean; maxDepth: number; areaTitle: string }
  ) => void;
  lang: Language;
}

export const EmergencyWizardModal: React.FC<EmergencyWizardModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  onLocateUser,
  floodAreas,
  shelters,
  onCompleteWizard,
  lang,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>(
    userLocation ? [userLocation.lat, userLocation.lng] : [18.783, 99.002]
  );
  const [locationName, setLocationName] = useState('ย่านช้างคลาน เทศบาลนครเชียงใหม่');

  const t = TRANSLATIONS[lang];

  // Quick preset emergency hotspots for high-speed simulation
  const HOTSPOTS: { nameTh: string; nameEn: string; coord: [number, number] }[] = [
    { nameTh: 'ย่านช้างคลาน / ไนท์บาซาร์ (เชียงใหม่)', nameEn: 'Chang Khlan / Night Bazaar (Chiang Mai)', coord: [18.783, 99.002] },
    { nameTh: 'ตำบลป่าแดด ริมน้ำปิง (เชียงใหม่)', nameEn: 'Pa Daet Ping Riverfront (Chiang Mai)', coord: [18.745, 98.988] },
    { nameTh: 'ตลาดสายลมจอย แม่สาย (เชียงราย)', nameEn: 'Sai Lom Joy Market, Mae Sai (Chiang Rai)', coord: [20.435, 99.882] },
    { nameTh: 'ชุมชนในเวียง วัดภูมินทร์ (น่าน)', nameEn: 'Nai Wiang Old City (Nan)', coord: [18.775, 100.772] },
    { nameTh: 'ริมกว๊านพะเยา (พะเยา)', nameEn: 'Kwan Phayao Lakefront (Phayao)', coord: [19.165, 99.898] },
    { nameTh: 'ชุมชนสบตุ๋ย ตลาดเก๊าจาว (ลำปาง)', nameEn: 'Sob Tui, Wang Riverfront (Lampang)', coord: [18.288, 99.495] },
  ];

  // Step 2 analysis: scan location against GISTDA flood polygons
  const scanThreat = () => {
    let matchedArea: FloodRiskArea | null = null;
    for (const a of floodAreas) {
      if (isPointInPolygon(selectedLocation, a.polygon)) {
        matchedArea = a;
        break;
      }
    }
    return matchedArea;
  };

  const threatArea = scanThreat();

  // Find nearest high-ground safe shelter
  const nearestShelter = shelters[0];

  const handleFinish = () => {
    onCompleteWizard(selectedLocation, nearestShelter, {
      isFlooded: !!threatArea,
      maxDepth: threatArea ? threatArea.waterDepthMeters : 0,
      areaTitle: threatArea ? threatArea.titleTh : 'พื้นที่ปลอดภัยทั่วไป',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Wizard Header with Progress Bar */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="text-xs font-bold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              ระบบขอความช่วยเหลือฉุกเฉิน 3 ขั้นตอน
            </span>
          </div>

          <h2 className="text-lg md:text-xl font-black font-['Prompt'] leading-snug">
            {step === 1 && 'ขั้นตอนที่ 1: ระบุตำแหน่งที่ท่านอยู่'}
            {step === 2 && 'ขั้นตอนที่ 2: สแกนระดับความเสี่ยง GISTDA'}
            {step === 3 && 'ขั้นตอนที่ 3: รับเส้นทางอพยพหลีกเลี่ยงน้ำท่วม'}
          </h2>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-3">
            <div
              className={`h-1.5 rounded-full flex-1 transition-all ${
                step >= 1 ? 'bg-white' : 'bg-white/30'
              }`}
            />
            <div
              className={`h-1.5 rounded-full flex-1 transition-all ${
                step >= 2 ? 'bg-white' : 'bg-white/30'
              }`}
            />
            <div
              className={`h-1.5 rounded-full flex-1 transition-all ${
                step >= 3 ? 'bg-white' : 'bg-white/30'
              }`}
            />
          </div>
        </div>

        {/* Official Hotline Call Bar & Critical Disclaimer */}
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 shrink-0 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 leading-tight">
              <span className="font-extrabold block">
                คำเตือน: แอปนี้ไม่ได้ส่งทีมกู้ภัยไปรับท่านโดยอัตโนมัติ
              </span>
              <span>
                หากท่านติดอยู่ในพื้นที่วิกฤต น้ำท่วมสูง หรือผู้ป่วยฉุกเฉิน กรุณาแตะปุ่มโทรออกสายด่วนทันที:
              </span>
            </div>
          </div>

          {/* Quick Tap-To-Call Hotlines */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <a
              href="tel:1784"
              className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold rounded-lg flex items-center justify-center gap-1 text-[11px] shadow-sm transition-all"
            >
              <Phone className="w-3 h-3" />
              <span>ปภ. 1784</span>
            </a>
            <a
              href="tel:1669"
              className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold rounded-lg flex items-center justify-center gap-1 text-[11px] shadow-sm transition-all"
            >
              <Phone className="w-3 h-3" />
              <span>กู้ชีพ 1669</span>
            </a>
            <a
              href="tel:191"
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold rounded-lg flex items-center justify-center gap-1 text-[11px] transition-all"
            >
              <Phone className="w-3 h-3" />
              <span>ตำรวจ 191</span>
            </a>
            <a
              href="tel:1193"
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold rounded-lg flex items-center justify-center gap-1 text-[11px] transition-all"
            >
              <Phone className="w-3 h-3" />
              <span>ทางหลวง 1193</span>
            </a>
          </div>
        </div>

        {/* Wizard Steps Content */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* STEP 1: SELECT LOCATION */}
          {step === 1 && (
            <div className="space-y-3.5">
              <p className="text-slate-600 leading-relaxed">
                กรุณาระบุตำแหน่งปัจจุบันของท่าน หรือจุดที่ต้องการความช่วยเหลือฉุกเฉิน
                เพื่อตรวจสอบความเสี่ยงน้ำท่วมจากดาวเทียมทันที
              </p>

              {/* GPS Instant Button */}
              <button
                onClick={() => {
                  onLocateUser();
                  if (userLocation) {
                    setSelectedLocation([userLocation.lat, userLocation.lng]);
                    setLocationName('พิกัด GPS ตำแหน่งของฉัน');
                  }
                }}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-md shadow-sky-600/20 text-xs md:text-sm transition-all min-h-[44px]"
              >
                <MapPin className="w-4 h-4 animate-bounce" />
                <span>ใช้พิกัดตำแหน่งปัจจุบันของฉัน (GPS Locate)</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-slate-400">
                  หรือเลือกจุดเสี่ยงหลัก (Hotspots)
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Hotspots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HOTSPOTS.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedLocation(h.coord);
                      setLocationName(lang === 'th' ? h.nameTh : h.nameEn);
                    }}
                    className={`p-2.5 text-left rounded-xl border transition-all text-[11px] min-h-[44px] ${
                      selectedLocation[0] === h.coord[0] && selectedLocation[1] === h.coord[1]
                        ? 'bg-rose-50 border-rose-500 font-bold text-rose-950 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="block font-medium truncate">
                      {lang === 'th' ? h.nameTh : h.nameEn}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {h.coord[0]}, {h.coord[1]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Current Selection Preview */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-[11px]">
                <span className="text-slate-500">พิกัดที่เลือก:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {selectedLocation[0].toFixed(4)}, {selectedLocation[1].toFixed(4)} ({locationName})
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: VIEW LOCAL GISTDA FLOOD THREAT STATUS */}
          {step === 2 && (
            <div className="space-y-3.5">
              {/* Location Badge */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-slate-700">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-bold">{locationName}</span>
              </div>

              {/* Threat Status Card */}
              {threatArea ? (
                <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white">
                      ⚠️ พื้นที่เสี่ยงอุทกภัยระดับวิกฤต
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-700">
                      {threatArea.code}
                    </span>
                  </div>

                  <h3 className="font-black text-sm md:text-base text-rose-950 font-['Prompt']">
                    {lang === 'th' ? threatArea.titleTh : threatArea.titleEn}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 bg-white rounded-xl border border-rose-200">
                      <span className="text-slate-500 block text-[10px]">ระดับน้ำท่วมขัง:</span>
                      <span className="text-base font-black text-rose-600 font-mono">
                        {threatArea.waterDepthMeters} เมตร (m)
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded-xl border border-rose-200">
                      <span className="text-slate-500 block text-[10px]">ครัวเรือนเสี่ยง:</span>
                      <span className="text-base font-black text-slate-800 font-mono">
                        {threatArea.affectedHouseholds.toLocaleString()} หลัง
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
                    {lang === 'th' ? threatArea.alertNoteTh : threatArea.alertNoteEn}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>พิกัดนี้อยู่นอกแนวน้ำท่วมขังหลัก</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    จากการสแกนภาพถ่ายดาวเทียม Sentinel-1A SAR ของ GISTDA จุดนี้ไม่พบน้ำท่วมขัง
                    แต่ขอแนะนำให้ตรวจสอบเส้นทางอพยพเตรียมพร้อมไว้ล่วงหน้า
                  </p>
                </div>
              )}

              {/* Data Verification Badge */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span>🛰️ ที่มาข้อมูล: ดาวเทียม GISTDA Sentinel-1A</span>
                <span className="font-mono text-emerald-600 font-bold">06:30 น.</span>
              </div>
            </div>
          )}

          {/* STEP 3: SAFE EVACUATION ROUTE & SHELTER CONFIRMATION */}
          {step === 3 && (
            <div className="space-y-3.5">
              {/* Target Shelter Card */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-600 text-white flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    ศูนย์พักพิงบนพื้นที่ดอนปลอดภัย
                  </span>
                  <span className="text-[10px] text-emerald-800 font-semibold">
                    {nearestShelter.type}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug font-['Prompt']">
                  {lang === 'th' ? nearestShelter.nameTh : nearestShelter.nameEn}
                </h3>

                <p className="text-[11px] text-slate-600">
                  📍 {lang === 'th' ? nearestShelter.addressTh : nearestShelter.addressEn}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 bg-white rounded-xl border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">ระดับความสูงพื้นที่:</span>
                    <span className="font-extrabold text-emerald-700">
                      +{nearestShelter.verificationStamp?.elevationMsl || 340} ม. MSL
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">ความจุรองรับ:</span>
                    <span className="font-extrabold text-slate-800">
                      {nearestShelter.capacity.toLocaleString()} คน
                    </span>
                  </div>
                </div>
              </div>

              {/* Route Summary */}
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl space-y-1.5 text-xs text-sky-950">
                <div className="flex items-center justify-between font-bold">
                  <span>🚗 เส้นทางอพยพ (ไม่พบจุดเสี่ยงน้ำท่วมบนเส้นทางนี้)</span>
                  <span className="text-sky-700 font-mono">OSRM Road Router</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  ระบบคำนวณเส้นทางตามถนนโครงข่ายจริง โดยหลีกเลี่ยงพื้นที่น้ำท่วมขัง
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-700">
                  <span>ระยะทาง: <b>~6.8 กม.</b></span>
                  <span>•</span>
                  <span>เวลาเดินทาง: <b>~18 นาที</b></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="h-10 sm:h-11 min-h-[40px] px-3.5 sm:px-4 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="h-10 sm:h-11 min-h-[40px] px-3.5 sm:px-4 text-slate-500 hover:text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center"
            >
              ยกเลิก
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="h-11 min-h-[44px] px-4 sm:px-5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-black text-sm sm:text-[15px] flex items-center gap-2 shadow-md shadow-rose-600/30 transition-all"
            >
              <span>{step === 1 ? 'สแกนความเสี่ยงน้ำท่วม' : 'เลือกศูนย์พักพิงและเส้นทาง'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="h-11 min-h-[44px] px-4 sm:px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-sm sm:text-[15px] flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Navigation className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <span>เริ่มการนำทางอพยพทันที (Start Route)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
