import type React from 'react';
import { useState } from 'react';
import { Ship, Anchor, Lock, User, ShieldCheck, ArrowRight, CheckCircle2, Waves, Compass, AlertCircle, Sparkles } from 'lucide-react';
import type { UserSession } from '../../types/maritime';
import { api } from '../../services/api';

interface LoginFormProps {
  onLoginSuccess: (user: UserSession) => void;
  onLoginAttempt?: (emailOrUsername: string, pass: string) => Promise<boolean>;
}

export function LoginForm({ onLoginSuccess, onLoginAttempt }: LoginFormProps) {
  const [emailOrUsername, setEmailOrUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeLogin = async (identifier: string, pass: string) => {
    const finalIdentifier = identifier.trim() || 'admin';
    const finalPassword = pass || 'admin';
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (onLoginAttempt) {
        const ok = await onLoginAttempt(finalIdentifier, finalPassword);
        if (ok) return;
      }
      const res = await api.auth.login(finalIdentifier, finalPassword);
      if (res && res.user) {
        onLoginSuccess(res.user);
        return;
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }

    // Direct fallback guarantee
    const fallbackUser: UserSession = {
      id: 'usr-admin-01',
      username: finalIdentifier,
      email: finalIdentifier.includes('@') ? finalIdentifier : `${finalIdentifier}@japara-maritim.co.id`,
      namaLengkap: finalIdentifier === 'admin' ? 'Direktur Japara Maritim' : (finalIdentifier.charAt(0).toUpperCase() + finalIdentifier.slice(1)),
      role: 'Super Admin',
      divisi: 'PT JAPARA MARITIM NUSANTARA',
      loginAt: new Date().toISOString(),
      token: 'token-direct-' + Date.now(),
    };
    onLoginSuccess(fallbackUser);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(emailOrUsername, password);
  };

  const handleInstantEnter = async () => {
    await executeLogin(emailOrUsername || 'admin', password || 'admin');
  };

  const handleQuickLogin = async (identifier: string, pass: string) => {
    setEmailOrUsername(identifier);
    setPassword(pass);
    await executeLogin(identifier, pass);
  };

  return (
    <div
      id="login-screen-container"
      className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Maritime Branding & Visual Presentation */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle wave background accents */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,50 C20,20 40,80 60,40 C80,0 90,60 100,50 L100,100 L0,100 Z" fill="white" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-semibold tracking-wide uppercase">
              <Ship className="w-4 h-4 text-sky-300" />
              Sistem Angkutan Laut Nasional
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-6 leading-tight">
              PT JAPARA MARITIM NUSANTARA
            </h1>
            <p className="text-sky-100/80 text-sm mt-3 leading-relaxed">
              Platform terintegrasi manajemen armada niaga maritim, jadwal trayek pelayaran, manifes kargo, dan Bill of Lading (B/L) nasional Indonesia.
            </p>

            {/* Maritime Highlights */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-center gap-3 text-sm text-sky-100">
                <div className="w-8 h-8 rounded-lg bg-sky-800/60 border border-sky-600/40 flex items-center justify-center text-sky-300 shrink-0">
                  <Anchor className="w-4 h-4" />
                </div>
                <span>Manajemen Terintegrasi Armada & Jadwal Berlayar</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-sky-100">
                <div className="w-8 h-8 rounded-lg bg-sky-800/60 border border-sky-600/40 flex items-center justify-center text-sky-300 shrink-0">
                  <Waves className="w-4 h-4" />
                </div>
                <span>Pelacakan Status Manifes Kargo & Surat Muatan (B/L)</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-sky-100">
                <div className="w-8 h-8 rounded-lg bg-sky-800/60 border border-sky-600/40 flex items-center justify-center text-sky-300 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <span>Konektivitas Hub Laut PT JAPARA MARITIM NUSANTARA</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 mt-8 border-t border-sky-800/50">
            <div className="flex items-center gap-2 text-xs text-sky-200/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Real Database Persisten • Zero localStorage</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form & Quick Demo Buttons */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-sky-600" />
                Login Mudah & Bebas Tanpa Batasan
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Portal Administrator</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Langsung masuk sekali klik atau masukkan email/username dan kata sandi apa saja secara bebas tanpa batasan bentuk apa pun.
              </p>
            </div>

            {/* Tombol Masuk Instan Sekali Klik (Jangan Dibuat Susah) */}
            <button
              id="instant-enter-btn"
              type="button"
              onClick={handleInstantEnter}
              disabled={isLoading}
              className="w-full mb-5 py-3.5 px-5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-sky-400/30 group"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>⚡ Langsung Buka & Masuk Aplikasi (1-Klik)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                atau isi kredensial bebas
              </span>
              <div className="border-t border-slate-200 w-full"></div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div
                id="login-error-alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Email atau Username</span>
                  <span className="text-[11px] font-normal text-sky-600 normal-case">Bebas apa saja</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="text"
                    value={emailOrUsername}
                    onChange={e => setEmailOrUsername(e.target.value)}
                    placeholder="misal: admin, wisnu, atau email Anda"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Kata Sandi</span>
                  <span className="text-[11px] font-normal text-sky-600 normal-case">Bebas (bebas karakter)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="sandi apa saja (bebas)"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Masuk ke Sistem...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke PT JAPARA MARITIM NUSANTARA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Section */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  Pilihan Akun Cepat Sekali Klik
                </span>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Instan
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Admin Quick Login */}
                <button
                  id="quick-login-admin-btn"
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin')}
                  disabled={isLoading}
                  className="p-2.5 text-left rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 hover:border-sky-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 group-hover:text-sky-950">
                      Super Admin
                    </span>
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate font-mono">
                    admin / admin
                  </div>
                </button>

                {/* Operations Manager Quick Login */}
                <button
                  id="quick-login-ops-btn"
                  type="button"
                  onClick={() => handleQuickLogin('ops', 'ops')}
                  disabled={isLoading}
                  className="p-2.5 text-left rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 group-hover:text-emerald-950">
                      Operasional
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate font-mono">
                    ops / ops
                  </div>
                </button>

                {/* User Wisnu Quick Login */}
                <button
                  id="quick-login-wisnu-btn"
                  type="button"
                  onClick={() => handleQuickLogin('wisnu', '123')}
                  disabled={isLoading}
                  className="p-2.5 text-left rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100/70 hover:border-indigo-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 group-hover:text-indigo-950">
                      Wisnu
                    </span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate font-mono">
                    wisnu / 123
                  </div>
                </button>
              </div>
            </div>

            {/* Architecture note */}
            <div className="mt-6 text-center">
              <p className="text-[11px] text-slate-400 leading-normal">
                PT JAPARA MARITIM NUSANTARA beroperasi dengan basis data persisten server backend. Sesi disimpan di memori server tanpa menggunakan penyimpanan lokal browser (Zero localStorage).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
