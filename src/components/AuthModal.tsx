import React, { useState, useEffect } from 'react';
import { Shield, User, Lock, Mail, X, ArrowRight, Loader2 } from 'lucide-react';
import { TRANSLATIONS, Language } from '../data/translations';
import { User as UserType } from '../types';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
  lang: Language;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
  initialMode = 'signin',
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];
  const { signIn, signUp, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!name.trim()) {
        setError(t.auth.nameRequired);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError(t.auth.invalidEmail);
        return;
      }
      if (password.length < 6) {
        setError(t.auth.passwordTooShort);
        return;
      }
      if (password !== confirmPassword) {
        setError(t.auth.passwordMismatch);
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError(lang === 'th' ? 'กรุณากรอกอีเมลและรหัสผ่าน' : 'Please fill all fields');
        return;
      }
    }

    setLoading(true);
    try {
      let user: UserType;
      if (mode === 'signin') {
        user = await signIn(email, password);
      } else {
        user = await signUp(name, email, password, confirmPassword);
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS') {
        setError(
          lang === 'th'
            ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
            : 'Invalid email address or password'
        );
      } else if (err.message === 'USER_ALREADY_EXISTS') {
        setError(t.auth.userAlreadyExists);
      } else if (err.message === 'NAME_REQUIRED') {
        setError(t.auth.nameRequired);
      } else if (err.message === 'INVALID_EMAIL') {
        setError(t.auth.invalidEmail);
      } else if (err.message === 'PASSWORD_TOO_SHORT') {
        setError(t.auth.passwordTooShort);
      } else if (err.message === 'PASSWORD_MISMATCH') {
        setError(t.auth.passwordMismatch);
      } else {
        setError(err.message || (lang === 'th' ? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' : 'Authentication failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
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
            aria-label="Close"
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
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium animate-in shake">
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
                  placeholder={lang === 'th' ? 'ชื่อ - นามสกุล' : 'Full Name'}
                  required
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
            {mode === 'signup' && (
              <p className="text-[10px] text-slate-500 mt-1">
                {lang === 'th' ? 'อย่างน้อย 6 ตัวอักษร' : 'Minimum 6 characters'}
              </p>
            )}
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
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>...</span>
              </>
            ) : (
              <>
                <span>{mode === 'signin' ? t.auth.signIn : t.auth.signUp}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Guest Access Option (Admin Demo button REMOVED as required) */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGuest}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-center text-xs transition-colors"
            >
              {t.auth.continueAsGuest}
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
              className="text-xs text-sky-600 hover:text-sky-800 hover:underline font-bold transition-colors py-1 px-2"
            >
              {mode === 'signup'
                ? (lang === 'th' ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'Already have an account? Sign In')
                : (lang === 'th' ? 'ยังไม่มีบัญชี? สมัครสมาชิกใหม่' : "Don't have an account? Sign Up")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
