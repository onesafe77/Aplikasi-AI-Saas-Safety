import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Loader2, ShieldAlert, Mail, CheckCircle2, Building2 } from 'lucide-react';
import { User as UserType } from '../types';
import logoImage from '@assets/si_asef_logo.png';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
  onRegisterClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onRegisterClick }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nik || !password) {
      setError('Mohon isi Email/NIK dan password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login gagal');
        setIsLoading(false);
        return;
      }

      onLoginSuccess({
        name: data.user.nama,
        email: `${data.user.nik}@perusahaan.id`,
        plan: data.user.role === 'admin' ? 'pro' : 'free',
        role: data.user.role,
        jabatan: data.user.jabatan,
        departemen: data.user.departemen
      });
    } catch (error: any) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white selection:bg-emerald-500/20 selection:text-emerald-900">

      {/* Left Column - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 md:p-12 lg:p-16 relative bg-white z-10">

        {/* Logo Mobile/Hiding */}
        <div className="flex items-center gap-2 mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-zinc-900">Si Asef</span>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-zinc-900 mb-3 tracking-tight">Selamat Datang Kembali</h1>
            <p className="text-zinc-500 text-lg">Masuk untuk mengakses dashboard K3 Anda.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm font-medium animate-pulse">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                Email Kerja / NIK
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  required
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
                  placeholder="nama@perusahaan.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-zinc-700">Password</label>
                <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline">Lupa Password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-zinc-900 font-medium placeholder:text-zinc-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 transition-all font-semibold text-xs uppercase tracking-wider"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-400">Atau masuk dengan</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3.5 bg-white border border-zinc-200 text-zinc-700 font-bold rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center justify-center gap-3 group relative overflow-hidden mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="relative z-10">Google Account</span>
            </button>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 hover:shadow-zinc-900/20 active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10">Masuk Dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                    <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Belum punya akun perusahaan? <button onClick={onRegisterClick} className="font-semibold text-zinc-900 hover:text-emerald-600 hover:underline transition-colors">Daftarkan Perusahaan</button>
            </p>
          </div>
        </div>

        <div className="text-xs text-zinc-400 flex items-center gap-4 mt-8">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Enterprise Security</span>
          <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> ISO 27001 Certified</span>
        </div>
      </div>

      {/* Right Column - Visuals */}
      <div className="hidden lg:flex flex-1 bg-zinc-900 relative overflow-hidden items-center justify-center p-16">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-teal-500/20 rounded-full blur-[120px] animate-blob [animation-delay:4s]"></div>

        {/* Content Card */}
        <div className="relative z-10 max-w-lg">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-emerald-400 font-bold text-2xl mb-1">98%</div>
                <div className="text-zinc-400 text-xs">Akurasi Regulasi</div>
              </div>
              <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-blue-400 font-bold text-2xl mb-1">24/7</div>
                <div className="text-zinc-400 text-xs">AI Safety Standby</div>
              </div>
            </div>

            <blockquote className="text-xl text-zinc-200 font-medium leading-relaxed mb-6">
              "Si Asef membantu kami memangkas waktu riset regulasi hingga 80%. Asisten K3 masa depan yang wajib dimiliki."
            </blockquote>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 p-0.5">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" alt="User" className="w-full h-full rounded-full object-cover" />
              </div>
              <div>
                <div className="text-white font-bold">Rizky Ramadhan</div>
                <div className="text-zinc-400 text-sm">HSE Manager, PT. Adaro Energy</div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute -right-8 top-0 bg-zinc-800 p-4 rounded-2xl border border-white/10 shadow-xl animate-float">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="absolute -left-4 bottom-16 bg-zinc-800 px-4 py-2 rounded-xl border border-white/10 shadow-xl animate-float-delayed">
            <span className="text-xs font-mono text-emerald-400">System Secure</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
