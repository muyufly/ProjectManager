import React, { useContext } from 'react';
import { AppContext } from '../constants';
import { LeftPanel } from '../components/LeftPanel';
import { useNavigate } from 'react-router-dom';
import { NotifyAPI } from '../services/api';
import { Check, Megaphone, Home } from 'lucide-react';

export const AnnouncementListPage: React.FC = () => {
    const { state, setState } = useContext(AppContext);
    const { announcements } = state;
    const navigate = useNavigate();

    const handleMarkAllAsRead = async () => {
        const unreadIds = announcements.filter(a => !a.isRead && !a.read).map(a => a.id);
        if (unreadIds.length === 0) return;
        try {
            await NotifyAPI.read({ messageIds: unreadIds });
            setState(prev => ({
                ...prev,
                announcements: prev.announcements.map(a => ({ ...a, isRead: true, read: true }))
            }));
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await NotifyAPI.read({ messageIds: [id] });
            setState(prev => ({
                ...prev,
                announcements: prev.announcements.map(a => a.id === id ? { ...a, isRead: true, read: true } : a)
            }));
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    };

    return (
        <div className="flex gap-6 h-full">
            <LeftPanel />

            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
                            <Megaphone size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">项目通知中心</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Notification Center</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm flex items-center gap-2 shadow-sm"
                        >
                            <Home size={16} /> 返回首页
                        </button>
                        {announcements.some(a => !a.isRead && !a.read) && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all text-sm flex items-center gap-2 shadow-lg shadow-indigo-100"
                            >
                                <Check size={16} /> 全部已读
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {announcements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium">暂无通知</p>
                        </div>
                    ) : (
                        announcements.map((announcement) => {
                            const isRead = announcement.isRead || announcement.read;
                            return (
                                <div
                                    key={announcement.id}
                                    className={`bg-white p-8 rounded-[2rem] border transition-all cursor-pointer relative group ${!isRead ? 'border-indigo-100 shadow-xl shadow-indigo-50/50' : 'border-slate-100 shadow-sm opacity-75 hover:opacity-100'}`}
                                    onClick={() => {
                                        if (!isRead) handleMarkAsRead(announcement.id);

                                        const bodyText = announcement.body || announcement.content;
                                        const tokenMatch = bodyText?.match(/token=([^&\s]+)/) || bodyText?.match(/Token:?\s*([a-zA-Z0-9._-]+)/i);
                                        const token = tokenMatch ? tokenMatch[1] : null;

                                        if (token) {
                                            navigate(`/accept-invite/${token}`);
                                        } else {
                                            navigate(`/announcement/${announcement.id}`);
                                        }
                                    }}
                                >
                                    {!isRead && (
                                        <div className="absolute top-6 left-6 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.8)] z-10 ring-4 ring-white"></div>
                                    )}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 pr-10">
                                            <h3 className={`font-black text-xl leading-tight transition-colors ${!isRead ? 'text-slate-900 group-hover:text-indigo-600' : 'text-slate-500 group-hover:text-slate-800'}`}>
                                                {announcement.title}
                                            </h3>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${!isRead ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                                            ID: {announcement.id}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end gap-6">
                                        <div className="flex-1">
                                            <p className={`text-sm leading-relaxed h-[60px] overflow-hidden text-ellipsis line-clamp-2 ${!isRead ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {announcement.body || announcement.content}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString('zh-CN') : announcement.date}
                                            </span>
                                            {isRead && <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">已读</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};