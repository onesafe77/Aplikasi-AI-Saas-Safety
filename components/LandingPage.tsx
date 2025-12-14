import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, BookOpen, AlertTriangle, FileText, Check, Star, Zap, Building2, Users, ChevronRight, Menu, HardHat, Factory, Truck, Search, Camera, Download, Scale, Hammer, Landmark, Pickaxe, Briefcase, HelpCircle, ChevronDown, ChevronUp, Play, Fingerprint, MousePointer2, Database, BrainCircuit, FileCheck } from 'lucide-react';

interface SpotlightData {
  content: string;
  documentName: string;
  pageNumber: number;
}

interface LandingPageProps {
  onStart: () => void;
}

const TESTIMONIALS = [
  {text: "Sangat membantu saat audit. Saya bisa menemukan pasal tentang Bejana Tekan dalam hitungan detik.", name: "Budi Darmawan", role: "HSE Coordinator", bg: "bg-white"},
  {text: "Sebagai mahasiswa K3, Si Asef seperti dosen pembimbing. Penjelasan regulasinya sangat detail.", name: "Siti Nurhaliza", role: "Mahasiswi K3 UI", bg: "bg-white"},
  {text: "Fitur cek sanksi sangat berguna untuk mengingatkan manajemen tentang risiko compliance.", name: "Agus Rahardjo", role: "Safety Manager", bg: "bg-white"},
  {text: "Validasi pasal UU 1/1970 jadi sangat cepat. Tidak perlu buka buku tebal lagi.", name: "Rina Wulandari", role: "Safety Officer", bg: "bg-white"},
  {text: "Tools wajib untuk bahan meeting P2K3 setiap bulan. Hemat waktu riset.", name: "Eko Prasetyo", role: "Project Manager", bg: "bg-white"},
  {text: "Identifikasi bahaya dari foto sangat presisi, membantu inspeksi lapangan.", name: "Dedi Suryana", role: "HSE Superintendent", bg: "bg-white"},
  {text: "Mempermudah penyusunan kebijakan K3 perusahaan yang sesuai regulasi terbaru.", name: "Maya Indah", role: "HRD Manager", bg: "bg-white"},
];

const TestimonialCard: React.FC<{ item: typeof TESTIMONIALS[0] }> = ({ item }) => (
  <div className={`w-[350px] md:w-[400px] flex-shrink-0 ${item.bg} p-8 rounded-[2rem] border border-zinc-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-2 transition-transform duration-300 group mx-4`}>
      <div className="flex text-amber-400 mb-6 gap-1">
          {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
      </div>
      <p className="text-zinc-600 mb-8 font-medium leading-relaxed group-hover:text-zinc-900 transition-colors line-clamp-3">"{item.text}"</p>
      <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-full flex items-center justify-center font-bold text-zinc-500 border border-zinc-200">
              {item.name.charAt(0)}
          </div>
          <div>
              <p className="text-sm font-bold text-zinc-900">{item.name}</p>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">{item.role}</p>
          </div>
      </div>
  </div>
);

const DEFAULT_SPOTLIGHT = {
  content: "Setiap tenaga kerja berhak mendapat perlindungan atas keselamatannya dalam melakukan pekerjaan untuk kesejahteraan hidup dan meningkatkan produksi serta produktivitas Nasional.",
  documentName: "UU No. 1 Tahun 1970",
  pageNumber: 1
};

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [spotlight, setSpotlight] = useState<SpotlightData>(DEFAULT_SPOTLIGHT);

  useEffect(() => {
    fetch('/api/spotlight')
      .then(res => res.json())
      .then(data => {
        if (data && data.content) {
          setSpotlight(data);
        }
      })
      .catch(() => {});
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper for cleaner company logo items
  const CompanyItem = ({ icon, name }: { icon: React.ReactNode, name: string }) => (
    <div className="flex items-center gap-3 mx-12 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default group transform hover:scale-110">
        <span className="text-emerald-500 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all [&>svg]:w-7 [&>svg]:h-7 [&>svg]:stroke-[2]">
            {icon}
        </span>
        <span className="text-lg font-bold text-zinc-800 tracking-widest font-display">{name}</span>
    </div>
  );

  const CompanyLogos = () => (
    <>
        <CompanyItem icon={<Building2 />} name="ADHIKARYA" />
        <CompanyItem icon={<Zap />} name="PLN GROUP" />
        <CompanyItem icon={<Users />} name="WASKITA" />
        <CompanyItem icon={<ShieldCheck />} name="PERTAMINA" />
        <CompanyItem icon={<HardHat />} name="HUTAMA KARYA" />
        <CompanyItem icon={<Factory />} name="KRAKATAU STEEL" />
        <CompanyItem icon={<Truck />} name="PELINDO" />
        <CompanyItem icon={<Building2 />} name="WIKA" />
        <CompanyItem icon={<Hammer />} name="SEMEN INDONESIA" />
        <CompanyItem icon={<Landmark />} name="JASA MARGA" />
        <CompanyItem icon={<Factory />} name="PUPUK INDONESIA" />
        <CompanyItem icon={<Pickaxe />} name="BUKIT ASAM" />
        <CompanyItem icon={<Pickaxe />} name="ANTM" />
        <CompanyItem icon={<Briefcase />} name="PP PERSERO" />
    </>
  );

  return (
    <div className="h-screen w-full bg-[#FAFAF9] text-zinc-800 font-sans flex flex-col overflow-y-auto selection:bg-emerald-500/20 selection:text-emerald-900 scroll-smooth bg-noise">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#FAFAF9]/80 backdrop-blur-xl border-b border-zinc-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <ShieldCheck className="w-6 h-6 relative z-10" strokeWidth={2.5} />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-zinc-900">Si Asef</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1 bg-white/50 p-1.5 rounded-full border border-zinc-200/50 backdrop-blur-md shadow-sm">
            <button onClick={() => scrollToSection('features')} className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-500 hover:text-emerald-700 hover:bg-white transition-all duration-300">Fitur</button>
            <button onClick={() => scrollToSection('how-it-works')} className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-500 hover:text-emerald-700 hover:bg-white transition-all duration-300">Teknologi</button>
            <button onClick={() => scrollToSection('testimonials')} className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-500 hover:text-emerald-700 hover:bg-white transition-all duration-300">Testimoni</button>
            <button onClick={() => scrollToSection('pricing')} className="px-5 py-2 rounded-full text-sm font-semibold text-zinc-500 hover:text-emerald-700 hover:bg-white transition-all duration-300">Harga</button>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={onStart} className="hidden md:block text-sm font-bold text-zinc-600 hover:text-zinc-900 px-2 transition-colors">
                Masuk
             </button>
             <button 
                onClick={onStart}
                className="text-sm font-bold bg-zinc-900 text-white px-6 py-2.5 rounded-full hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative z-10">Coba Gratis</span>
              </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden flex-shrink-0 min-h-[95vh] flex items-center">
        {/* Background Grid & Gradient */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-emerald-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[10%] w-[800px] h-[800px] bg-cyan-200/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob [animation-delay:4s]"></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 md:gap-24 relative z-10">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left pt-8 lg:pt-0">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-emerald-100 text-xs font-bold text-emerald-700 mb-8 shadow-sm backdrop-blur-md cursor-default hover:shadow-md transition-all animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Ahli Hukum & Regulasi K3 Indonesia
                </div>
                
                <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl text-zinc-900 leading-[1.1] mb-8 tracking-tight animate-fade-in-up [animation-delay:200ms]">
                    Paham Regulasi, <br/> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 animate-shimmer bg-[length:200%_auto]">Hindari Sanksi.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-normal animate-fade-in-up [animation-delay:400ms]">
                    Asisten AI yang menguasai <strong className="text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">UU No. 1 Tahun 1970</strong>, <strong className="text-emerald-700 font-semibold bg-emerald-50 px-1 rounded">PP 50/2012</strong>, dan seluruh standar K3. Dapatkan jawaban hukum K3 dalam hitungan detik.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full animate-fade-in-up [animation-delay:600ms]">
                    <button 
                        onClick={onStart}
                        className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white text-lg font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-zinc-900/20 hover:shadow-emerald-600/40 hover:-translate-y-1 flex items-center justify-center gap-2 group relative overflow-hidden"
                    >
                         <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative z-10 flex items-center gap-2">Konsultasi Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                    </button>
                    <button 
                        onClick={() => window.open('https://youtube.com', '_blank')}
                        className="w-full sm:w-auto px-8 py-4 bg-white/80 text-zinc-700 border border-zinc-200 text-lg font-bold rounded-2xl hover:bg-white hover:border-zinc-300 transition-all flex items-center justify-center gap-2 group backdrop-blur-sm shadow-sm"
                    >
                        <Play className="w-5 h-5 fill-zinc-700 group-hover:fill-emerald-600 group-hover:text-emerald-600 transition-colors" />
                        Lihat Demo
                    </button>
                </div>
            </div>

            {/* Right Visual - Stacked Glass UI */}
            <div className="flex-1 w-full relative perspective-1000 h-[600px] flex items-center justify-center lg:justify-end animate-fade-in-up [animation-delay:800ms]">
                
                {/* Back Card (Context) */}
                <div className="absolute w-[80%] h-[500px] bg-gradient-to-br from-zinc-100 to-white rounded-[2rem] border border-zinc-200 shadow-xl transform rotate-y-12 translate-x-10 translate-y-10 opacity-60 scale-90 animate-float-delayed -z-10"></div>

                {/* Main Card (App UI) */}
                <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white/40 relative z-10 transform rotate-y-[-5deg] hover:rotate-y-0 transition-transform duration-700 animate-float overflow-hidden">
                    {/* Header */}
                    <div className="h-16 border-b border-zinc-200/50 flex items-center justify-between px-6 bg-white/40 sticky top-0 z-20">
                        <div className="flex gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                             <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                             <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                        </div>
                        <div className="font-display font-bold text-zinc-800">Si Asef AI</div>
                        <div className="w-8 h-8 rounded-full bg-zinc-200/50"></div>
                    </div>

                    {/* Chat Body */}
                    <div className="p-5 space-y-4 overflow-hidden relative">
                         {/* Fading top for scroll effect illusion */}
                         <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white/60 to-transparent z-10 pointer-events-none"></div>

                        {/* Message 1: User */}
                        <div className="flex gap-4 items-end justify-end">
                            <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md text-xs font-medium max-w-[85%] leading-relaxed">
                                Apakah wajib lapor kecelakaan kerja ringan?
                            </div>
                            <div className="w-6 h-6 rounded-full bg-zinc-200 flex-shrink-0"></div>
                        </div>

                        {/* Message 2: AI */}
                        <div className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md flex-shrink-0 mt-1">
                                <ShieldCheck className="w-3 h-3" />
                            </div>
                            <div className="bg-white border border-zinc-200/60 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm text-xs text-zinc-600 max-w-[90%] space-y-2">
                                <p><strong className="text-zinc-900">Wajib.</strong> Berdasarkan Permenaker 03/1998.</p>
                                <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <BookOpen className="w-3 h-3 text-emerald-600" />
                                        <span className="text-[9px] font-bold text-emerald-700 uppercase">Pasal 4 Ayat 1</span>
                                    </div>
                                    <p className="text-[10px] italic text-zinc-500 line-clamp-2">"Pengurus wajib melaporkan tiap kecelakaan kerja..."</p>
                                </div>
                            </div>
                        </div>

                         {/* Message 3: User */}
                         <div className="flex gap-4 items-end justify-end">
                            <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md text-xs font-medium max-w-[85%] leading-relaxed">
                                Batas waktunya berapa lama Pak Asef?
                            </div>
                            <div className="w-6 h-6 rounded-full bg-zinc-200 flex-shrink-0"></div>
                        </div>

                         {/* Message 4: AI */}
                         <div className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md flex-shrink-0 mt-1">
                                <ShieldCheck className="w-3 h-3" />
                            </div>
                            <div className="bg-white border border-zinc-200/60 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm text-xs text-zinc-600 max-w-[90%]">
                                <p>Harus dilaporkan dalam waktu <strong className="text-emerald-700 bg-emerald-50 px-1 rounded">2 x 24 jam</strong> sejak kejadian.</p>
                            </div>
                        </div>
                        
                         {/* Message 5: User (Partial/Input) */}
                         <div className="flex gap-4 items-end justify-end opacity-50">
                            <div className="bg-zinc-100 text-zinc-400 px-4 py-2 rounded-2xl rounded-tr-sm text-xs font-medium">
                                Oke, formulir apa yang harus...
                            </div>
                            <div className="w-6 h-6 rounded-full bg-zinc-100 flex-shrink-0"></div>
                        </div>
                    </div>

                    {/* Floating Element - Analysis Status */}
                    <div className="absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl border border-white/50 shadow-lg flex items-center justify-between animate-pulse">
                         <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                             <span className="text-xs font-bold text-zinc-600">Mengetik Jawaban...</span>
                         </div>
                         <div className="h-1 w-20 bg-zinc-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 w-[70%] rounded-full"></div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Social Proof - Infinite Scroll */}
      <section className="py-12 bg-white border-y border-zinc-100 overflow-hidden flex-shrink-0">
        <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-10">Dipercaya Safety Officer Dari</p>
        <div className="relative flex overflow-x-hidden group">
            {/* Gradient masks */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

            <div className="flex animate-scroll hover:[animation-play-state:paused] whitespace-nowrap py-2">
               <div className="flex items-center">
                   <CompanyLogos />
               </div>
               <div className="flex items-center">
                   <CompanyLogos />
               </div>
            </div>
        </div>
      </section>

       {/* How It Works Section - RAG System */}
       <section id="how-it-works" className="py-32 px-6 bg-[#FAFAF9] flex-shrink-0 relative">
         <div className="max-w-7xl mx-auto">
             <div className="text-center mb-24">
                <div className="inline-block bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-100">
                    Sistem Anti-Halusinasi
                </div>
                <h2 className="font-display text-3xl md:text-5xl text-zinc-900 mb-6 font-bold tracking-tight">Teknologi <span className="text-emerald-600">RAG Engine</span></h2>
                <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                   Si Asef menggunakan teknologi <strong>Retrieval-Augmented Generation</strong>. 
                   Setiap jawaban divalidasi dengan sumber hukum nyata, bukan sekedar prediksi.
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-[3px] bg-gradient-to-r from-zinc-200 via-emerald-200 to-zinc-200 -z-10 border-t border-b border-white"></div>

                {[
                    { 
                        title: "1. Retrieval (Pencarian)", 
                        desc: "Sistem memindai ribuan halaman UU K3, PP 50/2012, dan Dokumen Internal Anda untuk mencari fakta hukum yang relevan.", 
                        icon: <Database className="w-7 h-7 text-white" />, 
                        color: "from-blue-500 to-cyan-500" 
                    },
                    { 
                        title: "2. Augmentation (Konteks)", 
                        desc: "Data hukum yang valid disuntikkan ke 'otak' AI sebagai konteks wajib. AI dilarang menjawab di luar data ini.", 
                        icon: <BrainCircuit className="w-7 h-7 text-white" />, 
                        color: "from-violet-500 to-purple-600" 
                    },
                    { 
                        title: "3. Generation (Validasi)", 
                        desc: "Si Asef menyusun jawaban yang akurat secara hukum, lengkap dengan kutipan Pasal dan Ayat sebagai bukti.", 
                        icon: <FileCheck className="w-7 h-7 text-white" />, 
                        color: "from-emerald-500 to-green-600" 
                    },
                ].map((step, idx) => (
                     <div key={idx} className="flex flex-col items-center text-center group">
                        <div className={`w-32 h-32 rounded-[2rem] bg-gradient-to-br ${step.color} flex items-center justify-center mb-8 shadow-2xl shadow-zinc-200 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ring-8 ring-white relative overflow-hidden`}>
                             <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            {step.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 mb-4">{step.title}</h3>
                        <p className="text-zinc-500 leading-relaxed text-base px-6">{step.desc}</p>
                    </div>
                ))}
             </div>
         </div>
       </section>

      {/* Regulasi Spotlight Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex-shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-200 animate-fade-in-up">
              <Scale className="w-3 h-3" />
              Regulasi Spotlight
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-zinc-900 font-bold tracking-tight animate-fade-in-up [animation-delay:200ms]">
              Kutipan Penting dari Regulasi K3
            </h2>
          </div>
          
          <div className="relative bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-emerald-100/50 border border-emerald-100 animate-fade-in-up [animation-delay:400ms] group hover:shadow-2xl hover:shadow-emerald-200/50 transition-all duration-500">
            <div className="absolute top-6 left-8 text-emerald-200 opacity-50">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
            </div>
            
            <div className="pl-8 md:pl-16">
              <p className="text-xl md:text-2xl text-zinc-700 leading-relaxed italic mb-6">
                "{spotlight.content}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="w-1 h-12 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                <div>
                  <p className="font-bold text-zinc-900">{spotlight.documentName}</p>
                  <p className="text-sm text-zinc-500">Halaman {spotlight.pageNumber}</p>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-6 right-8 text-emerald-200 opacity-50 rotate-180">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Dark Mode Bento Grid */}
      <section id="features" className="py-32 px-6 bg-[#09090B] flex-shrink-0 relative overflow-hidden text-white">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]"></div>

        <div className="max-w-7xl mx-auto relative z-10">
           <div className="mb-20 max-w-3xl">
             <div className="flex items-center gap-2 mb-4">
                 <div className="h-1 w-10 bg-emerald-500 rounded-full"></div>
                 <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Platform K3 Modern</span>
             </div>
             <h2 className="font-display text-4xl md:text-6xl text-white mb-6 font-bold tracking-tight">Semua Alat Safety <br/> Dalam Satu AI.</h2>
             <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">Kami menggabungkan database hukum dengan Computer Vision canggih.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[650px]">
              
              {/* Feature 1 - Large Left */}
              <div className="md:col-span-2 md:row-span-2 bg-zinc-900/50 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-500">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
                 <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" alt="Legal Docs" />
                 
                 <div className="relative z-20 h-full flex flex-col justify-end">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Ensiklopedia Regulasi</h3>
                    <p className="text-zinc-300 text-lg leading-relaxed max-w-md">
                        Akses instan ke UU No. 1 Tahun 1970, PP 50 Tahun 2012, dan standar ISO 45001. Ditulis ulang oleh AI agar mudah dipahami.
                    </p>
                 </div>
              </div>

              {/* Feature 2 - Top Right */}
              <div className="md:col-span-2 bg-zinc-800 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group hover:bg-zinc-800/80 transition-all duration-300 flex flex-row items-center justify-between">
                 <div className="relative z-10 max-w-[60%]">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                        <Camera className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Vision AI Detector</h3>
                    <p className="text-zinc-400 text-sm">Upload foto kondisi tidak aman, AI akan mendeteksi potensi bahaya & pelanggaran APD secara otomatis.</p>
                 </div>
                 <div className="w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl absolute -right-4 top-1/2 -translate-y-1/2 group-hover:bg-emerald-500/30 transition-colors"></div>
                 <div className="relative z-10">
                    <Fingerprint className="w-24 h-24 text-emerald-500/50 rotate-12" />
                 </div>
              </div>

              {/* Feature 3 - Bottom Middle */}
              <div className="md:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 relative overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 text-white flex flex-col justify-between">
                 <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                     <FileText className="w-6 h-6 text-white" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-1">Doc Generator</h3>
                    <p className="text-emerald-100 text-xs">Buat JSA & IBPR instan.</p>
                 </div>
                 <ArrowRight className="absolute bottom-8 right-8 w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>

              {/* Feature 4 - Bottom Right */}
               <div className="md:col-span-1 bg-zinc-900 rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between">
                 <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-white/5">
                     <Check className="w-6 h-6 text-emerald-500" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold mb-1 text-white">Compliance</h3>
                    <p className="text-zinc-500 text-xs">Cek kesesuaian aturan.</p>
                 </div>
              </div>

           </div>
        </div>
      </section>

       {/* Testimonials Section */}
       <section id="testimonials" className="py-32 bg-[#FAFAF9] flex-shrink-0 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-16">
            <h2 className="font-display text-3xl md:text-5xl text-zinc-900 text-center font-bold tracking-tight">Kata Mereka</h2>
        </div>
        
        <div className="relative flex overflow-x-hidden group">
            {/* Gradient masks */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FAFAF9] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FAFAF9] to-transparent z-10"></div>

            <div className="flex animate-scroll hover:[animation-play-state:paused] py-4">
               <div className="flex">
                   {TESTIMONIALS.map((item, i) => <TestimonialCard key={i} item={item} />)}
               </div>
               <div className="flex">
                   {TESTIMONIALS.map((item, i) => <TestimonialCard key={`dup-${i}`} item={item} />)}
               </div>
            </div>
        </div>
       </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-white relative flex-shrink-0">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="font-display text-4xl md:text-5xl text-zinc-900 mb-6 font-bold tracking-tight">Investasi Kecil, <span className="text-emerald-600">Dampak Besar.</span></h2>
                <p className="text-zinc-500 text-lg md:text-xl mb-10">Pilih paket yang sesuai dengan kebutuhan operasional Anda.</p>
                
                {/* Billing Toggle */}
                <div className="inline-flex items-center p-1.5 bg-zinc-100 rounded-full border border-zinc-200">
                    <button 
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${billingCycle === 'monthly' ? 'bg-white text-zinc-900 shadow-md ring-1 ring-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}
                    >
                        Bulanan
                    </button>
                    <button 
                         onClick={() => setBillingCycle('yearly')}
                         className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white text-zinc-900 shadow-md ring-1 ring-zinc-200' : 'text-zinc-500 hover:text-zinc-900'}`}
                    >
                        Tahunan
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">Hemat 20%</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {/* Free Tier */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-200 hover:border-zinc-300 transition-all flex flex-col h-full relative group hover:shadow-xl hover:shadow-zinc-200/50">
                    <div className="mb-8">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100">Starter</span>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-5xl font-extrabold text-zinc-900 tracking-tight">Rp 0</span>
                        </div>
                        <p className="mt-4 text-zinc-500 text-sm leading-relaxed">Untuk mahasiswa atau pemula.</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-1">
                        <li className="flex items-start gap-3 text-zinc-600 text-sm"><Check className="w-5 h-5 text-zinc-300" /> <span>Akses UU No. 1 & PP 50</span></li>
                        <li className="flex items-start gap-3 text-zinc-600 text-sm"><Check className="w-5 h-5 text-zinc-300" /> <span>5 Chat / hari</span></li>
                    </ul>
                    <button onClick={onStart} className="w-full py-4 px-6 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-bold rounded-2xl transition-colors border border-zinc-200">Mulai Gratis</button>
                </div>

                {/* Pro Tier */}
                <div className="bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-800 shadow-2xl relative transform md:-translate-y-6 flex flex-col z-10 h-full text-white ring-4 ring-emerald-500/20 group hover:ring-emerald-500/40 transition-all">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                        Most Popular
                    </div>
                    <div className="mb-8">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Professional</span>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-5xl font-extrabold text-white tracking-tight">
                                {billingCycle === 'monthly' ? 'Rp 149rb' : 'Rp 119rb'}
                            </span>
                            <span className="text-zinc-400 font-medium text-sm">/bln</span>
                        </div>
                        <p className="mt-4 text-zinc-400 text-sm leading-relaxed">Full akses untuk praktisi K3.</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-1">
                        <li className="flex items-start gap-3 text-zinc-300 text-sm"><Check className="w-5 h-5 text-emerald-500" /> <span><strong>Unlimited</strong> Chat & Konsultasi</span></li>
                        <li className="flex items-start gap-3 text-zinc-300 text-sm"><Check className="w-5 h-5 text-emerald-500" /> <span>Full Database Regulasi</span></li>
                        <li className="flex items-start gap-3 text-zinc-300 text-sm"><Check className="w-5 h-5 text-emerald-500" /> <span>Vision AI (Foto Bahaya)</span></li>
                        <li className="flex items-start gap-3 text-zinc-300 text-sm"><Check className="w-5 h-5 text-emerald-500" /> <span>Export PDF Document</span></li>
                    </ul>
                    <button onClick={onStart} className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-900/50">Upgrade to Pro</button>
                </div>

                {/* Enterprise Tier */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-200 hover:border-zinc-300 transition-all flex flex-col h-full relative group hover:shadow-xl hover:shadow-zinc-200/50">
                    <div className="mb-8">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100">Corporate</span>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-5xl font-extrabold text-zinc-900 tracking-tight">Custom</span>
                        </div>
                        <p className="mt-4 text-zinc-500 text-sm leading-relaxed">Untuk tim HSE besar.</p>
                    </div>
                    <ul className="space-y-4 mb-10 flex-1">
                        <li className="flex items-start gap-3 text-zinc-600 text-sm"><Check className="w-5 h-5 text-zinc-300" /> <span>Dashboard Admin</span></li>
                        <li className="flex items-start gap-3 text-zinc-600 text-sm"><Check className="w-5 h-5 text-zinc-300" /> <span>Upload SOP Internal</span></li>
                        <li className="flex items-start gap-3 text-zinc-600 text-sm"><Check className="w-5 h-5 text-zinc-300" /> <span>API & SSO</span></li>
                    </ul>
                    <button onClick={() => window.open('mailto:sales@siasef.id')} className="w-full py-4 px-6 bg-white border-2 border-zinc-200 hover:border-zinc-900 text-zinc-900 font-bold rounded-2xl transition-all">Hubungi Sales</button>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-zinc-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-zinc-900">Si Asef</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-zinc-500">
                <a href="#" className="hover:text-emerald-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-emerald-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-emerald-600 transition-colors">Contact</a>
            </div>
            <div className="text-sm text-zinc-400">
                &copy; 2024 Si Asef AI.
            </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;