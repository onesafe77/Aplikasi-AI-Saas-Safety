import React from 'react';
import { Plus, MessageSquare, Settings, ShieldCheck, X, Zap, LogOut, Database } from 'lucide-react';
import { ChatSession, User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: ChatSession[];
  user: User | null;
  onNewChat: () => void;
  onLoadSession: (id: string) => void;
  onOpenUpgrade: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  sessions, 
  user,
  onNewChat, 
  onLoadSession, 
  onOpenUpgrade, 
  onOpenSettings,
  onLogout
}) => {
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
             <button onClick={toggleSidebar} className="p-2 text-zinc-500"><X className="w-5 h-5"/></button>
           </div>
           
           {/* Header Logo Area */}
           <div className="flex items-center gap-3 mb-6 px-1">
              <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-lg text-zinc-900 tracking-tight">Si Asef</span>
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
                  <li key={session.id}>
                    <button 
                      onClick={() => onLoadSession(session.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors text-left group"
                    >
                      <MessageSquare className="w-4 h-4 text-zinc-300 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-[13px] truncate text-zinc-600 group-hover:text-zinc-900 font-medium">
                        {session.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 bg-[#FAFAF9] space-y-3 w-[280px]">
            
            {/* Upgrade Card */}
             <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white relative overflow-hidden group cursor-pointer shadow-lg shadow-zinc-900/20" onClick={onOpenUpgrade}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Starter Plan</span>
                        <span className="text-[10px] text-zinc-400">3/5 Chats</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
                        <div className="h-full w-[60%] bg-emerald-500 rounded-full"></div>
                    </div>

                    <button className="w-full py-2 bg-white text-zinc-900 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
                        <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                        Upgrade to Pro
                    </button>
                </div>
            </div>

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