import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldAlert, IdCard } from 'lucide-react';
import { User as UserType } from '../types';
import logoImage from '@assets/si_asef_logo.png';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'line';
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const animationRef = useRef<number | null>(null);

  // Initialize confetti with physics properties
  useEffect(() => {
    const colors = [
      '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', 
      '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
    ];
    
    const shapes: ('rect' | 'circle' | 'line')[] = ['rect', 'circle', 'line'];
    
    const particles: Confetti[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
    
    setConfetti(particles);
  }, []);

  // Physics animation loop
  useEffect(() => {
    const animate = () => {
      setConfetti(prev => prev.map(c => {
        let newX = c.x + c.vx;
        let newY = c.y + c.vy;
        let newVx = c.vx;
        let newVy = c.vy;
        let newRotation = c.rotation + c.rotationSpeed;

        // Add slight random movement for floating effect
        newVx += (Math.random() - 0.5) * 0.02;
        newVy += (Math.random() - 0.5) * 0.02;

        // Apply friction
        newVx *= 0.999;
        newVy *= 0.999;

        // Limit velocity
        const maxSpeed = 0.4;
        const speed = Math.sqrt(newVx * newVx + newVy * newVy);
        if (speed > maxSpeed) {
          newVx = (newVx / speed) * maxSpeed;
          newVy = (newVy / speed) * maxSpeed;
        }

        // Edge wrapping (wrap around screen)
        if (newX < -5) newX = 105;
        if (newX > 105) newX = -5;
        if (newY < -5) newY = 105;
        if (newY > 105) newY = -5;

        return {
          ...c,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          rotation: newRotation,
        };
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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

  const renderConfettiShape = (c: Confetti) => {
    const baseStyle: React.CSSProperties = {
      left: `${c.x}%`,
      top: `${c.y}%`,
      backgroundColor: c.color,
      transform: `rotate(${c.rotation}deg)`,
      transition: 'none',
    };

    if (c.shape === 'circle') {
      return (
        <div
          key={c.id}
          className="absolute rounded-full opacity-70"
          style={{
            ...baseStyle,
            width: c.size,
            height: c.size,
          }}
        />
      );
    } else if (c.shape === 'line') {
      return (
        <div
          key={c.id}
          className="absolute opacity-70"
          style={{
            ...baseStyle,
            width: c.size * 2.5,
            height: 3,
            borderRadius: 2,
          }}
        />
      );
    } else {
      return (
        <div
          key={c.id}
          className="absolute opacity-70"
          style={{
            ...baseStyle,
            width: c.size,
            height: c.size * 0.6,
            borderRadius: 2,
          }}
        />
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Animated Confetti Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map(c => renderConfettiShape(c))}
      </div>

      {/* Back Button */}
      <button className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:shadow-lg transition-all z-10">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-zinc-200/50 p-8 md:p-10 relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white shadow-lg border-2 border-zinc-100">
            <img 
              src={logoImage} 
              alt="Si Asef Logo" 
              className="w-full h-full object-cover scale-110"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Selamat Datang</h1>
          <p className="text-zinc-500 text-sm">Masuk ke Si Asef - Asisten K3 Anda</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* NIK Field */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <IdCard className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              required
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none transition-all text-sm text-zinc-900 placeholder:text-zinc-400"
              placeholder="nik@company.com"
            />
          </div>
          
          {/* Password Field */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
              <Lock className="w-5 h-5" />
            </div>
            <input 
              type={showPassword ? "text" : "password"}
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 outline-none transition-all text-sm text-zinc-900 placeholder:text-zinc-400"
              placeholder="••••••••"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-600">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
              />
              <span>Ingat saya</span>
            </label>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Lupa password?</a>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-600/30 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Secure Badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-emerald-600">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-wider uppercase">Secure Enterprise Login</span>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-sm text-zinc-500">
          Butuh akses? <a href="#" className="text-zinc-900 font-semibold hover:underline">Hubungi Admin</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
