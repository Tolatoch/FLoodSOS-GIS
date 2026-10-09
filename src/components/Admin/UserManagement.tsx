import React, { useEffect, useState } from 'react';
import { Users, Shield, UserCheck, Key, Mail, Clock } from 'lucide-react';
import { User } from '../../types';
import { TRANSLATIONS, Language } from '../../data/translations';
import { api } from '../../services/api';

interface UserManagementProps {
  lang: Language;
}

export const UserManagement: React.FC<UserManagementProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api.getUsers().then((data) => {
      if (data?.users) setUsers(data.users);
    });
  }, []);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-['Prompt']">
            {t.admin.tabs.users}
          </h2>
          <p className="text-xs text-slate-500">
            ระบบจัดการสิทธิ์ผู้ใช้งาน (RBAC: Admin, Staff, Registered User, Guest)
          </p>
        </div>
        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-xl border border-sky-200">
          Total: {users.length} Users
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">ผู้ใช้งาน</th>
                <th className="py-3 px-3">อีเมล</th>
                <th className="py-3 px-3">บทบาท (Role)</th>
                <th className="py-3 px-3">สิทธิ์การเข้าถึง</th>
                <th className="py-3 px-3">วันที่ลงทะเบียน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900 font-['Prompt']">
                    {u.name}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-mono">{u.email}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'staff'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {u.role === 'admin'
                      ? 'Full CRUD + Import + Logs'
                      : u.role === 'staff'
                      ? 'View + Edit Shelters & Areas'
                      : 'Map View + AI Agent + Saved Routes'}
                  </td>
                  <td className="py-3 px-3 text-[10px] text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
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
