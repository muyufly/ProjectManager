import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../constants';
import { LeftPanel } from '../components/LeftPanel';
import { ArrowLeft, Clock, Calendar, CheckCircle2 } from 'lucide-react';

export const AnnouncementDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useContext(AppContext);
  const { announcements } = state;
  const navigate = useNavigate();
  const announcement = announcements.find(a => a.id === Number(id));

  if (!announcement) {
    return (
      <div className="flex gap-6 h-full">
        <LeftPanel />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <p className="text-lg font-medium">未找到通知</p>
          <button
            onClick={() => navigate('/announcements')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            返回通知中心
          </button>
        </div>
      </div>
    );
  }

  const isRead = announcement.read || announcement.isRead;

  return (
    <div className="flex gap-6 h-full">
      <LeftPanel />

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Clock size={20} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">通知详情</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notification Detail</p>
          </div>
        </div>

        <div className={`bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border p-12 relative overflow-hidden ${isRead ? 'border-slate-100' : 'border-indigo-100'}`}>
          {/* Background accent */}
          <div className={`absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full blur-3xl opacity-10 ${isRead ? 'bg-slate-400' : 'bg-indigo-400'}`}></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isRead ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
                    {announcement.type || 'SYSTEM'}
                  </span>
                  {isRead && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle2 size={12} /> 已读
                    </span>
                  )}
                </div>
                <h1 className={`text-4xl font-black tracking-tight leading-tight ${isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                  {announcement.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-12 py-6 border-y border-slate-50">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString('zh-CN') : announcement.date}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 border-l border-slate-100 pl-6">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {announcement.createdAt ? new Date(announcement.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : (announcement.time || '00:00')}
                </span>
              </div>
            </div>

            <div className={`prose prose-slate max-w-none leading-relaxed text-lg whitespace-pre-line ${isRead ? 'text-slate-500' : 'text-slate-700'}`}>
              {announcement.body || announcement.content}
            </div>

            <div className="mt-20 pt-8 border-t border-slate-50 flex justify-between items-center">
              <button
                onClick={() => navigate('/announcements')}
                className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all text-sm group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回列表
              </button>

              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Notification ID: {announcement.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};