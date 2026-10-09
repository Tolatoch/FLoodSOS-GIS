import React from 'react';
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
  TrendingUp,
  MapPin,
  Compass,
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

interface DashboardViewProps {
  floodAreas: FloodRiskArea[];
  shelters: Shelter[];
  selectedProvince: ProvinceId | 'all';
  onSelectProvince: (p: ProvinceId | 'all') => void;
  lang: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  floodAreas,
  shelters,
  selectedProvince,
  onSelectProvince,
  lang,
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
        borderRadius: 6,
      },
      {
        label: lang === 'th' ? 'High (สูง)' : 'High',
        data: provinceKeys.map((pid) =>
          floodAreas
            .filter((a) => a.province === pid && a.riskLevel === 'high')
            .reduce((s, a) => s + a.affectedAreaSqKm, 0)
        ),
        backgroundColor: '#dc2626',
        borderRadius: 6,
      },
      {
        label: lang === 'th' ? 'Moderate (ปานกลาง)' : 'Moderate',
        data: provinceKeys.map((pid) =>
          floodAreas
            .filter((a) => a.province === pid && a.riskLevel === 'moderate')
            .reduce((s, a) => s + a.affectedAreaSqKm, 0)
        ),
        backgroundColor: '#ea580c',
        borderRadius: 6,
      },
      {
        label: lang === 'th' ? 'Low (ต่ำ)' : 'Low',
        data: provinceKeys.map((pid) =>
          floodAreas
            .filter((a) => a.province === pid && a.riskLevel === 'low')
            .reduce((s, a) => s + a.affectedAreaSqKm, 0)
        ),
        backgroundColor: '#eab308',
        borderRadius: 6,
      },
      {
        label: lang === 'th' ? 'Very Low (ต่ำมาก)' : 'Very Low',
        data: provinceKeys.map((pid) =>
          floodAreas
            .filter((a) => a.province === pid && a.riskLevel === 'very_low')
            .reduce((s, a) => s + a.affectedAreaSqKm, 0)
        ),
        backgroundColor: '#16a34a',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { boxWidth: 12, font: { size: 11 } },
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
        title: {
          display: true,
          text: lang === 'th' ? 'จังหวัด (Province)' : 'Province (Upper Northern Thailand)',
          font: { size: 12, weight: 'bold' as const },
          color: '#334155',
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: lang === 'th' ? 'พื้นที่เสี่ยงอุทกภัย (ตร.กม.)' : 'Affected Area (Sq.Km)',
          font: { size: 12, weight: 'bold' as const },
          color: '#334155',
        },
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
      legend: { position: 'bottom' as const, labels: { boxWidth: 12, font: { size: 10 } } },
    },
  };

  return (
    <div className="absolute inset-0 top-16 md:top-20 z-10 bg-slate-100 overflow-y-auto p-3 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 font-['Prompt']">
              {t.dashboard.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              {t.dashboard.subtitle}
            </p>
          </div>

          {/* Province Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => onSelectProvince('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                selectedProvince === 'all'
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.allProvinces}
            </button>
            {provinceKeys.map((pid) => (
              <button
                key={pid}
                onClick={() => onSelectProvince(pid)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  selectedProvince === pid
                    ? 'bg-sky-600 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lang === 'th' ? PROVINCES[pid].nameTh : PROVINCES[pid].nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Vital Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                {t.dashboard.summaryCards.totalRiskAreas}
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {totalRiskAreas} <span className="text-xs font-normal text-slate-500">จุด</span>
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              วิกฤต {criticalCount} จุด • สูง {highCount} จุด
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                {t.dashboard.summaryCards.criticalZones}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Waves className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-purple-700 font-mono">
              {criticalCount} <span className="text-xs font-normal text-slate-500">พื้นที่</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              น้ำล้นตลิ่งสูงสุด {maxWaterDepth} ม.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                {t.dashboard.summaryCards.totalShelters}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              {totalShelters} <span className="text-xs font-normal text-slate-500">แห่ง</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              เปิดรับผู้อพยพ 100%
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                {t.dashboard.summaryCards.availableCapacity}
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-sky-700 font-mono">
              {remainingCapacity.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">คน</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              จากทั้งหมด {totalCapacity.toLocaleString()} คน
            </p>
          </div>

          <div className="col-span-2 md:col-span-4 lg:col-span-1 p-4 bg-white rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                {t.dashboard.summaryCards.monitoredProvinces}
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 font-mono">
              5 <span className="text-xs font-normal text-slate-500">จังหวัด</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              ลุ่มน้ำปิง วัง กก น่าน อิง
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar Chart */}
          <div className="lg:col-span-2 p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col">
            <h3 className="font-bold text-sm md:text-base text-slate-900 mb-1 font-['Prompt']">
              {t.dashboard.charts.barTitle}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              คำนวณจากแบบจำลองดาวเทียมและข้อมูลระดับน้ำ GISTDA
            </p>
            <div className="h-72 w-full">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col">
            <h3 className="font-bold text-sm md:text-base text-slate-900 mb-1 font-['Prompt']">
              {t.dashboard.charts.doughnutTitle}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              สัดส่วนจำนวนจุดเสี่ยง 5 ระดับ
            </p>
            <div className="h-64 w-full flex items-center justify-center">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Inter-Province Comparison Table */}
        <div className="p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <h3 className="font-bold text-sm md:text-base text-slate-900 mb-3 font-['Prompt']">
            {t.dashboard.charts.provinceComparison}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">{t.dashboard.columns.province}</th>
                  <th className="py-3 px-3">{t.dashboard.columns.riskCount}</th>
                  <th className="py-3 px-3">{t.dashboard.columns.criticalCount}</th>
                  <th className="py-3 px-3">{t.dashboard.columns.waterDepthMax}</th>
                  <th className="py-3 px-3">{t.dashboard.columns.sheltersCount}</th>
                  <th className="py-3 px-3">{t.dashboard.columns.shelterCap}</th>
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
