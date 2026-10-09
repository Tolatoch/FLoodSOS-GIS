import React, { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  AlertTriangle,
  Home,
  Users,
  ScrollText,
  ArrowLeft,
  Compass,
} from 'lucide-react';
import { TRANSLATIONS, Language } from '../../data/translations';
import { FloodRiskArea, Shelter, User } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { ManageFloodRisk } from './ManageFloodRisk';
import { ManageShelters } from './ManageShelters';
import { UserManagement } from './UserManagement';
import { AuditLogsView } from './AuditLogsView';

interface AdminLayoutProps {
  onBackToMap: () => void;
  floodAreas: FloodRiskArea[];
  shelters: Shelter[];
  onRefreshData: () => void;
  currentUser: User;
  lang: Language;
}

export type AdminTab = 'dashboard' | 'flood_risk' | 'shelters' | 'users' | 'audit';

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  onBackToMap,
  floodAreas,
  shelters,
  onRefreshData,
  currentUser,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const t = TRANSLATIONS[lang];

  return (
    <div className="absolute inset-0 z-30 bg-slate-100 flex flex-col md:flex-row overflow-hidden font-['Noto_Sans_Thai',sans-serif]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Admin Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-white font-['Prompt']">
                  FloodSOS <span className="text-sky-400">Admin</span>
                </h2>
                <span className="text-[10px] text-slate-400">Portal v2.4 (PostGIS)</span>
              </div>
            </div>
            <button
              onClick={onBackToMap}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title={t.admin.backToMap}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t.admin.tabs.dashboard}</span>
            </button>

            <button
              onClick={() => setActiveTab('flood_risk')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'flood_risk'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{t.admin.tabs.floodRisk}</span>
            </button>

            <button
              onClick={() => setActiveTab('shelters')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'shelters'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t.admin.tabs.shelters}</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.admin.tabs.users}</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-sky-600 text-white font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>{t.admin.tabs.audit}</span>
            </button>
          </nav>
        </div>

        {/* Back to GIS Map button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onBackToMap}
            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Compass className="w-4 h-4 text-sky-400" />
            <span>{t.admin.backToMap}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            floodAreas={floodAreas}
            shelters={shelters}
            currentUser={currentUser}
            lang={lang}
          />
        )}
        {activeTab === 'flood_risk' && (
          <ManageFloodRisk
            floodAreas={floodAreas}
            onRefreshData={onRefreshData}
            lang={lang}
          />
        )}
        {activeTab === 'shelters' && (
          <ManageShelters
            shelters={shelters}
            onRefreshData={onRefreshData}
            lang={lang}
          />
        )}
        {activeTab === 'users' && <UserManagement lang={lang} />}
        {activeTab === 'audit' && <AuditLogsView lang={lang} />}
      </main>
    </div>
  );
};
