import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Bell, Check } from 'lucide-react';
import type { AppState, Notification } from '../types';
import { AppContext } from '../constants';
import { useContext, useState } from 'react';
import { NotifyAPI } from '../services/api';

interface NavbarProps {
  currentUser: AppState['currentUser'];
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser }) => {
  const { state, setState } = useContext(AppContext);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!currentUser) return null;

  const handleLogout = () => {
    localStorage.removeItem('student_online_token');
    setState(prev => ({ ...prev, currentUser: null, teams: [], projects: [], tasks: [] }));
    navigate('/login');
  };

  const handleMarkAsRead = async (ids: number[]) => {
    try {
      await NotifyAPI.read({ messageIds: ids });
      setState(prev => ({
        ...prev,
        notifications: prev.notifications?.map(n =>
          ids.includes(n.id) ? { ...n, isRead: true } : n
        )
      }));
    } catch (e) {
      console.error('Failed to mark notifications as read', e);
    }
  };

  const unreadCount = state.notifications?.filter(n => !n.isRead).length || 0;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-6 py-2 rounded-lg font-bold transition-colors ${isActive
      ? 'bg-blue-500 text-white'
      : 'text-slate-800 hover:bg-slate-100'
    }`;

  return (
    <nav className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <NavLink to="/" className={linkClass}>
            首页
          </NavLink>
          <NavLink to="/tasks" className={linkClass}>
            任务
          </NavLink>
          <NavLink to="/project-team" className={linkClass}>
            项目团队
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            个人中心
          </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-8 w-px bg-slate-200 mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ring-2 ring-slate-100">
            <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <span className="font-medium text-slate-700 hidden md:block">{currentUser.name}</span>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="退出登录"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};