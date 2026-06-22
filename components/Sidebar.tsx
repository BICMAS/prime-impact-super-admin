
import React from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  BookOpen, 
  Map, 
  LogOut,
  Award
} from 'lucide-react';
import { ViewState } from '../types';
import { logout } from '@/api/auth';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onLogout }) => {
  const menuItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'CONFIG', label: 'Platform Config', icon: <Settings size={20} /> },
    { id: 'USERS', label: 'User Management', icon: <Users size={20} /> },
    { id: 'COURSES', label: 'SCORM Courses', icon: <BookOpen size={20} /> },
    { id: 'PATHS', label: 'Learning Paths', icon: <Map size={20} /> },
    { id: 'REWARDS', label: 'Rewards & Certs', icon: <Award size={20} /> },
  ];

  return (
    <div className="w-64 bg-[#008080] text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 border-b border-white flex items-center gap-3">
        <img src="/img/bicmas-logo.png" alt="BICMAS Academy Logo" className="mx-auto h-20 w-20 mb-4" />
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-[#004c4c] text-white shadow-lg shadow-[#004c4c]/50' 
                : 'text-white hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className={`${currentView === item.id ? 'text-white' : 'text-slate-200 group-hover:text-white transition-colors'}`}>
              {item.icon}
            </div>
            <span className="font-medium">{item.label}</span>
            {currentView === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white font-bold hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-all duration-200"
        >
          
          <span className="font-medium">Logout</span>
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
