import React, { useState, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, BookOpen, UploadCloud, Scale, Gavel, Search, ShieldCheck, ChevronRight, Sparkles, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatBubble from './components/ChatBubble';
import InputArea from './components/InputArea';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import SourcePanel from './components/SourcePanel';
import { UpgradeModal, SettingsModal } from './components/Modals';
import { Message, Role, ChatSession, LoadingState, User, UploadedDocument, ViewState, Source, Folder, Employee } from './types';
import { sendMessageToGemini, initializeChat, updateChatContext, uploadDocument, getDocuments, deleteDocumentApi } from './services/gemini';
import { SourceInfo } from './components/CitationBubble';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [users, setUsers] = useState<Employee[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Modal States
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Source Panel State
  const [activeSource, setActiveSource] = useState<SourceInfo | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        } else {
            setSidebarOpen(true);
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentView === 'chat') {
      initializeChat(documents);
    }
  }, [currentView]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update Gemini Context whenever documents change
  useEffect(() => {
      if (currentView === 'chat') {
          updateChatContext(documents);
      }
  }, [documents, currentView]);

  // Load documents from database on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await getDocuments();
        setDocuments(docs.map((d: any) => ({
          id: d.id.toString(),
          name: d.name || d.original_name,
          type: d.file_type,
          content: '',
          uploadDate: new Date(d.created_at).getTime(),
          size: d.file_size,
          folder: d.folder
        })));
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };
    loadDocuments();
  }, []);

  // Load chat sessions from database
  const getUserNik = () => {
    if (!currentUser?.email) return null;
    return currentUser.email.split('@')[0];
  };

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const userNik = getUserNik();
        const url = userNik ? `/api/sessions?userId=${userNik}` : '/api/sessions';
        const res = await fetch(url);
        const data = await res.json();
        setSessions(data.map((s: any) => ({
          id: s.id,
          title: s.title,
          date: new Date(s.updated_at).toLocaleDateString('id-ID')
        })));
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    };
    if (currentUser) {
      loadSessions();
    } else {
      setSessions([]);
    }
  }, [currentUser?.email]);

  // Load folders from database
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleFolderCreate = async (name: string) => {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await loadFolders();
  };

  const handleFolderUpdate = async (id: number, name: string, oldName: string) => {
    const res = await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, oldName })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await loadFolders();
    await refreshDocuments();
  };

  const handleFolderDelete = async (id: number) => {
    const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await loadFolders();
    await refreshDocuments();
  };

  const refreshDocuments = async () => {
    const docs = await getDocuments();
    setDocuments(docs.map((d: any) => ({
      id: d.id.toString(),
      name: d.name || d.original_name,
      type: d.file_type,
      content: '',
      uploadDate: new Date(d.created_at).getTime(),
      size: d.file_size,
      folder: d.folder
    })));
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
        setCurrentView('admin');
    } else {
        setCurrentView('chat');
    }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setMessages([]);
      setCurrentView('login');
      setShowSettingsModal(false);
  };

  const handleNewChat = async () => {
    const newId = `chat_${Date.now()}`;
    setCurrentSessionId(newId);
    setMessages([]);
    setLoadingState('idle');
    if (window.innerWidth < 768) setSidebarOpen(false);
    setCurrentView('chat');
    
    // Create session in database
    try {
      const userNik = getUserNik();
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId, title: 'Chat Baru', userId: userNik })
      });
      // Refresh sessions
      const url = userNik ? `/api/sessions?userId=${userNik}` : '/api/sessions';
      const res = await fetch(url);
      const data = await res.json();
      setSessions(data.map((s: any) => ({
        id: s.id,
        title: s.title,
        date: new Date(s.updated_at).toLocaleDateString('id-ID')
      })));
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleLoadSession = async (id: string) => {
    setCurrentSessionId(id);
    setLoadingState('idle');
    if (window.innerWidth < 768) setSidebarOpen(false);
    setCurrentView('chat');
    
    try {
      const res = await fetch(`/api/sessions/${id}/messages`);
      const data = await res.json();
      setMessages(data.map((m: any) => {
        let parsedSources;
        try {
          parsedSources = m.sources ? (typeof m.sources === 'string' ? JSON.parse(m.sources) : m.sources) : undefined;
        } catch {
          parsedSources = undefined;
        }
        return {
          id: m.id.toString(),
          role: m.role === 'user' ? Role.USER : Role.MODEL,
          content: m.content,
          timestamp: new Date(m.created_at).getTime(),
          sources: parsedSources
        };
      }));
    } catch (error) {
      console.error('Failed to load session messages:', error);
      setMessages([]);
    }
  };

  const handleDocumentUpload = async (file: File, folder: string = 'Umum', onProgress?: (percent: number) => void) => {
    const result = await uploadDocument(file, folder, onProgress);
    if (result.success) {
      const docs = await getDocuments();
      setDocuments(docs.map((d: any) => ({
        id: d.id.toString(),
        name: d.name || d.original_name,
        type: d.file_type,
        content: '',
        uploadDate: new Date(d.created_at).getTime(),
        size: d.file_size,
        folder: d.folder || 'Umum'
      })));
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    const success = await deleteDocumentApi(parseInt(id));
    if (success) {
      setDocuments(prev => prev.filter(d => d.id !== id));
    } else {
      throw new Error('Failed to delete document');
    }
  };

  const handleSendMessage = async (text: string, image?: string) => {
    const displayContent = image ? `[Attachment] ${text}` : text;
    
    // Create session if not exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = `chat_${Date.now()}`;
      setCurrentSessionId(sessionId);
      try {
        const userNik = getUserNik();
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sessionId, title: text.substring(0, 50), userId: userNik })
        });
      } catch (e) {
        console.error('Failed to create session:', e);
      }
    }
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: displayContent,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoadingState('streaming');
    
    // Save user message to database
    if (sessionId) {
      fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: displayContent })
      }).catch(console.error);
      
      // Update session title if first message
      if (messages.length === 0) {
        fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.substring(0, 50) })
        }).then(() => {
          // Refresh sessions list
          const userNik = getUserNik();
          const url = userNik ? `/api/sessions?userId=${userNik}` : '/api/sessions';
          fetch(url)
            .then(res => res.json())
            .then(data => setSessions(data.map((s: any) => ({
              id: s.id,
              title: s.title,
              date: new Date(s.updated_at).toLocaleDateString('id-ID')
            }))));
        }).catch(console.error);
      }
    }

    const aiMsgId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiMsgId,
      role: Role.MODEL,
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      let accumulatedText = '';
      const promptToSend = image ? `[User uploaded an image] ${text}` : text;
      let messageSources: Source[] = [];

      await sendMessageToGemini(promptToSend, 
        (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId 
              ? { ...msg, content: accumulatedText, sources: messageSources }
              : msg
          ));
        },
        (sources) => {
          messageSources = sources;
        }
      );
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, isStreaming: false, sources: messageSources }
          : msg
      ));
      setLoadingState('idle');
      
      // Save AI response to database
      if (sessionId) {
        fetch(`/api/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'model', content: accumulatedText, sources: messageSources })
        }).catch(console.error);
      }

    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, content: "Maaf, saya mengalami kendala koneksi.", isStreaming: false }
          : msg
      ));
      setLoadingState('error');
    }
  };

  // --- VIEW RENDERING ---

  if (currentView === 'landing') {
    return <LandingPage onStart={() => setCurrentView('login')} />;
  }

  if (currentView === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentView === 'admin') {
      return (
          <AdminDashboard 
            documents={documents}
            folders={folders}
            users={users}
            onUpload={handleDocumentUpload}
            onDelete={handleDeleteDocument}
            onLogout={handleLogout}
            onFolderCreate={handleFolderCreate}
            onFolderUpdate={handleFolderUpdate}
            onFolderDelete={handleFolderDelete}
            onRefreshUsers={loadUsers}
          />
      );
  }

  // Chat View (Only for standard users)
  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        user={currentUser}
        onNewChat={handleNewChat}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setShowSettingsModal(true)}
        onLogout={handleLogout}
      />

      {/* Modals */}
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        user={currentUser} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300 bg-[#F9FAFB]">
        
        {/* Header - Styled like Breadcrumbs */}
        <header className="flex-none h-14 flex items-center justify-between px-6 z-10 bg-white border-b border-zinc-100">
            <div className="flex items-center gap-3">
                <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="text-zinc-400 hover:text-zinc-600"
                >
                {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                </button>
                
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm">
                    <span className="font-semibold text-zinc-900">Si Asef</span>
                    <span className="mx-2 text-zinc-300">/</span>
                    <span className="text-zinc-500 font-medium">Dashboard Hukum</span>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                <span>HOME</span>
                </div>
            </div>
        </header>

        {/* Main Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto w-full relative scroll-smooth p-4 md:p-8">
            {messages.length === 0 ? (
            <div className="max-w-5xl mx-auto animate-fade-in-up">
                
                {/* Greeting */}
                <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold text-zinc-900 mb-2">
                    Halo, {currentUser?.name || 'Bagus K3'}.
                </h1>
                <p className="text-zinc-500">
                    Saya siap membantu Anda menelusuri <strong className="text-zinc-800">Regulasi K3 & Hukum Lingkungan Indonesia</strong>.
                </p>
                </div>

                {/* Top Section: Spotlight & Library */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Spotlight Card (Dark) - Always visible */}
                <div className="lg:col-span-2 bg-zinc-900 rounded-[2rem] p-6 md:p-8 relative overflow-hidden text-white flex flex-col justify-between min-h-[240px] md:min-h-[280px] shadow-xl group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-900/40 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-900/20 rounded-full blur-[80px] pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 mb-6">
                            <Sparkles className="w-3 h-3 text-amber-400" fill="currentColor" />
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">Regulasi Spotlight</span>
                        </div>
                        
                        <blockquote className="font-serif text-2xl md:text-3xl leading-snug mb-6 text-white/90">
                            "Perusahaan wajib menerapkan SMK3 jika mempekerjakan minimal 100 orang atau memiliki potensi bahaya tinggi."
                        </blockquote>
                        
                        <div className="inline-block bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded mb-6 font-mono">
                            PP 50 Tahun 2012 Pasal 5
                        </div>
                    </div>

                    <button 
                        onClick={() => handleSendMessage("Jelaskan tentang kewajiban SMK3 menurut PP 50 Tahun 2012")}
                        className="relative z-10 self-start bg-white text-zinc-900 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-2"
                    >
                        Pelajari SMK3
                    </button>

                    {/* Background Icon Decoration */}
                    <Scale className="absolute right-8 bottom-8 w-32 h-32 text-white/5 rotate-12" />
                </div>

                {/* Regulation Library (List) - Hidden on mobile */}
                <div className="hidden lg:flex bg-white rounded-[2rem] border border-zinc-200 p-6 flex-col h-full shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-zinc-900">Pustaka Regulasi</h3>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="group cursor-pointer hover:bg-zinc-50 p-3 -mx-3 rounded-xl transition-colors">
                            <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Update Terbaru</span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-800 mb-1">UU Cipta Kerja (Klaster Ketenagakerjaan)</h4>
                            <p className="text-xs text-zinc-400">Update Terbaru</p>
                        </div>

                        <div className="group cursor-pointer hover:bg-zinc-50 p-3 -mx-3 rounded-xl transition-colors">
                            <h4 className="text-sm font-bold text-zinc-800 mb-1">Permenaker No. 5 Tahun 2018</h4>
                            <p className="text-xs text-zinc-500">(Lingkungan Kerja)</p>
                            <p className="text-[10px] text-zinc-400 mt-1">Referensi Utama</p>
                        </div>

                        <div className="group cursor-pointer hover:bg-zinc-50 p-3 -mx-3 rounded-xl transition-colors">
                            <h4 className="text-sm font-bold text-zinc-800 mb-1">PP No. 50 Tahun 2012 (SMK3)</h4>
                            <p className="text-xs text-zinc-400">Wajib Baca</p>
                        </div>
                    </div>
                </div>
                </div>

                {/* Feature Cards Row - Hidden on mobile */}
                <div className="hidden md:flex mb-4 text-sm font-bold text-zinc-500 items-center gap-2">
                    <Search className="w-4 h-4" /> Penelusuran Hukum
                </div>
                <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
                    <button 
                    onClick={() => handleSendMessage("Carikan dasar hukum tentang...")}
                    className="bg-white p-5 rounded-2xl border border-zinc-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-left group"
                    >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Scale className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-zinc-900 mb-1">Cari Dasar Hukum</h3>
                    <p className="text-xs text-zinc-500">Temukan pasal spesifik</p>
                    <div className="mt-4 flex justify-end">
                        <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                    </button>

                    <button 
                    onClick={() => handleSendMessage("Buatkan checklist kepatuhan untuk...")}
                    className="bg-white p-5 rounded-2xl border border-zinc-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 transition-all text-left group"
                    >
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-zinc-900 mb-1">Cek Kepatuhan</h3>
                    <p className="text-xs text-zinc-500">Audit kesesuaian regulasi</p>
                    <div className="mt-4 flex justify-end">
                        <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    </button>

                    <button 
                    onClick={() => handleSendMessage("Apa sanksi jika melanggar...")}
                    className="bg-white p-5 rounded-2xl border border-zinc-200 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/5 transition-all text-left group"
                    >
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Gavel className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="font-bold text-zinc-900 mb-1">Sanksi & Denda</h3>
                    <p className="text-xs text-zinc-500">Konsekuensi hukum</p>
                    <div className="mt-4 flex justify-end">
                        <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-red-500 transition-colors" />
                    </div>
                    </button>
                </div>
                
                {/* Additional: User's Recent Activity / Suggestion (Optional - hidden for now to match image cleanly) */}

            </div>
            ) : (
            <div className="flex flex-col pb-4 pt-4 min-h-0 max-w-4xl mx-auto">
                {messages.map((msg, idx) => (
                <ChatBubble 
                  key={msg.id} 
                  message={msg} 
                  onRegenerate={() => handleSendMessage(msg.content)}
                  onOpenSource={(source) => setActiveSource(source)}
                />
                ))}
            </div>
            )}
        </div>

        <div className="flex-none pt-2 bg-gradient-to-t from-[#F9FAFB] via-[#F9FAFB] to-transparent">
            <InputArea onSendMessage={handleSendMessage} isLoading={loadingState === 'streaming'} />
        </div>
      </main>
      
      {/* Source Panel */}
      <SourcePanel 
        source={activeSource} 
        onClose={() => setActiveSource(null)} 
      />
    </div>
  );
}

export default App;