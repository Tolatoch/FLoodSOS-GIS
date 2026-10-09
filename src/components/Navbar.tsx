import React, { useState } from 'react';
import {
  Compass,
  BarChart3,
  Home,
  Bot,
  ShieldCheck,
  Globe,
  User as UserIcon,
  Search,
  Navigation,
  AlertTriangle,
  LogOut,
  MapPin,
  AlertOctagon,
  Moon,
  Sun,
  Lock,
  Menu,
  Check,
  X,
} from 'lucide-react';
import { ProvinceId, User, AppViewMode, BasemapType } from '../types';
import { PROVINCES } from '../data/geoData';
import { TRANSLATIONS, Language } from '../data/translations';

interface NavbarProps {
  selectedProvince: ProvinceId | 'all';
  onSelectProvince: (p: ProvinceId | 'all') => void;
  lang: Language;
  onToggleLang: () => void;
  viewMode: AppViewMode;
  onChangeViewMode: (mode: AppViewMode) => void;
  activePanel: 'none' | 'shelters' | 'route' | 'agent';
  onTogglePanel: (panel: 'none' | 'shelters' | 'route' | 'agent') => void;
  onOpenEmergencyWizard: () => void;
  currentUser: User;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onSearchSelect: (item: any) => void;
  searchItems: { id: string; title: string; type: 'flood' | 'shelter' | 'province'; lat: number; lng: number }[];
  basemap: BasemapType;
  onChangeBasemap: (basemap: BasemapType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedProvince,
  onSelectProvince,
  lang,
  onToggleLang,
  viewMode,
  onChangeViewMode,
  activePanel,
  onTogglePanel,
  onOpenEmergencyWizard,
  currentUser,
  onOpenAuth,
  onSignOut,
  onSearchSelect,
  searchItems,
  basemap,
  onChangeBasemap,
}) => {
  const t = TRANSLATIONS[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredSearch = searchQuery.trim()
    ? searchItems
        .filter((item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  return (
    <>
      {/* ========================================================
          TOP HEADER & FLOATING CONTROLS
          ======================================================== */}
      <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-2 md:p-3 safe-top flex flex-col gap-2 max-w-full overflow-hidden">
        {/* ========================================================
            Requirement 1: Header - One Row Only!
            Show logo, SOS button, profile/sign-in button.
            Language toggle and dark mode moved into menu.
            Nothing may overflow horizontally.
            ======================================================== */}
        <div className="pointer-events-auto flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md px-2.5 md:px-4 py-1.5 md:py-2 rounded-2xl shadow-lg border border-slate-200/80 w-full max-w-full overflow-hidden min-h-[52px]">
          {/* 1. Logo & Branding (Left) */}
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            <button
              onClick={() => {
                onChangeViewMode('map');
                onTogglePanel('none');
              }}
              className="flex items-center gap-2 group text-left min-w-0"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Compass className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-sm md:text-lg tracking-tight text-slate-900 font-['Prompt'] truncate">
                    FloodSOS<span className="text-sky-600"> GIS</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    LIVE
                  </span>
                </div>
                <p className="hidden xl:block text-[10px] text-slate-500 font-medium truncate max-w-xs">
                  5 จังหวัดภาคเหนือตอนบน
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Only: Google Maps Search Bar in Main Header */}
          <div className="hidden md:block relative flex-1 max-w-xs lg:max-w-sm mx-2">
            <div className="relative flex items-center bg-slate-100/90 hover:bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500 rounded-xl transition-all border border-slate-200/60 px-3 py-1.5 shadow-inner">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent border-none text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchOpen(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Desktop Autocomplete */}
            {searchOpen && filteredSearch.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in">
                {filteredSearch.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      onSearchSelect(item);
                      setSearchQuery(item.title);
                      setSearchOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 flex items-center gap-2 border-b border-slate-100 last:border-b-0"
                  >
                    {item.type === 'flood' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : item.type === 'shelter' ? (
                      <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                    )}
                    <span className="font-medium text-slate-800 truncate">{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop View Switchers */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => {
                onChangeViewMode('map');
                onTogglePanel('none');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'map' && activePanel === 'none'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t.tabs.map}</span>
            </button>
            <button
              onClick={() => onChangeViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t.tabs.dashboard}</span>
            </button>
          </div>

          {/* Right Action Cluster: SOS Button & Profile/Settings Menu Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 2. SOS Button (Touch Target >= 44px) */}
            <button
              onClick={onOpenEmergencyWizard}
              className="min-h-[44px] px-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-95 text-white font-extrabold rounded-xl shadow-md shadow-rose-600/20 text-xs flex items-center justify-center gap-1 shrink-0 font-['Prompt'] transition-all"
              title="ขอความช่วยเหลือฉุกเฉิน 3 ขั้นตอน"
            >
              <AlertOctagon className="w-4 h-4 text-white animate-pulse" />
              <span className="hidden sm:inline">SOS ฉุกเฉิน</span>
              <span className="sm:hidden font-black">SOS</span>
            </button>

            {/* 3. Profile / Settings Menu Button (Touch Target >= 44px) */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl text-xs font-medium transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 border border-slate-200/80 active:scale-95"
                title="เมนูและการตั้งค่า (Menu & Settings)"
                aria-label="User Menu and Settings"
              >
                <UserIcon className="w-4 h-4 text-slate-700" />
                <Menu className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Combined Menu Dropdown (User Account, Language Toggle, Dark Mode) */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-800">
                  {/* User Profile Card */}
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">
                      {currentUser.role === 'guest' ? 'ผู้เยี่ยมชม (Guest)' : currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    {currentUser.role === 'guest' ? (
                      <button
                        onClick={() => {
                          onOpenAuth();
                          setMenuOpen(false);
                        }}
                        className="mt-2 w-full py-1.5 px-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-center transition-colors"
                      >
                        {t.auth.signIn} / {t.auth.signUp}
                      </button>
                    ) : (
                      <span className="inline-block mt-1 text-[9px] uppercase px-1.5 py-0.5 bg-sky-100 text-sky-800 font-bold rounded">
                        {currentUser.role}
                      </span>
                    )}
                  </div>

                  {/* Menu Item 1: Language Toggle (Moved into Menu as requested) */}
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      {lang === 'th' ? 'ภาษา / Language' : 'Language'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => {
                          if (lang !== 'th') onToggleLang();
                        }}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                          lang === 'th' ? 'bg-white shadow text-sky-700' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lang === 'th' && <Check className="w-3 h-3 text-sky-600" />}
                        <span>ภาษาไทย</span>
                      </button>
                      <button
                        onClick={() => {
                          if (lang !== 'en') onToggleLang();
                        }}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                          lang === 'en' ? 'bg-white shadow text-sky-700' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lang === 'en' && <Check className="w-3 h-3 text-sky-600" />}
                        <span>English</span>
                      </button>
                    </div>
                  </div>

                  {/* Menu Item 2: Dark Mode Toggle (Moved into Menu as requested) */}
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      {lang === 'th' ? 'โหมดแผนที่ / Basemap Theme' : 'Basemap Theme'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => onChangeBasemap('osm')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          basemap !== 'dark' ? 'bg-white shadow text-sky-700' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => onChangeBasemap('dark')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          basemap === 'dark' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-sky-400" />
                        <span>Dark SOS</span>
                      </button>
                    </div>
                  </div>

                  {/* Menu Item 3: Protected Admin Portal (Admin Only) */}
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        onChangeViewMode('admin');
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-sky-50 flex items-center gap-2 text-slate-700 font-semibold border-b border-slate-100"
                    >
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <span>{t.tabs.admin} (Protected)</span>
                    </button>
                  )}

                  {/* Menu Item 4: Sign Out (if logged in) */}
                  {currentUser.role !== 'guest' && (
                    <button
                      onClick={() => {
                        onSignOut();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.auth.signOut}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            Requirement 5: Show floating search bar and province chips
            on the Map tab only! Other tabs get their own header.
            ======================================================== */}
        {viewMode === 'map' && activePanel === 'none' && (
          <>
            {/* Mobile Google Maps-Style Floating Search Bar */}
            <div className="md:hidden pointer-events-auto relative w-full px-0.5 animate-in fade-in">
              <div className="relative flex items-center bg-white/95 backdrop-blur-md shadow-md rounded-2xl border border-slate-200/90 px-3 py-1.5 min-h-[44px]">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent border-none text-xs text-slate-800 focus:outline-none placeholder:text-slate-400 font-normal"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px]"
                    aria-label="Clear Search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Mobile Autocomplete Results */}
              {searchOpen && filteredSearch.length > 0 && (
                <div className="absolute top-full left-0.5 right-0.5 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  {filteredSearch.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        onSearchSelect(item);
                        setSearchQuery(item.title);
                        setSearchOpen(false);
                      }}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-sky-50 flex items-center gap-2 border-b border-slate-100 last:border-b-0 min-h-[44px]"
                    >
                      {item.type === 'flood' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : item.type === 'shelter' ? (
                        <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                      )}
                      <span className="font-medium text-slate-800 truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Province chips: horizontally scrollable row */}
            <div className="pointer-events-auto relative w-full max-w-full overflow-hidden animate-in fade-in">
              {/* Left Edge Gradient Fade */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-900/40 to-transparent z-10" />

              {/* Right Edge Gradient Fade */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-900/40 to-transparent z-10" />

              {/* Scrollable Container with Snap Scrolling */}
              <div className="flex items-center gap-1.5 overflow-x-auto snap-scroll-x no-scrollbar py-1 px-1">
                {/* All Provinces Chip */}
                <button
                  onClick={() => onSelectProvince('all')}
                  className={`snap-item shrink-0 min-h-[44px] min-w-[56px] px-3.5 py-1.5 text-xs font-semibold rounded-2xl transition-all flex items-center justify-center ${
                    selectedProvince === 'all'
                      ? 'bg-sky-600 text-white shadow-md font-bold ring-2 ring-sky-400/40'
                      : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-200/90 shadow-sm backdrop-blur-md'
                  }`}
                >
                  {t.allProvinces}
                </button>

                {/* All 5 Upper-Northern Provinces */}
                {(Object.keys(PROVINCES) as ProvinceId[]).map((pid) => (
                  <button
                    key={pid}
                    onClick={() => onSelectProvince(pid)}
                    className={`snap-item shrink-0 min-h-[44px] px-3.5 py-1.5 text-xs font-semibold rounded-2xl transition-all flex items-center justify-center ${
                      selectedProvince === pid
                        ? 'bg-sky-600 text-white shadow-md font-bold ring-2 ring-sky-400/40'
                        : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-200/90 shadow-sm backdrop-blur-md'
                    }`}
                  >
                    {lang === 'th' ? PROVINCES[pid].nameTh : PROVINCES[pid].nameEn}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </header>

      {/* ========================================================
          Requirement 5: Bottom tab bar - single-line labels
          (แผนที่, ศูนย์พักพิง, เส้นทาง, สถิติ, AI),
          font size >= 11px, active state clearly visible.
          ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-2xl flex items-center justify-around px-1 safe-bottom min-h-[56px]">
        {/* Tab 1: แผนที่ (Map) */}
        <button
          onClick={() => {
            onChangeViewMode('map');
            onTogglePanel('none');
          }}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all ${
            viewMode === 'map' && activePanel === 'none'
              ? 'text-sky-600 font-bold bg-sky-50/70'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label={lang === 'th' ? 'แผนที่' : 'Map'}
        >
          <Compass className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[11px] font-semibold whitespace-nowrap truncate leading-none">
            {lang === 'th' ? 'แผนที่' : 'Map'}
          </span>
        </button>

        {/* Tab 2: ศูนย์พักพิง (Shelters) */}
        <button
          onClick={() => {
            onChangeViewMode('map');
            onTogglePanel(activePanel === 'shelters' ? 'none' : 'shelters');
          }}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all ${
            activePanel === 'shelters'
              ? 'text-emerald-600 font-bold bg-emerald-50/70'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label={lang === 'th' ? 'ศูนย์พักพิง' : 'Shelters'}
        >
          <Home className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[11px] font-semibold whitespace-nowrap truncate leading-none">
            {lang === 'th' ? 'ศูนย์พักพิง' : 'Shelters'}
          </span>
        </button>

        {/* Tab 3: เส้นทาง (Route) */}
        <button
          onClick={() => {
            onChangeViewMode('map');
            onTogglePanel(activePanel === 'route' ? 'none' : 'route');
          }}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all ${
            activePanel === 'route'
              ? 'text-sky-600 font-bold bg-sky-50/70'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label={lang === 'th' ? 'เส้นทาง' : 'Route'}
        >
          <Navigation className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[11px] font-semibold whitespace-nowrap truncate leading-none">
            {lang === 'th' ? 'เส้นทาง' : 'Route'}
          </span>
        </button>

        {/* Tab 4: สถิติ (Stats / Dashboard) */}
        <button
          onClick={() => {
            onChangeViewMode('dashboard');
            onTogglePanel('none');
          }}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all ${
            viewMode === 'dashboard'
              ? 'text-sky-600 font-bold bg-sky-50/70'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label={lang === 'th' ? 'สถิติ' : 'Stats'}
        >
          <BarChart3 className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[11px] font-semibold whitespace-nowrap truncate leading-none">
            {lang === 'th' ? 'สถิติ' : 'Stats'}
          </span>
        </button>

        {/* Tab 5: AI (AI Agent) */}
        <button
          onClick={() => {
            onTogglePanel(activePanel === 'agent' ? 'none' : 'agent');
          }}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 rounded-xl transition-all ${
            activePanel === 'agent'
              ? 'text-purple-600 font-bold bg-purple-50/70'
              : 'text-purple-600/80 hover:text-purple-900'
          }`}
          aria-label="AI"
        >
          <Bot className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[11px] font-semibold whitespace-nowrap truncate leading-none">
            AI
          </span>
        </button>
      </nav>
    </>
  );
};
