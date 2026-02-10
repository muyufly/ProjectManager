import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import type { AppState } from '../types';

interface NavbarProps {
  currentUser: AppState['currentUser'];
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser }) => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-6 py-2 rounded-lg font-bold transition-colors ${
      isActive
        ? 'bg-blue-500 text-white'
        : 'text-slate-800 hover:bg-slate-100'
    }`;

  return (
    <nav className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <button className="p-2 hover:bg-slate-100 rounded-lg">
          <Menu size={24} className="text-slate-600" />
        </button>
        
        <div className="flex items-center gap-2">
            <NavLink to="/" className={linkClass}>
            首页
            </NavLink>
            <NavLink to="/tasks" className={linkClass}>
            任务
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
            个人中心
            </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
            <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <span className="font-medium text-slate-700">{currentUser.name}</span>
      </div>
    </nav>
  );
};