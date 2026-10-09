import React, { useState } from 'react';
import { Shield, User, Lock, Mail, X, CheckCircle, ArrowRight } from 'lucide-react';
import { TRANSLATIONS, Language } from '../data/translations';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  lang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(lang === 'th' ? 'กรุณากรอกอีเมลและรหัสผ่าน' : 'Please fill all fields');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError(lang === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = () => {
    onSuccess({
      id: 'usr-admin-01',
      name: 'Admin GIS Center',
      email: 'admin@floodsos.go.th',
      role: 'admin',
      createdAt: '2026-09-01T08:00:00Z',
    });
    onClose();
  };

  const handleQuickGuest = () => {
    onSuccess({
      id: 'guest-01',
      name: 'Guest User',
      email: 'guest@floodsos.local',
      role: 'guest',
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-tr from-sky-700 to-blue-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-sky-200" />
          </div>
          <h2 className="text-xl font-black font-['Prompt']">
            {mode === 'signin' ? t.auth.signIn : t.auth.signUp}
          </h2>
          <p className="text-xs text-sky-100 mt-1">
            FloodSOS GIS - Upper Northern Thailand
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {t.auth.fullName}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อ - นามสกุล"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t.auth.email}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {t.auth.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {t.auth.confirmPassword}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {loading ? '...' : mode === 'signin' ? t.auth.signIn : t.auth.signUp}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Shortcuts */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-center text-xs flex items-center justify-center gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>เข้าสู่ระบบเจ้าหน้าที่ (Admin Demo)</span>
            </button>

            <button
              type="button"
              onClick={handleQuickGuest}
              className="w-full py-1.5 px-3 text-slate-600 hover:text-slate-900 font-medium text-center text-xs"
            >
              {t.auth.guestAccess}
            </button>
          </div>

          {/* Toggle Switch */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
              className="text-xs text-sky-600 hover:underline font-semibold"
            >
              {mode === 'signin' ? t.auth.noAccount : t.auth.haveAccount}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
