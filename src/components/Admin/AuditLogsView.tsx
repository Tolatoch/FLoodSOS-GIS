import React, { useEffect, useState } from 'react';
import { ScrollText, Shield, Clock, HardDrive, CheckCircle } from 'lucide-react';
import { TRANSLATIONS, Language } from '../../data/translations';
import { api } from '../../services/api';

interface AuditLogsViewProps {
  lang: Language;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getAuditLogs().then((data) => {
      if (data?.logs) setLogs(data.logs);
    });
  }, []);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-['Prompt']">
            {t.admin.tabs.audit}
          </h2>
          <p className="text-xs text-slate-500">
            ประวัติการแก้ไขข้อมูลเชิงพื้นที่และการเข้าถึงระบบ (PostGIS `audit_logs`)
          </p>
        </div>
        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-xl border border-purple-200">
          Security Log
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">เวลา (Timestamp)</th>
                <th className="py-3 px-3">การกระทำ (Action)</th>
                <th className="py-3 px-3">ผู้ดำเนินการ</th>
                <th className="py-3 px-3">รายละเอียด (Details)</th>
                <th className="py-3 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 text-[11px] font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {log.userName}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      Role: {log.userRole}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {lang === 'th' ? log.detailsTh : log.detailsEn}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[10px]">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
