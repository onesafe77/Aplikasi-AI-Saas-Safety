import React, { useState } from 'react';
import { Plus, MessageSquare, Settings, ShieldCheck, X, Trash2 } from 'lucide-react';
import { ChatSession, User } from '../types';
import logoImage from '@assets/si_asef_logo.png';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: ChatSession[];
  user: User | null;
  onNewChat: () => void;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  sessions,
  user,
  onNewChat,
  onLoadSession,
  onDeleteSession,
  onOpenSettings,
  onLogout,
  onOpenAdmin
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeleteConfirm(sessionId);
  };

  const confirmDelete = (sessionId: string) => {
    onDeleteSession(sessionId);
    setDeleteConfirm(null);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:relative z-30 flex flex-col h-full bg-[#FAFAF9] border-r border-zinc-200
          transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${isOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full opacity-0 md:opacity-100'}
          overflow-hidden font-sans
        `}
      >
        <div className="p-5 flex-none w-[280px]">
          {/* Close button for mobile */}
          <div className="md:hidden w-full flex justify-end mb-2">
            <button onClick={toggleSidebar} className="p-2 text-zinc-500"><X className="w-5 h-5" /></button>
          </div>

          {/* Header Logo Area */}
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md">
              <img src={logoImage} alt="Si Asef" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-lg text-zinc-900 tracking-tight">SiAsef</span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-xl hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/10 hover:text-emerald-700 transition-all duration-200 group text-sm text-zinc-600 shadow-sm font-semibold"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            Mulai Chat Baru
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-5 space-y-6 scrollbar-thin w-[280px]">

          {/* History Section */}
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 px-2">Riwayat Chat</h3>
            {sessions.length === 0 ? (
              <p className="text-xs text-zinc-400 px-2">Belum ada riwayat chat</p>
            ) : (
              <ul className="space-y-1">
                {sessions.map((session) => (
                  <li key={session.id} className="relative group">
                    {deleteConfirm === session.id ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-xs text-red-600 flex-1">Hapus chat ini?</span>
                        <button
                          onClick={() => confirmDelete(session.id)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Ya
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 bg-zinc-200 text-zinc-600 text-xs rounded hover:bg-zinc-300"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <button
                          onClick={() => onLoadSession(session.id)}
                          className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors text-left"
                        >
                          <MessageSquare className="w-4 h-4 text-zinc-300 group-hover:text-emerald-600 transition-colors" />
                          <span className="text-[13px] truncate text-zinc-600 group-hover:text-zinc-900 font-medium">
                            {session.title}
                          </span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(e, session.id)}
                          className="p-2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"
                          title="Hapus chat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 bg-[#FAFAF9] space-y-3 w-[280px]">
          {/* Admin Panel Button */}
          {user?.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="w-full flex items-center gap-3 px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors shadow-sm mb-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-bold">Admin Panel</span>
            </button>
          )}

          <div className="border-t border-zinc-200 pt-3">
            <div className="flex items-center justify-between group px-2 py-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <span className="text-xs font-bold">{user ? user.name.charAt(0) : 'S'}</span>
                </div>
                <div className="text-left overflow-hidden w-28">
                  <p className="text-sm font-bold text-zinc-900 truncate">
                    {user ? user.name : 'Safety Officer'}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {user ? user.email : 'Free Account'}
                  </p>
                </div>
              </div>
              <button onClick={onOpenSettings} className="text-zinc-400 hover:text-zinc-600">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;