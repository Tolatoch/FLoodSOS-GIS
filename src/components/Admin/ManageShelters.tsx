import React, { useState } from 'react';
import {
  Home,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  MapPin,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { Shelter, ProvinceId, ShelterType } from '../../types';
import { TRANSLATIONS, Language } from '../../data/translations';
import { NORTHERN_BOUNDS, PROVINCES } from '../../data/geoData';
import { api } from '../../services/api';

interface ManageSheltersProps {
  shelters: Shelter[];
  onRefreshData: () => void;
  lang: Language;
}

export const ManageShelters: React.FC<ManageSheltersProps> = ({
  shelters,
  onRefreshData,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [coordError, setCoordError] = useState('');
  const [editingItem, setEditingItem] = useState<Partial<Shelter> | null>(null);

  const filtered = shelters.filter(
    (s) =>
      s.nameTh.toLowerCase().includes(search.toLowerCase()) ||
      s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      s.districtTh.toLowerCase().includes(search.toLowerCase()) ||
      s.province.toLowerCase().includes(search.toLowerCase())
  );

  const handleSyncDdpm = async () => {
    setSyncing(true);
    try {
      await api.syncDdpm();
      setSyncSuccess(true);
      onRefreshData();
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  // Validation: ensure lat/lng is strictly within the 5 upper-northern provinces bounds
  const validateCoordinates = (lat: number, lng: number): boolean => {
    const [[minLat, minLng], [maxLat, maxLng]] = NORTHERN_BOUNDS;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setCoordError('');
    if (!editingItem) return;

    const lat = editingItem.lat || 0;
    const lng = editingItem.lng || 0;

    if (!validateCoordinates(lat, lng)) {
      setCoordError(
        'พิกัดไม่อยู่ในพื้นที่ 5 จังหวัดภาคเหนือตอนบน (Lat 17.15 - 20.55, Lng 98.1 - 101.45)'
      );
      return;
    }

    if (editingItem.id) {
      await api.updateShelter(editingItem.id, editingItem);
    } else {
      await api.createShelter({
        ...editingItem,
        source: 'DDPM Open Data CKAN',
        currentOccupants: editingItem.currentOccupants || 0,
        facilities: editingItem.facilities || ['medical', 'drinking_water', 'kitchen'],
      });
    }

    setEditingItem(null);
    onRefreshData();
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.admin.crud.confirmDelete)) {
      await api.deleteShelter(id);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-['Prompt']">
            {t.admin.tabs.shelters}
          </h2>
          <p className="text-xs text-slate-500">
            ระบบบริหารจัดการศูนย์พักพิง ปภ. (PostGIS `shelters` with GiST Point index)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sync DDPM CKAN button */}
          <button
            onClick={handleSyncDdpm}
            disabled={syncing}
            className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-emerald-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'กำลังดึงข้อมูล CKAN...' : t.admin.crud.importDdpm}</span>
          </button>

          {/* Add New Shelter */}
          <button
            onClick={() =>
              setEditingItem({
                nameTh: '',
                nameEn: '',
                type: 'government',
                province: 'chiang_mai',
                districtTh: '',
                districtEn: '',
                subdistrictTh: '',
                subdistrictEn: '',
                addressTh: '',
                addressEn: '',
                lat: 18.795,
                lng: 98.985,
                capacity: 1000,
                currentOccupants: 0,
                status: 'open',
                contact: '053-000-000',
                facilities: ['medical', 'drinking_water', 'kitchen', 'solar_power'],
              })
            }
            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors"
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
          placeholder="ค้นหาชื่อศูนย์พักพิง, อำเภอ, จังหวัด..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">ชื่อศูนย์พักพิง</th>
                <th className="py-3 px-3">ประเภท</th>
                <th className="py-3 px-3">จังหวัด</th>
                <th className="py-3 px-3">พิกัด (Lat, Lng)</th>
                <th className="py-3 px-3">ความจุ (คน)</th>
                <th className="py-3 px-3">เบอร์ติดต่อ</th>
                <th className="py-3 px-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 font-['Prompt'] block">
                      {lang === 'th' ? item.nameTh : item.nameEn}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      📍 {lang === 'th' ? item.addressTh : item.addressEn}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 capitalize">{item.province.replace('_', ' ')}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                    {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-700">
                    {item.capacity.toLocaleString()} คน
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-mono">{item.contact}</td>
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
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm font-['Prompt']">
                {editingItem.id ? t.admin.crud.edit : t.admin.crud.add}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3 text-xs">
              {coordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{coordError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อศูนย์พักพิง (ไทย)
                </label>
                <input
                  type="text"
                  value={editingItem.nameTh || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nameTh: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อศูนย์พักพิง (English)
                </label>
                <input
                  type="text"
                  value={editingItem.nameEn || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nameEn: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  <label className="block text-slate-700 font-semibold mb-1">ประเภท</label>
                  <select
                    value={editingItem.type || 'government'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        type: e.target.value as ShelterType,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="government">อาคารอเนกประสงค์รัฐ</option>
                    <option value="school">โรงเรียน</option>
                    <option value="university">มหาวิทยาลัย</option>
                    <option value="temple">วัด</option>
                    <option value="pao">อบจ.</option>
                    <option value="municipality">เทศบาล</option>
                    <option value="tao">อบต.</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Latitude (17.15 - 20.55)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingItem.lat || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        lat: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Longitude (98.10 - 101.45)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editingItem.lng || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        lng: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ความจุทั้งหมด (คน)
                  </label>
                  <input
                    type="number"
                    value={editingItem.capacity || 0}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    เบอร์โทรศัพท์ฉุกเฉิน
                  </label>
                  <input
                    type="text"
                    value={editingItem.contact || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, contact: e.target.value })
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow"
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
