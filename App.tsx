import React, { useState, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, BookOpen, UploadCloud, Scale, Gavel, Search, ShieldCheck, ChevronRight, Sparkles, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatBubble from './components/ChatBubble';
import InputArea from './components/InputArea';
import LandingPage from './components/LandingPage';
import RegisterOrganization from './components/RegisterOrganization';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import SourcePanel from './components/SourcePanel';
import { UpgradeModal, SettingsModal } from './components/Modals';
import { Message, Role, ChatSession, LoadingState, User, UploadedDocument, ViewState, Source, Folder, Employee } from './types';
import { sendMessageToGemini, initializeChat, updateChatContext, uploadDocument, getDocuments, deleteDocumentApi } from './services/gemini';
import { SourceInfo } from './components/CitationBubble';

function App() {
  const [currentView, setCurrentView] = useState<ViewState | 'register'>('landing');
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
        const docs = await getDocuments(currentUser?.organization_id || null);
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
    if (currentUser) {
      loadDocuments();
    }
  }, [currentUser]);

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
      const url = currentUser?.organization_id
        ? `/api/folders?organizationId=${currentUser.organization_id}`
        : '/api/folders';
      const res = await fetch(url);
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
      body: JSON.stringify({ name, organizationId: currentUser?.organization_id })
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
    const docs = await getDocuments(currentUser?.organization_id || null);
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
    const result = await uploadDocument(file, folder, currentUser?.organization_id || null, onProgress);
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
    return (
      <LandingPage
        onStart={() => setCurrentView('login')}
        onRegister={() => setCurrentView('register')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterOrganization
        onRegisterSuccess={handleLoginSuccess}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onRegisterClick={() => setCurrentView('register')}
      />
    );
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
        onBack={() => setCurrentView('chat')}
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
        onOpenAdmin={() => setCurrentView('admin')}
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

        {/* Header - Minimalist */}
        <header className="flex-none h-14 flex items-center justify-between px-4 md:px-8 z-10 bg-white/80 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <span className="font-semibold text-zinc-700 text-sm">Model K3 3.5 Sonnet</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
              title="New Chat"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto w-full relative scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">

              {/* Minimalist Greeting */}
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-medium text-zinc-900 mb-2">
                  Selamat Datang, {currentUser?.name?.split(' ')[0] || 'User'}.
                </h1>
                <p className="text-zinc-500">
                  Saya siap membantu Anda menelusuri regulasi K3.
                </p>
              </div>

              {/* Suggestions Grid - 2x2 Minimalist */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleSendMessage("Jelaskan tentang kewajiban SMK3 menurut PP 50 Tahun 2012")}
                  className="p-4 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-zinc-900 text-sm">Dasar Hukum SMK3</span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">Kewajiban penerapan menurut PP 50/2012.</p>
                </button>

                <button
                  onClick={() => handleSendMessage("Buatkan checklist inspeksi APD untuk area tambang")}
                  className="p-4 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-zinc-900 text-sm">Checklist Inspeksi</span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">Buat form inspeksi APD otomatis.</p>
                </button>

                <button
                  onClick={() => handleSendMessage("Apa sanksi pidana jika melanggar UU No. 1 Tahun 1970?")}
                  className="p-4 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Gavel className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-zinc-900 text-sm">Cek Sanksi Hukum</span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">Konsekuensi pelanggaran K3.</p>
                </button>

                <button
                  onClick={() => handleSendMessage("Analisa potensi bahaya dari deskripsi pekerjaan welding")}
                  className="p-4 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Search className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-zinc-900 text-sm">Analisa Bahaya</span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">Identifikasi risiko pekerjaan.</p>
                </button>
              </div>

            </div>
          ) : (
            <div className="flex flex-col pb-4 pt-8 min-h-0 max-w-3xl mx-auto px-4">
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