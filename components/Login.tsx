import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldAlert, IdCard, FileText, Shield, AlertTriangle, HardHat, Flame, Zap, CheckCircle2, Wrench, Radio } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
  onLoginSuccess: (user: UserType) => void;
}

interface PhysicsElement {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  icon: string;
  label: string;
  isDragging: boolean;
  mass: number;
}

const ICONS: Record<string, React.ReactNode> = {
  'shield': <Shield className="w-5 h-5" />,
  'hardhat': <HardHat className="w-5 h-5" />,
  'filetext': <FileText className="w-5 h-5" />,
  'alert': <AlertTriangle className="w-5 h-5" />,
  'flame': <Flame className="w-5 h-5" />,
  'zap': <Zap className="w-5 h-5" />,
  'check': <CheckCircle2 className="w-5 h-5" />,
  'shieldcheck': <ShieldCheck className="w-5 h-5" />,
  'wrench': <Wrench className="w-5 h-5" />,
  'radio': <Radio className="w-5 h-5" />,
};

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [elements, setElements] = useState<PhysicsElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number; lastX: number; lastY: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize physics elements
  useEffect(() => {
    const iconData = [
      { icon: 'shield', label: 'K3' },
      { icon: 'hardhat', label: 'APD' },
      { icon: 'filetext', label: 'SOP' },
      { icon: 'alert', label: 'Bahaya' },
      { icon: 'flame', label: 'APAR' },
      { icon: 'zap', label: 'Listrik' },
      { icon: 'check', label: 'Audit' },
      { icon: 'shieldcheck', label: 'Safety' },
      { icon: 'wrench', label: 'P2K3' },
      { icon: 'radio', label: 'Darurat' },
    ];

    const initialElements: PhysicsElement[] = iconData.map((item, i) => ({
      id: i,
      x: 50 + Math.random() * 300,
      y: 50 + Math.random() * 400,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      width: 100,
      height: 44,
      icon: item.icon,
      label: item.label,
      isDragging: false,
      mass: 1,
    }));

    setElements(initialElements);
  }, []);

  // Physics simulation loop
  useEffect(() => {
    const friction = 0.995;
    const bounce = 0.8;

    const simulate = () => {
      if (!containerRef.current) {
        animationRef.current = requestAnimationFrame(simulate);
        return;
      }

      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      setElements(prev => prev.map(el => {
        if (el.isDragging) return el;

        let newX = el.x + el.vx;
        let newY = el.y + el.vy;
        let newVx = el.vx * friction;
        let newVy = el.vy * friction;
        let newRotation = el.rotation + el.rotationSpeed;
        let newRotationSpeed = el.rotationSpeed * 0.99;

        // Add slight random movement for floating effect
        newVx += (Math.random() - 0.5) * 0.1;
        newVy += (Math.random() - 0.5) * 0.1;

        // Edge collision
        if (newX < 0) {
          newX = 0;
          newVx = -newVx * bounce;
          newRotationSpeed += newVx * 0.5;
        }
        if (newX + el.width > containerWidth) {
          newX = containerWidth - el.width;
          newVx = -newVx * bounce;
          newRotationSpeed -= newVx * 0.5;
        }
        if (newY < 0) {
          newY = 0;
          newVy = -newVy * bounce;
          newRotationSpeed += newVy * 0.5;
        }
        if (newY + el.height > containerHeight) {
          newY = containerHeight - el.height;
          newVy = -newVy * bounce;
          newRotationSpeed -= newVy * 0.5;
        }

        return {
          ...el,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          rotation: newRotation,
          rotationSpeed: newRotationSpeed,
        };
      }));

      // Simple collision detection between elements
      setElements(prev => {
        const newElements = [...prev];
        for (let i = 0; i < newElements.length; i++) {
          for (let j = i + 1; j < newElements.length; j++) {
            const a = newElements[i];
            const b = newElements[j];
            
            if (a.isDragging || b.isDragging) continue;

            const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
            const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = (a.width + b.width) / 2.5;

            if (dist < minDist && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;

              // Separate elements
              newElements[i] = { ...a, x: a.x + nx * overlap / 2, y: a.y + ny * overlap / 2 };
              newElements[j] = { ...b, x: b.x - nx * overlap / 2, y: b.y - ny * overlap / 2 };

              // Exchange velocities (simplified)
              const dvx = a.vx - b.vx;
              const dvy = a.vy - b.vy;
              const dvn = dvx * nx + dvy * ny;

              if (dvn > 0) {
                newElements[i] = { ...newElements[i], vx: a.vx - dvn * nx * 0.5, vy: a.vy - dvn * ny * 0.5 };
                newElements[j] = { ...newElements[j], vx: b.vx + dvn * nx * 0.5, vy: b.vy + dvn * ny * 0.5 };
              }
            }
          }
        }
        return newElements;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, id: number) => {
    e.preventDefault();
    const el = elements.find(el => el.id === id);
    if (!el) return;

    dragRef.current = {
      id,
      offsetX: e.clientX - el.x,
      offsetY: e.clientY - el.y,
      lastX: e.clientX,
      lastY: e.clientY,
    };

    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, isDragging: true, vx: 0, vy: 0 } : el
    ));
  }, [elements]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragRef.current.offsetX + containerRect.left;
    const newY = e.clientY - containerRect.top - dragRef.current.offsetY + containerRect.top;

    const velocityX = (e.clientX - dragRef.current.lastX) * 0.5;
    const velocityY = (e.clientY - dragRef.current.lastY) * 0.5;

    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    setElements(prev => prev.map(el => 
      el.id === dragRef.current?.id 
        ? { ...el, x: e.clientX - containerRect.left - (dragRef.current?.offsetX || 0), y: e.clientY - containerRect.top - (dragRef.current?.offsetY || 0), vx: velocityX, vy: velocityY }
        : el
    ));
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return;

    setElements(prev => prev.map(el => 
      el.id === dragRef.current?.id ? { ...el, isDragging: false } : el
    ));

    dragRef.current = null;
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

  return (
    <div className="min-h-screen w-full bg-white flex overflow-hidden font-sans">
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.6); }
        }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .physics-element {
          user-select: none;
          cursor: grab;
          transition: box-shadow 0.2s, transform 0.1s;
        }
        .physics-element:hover {
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
        }
        .physics-element:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .physics-element.dragging {
          z-index: 100;
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.7);
        }
      `}</style>
      
      {/* LEFT SIDE - Form Section */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-12 relative z-10 bg-white">
        <div className="max-w-[420px] w-full mx-auto">
            
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-lg pulse-glow">
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

      {/* RIGHT SIDE - Antigravity Physics Playground */}
      <div 
        ref={containerRef}
        className="hidden lg:block w-[55%] bg-[#09090B] relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Animated Background Orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-900/40 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-900/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-cyan-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-white/10 text-6xl font-bold tracking-widest">K3</p>
            <p className="text-white/5 text-sm mt-2 tracking-[0.3em]">DRAG & THROW</p>
          </div>
        </div>

        {/* Physics Elements */}
        {elements.map((el) => (
          <div
            key={el.id}
            className={`physics-element absolute bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl flex items-center gap-2 ${el.isDragging ? 'dragging' : ''}`}
            style={{
              left: el.x,
              top: el.y,
              transform: `rotate(${el.rotation}deg)`,
              zIndex: el.isDragging ? 100 : 10,
            }}
            onMouseDown={(e) => handleMouseDown(e, el.id)}
          >
            <span className="text-emerald-400">{ICONS[el.icon]}</span>
            <span className="text-sm font-semibold text-white whitespace-nowrap">{el.label}</span>
          </div>
        ))}

        {/* Instructions */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-white/30 text-xs tracking-wider">Tarik dan lempar elemen K3</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
