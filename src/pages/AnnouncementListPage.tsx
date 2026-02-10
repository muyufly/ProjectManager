import React, { useContext } from 'react';
import { AppContext } from '../constants';
import { LeftPanel } from '../components/LeftPanel';
import { useNavigate } from 'react-router-dom';

export const AnnouncementListPage: React.FC = () => {
  const { state } = useContext(AppContext);
  const { announcements } = state;
  const navigate = useNavigate();

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

        <div className="flex flex-col gap-4">
            {announcements.map((announcement) => (
                <div 
                    key={announcement.id}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => navigate(`/announcement/${announcement.id}`)}
                >
                     <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{announcement.title}</h3>
                        <div className="bg-orange-400 text-white text-xs px-2 py-0.5 rounded shadow-sm">
                            {announcement.id}
                        </div>
                     </div>
                    <div className="flex justify-between items-end gap-6">
                        <p className="text-slate-600 text-sm leading-relaxed h-[60px] overflow-hidden text-ellipsis line-clamp-2">
                            {announcement.content}
                        </p>
                        <span className="text-xs text-slate-400 whitespace-nowrap mb-1">
                            {announcement.date}
                        </span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};