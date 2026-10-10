import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  BarChart3,
  Home,
  Bot,
  ShieldCheck,
  User as UserIcon,
  Navigation,
  LogOut,
  Check,
  Bookmark,
  Globe,
} from 'lucide-react';
import { User, AppViewMode } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  onSetLang?: (lang: Language) => void;
  viewMode: AppViewMode;
  onChangeViewMode: (mode: AppViewMode) => void;
  activePanel: 'none' | 'shelters' | 'route' | 'agent';
  onTogglePanel: (panel: 'none' | 'shelters' | 'route' | 'agent') => void;
  currentUser: User;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onSignOut: () => void;
  onOpenProfile?: () => void;
  onOpenSavedShelters?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onSetLang,
  viewMode,
  onChangeViewMode,
  activePanel,
  onTogglePanel,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenProfile,
  onOpenSavedShelters,
}) => {
  const t = TRANSLATIONS[lang];

  // Language Popover State
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Account Menu State (Only for signed-in users)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Handle outside click & Esc for both menus
  useEffect(() => {
    if (!langMenuOpen && !accountMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setLangMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLangMenuOpen(false);
        setAccountMenuOpen(false);
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
  }, [langMenuOpen, accountMenuOpen]);

  const handleSelectLanguage = (targetLang: Language) => {
    if (lang !== targetLang) {
      if (onSetLang) {
        onSetLang(targetLang);
      } else {
        onToggleLang();
      }
    }
    setLangMenuOpen(false);
  };

  const handleAccountClick = () => {
    if (currentUser.role === 'guest') {
      // Guest: directly open the auth modal on the SIGN UP form. No dropdown.
      onOpenAuth('signup');
    } else {
      // Signed-in user: toggle dropdown menu
      setAccountMenuOpen(!accountMenuOpen);
    }
  };

  return (
    <>
      {/* ========================================================
          1. TOP-RIGHT FLOATING CONTROLS
          - Order: Globe button, then Account button
          - Hidden on phone & tablet when dashboard is open so nothing sits on top of the title
          - Sizes: 40px phone, 44px tablet, 48px desktop (round white)
          ======================================================== */}
      <div className={`fixed top-3.5 right-3.5 sm:top-4 sm:right-6 z-40 items-center gap-2.5 sm:gap-3 pointer-events-auto ${
        viewMode === 'dashboard' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Language Globe Button */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] lg:min-h-[48px] lg:min-w-[48px] rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-xl border border-slate-200/90 flex items-center justify-center transition-all active:scale-95 backdrop-blur-md"
            title={lang === 'th' ? 'เปลี่ยนภาษา / Change Language' : 'Change Language'}
            aria-label="Language Selector"
            aria-expanded={langMenuOpen}
          >
            <Globe className="w-5 h-5 lg:w-[22px] lg:h-[22px] text-slate-700" />
          </button>

          {/* Language Popover */}
          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[160px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs sm:text-[14px] text-slate-800">
              <button
                onClick={() => handleSelectLanguage('th')}
                className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-sky-50 transition-colors font-medium ${
                  lang === 'th' ? 'text-sky-700 font-bold bg-sky-50/60' : 'text-slate-700'
                }`}
              >
                <span>ภาษาไทย</span>
                {lang === 'th' && <Check className="w-4 h-4 text-sky-600" />}
              </button>
              <button
                onClick={() => handleSelectLanguage('en')}
                className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-sky-50 transition-colors font-medium ${
                  lang === 'en' ? 'text-sky-700 font-bold bg-sky-50/60' : 'text-slate-700'
                }`}
              >
                <span>English</span>
                {lang === 'en' && <Check className="w-4 h-4 text-sky-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Account Button (Person Icon) */}
        <div className="relative" ref={accountMenuRef}>
          <button
            onClick={handleAccountClick}
            className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] lg:min-h-[48px] lg:min-w-[48px] rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-xl border border-slate-200/90 flex items-center justify-center transition-all active:scale-95 backdrop-blur-md"
            title={currentUser.role === 'guest' ? (lang === 'th' ? 'สมัครสมาชิก' : 'Sign Up') : t.auth.myProfile}
            aria-label="User Account Menu"
            aria-expanded={accountMenuOpen}
          >
            {currentUser && currentUser.role !== 'guest' ? (
              currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-sky-400 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                  {(currentUser.name || 'U').charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              <UserIcon className="w-5 h-5 lg:w-[22px] lg:h-[22px] text-slate-700 shrink-0" />
            )}
          </button>

          {/* Account Dropdown Menu (Signed-in users only; language toggle removed) */}
          {accountMenuOpen && currentUser.role !== 'guest' && (
            <div className="absolute right-0 top-full mt-2 w-[220px] sm:w-[250px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs sm:text-[14px] text-slate-800">
              <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center gap-2.5">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {(currentUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate text-xs sm:text-sm leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="py-1 px-1 space-y-0.5">
                <button
                  onClick={() => {
                    if (onOpenProfile) onOpenProfile();
                    setAccountMenuOpen(false);
                  }}
                  className="w-full text-left px-3 h-10 rounded-xl hover:bg-sky-50 flex items-center gap-2.5 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{t.auth.myProfile}</span>
                </button>

                <button
                  onClick={() => {
                    if (onOpenSavedShelters) onOpenSavedShelters();
                    setAccountMenuOpen(false);
                  }}
                  className="w-full text-left px-3 h-10 rounded-xl hover:bg-sky-50 flex items-center gap-2.5 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
                >
                  <Bookmark className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t.auth.savedShelters}</span>
                </button>

                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      onChangeViewMode('admin');
                      setAccountMenuOpen(false);
                    }}
                    className="w-full text-left px-3 h-10 rounded-xl hover:bg-sky-50 flex items-center justify-between text-sky-700 font-semibold text-xs sm:text-sm transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{t.auth.adminPanel}</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded">
                      {t.auth.adminBadge}
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-1 border-t border-slate-100 px-1 pb-1">
                <button
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full text-left px-3 h-10 rounded-xl hover:bg-rose-50 flex items-center gap-2.5 text-rose-600 font-semibold text-xs sm:text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{t.auth.signOut}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          2. CONVEX / DOCKED-FAB BOTTOM NAV FOR PHONE & TABLET (<1024px)
          - Full width, attached to bottom, white, --nav-h 60px (+ safe-area)
          - Soft shadow on top, centered container max 640px on tablet
          - 5 equal items: แผนที่, ศูนย์พักพิง, เส้นทาง, สถิติ, AI
          - Active item: 52px circle in brand gradient, white icon, 4px white ring,
            soft shadow, raised poking out --nav-bump (20px) above the bar
          - Smooth concave notch (sunken curve) docked around the circle
          - Notch and circle slide horizontally in 300ms cubic-bezier(0.3, 0.8, 0.3, 1)
          - Transform & opacity only; press feedback scales to 0.92
          - Label stays below circle inside bar, bold, brand colored, 11px (12px tablet)
          ======================================================== */}
      {(() => {
        const currentTab: 'map' | 'shelters' | 'route' | 'stats' | 'agent' =
          viewMode === 'dashboard'
            ? 'stats'
            : activePanel === 'shelters'
            ? 'shelters'
            : activePanel === 'route'
            ? 'route'
            : activePanel === 'agent'
            ? 'agent'
            : 'map';

        const tabIndexMap: Record<'map' | 'shelters' | 'route' | 'stats' | 'agent', number> = {
          map: 0,
          shelters: 1,
          route: 2,
          stats: 3,
          agent: 4,
        };

        const activeIndex = tabIndexMap[currentTab];

        const navItems: Array<{
          id: 'map' | 'shelters' | 'route' | 'stats' | 'agent';
          labelTh: string;
          labelEn: string;
          icon: React.ComponentType<{ className?: string }>;
          onClick: () => void;
        }> = [
          {
            id: 'map',
            labelTh: 'แผนที่',
            labelEn: 'Map',
            icon: Compass,
            onClick: () => {
              onChangeViewMode('map');
              onTogglePanel('none');
            },
          },
          {
            id: 'shelters',
            labelTh: 'ศูนย์พักพิง',
            labelEn: 'Shelters',
            icon: Home,
            onClick: () => {
              onChangeViewMode('map');
              onTogglePanel('shelters');
            },
          },
          {
            id: 'route',
            labelTh: 'เส้นทาง',
            labelEn: 'Route',
            icon: Navigation,
            onClick: () => {
              onChangeViewMode('map');
              onTogglePanel('route');
            },
          },
          {
            id: 'stats',
            labelTh: 'สถิติ',
            labelEn: 'Stats',
            icon: BarChart3,
            onClick: () => {
              onChangeViewMode('dashboard');
              onTogglePanel('none');
            },
          },
          {
            id: 'agent',
            labelTh: 'AI',
            labelEn: 'AI',
            icon: Bot,
            onClick: () => {
              onChangeViewMode('map');
              onTogglePanel('agent');
            },
          },
        ];

        const ActiveIcon = navItems[activeIndex]?.icon || Compass;

        return (
          <nav
            className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] h-[calc(var(--nav-h)+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)]"
            aria-label={lang === 'th' ? 'แถบนำทางหลัก' : 'Main navigation'}
          >
            <div className="relative w-full max-w-[640px] mx-auto h-[var(--nav-h)]">
              {/* Single Sliding Notch + Active Docked-FAB Circle Layer */}
              <div
                className="absolute top-0 left-0 w-1/5 h-full pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.3,0.8,0.3,1)] motion-reduce:transition-none z-20"
                style={{
                  transform: `translateX(${activeIndex * 100}%)`,
                }}
              >
                {/* Concave Notch SVG (sunken curve) around the circle */}
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[88px] h-[26px] pointer-events-none">
                  <svg viewBox="0 0 88 26" className="w-full h-full" fill="none">
                    {/* Subtle sunken notch background fill */}
                    <path
                      d="M 0 1 C 18 1, 22 22, 44 22 C 66 22, 70 1, 88 1 L 88 26 L 0 26 Z"
                      fill="#f8fafc"
                      opacity="0.9"
                    />
                    {/* Smooth concave notch border line */}
                    <path
                      d="M 0 1 C 18 1, 22 22, 44 22 C 66 22, 70 1, 88 1"
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* Active 52px Circle Docked into the Notch */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-sky-600 via-sky-500 to-blue-600 ring-4 ring-white shadow-[0_8px_20px_rgba(2,132,199,0.38)] flex items-center justify-center transition-transform duration-100 select-none">
                  <ActiveIcon className="w-6 h-6 text-white stroke-[2.25] transition-transform duration-200" />
                </div>
              </div>

              {/* 5 Equal-Width Navigation Items */}
              <div className="grid grid-cols-5 w-full h-full relative z-10">
                {navItems.map((item, idx) => {
                  const isActive = activeIndex === idx;
                  const IconComponent = item.icon;
                  const label = lang === 'th' ? item.labelTh : item.labelEn;

                  return (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className="group relative flex flex-col items-center justify-between h-full w-full pt-2 pb-1.5 transition-transform duration-100 ease-out active:scale-[0.92] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-1 rounded-xl select-none"
                      aria-label={label}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Inactive outline icon (22px, gray) - fades out when active */}
                      <div
                        className={`w-6 h-6 flex items-center justify-center transition-all duration-200 ${
                          isActive
                            ? 'opacity-0 scale-75 pointer-events-none'
                            : 'opacity-100 scale-100 text-slate-500 group-hover:text-slate-800'
                        }`}
                      >
                        <IconComponent className="w-[22px] h-[22px] stroke-[1.75]" />
                      </div>

                      {/* Label below the icon/circle inside the bar */}
                      <span
                        className={`text-[11px] md:text-[12px] leading-tight truncate transition-colors duration-200 ${
                          isActive
                            ? 'text-sky-700 font-bold'
                            : 'text-slate-500 font-normal group-hover:text-slate-800'
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        );
      })()}
    </>
  );
};
