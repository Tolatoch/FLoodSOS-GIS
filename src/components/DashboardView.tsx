import React, { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  AlertTriangle,
  Home,
  Waves,
  ShieldCheck,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronDown,
  BarChart3,
  X,
  MapPin,
  Check,
} from 'lucide-react';
import { FloodRiskArea, Shelter, ProvinceId } from '../types';
import { PROVINCES } from '../data/geoData';
import { TRANSLATIONS, Language } from '../data/translations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ProvinceSelectorDropdownProps {
  selectedProvince: ProvinceId | 'all';
  onSelectProvince: (p: ProvinceId | 'all') => void;
  lang: Language;
}

const PROVINCE_DROPDOWN_OPTIONS: { id: ProvinceId | 'all'; labelTh: string; labelEn: string }[] = [
  { id: 'all', labelTh: 'ทั้งหมด (5 จังหวัด)', labelEn: 'All (5 Provinces)' },
  { id: 'chiang_mai', labelTh: 'เชียงใหม่', labelEn: 'Chiang Mai' },
  { id: 'chiang_rai', labelTh: 'เชียงราย', labelEn: 'Chiang Rai' },
  { id: 'phayao', labelTh: 'พะเยา', labelEn: 'Phayao' },
  { id: 'nan', labelTh: 'น่าน', labelEn: 'Nan' },
  { id: 'lampang', labelTh: 'ลำปาง', labelEn: 'Lampang' },
];

const ProvinceSelectorDropdown: React.FC<ProvinceSelectorDropdownProps> = ({
  selectedProvince,
  onSelectProvince,
  lang,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentOption =
    PROVINCE_DROPDOWN_OPTIONS.find((o) => o.id === selectedProvince) || PROVINCE_DROPDOWN_OPTIONS[0];
  const currentLabel = lang === 'th' ? currentOption.labelTh : currentOption.labelEn;

  useEffect(() => {
    if (isOpen) {
      const idx = PROVINCE_DROPDOWN_OPTIONS.findIndex((o) => o.id === selectedProvince);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, selectedProvince]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
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
  }, [isOpen]);

  const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % PROVINCE_DROPDOWN_OPTIONS.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + PROVINCE_DROPDOWN_OPTIONS.length) % PROVINCE_DROPDOWN_OPTIONS.length
      );
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < PROVINCE_DROPDOWN_OPTIONS.length) {
        onSelectProvince(PROVINCE_DROPDOWN_OPTIONS[highlightedIndex].id);
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* 44px high, 12px radius, map-pin icon on left, small "จังหวัด" label, current value, chevron on right */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${lang === 'th' ? 'เลือกจังหวัด' : 'Select province'}: ${currentLabel}`}
        className="w-full h-[44px] px-3.5 bg-white border border-slate-200/90 hover:border-slate-300 rounded-[12px] shadow-xs flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors select-none cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-[12px] text-slate-500 font-medium shrink-0">
            {lang === 'th' ? 'จังหวัด' : 'Province'}
          </span>
          <span className="text-[13px] sm:text-sm font-bold text-slate-900 truncate font-['Prompt']">
            {currentLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-sky-600' : ''
          }`}
        />
      </button>

      {/* Dropdown list directly below */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          aria-label={lang === 'th' ? 'รายชื่อจังหวัด' : 'Provinces'}
          className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-[12px] shadow-lg border border-slate-200/90 max-h-[280px] overflow-y-auto divide-y divide-slate-100 py-1"
        >
          {PROVINCE_DROPDOWN_OPTIONS.map((opt, idx) => {
            const isSelected = selectedProvince === opt.id;
            const isHighlighted = highlightedIndex === idx;
            const label = lang === 'th' ? opt.labelTh : opt.labelEn;

            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectProvince(opt.id);
                  setIsOpen(false);
                  buttonRef.current?.focus();
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full h-[44px] px-3.5 flex items-center justify-between text-left transition-colors select-none cursor-pointer ${
                  isHighlighted ? 'bg-sky-50' : 'bg-white'
                }`}
              >
                <span
                  className={`text-[13px] sm:text-sm font-['Prompt'] ${
                    isSelected ? 'font-bold text-sky-700' : 'font-normal text-slate-800'
                  }`}
                >
                  {label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface DashboardViewProps {
  floodAreas: FloodRiskArea[];
  shelters: Shelter[];
  selectedProvince: ProvinceId | 'all';
  onSelectProvince: (p: ProvinceId | 'all') => void;
  lang: Language;
  isPanelMode?: boolean;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  onCollapsePanel?: () => void;
  onClose?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  floodAreas,
  shelters,
  selectedProvince,
  onSelectProvince,
  lang,
  isPanelMode = false,
  onToggleExpand,
  isExpanded = false,
  onCollapsePanel,
  onClose,
}) => {
  const t = TRANSLATIONS[lang];

  // Filtered dataset
  const activeAreas =
    selectedProvince === 'all'
      ? floodAreas
      : floodAreas.filter((a) => a.province === selectedProvince);

  const activeShelters =
    selectedProvince === 'all'
      ? shelters
      : shelters.filter((s) => s.province === selectedProvince);

  // Summary Metrics
  const totalRiskAreas = activeAreas.length;
  const criticalCount = activeAreas.filter((a) => a.riskLevel === 'very_high').length;
  const highCount = activeAreas.filter((a) => a.riskLevel === 'high').length;
  const totalShelters = activeShelters.length;
  const totalCapacity = activeShelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupants = activeShelters.reduce((acc, s) => acc + s.currentOccupants, 0);
  const remainingCapacity = totalCapacity - totalOccupants;
  const maxWaterDepth = activeAreas.reduce((max, a) => Math.max(max, a.waterDepthMeters), 0);

  // 1. Bar Chart Data: Affected area (sq.km.) by risk level per province
  const provinceKeys = Object.keys(PROVINCES) as ProvinceId[];
  const barLabels = provinceKeys.map((p) =>
    lang === 'th' ? PROVINCES[p].nameTh : PROVINCES[p].nameEn
  );

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: lang === 'th' ? 'Very High (วิกฤต)' : 'Very High (Critical)',
        data: provinceKeys.map((pid) =>
          floodAreas
            .filter((a) => a.province === pid && a.riskLevel === 'very_high')
            .reduce((s, a) => s + a.affectedAreaSqKm, 0)
        ),
        backgroundColor: '#7e22ce',
        borderRadius: 4,
      },
      {
        label: lang === 'th' ? 'High (สูง)' : 'High',
        data: provinceKeys.map((pid) =>
          floodAreas
            .filter((a) => a.province === pid && a.riskLevel === 'high')
            .reduce((s, a) => s + a.affectedAreaSqKm, 0)
        ),
        backgroundColor: '#dc2626',
        borderRadius: 4,
      },
      {
        label: lang === 'th' ? 'Moderate (ปานกลาง)' : 'Moderate',
        data: provinceKeys.map((pid) =>
          floodAreas
            .filter((a) => a.province === pid && a.riskLevel === 'moderate')
            .reduce((s, a) => s + a.affectedAreaSqKm, 0)
        ),
        backgroundColor: '#ea580c',
        borderRadius: 4,
      },
      {
        label: lang === 'th' ? 'Low (ต่ำ)' : 'Low',
        data: provinceKeys.map((pid) =>
          floodAreas
            .filter((a) => a.province === pid && a.riskLevel === 'low')
            .reduce((s, a) => s + a.affectedAreaSqKm, 0)
        ),
        backgroundColor: '#eab308',
        borderRadius: 4,
      },
      {
        label: lang === 'th' ? 'Very Low (ต่ำมาก)' : 'Very Low',
        data: provinceKeys.map((pid) =>
          floodAreas
            .filter((a) => a.province === pid && a.riskLevel === 'very_low')
            .reduce((s, a) => s + a.affectedAreaSqKm, 0)
        ),
        backgroundColor: '#16a34a',
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { boxWidth: 10, font: { size: isPanelMode ? 9 : 11 } },
      },
      tooltip: {
        callbacks: {
          label: (item: any) => `${item.dataset.label}: ${item.raw.toFixed(1)} ตร.กม.`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: isPanelMode ? 10 : 12 } },
      },
      y: {
        stacked: true,
        ticks: { font: { size: isPanelMode ? 10 : 12 } },
      },
    },
  };

  // 2. Doughnut Chart: Risk share
  const doughnutData = {
    labels: ['Very High', 'High', 'Moderate', 'Low', 'Very Low'],
    datasets: [
      {
        data: [
          activeAreas.filter((a) => a.riskLevel === 'very_high').length,
          activeAreas.filter((a) => a.riskLevel === 'high').length,
          activeAreas.filter((a) => a.riskLevel === 'moderate').length,
          activeAreas.filter((a) => a.riskLevel === 'low').length,
          activeAreas.filter((a) => a.riskLevel === 'very_low').length,
        ],
        backgroundColor: ['#7e22ce', '#dc2626', '#ea580c', '#eab308', '#16a34a'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: isPanelMode ? 9 : 10 } } },
    },
  };

  // PANEL EMBED MODE (Inside 400px Left Panel)
  if (isPanelMode) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden select-text">
        {/* Panel Header */}
        <div className="px-3 sm:px-4 py-2.5 min-h-[64px] bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 rounded-xl bg-blue-700/60 flex items-center justify-center text-blue-200 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[15px] sm:text-base leading-tight font-['Prompt'] truncate">
                {t.dashboard.title}
              </h3>
              <p className="text-[11px] text-blue-200 truncate hidden sm:block mt-0.5">
                {t.dashboard.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="text-blue-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold"
                title={lang === 'th' ? 'ขยายเต็มจอ' : 'Expand full-width view'}
                aria-label={lang === 'th' ? 'ขยายเต็มจอ' : 'Expand full-width view'}
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === 'th' ? 'ขยาย' : 'Expand'}</span>
              </button>
            )}
            {(onCollapsePanel || onClose) && (
              <button
                onClick={onCollapsePanel || onClose}
                className="text-blue-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                title={lang === 'th' ? 'ยุบแผงด้านข้าง' : 'Collapse Panel'}
                aria-label={lang === 'th' ? 'ยุบแผงด้านข้าง' : 'Collapse Panel'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Panel Content (Scrollable) */}
        <div className="p-3 overflow-y-auto space-y-3 flex-1 text-xs">
          {/* Sticky Province Selector Dropdown */}
          <div className="sticky top-0 z-20 bg-slate-100 -mt-1 pt-1 pb-1">
            <ProvinceSelectorDropdown
              selectedProvince={selectedProvince}
              onSelectProvince={onSelectProvince}
              lang={lang}
            />
          </div>

          {/* 4 Summary Cards (2x2 grid) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block truncate">
                {t.dashboard.summaryCards.totalRiskAreas}
              </span>
              <p className="text-[20px] font-black text-slate-900 font-mono mt-1 leading-none">
                {totalRiskAreas} <span className="text-[10px] font-normal text-slate-500 font-sans">จุด</span>
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1 truncate">
                วิกฤต {criticalCount} • สูง {highCount}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block truncate">
                {t.dashboard.summaryCards.criticalZones}
              </span>
              <p className="text-[20px] font-black text-purple-700 font-mono mt-1 leading-none">
                {criticalCount} <span className="text-[10px] font-normal text-slate-500 font-sans">พื้นที่</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1 truncate">
                น้ำล้นตลิ่ง {maxWaterDepth} ม.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block truncate">
                {t.dashboard.summaryCards.totalShelters}
              </span>
              <p className="text-[20px] font-black text-slate-900 font-mono mt-1 leading-none">
                {totalShelters} <span className="text-[10px] font-normal text-slate-500 font-sans">แห่ง</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                เปิดรับผู้อพยพ 100%
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block truncate">
                {t.dashboard.summaryCards.availableCapacity}
              </span>
              <p className="text-[18px] font-black text-sky-700 font-mono mt-1 leading-none truncate">
                {remainingCapacity.toLocaleString()}{' '}
                <span className="text-[10px] font-normal text-slate-500 font-sans">คน</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1 truncate">
                จาก {totalCapacity.toLocaleString()} คน
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
            <h4 className="font-bold text-[13px] text-slate-900 mb-1 font-['Prompt']">
              {t.dashboard.charts.barTitle}
            </h4>
            <div className="h-48 w-full">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
            <h4 className="font-bold text-[13px] text-slate-900 mb-1 font-['Prompt']">
              {t.dashboard.charts.doughnutTitle}
            </h4>
            <div className="h-44 w-full flex items-center justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>

          {/* Comparison Table */}
          <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <h4 className="font-bold text-[13px] text-slate-900 mb-2 font-['Prompt']">
              {t.dashboard.charts.provinceComparison}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-2">จังหวัด</th>
                    <th className="py-1.5 px-1.5">เสี่ยง</th>
                    <th className="py-1.5 px-1.5">วิกฤต</th>
                    <th className="py-1.5 px-1.5">ศูนย์ฯ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {provinceKeys.map((pid) => {
                    const p = PROVINCES[pid];
                    const pAreas = floodAreas.filter((a) => a.province === pid);
                    const pShelters = shelters.filter((s) => s.province === pid);
                    const pCrit = pAreas.filter((a) => a.riskLevel === 'very_high').length;

                    return (
                      <tr key={pid} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 font-bold text-slate-900 font-['Prompt']">
                          {lang === 'th' ? p.nameTh : p.nameEn}
                        </td>
                        <td className="py-1.5 px-1.5">{pAreas.length}</td>
                        <td className="py-1.5 px-1.5 text-purple-700 font-bold">{pCrit}</td>
                        <td className="py-1.5 px-1.5">{pShelters.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FULL-WIDTH VIEW (max width 1360px centered)
  return (
    <div className="absolute inset-0 top-0 z-30 bg-slate-100 overflow-y-auto p-2.5 sm:p-4 lg:p-8 pt-[max(10px,env(safe-area-inset-top,0px))] sm:pt-4 lg:pt-8 pb-[calc(var(--nav-h)+var(--nav-bump)+16px+env(safe-area-inset-bottom,0px))] lg:pb-8 select-text">
      <div className="max-w-[1360px] mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
        {/* ========================================================
            1. PHONE & TABLET (<1024px): SHEET-STYLE HEADER
            - Colored header bar with round icon on left
            - Title: "แดชบอร์ดติดตามสถานการณ์อุทกภัย" (one line with ellipsis)
            - Subtitle: hidden on phone, shown on tablet
            - Action button: X on right in its own area, never overlaps text
            - Header min-height 64px, nothing clipped at the top
            ======================================================== */}
        <div className="lg:hidden px-3.5 sm:px-4 py-2.5 sm:py-3 min-h-[64px] bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex items-center justify-between shrink-0 shadow-sm rounded-2xl">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 rounded-xl bg-blue-700/60 flex items-center justify-center text-blue-200 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-[16px] sm:text-[18px] leading-tight font-['Prompt'] text-white truncate">
                {t.dashboard.title}
              </h2>
              <p className="text-[11px] sm:text-[12px] text-blue-200 truncate mt-0.5 hidden sm:block">
                {t.dashboard.subtitle}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center ml-2">
            <button
              onClick={onClose || onToggleExpand}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              title={lang === 'th' ? 'ปิด' : 'Close'}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            2. DESKTOP (>=1024px): EXPAND MODE HEADER
            - Title: one line (ellipsis if too long)
            - Subtitle: shown on one line
            - Action buttons: "<" (Collapse to panel) in its own area on right
            - Header min-height 64px, nothing clipped at top
            ======================================================== */}
        <div className="hidden lg:flex items-center justify-between gap-4 bg-white px-4 lg:px-6 py-3 min-h-[64px] rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 border border-sky-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[20px] lg:text-[24px] font-black text-slate-900 font-['Prompt'] leading-tight truncate">
                {t.dashboard.title}
              </h1>
              <p className="text-[12px] lg:text-[13px] text-slate-500 mt-0.5 truncate hidden sm:block">
                {t.dashboard.subtitle}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 ml-2">
            {(onToggleExpand || onCollapsePanel || onClose) && (
              <button
                onClick={onToggleExpand || onCollapsePanel || onClose}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200"
                title={lang === 'th' ? 'ย่อกลับเข้าแถบด้านข้าง' : 'Collapse to panel'}
                aria-label={lang === 'th' ? 'ย่อกลับเข้าแถบด้านข้าง' : 'Collapse to panel'}
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
                <span>{lang === 'th' ? 'ย่อเข้าแถบข้าง' : 'Collapse'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sticky Province Selector Dropdown (Sticky at the top of the dashboard scroll area) */}
        <div className="sticky top-0 z-20 bg-slate-100 py-1 sm:py-1.5 -mx-0.5 px-0.5">
          <ProvinceSelectorDropdown
            selectedProvince={selectedProvince}
            onSelectProvince={onSelectProvince}
            lang={lang}
          />
        </div>

        {/* 4-Column Stat Grid on Desktop: max content width 1360px, centered */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-5">
          <div className="p-3 sm:p-4 lg:p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 lg:mb-3">
              <span className="text-[12px] sm:text-[13px] lg:text-[14px] font-semibold text-slate-500">
                {t.dashboard.summaryCards.totalRiskAreas}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </div>
            </div>
            <p className="text-[24px] sm:text-[28px] lg:text-[36px] font-black text-slate-900 font-mono leading-none">
              {totalRiskAreas} <span className="text-[12px] sm:text-[13px] lg:text-[14px] font-normal text-slate-500 font-sans">จุด</span>
            </p>
            <p className="text-[11px] sm:text-[12px] lg:text-[13px] text-rose-600 font-semibold mt-1.5">
              วิกฤต {criticalCount} จุด • สูง {highCount} จุด
            </p>
          </div>

          <div className="p-3 sm:p-4 lg:p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 lg:mb-3">
              <span className="text-[12px] sm:text-[13px] lg:text-[14px] font-semibold text-slate-500">
                {t.dashboard.summaryCards.criticalZones}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Waves className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </div>
            </div>
            <p className="text-[24px] sm:text-[28px] lg:text-[36px] font-black text-purple-700 font-mono leading-none">
              {criticalCount} <span className="text-[12px] sm:text-[13px] lg:text-[14px] font-normal text-slate-500 font-sans">พื้นที่</span>
            </p>
            <p className="text-[11px] sm:text-[12px] lg:text-[13px] text-slate-500 mt-1.5">
              น้ำล้นตลิ่งสูงสุด {maxWaterDepth} ม.
            </p>
          </div>

          <div className="p-3 sm:p-4 lg:p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 lg:mb-3">
              <span className="text-[12px] sm:text-[13px] lg:text-[14px] font-semibold text-slate-500">
                {t.dashboard.summaryCards.totalShelters}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </div>
            </div>
            <p className="text-[24px] sm:text-[28px] lg:text-[36px] font-black text-slate-900 font-mono leading-none">
              {totalShelters} <span className="text-[12px] sm:text-[13px] lg:text-[14px] font-normal text-slate-500 font-sans">แห่ง</span>
            </p>
            <p className="text-[11px] sm:text-[12px] lg:text-[13px] text-emerald-600 font-semibold mt-1.5">
              เปิดรับผู้อพยพ 100%
            </p>
          </div>

          <div className="p-3 sm:p-4 lg:p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2 lg:mb-3">
              <span className="text-[12px] sm:text-[13px] lg:text-[14px] font-semibold text-slate-500">
                {t.dashboard.summaryCards.availableCapacity}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </div>
            </div>
            <p className="text-[24px] sm:text-[28px] lg:text-[36px] font-black text-sky-700 font-mono leading-none">
              {remainingCapacity.toLocaleString()}{' '}
              <span className="text-[12px] sm:text-[13px] lg:text-[14px] font-normal text-slate-500 font-sans">คน</span>
            </p>
            <p className="text-[11px] sm:text-[12px] lg:text-[13px] text-slate-500 mt-1.5">
              จากทั้งหมด {totalCapacity.toLocaleString()} คน
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {/* Bar Chart */}
          <div className="lg:col-span-2 p-3 sm:p-4 lg:p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col">
            <h3 className="font-bold text-[15px] sm:text-[16px] lg:text-[18px] text-slate-900 mb-1 font-['Prompt']">
              {t.dashboard.charts.barTitle}
            </h3>
            <p className="text-[12px] sm:text-[13px] lg:text-[14px] text-slate-400 mb-3 sm:mb-4">
              คำนวณจากแบบจำลองดาวเทียมและข้อมูลระดับน้ำ GISTDA
            </p>
            <div className="h-64 sm:h-72 lg:h-80 w-full">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="p-3 sm:p-4 lg:p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col">
            <h3 className="font-bold text-[15px] sm:text-[16px] lg:text-[18px] text-slate-900 mb-1 font-['Prompt']">
              {t.dashboard.charts.doughnutTitle}
            </h3>
            <p className="text-[12px] sm:text-[13px] lg:text-[14px] text-slate-400 mb-3 sm:mb-4">
              สัดส่วนจำนวนจุดเสี่ยง 5 ระดับ
            </p>
            <div className="h-56 sm:h-64 lg:h-80 w-full flex items-center justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Inter-Province Comparison Table */}
        <div className="p-3 sm:p-4 lg:p-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <h3 className="font-bold text-[15px] sm:text-[16px] lg:text-[18px] text-slate-900 mb-2.5 sm:mb-3 font-['Prompt']">
            {t.dashboard.charts.provinceComparison}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 sm:py-3 px-2.5 sm:px-3">{t.dashboard.columns.province}</th>
                  <th className="py-2.5 sm:py-3 px-2.5 sm:px-3">{t.dashboard.columns.riskCount}</th>
                  <th className="py-2.5 sm:py-3 px-2.5 sm:px-3">{t.dashboard.columns.criticalCount}</th>
                  <th className="py-2.5 sm:py-3 px-2.5 sm:px-3">{t.dashboard.columns.waterDepthMax}</th>
                  <th className="py-2.5 sm:py-3 px-2.5 sm:px-3">{t.dashboard.columns.sheltersCount}</th>
                  <th className="py-2.5 sm:py-3 px-2.5 sm:px-3">{t.dashboard.columns.shelterCap}</th>
                  <th className="py-3 px-3">{t.dashboard.columns.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {provinceKeys.map((pid) => {
                  const p = PROVINCES[pid];
                  const pAreas = floodAreas.filter((a) => a.province === pid);
                  const pShelters = shelters.filter((s) => s.province === pid);
                  const pCrit = pAreas.filter((a) => a.riskLevel === 'very_high').length;
                  const pMaxDepth = pAreas.reduce((m, a) => Math.max(m, a.waterDepthMeters), 0);
                  const pCap = pShelters.reduce((s, sh) => s + sh.capacity, 0);

                  return (
                    <tr key={pid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 font-['Prompt']">
                        {lang === 'th' ? p.nameTh : p.nameEn}
                      </td>
                      <td className="py-3 px-3">{pAreas.length}</td>
                      <td className="py-3 px-3 text-purple-700 font-bold">{pCrit}</td>
                      <td className="py-3 px-3 text-rose-600 font-bold">{pMaxDepth} ม.</td>
                      <td className="py-3 px-3">{pShelters.length}</td>
                      <td className="py-3 px-3">{pCap.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            pCrit > 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {pCrit > 0 ? 'เฝ้าระวังวิกฤต' : 'ปกติ / ควบคุมได้'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
