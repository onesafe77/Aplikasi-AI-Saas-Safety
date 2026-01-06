import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, ArrowRight, Loader2, Quote, ShieldAlert, IdCard, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!nik || !password) {
        setError('Mohon isi NIK dan password.');
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
        role: data.user.role
      });
    } catch (error: any) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex overflow-hidden font-sans">
      
      {/* LEFT SIDE - Form Section */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-12 relative z-10 bg-white">
        <div className="max-w-[420px] w-full mx-auto">
            
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-bold text-zinc-900">Si Asef</span>
            </div>

            <h1 className="font-display text-4xl font-extrabold text-zinc-900 mb-2 tracking-tight">
                Selamat Datang
            </h1>
            <p className="text-zinc-500 mb-10">
                Masuk dengan NIK untuk konsultasi regulasi K3.
            </p>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium animate-fade-in-up">
                    <ShieldAlert className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* NIK Field */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider">NIK (Nomor Induk Karyawan)</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-600 transition-colors">
                            <IdCard className="w-5 h-5" />
                        </div>
                        <input 
                            type="text" 
                            required
                            value={nik}
                            onChange={(e) => setNik(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-base text-zinc-900 placeholder:text-zinc-400 font-medium"
                            placeholder="Masukkan NIK Anda"
                        />
                    </div>
                </div>
                
                {/* Password Field */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                        <a href="#" className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">Lupa Password?</a>
                    </div>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-600 transition-colors">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"}
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-base text-zinc-900 placeholder:text-zinc-400 font-medium"
                            placeholder="••••••••"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 font-bold text-base rounded-2xl transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-4 group
                    ${nik === 'admin'
                        ? 'bg-zinc-800 text-white hover:bg-zinc-900 shadow-zinc-900/10' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30'
                    }`}
                >
                    {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Memproses...
                        </>
                    ) : (
                        <>
                          {nik === 'admin' ? 'Masuk sebagai Admin' : 'Masuk'}
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-sm text-emerald-700">
                    <strong>Butuh bantuan?</strong> Hubungi admin perusahaan untuk mendapatkan akses atau reset password.
                </p>
            </div>
        </div>
      </div>

      {/* RIGHT SIDE - Feature Showcase */}
      <div className="hidden lg:flex w-[55%] bg-[#09090B] text-white relative items-center justify-center p-16 overflow-hidden">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0 bg-[#09090B]">
             <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-900/30 rounded-full blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>
        </div>
        
        {/* Noise overlay */}
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>

        <div className="max-w-lg relative z-10 w-full animate-fade-in-up">
            {/* Glassmorphism Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Quote className="absolute top-8 left-8 w-10 h-10 text-emerald-500/40" />
                <p className="text-2xl leading-relaxed font-display font-medium text-zinc-100 mb-8 pt-6 relative z-10">
                    "Si Asef telah mengubah cara tim kami bekerja. Pembuatan dokumen JSA yang biasanya butuh 2 jam, kini selesai dalam <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">5 menit</span>."
                </p>
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-emerald-500/20">
                        DK
                    </div>
                    <div>
                        <p className="font-bold text-lg text-white">Dimas Kurniawan</p>
                        <p className="text-sm text-emerald-300 font-medium">HSE Manager, PT Waskita Karya</p>
                    </div>
                </div>
            </div>

            {/* Floating Badges */}
            <div className="mt-12 grid grid-cols-2 gap-4">
                 <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-colors cursor-default">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">Update 2024</p>
                        <p className="text-xs text-zinc-400">Database Regulasi</p>
                    </div>
                </div>
                 <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-colors cursor-default">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">Export PDF</p>
                        <p className="text-xs text-zinc-400">Laporan Instan</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
