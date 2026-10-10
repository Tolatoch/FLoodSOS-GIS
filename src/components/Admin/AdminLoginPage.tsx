import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle, Compass, Globe, Check } from 'lucide-react';
import { Language, TRANSLATIONS } from '../../data/translations';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBackToMap: () => void;
  lang: Language;
  onToggleLang: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onBackToMap,
  lang,
  onToggleLang,
}) => {
  const { adminSignIn } = useAuth();
  const t = TRANSLATIONS[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError(
        lang === 'th' ? 'กรุณากรอกอีเมลและรหัสผ่าน' : 'Please enter email and password'
      );
      return;
    }

    setLoading(true);
    try {
      await adminSignIn(email, password);
      onSuccess();
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED_ADMIN' || err.message === 'INVALID_CREDENTIALS') {
        setError(t.auth.adminUnauthorized);
      } else if (err.message === 'MISSING_FIELDS') {
        setError(lang === 'th' ? 'กรุณากรอกอีเมลและรหัสผ่าน' : 'Please enter email and password');
      } else {
        setError(err.message || (lang === 'th' ? 'การเข้าสู่ระบบล้มเหลว' : 'Sign in failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 font-['Roboto','Noto_Sans_Thai',sans-serif]">
      {/* Top Bar with Language Switcher and Return to Map */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full pt-2">
        <button
          onClick={onBackToMap}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>{t.admin.backToMap}</span>
        </button>

        {/* TH/EN Language Toggle */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm active:scale-95"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>{lang === 'th' ? 'EN' : 'ไทย'}</span>
        </button>
      </div>

      {/* Main Admin Card */}
      <div className="flex items-center justify-center my-auto py-8">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/80 rounded-3xl p-6 sm:p-8 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-700 to-indigo-800 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-600/20 ring-1 ring-white/20">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white font-['Prompt'] tracking-tight">
              FloodSOS <span className="text-sky-400">Admin</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              {t.auth.adminLoginSubtitle}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-300 flex items-start gap-2.5 animate-in shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@floodsos.go.th"
                  required
                  autoFocus
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-sky-900/40 transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-sky-200" />
              <span>{loading ? '...' : t.auth.adminSignInBtn}</span>
            </button>
          </form>

          {/* Footer Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500">
              {lang === 'th'
                ? 'เฉพาะเจ้าหน้าที่กรมป้องกันและบรรเทาสาธารณภัย (ปภ.) และผู้ดูแลระบบ GIS เท่านั้น'
                : 'Authorized DDPM emergency personnel and GIS system administrators only.'}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center text-[10px] text-slate-600 pb-2">
        FloodSOS GIS • PostGIS Spatial Emergency Platform
      </div>
    </div>
  );
};
