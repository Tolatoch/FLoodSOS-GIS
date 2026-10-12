import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Check } from 'lucide-react';
import { ProvinceId } from '../types';
import { PROVINCES } from '../data/geoData';
import { Language, TRANSLATIONS } from '../data/translations';

interface ProvinceFilterButtonProps {
  selectedProvince: ProvinceId | 'all';
  onSelectProvince: (p: ProvinceId | 'all') => void;
  lang: Language;
}

export const ProvinceFilterButton: React.FC<ProvinceFilterButtonProps> = ({
  selectedProvince,
  onSelectProvince,
  lang,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  // Close on tap outside or Esc key
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const [coords, setCoords] = useState<{ right: number; top: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Compute position relative to the button on desktop
  useEffect(() => {
    if (!open) return;
    const updateCoords = () => {
      if (!buttonRef.current || window.innerWidth < 1024) {
        setCoords(null);
        return;
      }
      const rect = buttonRef.current.getBoundingClientRect();
      const right = window.innerWidth - rect.left + 12; // 12px gap to the left of the button
      const estimatedHeight = 310;
      let top = rect.top;
      if (top + estimatedHeight > window.innerHeight - 16) {
        top = Math.max(80, window.innerHeight - 16 - estimatedHeight);
      }
      top = Math.max(80, top);
      setCoords({ right, top });
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [open]);

  const provinceOptions: { id: ProvinceId | 'all'; labelTh: string; labelEn: string }[] = [
    { id: 'all', labelTh: 'ทั้งหมด (5 จังหวัด)', labelEn: 'All (5 Provinces)' },
    { id: 'chiang_mai', labelTh: 'เชียงใหม่', labelEn: 'Chiang Mai' },
    { id: 'chiang_rai', labelTh: 'เชียงราย', labelEn: 'Chiang Rai' },
    { id: 'phayao', labelTh: 'พะเยา', labelEn: 'Phayao' },
    { id: 'nan', labelTh: 'น่าน', labelEn: 'Nan' },
    { id: 'lampang', labelTh: 'ลำปาง', labelEn: 'Lampang' },
  ];

  return (
    <div className="relative" ref={containerRef}>
      {/* 44px round on phone, 52px on desktop */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="w-11 h-11 sm:w-11 sm:h-11 lg:w-[52px] lg:h-[52px] min-h-[44px] min-w-[44px] lg:min-h-[52px] lg:min-w-[52px] bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-xl border border-slate-200/90 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group backdrop-blur-md relative"
        title={lang === 'th' ? 'กรองตามจังหวัด' : 'Filter by Province'}
        aria-label={lang === 'th' ? 'กรองตามจังหวัด' : 'Filter by Province'}
        aria-expanded={open}
      >
        <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-sky-600 transition-transform group-hover:scale-110" />

        {/* When a province is selected, show small brand-colored dot */}
        {selectedProvince !== 'all' && (
          <span className="absolute top-1 right-1 lg:top-1.5 lg:right-1.5 w-2.5 h-2.5 bg-sky-600 rounded-full ring-2 ring-white" />
        )}
      </button>

      {/* Popover:
          - Phone & tablet (< 1024px): opening above the button
          - Desktop (>= 1024px): fixed position to the LEFT of the button (12px gap),
            clamped inside viewport: 16px margin on every side, never higher than 80px from top,
            max-height calc(100dvh - 96px) with internal scroll, width 220px, 44px rows */}
      {open && (
        <div
          className="fixed z-50 w-[220px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 text-slate-800 animate-in fade-in zoom-in-95 overflow-y-auto no-scrollbar
            /* Mobile/tablet: right-3.5 sm:right-4, bottom at calculated offset above province button */
            max-lg:right-3.5 max-sm:right-3.5 sm:max-lg:right-4 max-lg:bottom-[calc(var(--nav-h)+var(--nav-bump)+12px+env(safe-area-inset-bottom,0px)+176px)] max-lg:max-h-[calc(100dvh-200px)]"
          style={
            coords
              ? {
                  right: `${coords.right}px`,
                  top: `${coords.top}px`,
                  maxHeight: 'calc(100dvh - 96px)',
                }
              : {
                  maxHeight: 'min(calc(100dvh - 96px), calc(100dvh - 80px - 16px))',
                }
          }
        >
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-['Prompt']">
              {lang === 'th' ? 'เลือกจังหวัด' : 'Select Province'}
            </span>
          </div>

          <div className="py-1">
            {provinceOptions.map((opt) => {
              const isSelected = selectedProvince === opt.id;
              const label = lang === 'th' ? opt.labelTh : opt.labelEn;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSelectProvince(opt.id);
                    setOpen(false);
                  }}
                  className={`w-full h-11 px-3.5 flex items-center justify-between text-[14px] font-medium transition-colors text-left ${
                    isSelected
                      ? 'bg-sky-50 text-sky-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{label}</span>
                  {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
