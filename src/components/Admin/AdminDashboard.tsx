import React, { useEffect, useState } from 'react';
import {
  Users,
  Activity,
  AlertTriangle,
  Home,
  CheckCircle,
  Database,
  Server,
  Zap,
} from 'lucide-react';
import { FloodRiskArea, Shelter, User } from '../../types';
import { TRANSLATIONS, Language } from '../../data/translations';
import { api } from '../../services/api';

interface AdminDashboardProps {
  floodAreas: FloodRiskArea[];
  shelters: Shelter[];
  currentUser: User;
  lang: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  floodAreas,
  shelters,
  currentUser,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [stats, setStats] = useState({
    totalUsers: 18,
    activeUsers: 6,
    totalFloodAreas: floodAreas.length,
    totalShelters: shelters.length,
    totalAuditLogs: 12,
  });

  useEffect(() => {
    api.getAdminStats().then((data) => {
      if (data) setStats(data);
    });
  }, []);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-blue-800 to-indigo-900 rounded-3xl p-5 md:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-sky-200 mb-2">
            ADMIN CONSOLE
          </span>
          <h1 className="text-xl md:text-2xl font-black font-['Prompt']">
            {lang === 'th' ? `ยินดีต้อนรับ, ${currentUser.name}` : `Welcome back, ${currentUser.name}`}
          </h1>
          <p className="text-xs md:text-sm text-sky-200 mt-1">
            {lang === 'th'
              ? 'ระบบสารสนเทศภูมิศาสตร์บริหารจัดการข้อมูลอุทกภัยและศูนย์พักพิงภาคเหนือตอนบน'
              : 'Web GIS Operational Command Center for Upper Northern Thailand'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            PostGIS Connected
          </span>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.admin.stats.totalUsers}</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{stats.totalUsers}</p>
          <p className="text-[11px] text-sky-600 mt-1 font-semibold">บัญชีผู้ใช้งานในระบบ</p>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.admin.stats.activeUsers}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{stats.activeUsers}</p>
          <p className="text-[11px] text-slate-500 mt-1">ออนไลน์ขณะนี้</p>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.admin.stats.totalFloodAreas}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">{floodAreas.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">GISTDA Polygon Features</p>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.admin.stats.totalShelters}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">{shelters.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">DDPM Safe Points</p>
        </div>
      </div>

      {/* System Health & Architecture telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-['Prompt']">
            <Server className="w-4 h-4 text-sky-600" />
            <span>สถานะระบบและเทคโนโลยี (System Stack)</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-700">Database Engine</span>
              <span className="font-mono font-bold text-emerald-600">PostgreSQL 16 + PostGIS 3.4</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-700">Routing Topology</span>
              <span className="font-mono font-bold text-emerald-600">pgRouting on OSM Network</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-700">API Gateway</span>
              <span className="font-mono font-bold text-sky-600">FastAPI / Express REST Proxy</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-700">AI Agent Runtime</span>
              <span className="font-mono font-bold text-purple-600">LangChain + Gemini 3.8 Flash</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-['Prompt']">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>สถานะการเชื่อมต่อข้อมูลภายนอก (Data Sync Status)</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-800">GISTDA Flood Monitoring API</p>
                <p className="text-[10px] text-slate-400">disaster.gistda.or.th</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-800">DDPM Open Data CKAN</p>
                <p className="text-[10px] text-slate-400">catalog.disaster.go.th</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-800">OpenStreetMap Northern Road Network</p>
                <p className="text-[10px] text-slate-400">Chiang Mai, Chiang Rai, Phayao, Nan, Lampang</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                INDEXED (GiST)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
