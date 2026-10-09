import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  FileDown,
  Layers,
  MapPin,
} from 'lucide-react';
import { FloodRiskArea, ProvinceId, RiskLevel } from '../../types';
import { TRANSLATIONS, Language } from '../../data/translations';
import { api } from '../../services/api';

interface ManageFloodRiskProps {
  floodAreas: FloodRiskArea[];
  onRefreshData: () => void;
  lang: Language;
}

export const ManageFloodRisk: React.FC<ManageFloodRiskProps> = ({
  floodAreas,
  onRefreshData,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<FloodRiskArea> | null>(null);

  const filtered = floodAreas.filter(
    (a) =>
      a.titleTh.toLowerCase().includes(search.toLowerCase()) ||
      a.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      a.province.toLowerCase().includes(search.toLowerCase())
  );

  const handleSyncGistda = async () => {
    setSyncing(true);
    try {
      await api.syncGistda();
      setSyncSuccess(true);
      onRefreshData();
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.id) {
      await api.updateFloodArea(editingItem.id, editingItem);
    } else {
      // Create new
      const fullItem: Partial<FloodRiskArea> = {
        ...editingItem,
        center: [editingItem.center?.[0] || 18.79, editingItem.center?.[1] || 98.98],
        polygon: [
          [editingItem.center?.[0] || 18.79, editingItem.center?.[1] || 98.98],
          [(editingItem.center?.[0] || 18.79) + 0.015, editingItem.center?.[1] || 98.98],
          [(editingItem.center?.[0] || 18.79) + 0.015, (editingItem.center?.[1] || 98.98) + 0.015],
          [editingItem.center?.[0] || 18.79, (editingItem.center?.[1] || 98.98) + 0.015],
        ],
        gistdaStatus: editingItem.riskLevel === 'very_high' ? 'critical' : 'warning',
      };
      await api.createFloodArea(fullItem);
    }

    setEditingItem(null);
    onRefreshData();
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.admin.crud.confirmDelete)) {
      await api.deleteFloodArea(id);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-['Prompt']">
            {t.admin.tabs.floodRisk}
          </h2>
          <p className="text-xs text-slate-500">
            จัดการข้อมูลพื้นที่เสี่ยงอุทกภัย 5 จังหวัดภาคเหนือ (PostGIS `flood_risk_areas`)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync GISTDA button */}
          <button
            onClick={handleSyncGistda}
            disabled={syncing}
            className="py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-sky-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'กำลังซิงค์...' : t.admin.crud.importGistda}</span>
          </button>

          {/* Add New Record */}
          <button
            onClick={() =>
              setEditingItem({
                titleTh: '',
                titleEn: '',
                province: 'chiang_mai',
                districtTh: '',
                districtEn: '',
                subdistrictTh: '',
                subdistrictEn: '',
                riskLevel: 'high',
                waterDepthMeters: 1.0,
                affectedAreaSqKm: 5.0,
                affectedHouseholds: 1000,
                center: [18.79, 98.98],
                source: 'GISTDA Flood Monitoring',
              })
            }
            className="py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.admin.crud.add}</span>
          </button>
        </div>
      </div>

      {syncSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{t.admin.crud.importSuccess}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อพื้นที่เสี่ยง, รหัสจุด, หรือจังหวัด..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">รหัส/ชื่อพื้นที่</th>
                <th className="py-3 px-3">จังหวัด</th>
                <th className="py-3 px-3">ระดับความเสี่ยง</th>
                <th className="py-3 px-3">ระดับน้ำ (ม.)</th>
                <th className="py-3 px-3">ครัวเรือน</th>
                <th className="py-3 px-3">อัปเดต</th>
                <th className="py-3 px-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono text-[10px] text-slate-400 block">{item.code}</span>
                    <span className="font-bold text-slate-900 font-['Prompt']">
                      {lang === 'th' ? item.titleTh : item.titleEn}
                    </span>
                  </td>
                  <td className="py-3 px-3 capitalize">{item.province.replace('_', ' ')}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.riskLevel === 'very_high'
                          ? 'bg-purple-100 text-purple-800'
                          : item.riskLevel === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-600">
                    {item.waterDepthMeters} ม.
                  </td>
                  <td className="py-3 px-3">{item.affectedHouseholds.toLocaleString()}</td>
                  <td className="py-3 px-3 text-[10px] text-slate-400">{item.updatedAt}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                        title={t.admin.crud.edit}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"
                        title={t.admin.crud.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm font-['Prompt']">
                {editingItem.id ? t.admin.crud.edit : t.admin.crud.add}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อพื้นที่เสี่ยง (ไทย)
                </label>
                <input
                  type="text"
                  value={editingItem.titleTh || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, titleTh: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อพื้นที่เสี่ยง (English)
                </label>
                <input
                  type="text"
                  value={editingItem.titleEn || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, titleEn: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">จังหวัด</label>
                  <select
                    value={editingItem.province || 'chiang_mai'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        province: e.target.value as ProvinceId,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="chiang_mai">เชียงใหม่</option>
                    <option value="chiang_rai">เชียงราย</option>
                    <option value="phayao">พะเยา</option>
                    <option value="nan">น่าน</option>
                    <option value="lampang">ลำปาง</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ระดับความเสี่ยง
                  </label>
                  <select
                    value={editingItem.riskLevel || 'high'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        riskLevel: e.target.value as RiskLevel,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="very_high">Very High (วิกฤต)</option>
                    <option value="high">High (สูง)</option>
                    <option value="moderate">Moderate (ปานกลาง)</option>
                    <option value="low">Low (ต่ำ)</option>
                    <option value="very_low">Very Low (ต่ำมาก)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ระดับน้ำคาดการณ์ (เมตร)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingItem.waterDepthMeters || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        waterDepthMeters: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ครัวเรือนที่เสี่ยงภัย
                  </label>
                  <input
                    type="number"
                    value={editingItem.affectedHouseholds || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        affectedHouseholds: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  {t.admin.crud.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow"
                >
                  {t.admin.crud.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
