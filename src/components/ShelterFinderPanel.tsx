import React, { useState } from 'react';
import {
  Home,
  Navigation,
  MapPin,
  Phone,
  Filter,
  CheckCircle2,
  X,
  Search,
  Sparkles,
  Zap,
  ShieldCheck,
  Mountain,
} from 'lucide-react';
import { Shelter, ShelterType, ProvinceId } from '../types';
import { PROVINCES } from '../data/geoData';
import { TRANSLATIONS, Language } from '../data/translations';

interface ShelterFinderPanelProps {
  shelters: (Shelter & { distanceKm?: number })[];
  selectedProvince: ProvinceId | 'all';
  onSelectShelter: (shelter: Shelter) => void;
  onPlanRoute: (shelter: Shelter) => void;
  onLocateUser: () => void;
  onClose: () => void;
  lang: Language;
}

// Helper to translate facility keys to Thai
function getFacilityLabel(f: string, lang: Language): string {
  if (lang === 'en') {
    return f.replace('_', ' ');
  }
  switch (f) {
    case 'medical':
    case 'medical_hospital':
      return 'ทีมแพทย์/ปฐมพยาบาล';
    case 'solar_power':
      return 'ไฟฟ้าโซลาร์เซลล์สำรอง';
    case 'drinking_water':
    case 'clean_water':
      return 'น้ำดื่มสะอาด';
    case 'kitchen':
      return 'โรงครัวประกอบอาหาร';
    case 'pet_friendly':
      return 'รองรับสัตว์เลี้ยง';
    case 'helipad':
      return 'ลานจอดเฮลิคอปเตอร์';
    case 'wifi':
      return 'Wi-Fi ฉุกเฉิน';
    case 'charging_station':
    case 'electric_charging':
      return 'จุดชาร์จแบตเตอรี่';
    case 'elderly_care':
      return 'ดูแลผู้สูงอายุ/ผู้ป่วย';
    case 'boats':
      return 'เรือกู้ภัย';
    case 'large_parking':
      return 'ที่จอดรถยกสูง';
    case 'shower_rooms':
      return 'ห้องน้ำ/สุขา';
    default:
      return f.replace('_', ' ');
  }
}

export const ShelterFinderPanel: React.FC<ShelterFinderPanelProps> = ({
  shelters,
  selectedProvince,
  onSelectShelter,
  onPlanRoute,
  onLocateUser,
  onClose,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'distance' | 'capacity' | 'elevation'>('distance');

  const filtered = shelters.filter((s) => {
    if (selectedProvince !== 'all' && s.province !== selectedProvince) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.nameTh.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.districtTh.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'capacity') {
      return b.capacity - a.capacity;
    }
    if (sortBy === 'elevation') {
      return (b.verificationStamp?.elevationMsl || 0) - (a.verificationStamp?.elevationMsl || 0);
    }
    return (a.distanceKm || 999) - (b.distanceKm || 999);
  });

  const getShelterTypeLabel = (type: ShelterType) => {
    return t.shelterTypes[type] || type;
  };

  return (
    <div className="fixed inset-x-0 bottom-14 md:bottom-6 md:inset-x-auto md:left-3 md:w-[440px] z-40 bg-white shadow-2xl rounded-t-3xl md:rounded-2xl border border-slate-200 flex flex-col max-h-[82vh] overflow-hidden animate-in slide-in-from-bottom-4 md:slide-in-from-left-4">
      {/* Drag Handle for Bottom Sheet on mobile */}
      <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 shrink-0 md:hidden" />

      {/* Dedicated Shelter Tab Header */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/60 flex items-center justify-center">
            <Home className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight font-['Prompt']">
              {t.shelterFinder.title}
            </h3>
            <p className="text-[11px] text-emerald-200">
              {lang === 'th' ? 'ศูนย์พักพิงที่ดอนสูง พ้นแนวน้ำท่วม ปภ.' : 'High-Ground Evacuation Centers'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* GPS Locate & Filter Controls */}
      <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2 shrink-0 text-xs">
        {/* Locate GPS Button */}
        <button
          onClick={onLocateUser}
          className="w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 min-h-[44px]"
        >
          <MapPin className="w-4 h-4 animate-bounce" />
          <span>{t.shelterFinder.locateNearMe}</span>
        </button>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.shelterFinder.searchByName}
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
          />
        </div>

        {/* Type & Sort dropdowns */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none min-h-[40px]"
          >
            <option value="all">{t.shelterFinder.allTypes}</option>
            <option value="school">{t.shelterTypes.school}</option>
            <option value="university">{t.shelterTypes.university}</option>
            <option value="temple">{t.shelterTypes.temple}</option>
            <option value="government">{t.shelterTypes.government}</option>
            <option value="pao">{t.shelterTypes.pao}</option>
            <option value="municipality">{t.shelterTypes.municipality}</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none min-h-[40px]"
          >
            <option value="distance">{t.shelterFinder.sortDistance}</option>
            <option value="capacity">{t.shelterFinder.sortCapacity}</option>
            <option value="elevation">ความสูงพื้นที่มากที่สุด</option>
          </select>
        </div>
      </div>

      {/* Shelters List (Opaque solid white background) */}
      <div className="p-3 overflow-y-auto space-y-3 flex-1 bg-white">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            ไม่พบศูนย์พักพิงที่ตรงกับเงื่อนไข
          </div>
        ) : (
          filtered.map((shelter) => {
            return (
              <div
                key={shelter.id}
                onClick={() => onSelectShelter(shelter)}
                className="p-3.5 bg-white hover:bg-emerald-50/30 border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-sm transition-all cursor-pointer group"
              >
                {/* Header row with Shelter Type & Elevation */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                      {getShelterTypeLabel(shelter.type)}
                    </span>

                    <h4 className="font-bold text-xs md:text-sm text-slate-900 group-hover:text-emerald-700 leading-snug font-['Prompt']">
                      {lang === 'th' ? shelter.nameTh : shelter.nameEn}
                    </h4>
                  </div>

                  {/* Elevation & Distance */}
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-0.5 font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      <Mountain className="w-3 h-3" />
                      +{shelter.verificationStamp?.elevationMsl || 320}m MSL
                    </span>
                    {shelter.distanceKm !== undefined && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        ห่าง {shelter.distanceKm} กม.
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mb-2 truncate">
                  📍 {lang === 'th' ? shelter.addressTh : shelter.addressEn}
                </p>

                {/* Capacity (Clean without fabricated live occupancy bar) */}
                <div className="mb-2 p-2 bg-slate-50 rounded-xl text-[11px] text-slate-700 flex items-center justify-between">
                  <span>ความจุรองรับ: <b>{shelter.capacity.toLocaleString()} คน</b></span>
                  <span className="text-[10px] text-slate-400">โทร 1784 เพื่อยืนยัน</span>
                </div>

                {/* Amenities Badges in Thai */}
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {shelter.facilities.slice(0, 4).map((f) => (
                    <span
                      key={f}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium"
                    >
                      ✓ {getFacilityLabel(f, lang)}
                    </span>
                  ))}
                  {shelter.facilities.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-medium">
                      +{shelter.facilities.length - 4}
                    </span>
                  )}
                </div>

                {/* Action Buttons: Official Call Hotline & Plan Route */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <a
                    href="tel:1784"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-3 py-2 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl min-h-[44px]"
                    title="สายด่วน ปภ. 1784"
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                    <span>โทร 1784 (ปภ.)</span>
                  </a>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlanRoute(shelter);
                    }}
                    className="flex-1 py-2 px-3 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm min-h-[44px]"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{t.shelterFinder.planRoute}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
