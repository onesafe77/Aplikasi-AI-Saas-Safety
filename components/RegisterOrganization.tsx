import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Building2, Briefcase, Mail, ArrowRight, Loader2, ShieldAlert, ArrowLeft, CheckCircle2, ChevronRight, Zap, Scale, FileText } from 'lucide-react';

interface RegisterProps {
    onRegisterSuccess: (user: any) => void;
    onBack: () => void;
}

const INDUSTRIES = [
    'Pertambangan', 'Minyak & Gas', 'Konstruksi', 'Manufaktur',
    'Pembangkit Listrik', 'Rumah Sakit', 'Logistik & Transportasi',
    'Perkebunan & Kehutanan', 'Lainnya'
];

const ROLES = [
    'HSE Officer / Staff', 'HSE Manager / Lead', 'HR / GA', 'Direktur / Owner', 'Mahasiswa', 'Lainnya'
];

const GOALS = [
    { id: 'compliance', label: 'Kepatuhan Regulasi', icon: <Scale className="w-4 h-4" /> },
    { id: 'audit', label: 'Persiapan Audit', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'docs', label: 'Pembuatan Dokumen (JSA/IBPR)', icon: <FileText className="w-4 h-4" /> },
    { id: 'productivity', label: 'Efisiensi Kerja Tim', icon: <Zap className="w-4 h-4" /> },
];

const RegisterOrganization: React.FC<RegisterProps> = ({ onRegisterSuccess, onBack }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Step 1: Account
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        // Step 2: Company
        companyName: '',
        industry: 'Pertambangan',
        role: 'HSE Officer / Staff',
        teamSize: '1-10',
        // Step 3: Goals (Survey)
        goals: [] as string[]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const toggleGoal = (goalId: string) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.includes(goalId)
                ? prev.goals.filter(g => g !== goalId)
                : [...prev.goals, goalId]
        }));
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (step < 3) {
            setStep(s => s + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // Include survey data in a 'settings' object/field if backend supports it, 
            // or just mix it in for now (backend might ignore extra fields, but valid JSONB settings helps)
            const payload = {
                ...formData,
                settings: {
                    role: formData.role,
                    teamSize: formData.teamSize,
                    goals: formData.goals
                }
            };

            const res = await fetch('/api/register-organization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMessage = data.error || 'Registrasi gagal';
                const errorDetail = data.detail ? ` - ${data.detail}` : '';
                setError(errorMessage + errorDetail);
                setIsLoading(false);
                return;
            }

            onRegisterSuccess({
                name: data.user.nama,
                email: `${data.user.nik}@${data.organization.slug}.id`,
                plan: 'pro',
                role: 'admin',
                jabatan: data.user.jabatan,
                departemen: data.user.departemen
            });
        } catch (error: any) {
            console.error('Registration error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setError('Tidak dapat terhubung ke server. Pastikan server berjalan.');
            } else {
                setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
            }
            setIsLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">Nama Lengkap</label>
                            <input
                                type="text" name="adminName" required value={formData.adminName} onChange={handleChange}
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                                placeholder="Jhon Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">Email Kerja</label>
                            <input
                                type="email" name="adminEmail" required value={formData.adminEmail} onChange={handleChange}
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                                placeholder="name@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">Password</label>
                            <input
                                type="password" name="adminPassword" required value={formData.adminPassword} onChange={handleChange}
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                                placeholder="Make it strong" minLength={6}
                            />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">Nama Perusahaan</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text" name="companyName" required value={formData.companyName} onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                                    placeholder="PT. Sinergi K3"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700">Industri</label>
                                <select
                                    name="industry" value={formData.industry} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                                >
                                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700">Ukuran Tim</label>
                                <select
                                    name="teamSize" value={formData.teamSize} onChange={handleChange}
                                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                                >
                                    <option value="1-10">1-10 Orang</option>
                                    <option value="11-50">11-50 Orang</option>
                                    <option value="51-200">51-200 Orang</option>
                                    <option value="200+">200+ Orang</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-zinc-700">Peran Anda</label>
                            <select
                                name="role" value={formData.role} onChange={handleChange}
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                            >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="text-center mb-6">
                            <h3 className="font-bold text-zinc-900">Apa fokus utama Anda menggunakan Si Asef?</h3>
                            <p className="text-xs text-zinc-500">Pilih semua yang sesuai agar kami bisa menyesuaikan pengalaman Anda.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {GOALS.map(goal => (
                                <div
                                    key={goal.id}
                                    onClick={() => toggleGoal(goal.id)}
                                    className={`cursor-pointer p-4 rounded-xl border flex items-center gap-3 transition-all ${formData.goals.includes(goal.id) ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.goals.includes(goal.id) ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                        {goal.icon}
                                    </div>
                                    <span className={`text-sm font-medium ${formData.goals.includes(goal.id) ? 'text-emerald-900' : 'text-zinc-600'}`}>{goal.label}</span>
                                    {formData.goals.includes(goal.id) && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen w-full bg-zinc-50 flex items-center justify-center p-4">
            {/* Back Button */}
            <button
                onClick={step === 1 ? onBack : () => setStep(s => s - 1)}
                className="fixed top-6 left-6 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-medium transition-colors z-20"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>{step === 1 ? 'Kembali' : 'Sebelumnya'}</span>
            </button>

            <div className="w-full max-w-lg">
                {/* Progress Steps */}
                <div className="flex justify-between mb-8 px-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${step >= i ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-300'}`}>
                                {i}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= i ? 'text-zinc-900' : 'text-zinc-300'}`}>
                                {i === 1 ? 'Akun' : i === 2 ? 'Profil' : 'Survey'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-zinc-200/50 p-8 md:p-10 relative overflow-hidden">
                    {/* Header Text Dynamic */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-1">
                            {step === 1 ? 'Buat Akun Perusahaan' : step === 2 ? 'Profil Perusahaan' : 'Preferensi Penggunaan'}
                        </h2>
                        <p className="text-zinc-500 text-sm">
                            {step === 1 ? 'Langkah awal transformasi digital K3.' : step === 2 ? 'Ceritakan sedikit tentang organisasi Anda.' : 'Bantu kami personalisasi dashboard Anda.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <form onSubmit={handleNext}>
                        {renderStepContent()}

                        <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-end user-select-none">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-8 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        {step === 3 ? 'Selesai & Masuk' : 'Lanjut'}
                                        {step < 3 && <ChevronRight className="w-4 h-4" />}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-zinc-400 mt-8">
                    &copy; 2024 Si Asef AI. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default RegisterOrganization;
