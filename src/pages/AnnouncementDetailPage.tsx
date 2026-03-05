import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../constants';
import { LeftPanel } from '../components/LeftPanel';
import { ArrowLeft } from 'lucide-react';

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
          未找到公告
          <button onClick={() => navigate('/announcements')} className="text-blue-500 hover:underline mt-2">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      <LeftPanel />

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-200 w-fit px-4 py-2 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">项目公告</h2>
          </div>
          <button className="px-6 py-2 rounded-full border border-blue-400 text-blue-500 font-bold hover:bg-blue-50 transition-colors text-sm">
            发布公告
          </button>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800">{announcement.title}</h1>
            <span className="text-sm text-slate-500">{announcement.date}</span>
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
            {announcement.content}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={16} /> 返回
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};