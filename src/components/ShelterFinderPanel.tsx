import React, { useEffect } from 'react';
import {
  Home,
  Navigation,
  MapPin,
  Phone,
  Mountain,
  Bookmark,
  X,
  ChevronLeft,
} from 'lucide-react';
import { Shelter, ShelterType, ProvinceId } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { useAuth } from '../context/AuthContext';

interface ShelterFinderPanelProps {
  shelters: (Shelter & { distanceKm?: number })[];
  selectedProvince: ProvinceId | 'all';
  onSelectShelter: (shelter: Shelter) => void;
  onPlanRoute: (shelter: Shelter) => void;
  onLocateUser: () => void;
  onClose: () => void;
  onOpenAuth?: () => void;
  lang: Language;
  isDesktopPanel?: boolean;
  onHoverShelter?: (shelterId: string | null) => void;
  selectedShelter?: Shelter | null;
  onCollapse?: () => void;
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
  onOpenAuth,
  lang,
  isDesktopPanel = false,
  onHoverShelter,
  selectedShelter,
  onCollapse,
}) => {
  const t = TRANSLATIONS[lang];
  const { currentUser, isShelterSaved, toggleSaveShelter } = useAuth();

  // Filter shelters by province
  const filtered = shelters.filter((s) => {
    if (selectedProvince !== 'all' && s.province !== selectedProvince) return false;
    return true;
  });

  // Sort by nearest when GPS location is known (distanceKm present), otherwise in default order
  const hasGpsDistance = shelters.some((s) => s.distanceKm !== undefined && s.distanceKm !== null);
  if (hasGpsDistance) {
    filtered.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  const getShelterTypeLabel = (type: ShelterType) => {
    return t.shelterTypes[type] || type;
  };

  // Auto-scroll to selected shelter when selectedShelter changes
  useEffect(() => {
    if (selectedShelter) {
      const cardEl = document.getElementById(`shelter-card-${selectedShelter.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedShelter?.id]);

  // 3 Bottom Sheet States on Phone: 'peek' (~96px), 'half' (50%), 'full' (90%)
  const [sheetState, setSheetState] = React.useState<'peek' | 'half' | 'full'>('half');

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

  return (
    <div className={containerClasses}>
      {/* Draggable Handle for Bottom Sheet on phone only */}
      {!isDesktopPanel && (
        <button
          onClick={cycleSheetState}
          className="w-full flex flex-col items-center justify-center pt-2 pb-1 shrink-0 md:hidden hover:bg-slate-50 active:bg-slate-100"
          aria-label="Toggle Sheet Height"
        >
          <div className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors" />
        </button>
      )}

      {/* Shelter Tab Header: title fully visible, collapse button removed on desktop, close X kept */}
      <div className="px-4 py-3 min-h-[56px] bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div
          className={`flex items-center gap-2.5 ${!isDesktopPanel ? 'cursor-pointer md:cursor-default' : ''}`}
          onClick={!isDesktopPanel ? cycleSheetState : undefined}
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600/60 flex items-center justify-center text-emerald-200 shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[16px] leading-snug font-['Prompt'] text-white">
              {t.shelterFinder.title}
            </h3>
            <p className="text-[12px] text-emerald-200 truncate leading-normal">
              {lang === 'th' ? 'ศูนย์พักพิงที่ดอนสูง พ้นแนวน้ำท่วม ปภ.' : 'High-Ground Evacuation Centers'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isDesktopPanel ? (
            <button
              onClick={onCollapse || onClose}
              className="text-emerald-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title={lang === 'th' ? 'ยุบแผงด้านข้าง' : 'Collapse Panel'}
              aria-label="Collapse"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-emerald-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title={lang === 'th' ? 'ปิด' : 'Close'}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* GPS Locate Control only: Search bar, type dropdown, and sort dropdown deleted as requested */}
      <div className="p-3 sm:p-3.5 border-b border-slate-100 bg-slate-50 shrink-0">
        <button
          onClick={onLocateUser}
          className="w-full h-11 min-h-[44px] px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm sm:text-[15px] shadow-sm transition-all active:scale-98"
        >
          <MapPin className="w-4 h-4 sm:w-[18px] sm:h-[18px] animate-bounce shrink-0" />
          <span>{t.shelterFinder.locateNearMe}</span>
        </button>
      </div>

      {/* Shelters List: sorted by nearest when GPS location is known, otherwise default order */}
      <div className="p-2.5 sm:p-3 overflow-y-auto space-y-2.5 flex-1 bg-white">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs sm:text-sm">
            ไม่พบศูนย์พักพิงในพื้นที่นี้
          </div>
        ) : (
          filtered.map((shelter) => {
            const isSelected = selectedShelter?.id === shelter.id;
            return (
              <div
                key={shelter.id}
                id={`shelter-card-${shelter.id}`}
                onClick={() => onSelectShelter(shelter)}
                onMouseEnter={() => onHoverShelter?.(shelter.id)}
                onMouseLeave={() => onHoverShelter?.(null)}
                className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-emerald-50/60 border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
                    : 'bg-white hover:bg-emerald-50/30 border-slate-200 hover:border-emerald-400 shadow-xs'
                }`}
              >
                {/* Header row with Shelter Type & Elevation */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                      {getShelterTypeLabel(shelter.type)}
                    </span>

                    <h4 className="font-bold text-[15px] sm:text-[17px] text-slate-900 group-hover:text-emerald-700 leading-snug font-['Prompt'] truncate">
                      {lang === 'th' ? shelter.nameTh : shelter.nameEn}
                    </h4>
                  </div>

                  {/* Elevation & Distance */}
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-0.5 font-extrabold text-xs sm:text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      <Mountain className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      +{shelter.verificationStamp?.elevationMsl || 320}m MSL
                    </span>
                    {shelter.distanceKm !== undefined && (
                      <span className="text-[12px] sm:text-[13px] text-slate-500 block mt-0.5">
                        ห่าง {shelter.distanceKm} กม.
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[12px] sm:text-[14px] text-slate-500 mb-2 truncate">
                  📍 {lang === 'th' ? shelter.addressTh : shelter.addressEn}
                </p>

                {/* Capacity */}
                <div className="mb-2 p-2 bg-slate-50 rounded-xl text-[12px] sm:text-[13px] text-slate-700 flex items-center justify-between">
                  <span>ความจุรองรับ: <b>{shelter.capacity.toLocaleString()} คน</b></span>
                  <span className="text-[11px] sm:text-[12px] text-slate-400">โทร 1784 เพื่อยืนยัน</span>
                </div>

                {/* Amenities Badges in Thai */}
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {shelter.facilities.slice(0, 4).map((f) => (
                    <span
                      key={f}
                      className="px-2 py-0.5 rounded text-[11px] sm:text-[12px] bg-slate-100 text-slate-700 font-medium"
                    >
                      ✓ {getFacilityLabel(f, lang)}
                    </span>
                  ))}
                  {shelter.facilities.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded text-[11px] sm:text-[12px] bg-slate-100 text-slate-500 font-medium">
                      +{shelter.facilities.length - 4}
                    </span>
                  )}
                </div>

                {/* Action Buttons: Hotline Call, Bookmark, & Plan Route */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <a
                    href="tel:1784"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-3 h-10 sm:h-11 min-h-[40px] text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                    title="สายด่วน ปภ. 1784"
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                    <span>1784</span>
                  </a>

                  {/* Bookmark Save Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentUser.role === 'guest') {
                        if (onOpenAuth) onOpenAuth();
                      } else {
                        toggleSaveShelter(shelter.id);
                      }
                    }}
                    className={`h-10 w-10 sm:h-11 sm:w-11 min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center transition-all ${
                      isShelterSaved(shelter.id)
                        ? 'bg-amber-50 text-amber-600 border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
                    }`}
                    title={isShelterSaved(shelter.id) ? t.auth.saved : t.auth.saveShelter}
                    aria-label={isShelterSaved(shelter.id) ? t.auth.saved : t.auth.saveShelter}
                  >
                    <Bookmark className={`w-4 h-4 ${isShelterSaved(shelter.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Main Action: Plan Route 44px */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlanRoute(shelter);
                    }}
                    className="flex-1 h-11 min-h-[44px] px-3 text-sm sm:text-[15px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                  >
                    <Navigation className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
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
