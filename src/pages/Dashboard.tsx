import React, { useContext, useState } from 'react';
import { AppContext } from '../constants';
import { LeftPanel } from '../components/LeftPanel';
import { ChevronDown, ChevronUp, Bell, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { state } = useContext(AppContext);
  const { availableProjects, announcements } = state;
  const [showAllProjects, setShowAllProjects] = useState(false);
  const navigate = useNavigate();

  // Get the latest announcement
  const latestAnnouncement = announcements.length > 0 ? announcements[0] : null;

  // Logic for displaying projects (show 3 or all)
  const displayedProjects = showAllProjects 
    ? availableProjects 
    : availableProjects.slice(0, 3);

  return (
    <div className="flex gap-6 h-full">
      <LeftPanel showStats={true} />
      
      <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* Project Announcement Section */}
        {latestAnnouncement && (
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="bg-blue-100 px-6 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-2">
                        <Bell size={18} className="text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-800">项目公告</h2>
                    </div>
                    <button 
                        onClick={() => navigate('/announcements')}
                        className="text-blue-600 hover:text-white font-bold border-2 border-blue-100 hover:bg-blue-500 hover:border-blue-500 px-5 py-1.5 rounded-full transition-all text-sm shadow-sm"
                    >
                        查看全部
                    </button>
                </div>
                
                <div 
                    className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group relative overflow-hidden"
                    onClick={() => navigate(`/announcement/${latestAnnouncement.id}`)}
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-slate-800 text-xl group-hover:text-blue-600 transition-colors">{latestAnnouncement.title}</h3>
                        <span className="text-sm font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                            {latestAnnouncement.date}
                        </span>
                    </div>
                    <p className="text-slate-600 text-base leading-relaxed h-[72px] overflow-hidden text-ellipsis line-clamp-3">
                        {latestAnnouncement.content}
                    </p>
                    <div className="mt-4 flex justify-end">
                         <span className="text-sm text-blue-500 font-medium group-hover:underline">阅读更多</span>
                    </div>
                </div>
            </div>
        )}

        <div className="flex flex-col gap-4">
             <div className="bg-blue-100 px-6 py-2.5 rounded-xl shadow-sm w-fit inline-flex items-center gap-2">
                <CheckCircle size={18} className="text-blue-600" />
                <h2 className="text-xl font-bold text-slate-800">可加入项目</h2>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                        <th className="px-6 py-5 text-center font-bold text-slate-700 text-base uppercase tracking-wider">项目名称</th>
                        <th className="px-6 py-5 text-center font-bold text-slate-700 text-base uppercase tracking-wider">项目简介</th>
                        <th className="px-6 py-5 text-center font-bold text-slate-700 text-base uppercase tracking-wider">需求</th>
                        <th className="px-6 py-5 text-center font-bold text-slate-700 text-base uppercase tracking-wider">截止日期</th>
                        <th className="px-6 py-5 text-center font-bold text-slate-700 text-base uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayedProjects.map((project) => (
                        <tr key={project.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-6 font-bold text-slate-800 w-1/5 text-center group-hover:text-blue-700 transition-colors">{project.name}</td>
                            <td className="px-6 py-6 text-slate-600 text-sm w-1/4 leading-relaxed">{project.description}</td>
                            <td className="px-6 py-6 text-slate-600 text-sm w-1/4 leading-relaxed">{project.requirements}</td>
                            <td className="px-6 py-6 text-slate-800 font-medium text-center">{project.deadline}</td>
                            <td className="px-6 py-6 text-center">
                                <button 
                                    onClick={() => alert('已发送申请！')}
                                    className="border-2 border-blue-400 text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 px-6 py-1.5 rounded-full font-bold transition-all shadow-sm active:scale-95"
                                >
                                    接受
                                </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            
                {/* Show More / Collapse Button */}
                {availableProjects.length > 3 && (
                    <div 
                        className="p-4 bg-slate-50 border-t border-slate-200 text-center cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-blue-600 font-bold text-sm"
                        onClick={() => setShowAllProjects(!showAllProjects)}
                    >
                        {showAllProjects ? (
                            <>
                            收起 <ChevronUp size={16} />
                            </>
                        ) : (
                            <>
                            查看更多 ({availableProjects.length - 3} 个项目) <ChevronDown size={16} />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};