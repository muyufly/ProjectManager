import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../constants';
import { LeftPanel } from '../components/LeftPanel';
import type { User } from '../types';
import { Users } from 'lucide-react';

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const { state } = useContext(AppContext);
  const { teams, projects, users } = state;

  const team = teams.find(t => t.id === teamId);
  const project = projects.find(p => p.teamId === teamId);

  if (!team || !project) return (
    <div className="flex gap-6 h-full">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center text-slate-400">未找到团队或项目</div>
    </div>
  );

  const getResponsibility = (user: User) => {
    if (user.department === '视觉设计') return '设计项目协作管理系统网页';
    if (user.role === 'Manager') return '项目整体统筹，进度追踪及需求分析。';
    return '前端开发，React组件实现及后端API对接。';
  };

  return (
    <div className="flex gap-6 h-full">
      <LeftPanel />
      
      <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4">
            <div className="bg-blue-100 px-6 py-2.5 rounded-xl shadow-sm w-fit inline-flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <h2 className="text-xl font-bold text-slate-800">我的团队</h2>
            </div>
            
            <div className="mt-2">
                 <div className="bg-white px-8 py-4 rounded-xl shadow-sm border border-slate-200 w-fit">
                    <h1 className="text-2xl font-bold text-slate-800">{team.name}</h1>
                </div>
            </div>
        </div>

        {/* Unified Card for Intro and Members */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Project Introduction Section */}
            <div className="p-8 md:p-10">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                        项目简介
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-base">
                        {project.description}
                        <br /><br />
                        {project.requirements}
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100 mx-10"></div>

            {/* Member List Section */}
            <div className="p-8 md:p-10 pt-6">
                <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                    {team.name} 成员
                </h3>
                
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-8 py-5 font-bold text-slate-700 text-base uppercase tracking-wider w-1/5 text-center">姓名</th>
                                <th className="px-8 py-5 font-bold text-slate-700 text-base uppercase tracking-wider w-1/5 text-center">院系</th>
                                <th className="px-8 py-5 font-bold text-slate-700 text-base uppercase tracking-wider text-center">负责部分</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {team.memberIds.map(memberId => {
                                const user = users.find(u => u.id === memberId);
                                if (!user) return null;
                                return (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-8 font-bold text-slate-800 text-lg text-center">{user.name}</td>
                                        <td className="px-8 py-8 text-slate-600 text-lg text-center">{user.department || '开发部'}</td>
                                        <td className="px-8 py-8 text-slate-500 text-lg text-center leading-relaxed">{getResponsibility(user)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};