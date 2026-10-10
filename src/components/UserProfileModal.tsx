import React, { useState } from 'react';
import {
  User,
  Bookmark,
  Navigation,
  Clock,
  MapPin,
  Phone,
  Mountain,
  Trash2,
  X,
  Compass,
  ArrowRight,
  Shield,
  Calendar,
} from 'lucide-react';
import { Shelter, SavedRouteHistoryItem } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  initialTab?: 'profile' | 'saved_shelters' | 'route_history';
  onClose: () => void;
  allShelters: Shelter[];
  onSelectShelter: (shelter: Shelter) => void;
  onPlanRoute: (shelter: Shelter) => void;
  lang: Language;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  initialTab = 'profile',
  onClose,
  allShelters,
  onSelectShelter,
  onPlanRoute,
  lang,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];
  const { currentUser, savedShelterIds, toggleSaveShelter, routeHistory, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'saved_shelters' | 'route_history'>(initialTab);

  const savedSheltersList = allShelters.filter((s) => savedShelterIds.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sky-700 via-blue-800 to-indigo-900 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-lg text-white border border-white/20">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Prompt'] leading-tight">{currentUser.name}</h2>
              <p className="text-xs text-sky-200 truncate">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block text-[10px] uppercase px-2 py-0.5 bg-white/20 text-white font-bold rounded-full">
                  {currentUser.role === 'admin' ? t.auth.roleAdmin : t.auth.roleUser}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t.auth.myProfile}</span>
          </button>

          <button
            onClick={() => setActiveTab('saved_shelters')}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'saved_shelters'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-500" />
            <span>{t.auth.savedShelters}</span>
            {savedSheltersList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                {savedSheltersList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('route_history')}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'route_history'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Navigation className="w-4 h-4 text-sky-600" />
            <span>{t.auth.routeHistory}</span>
            {routeHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-sky-100 text-sky-800 text-[10px] font-bold rounded-full">
                {routeHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-700 space-y-4">
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {t.auth.savedShelters}
                  </span>
                  <p className="text-xl font-extrabold text-slate-900 font-['Prompt']">
                    {savedSheltersList.length}{' '}
                    <span className="text-xs font-normal text-slate-500">{lang === 'th' ? 'แห่ง' : 'places'}</span>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {t.auth.routeHistory}
                  </span>
                  <p className="text-xl font-extrabold text-slate-900 font-['Prompt']">
                    {routeHistory.length}{' '}
                    <span className="text-xs font-normal text-slate-500">{lang === 'th' ? 'เส้นทาง' : 'routes'}</span>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">{t.auth.fullName}</span>
                  <span className="font-semibold text-slate-800">{currentUser.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">{t.auth.email}</span>
                  <span className="font-semibold text-slate-800">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">{t.auth.memberSince}</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(currentUser.createdAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-500">{lang === 'th' ? 'ประเภทสิทธิ์' : 'Role'}</span>
                  <span className="font-semibold text-slate-800">
                    {currentUser.role === 'admin' ? t.auth.roleAdmin : t.auth.roleUser}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Saved Shelters */}
          {activeTab === 'saved_shelters' && (
            <div className="space-y-3">
              {savedSheltersList.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-semibold">{t.auth.noSavedShelters}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === 'th'
                      ? 'คุณสามารถกดไอคอนบันทึกที่การ์ดศูนย์พักพิง เพื่อเข้าถึงได้สะดวกในอนาคต'
                      : 'Bookmark shelters from the Shelters tab to access them quickly here.'}
                  </p>
                </div>
              ) : (
                savedSheltersList.map((shelter) => (
                  <div
                    key={shelter.id}
                    className="p-3.5 bg-slate-50 hover:bg-sky-50/50 border border-slate-200/90 rounded-2xl transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 font-['Prompt'] text-sm leading-tight truncate">
                          {lang === 'th' ? shelter.nameTh : shelter.nameEn}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {shelter.districtTh}, {shelter.subdistrictTh}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleSaveShelter(shelter.id)}
                        className="text-amber-500 hover:text-rose-500 p-1 rounded-lg hover:bg-white transition-colors"
                        title={t.auth.removeSaved}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-600">
                      <span className="flex items-center gap-1">
                        <Mountain className="w-3.5 h-3.5 text-slate-400" />
                        <span>{shelter.verificationStamp.elevationMsl}m MSL</span>
                      </span>
                      {shelter.contact && (
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{shelter.contact}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        onClick={() => {
                          onSelectShelter(shelter);
                          onClose();
                        }}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200 text-center text-xs flex items-center justify-center gap-1"
                      >
                        <Compass className="w-3.5 h-3.5 text-sky-600" />
                        <span>{t.auth.viewOnMap}</span>
                      </button>
                      <button
                        onClick={() => {
                          onPlanRoute(shelter);
                          onClose();
                        }}
                        className="flex-1 py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-center text-xs flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{t.auth.planRoute}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Routing History */}
          {activeTab === 'route_history' && (
            <div className="space-y-3">
              {routeHistory.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Navigation className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-semibold">{t.auth.noRouteHistory}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === 'th'
                      ? 'ประวัติเส้นทางที่คุณคำนวณจะปรากฏที่นี่โดยอัตโนมัติ'
                      : 'Evacuation routes calculated will appear here automatically.'}
                  </p>
                </div>
              ) : (
                routeHistory.map((item) => {
                  const targetShelter = allShelters.find((s) => s.id === item.shelterId);
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 font-['Prompt'] text-xs leading-tight truncate">
                            {lang === 'th' ? item.shelterNameTh : item.shelterNameEn}
                          </h4>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(item.timestamp).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}</span>
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-sky-700">{item.distanceKm.toFixed(1)} km</span>
                          <p className="text-[10px] text-slate-500">~{item.durationMinutes} min</p>
                        </div>
                      </div>

                      {targetShelter && (
                        <button
                          onClick={() => {
                            onPlanRoute(targetShelter);
                            onClose();
                          }}
                          className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-center text-xs flex items-center justify-center gap-1"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>{t.auth.planRoute}</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
