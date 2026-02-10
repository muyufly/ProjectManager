import React, { useContext } from 'react';
import { ChevronRight } from 'lucide-react';
import { AppContext } from '../constants';
import type { Project } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

interface LeftPanelProps {
  showStats?: boolean;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ showStats = false }) => {
  const { state } = useContext(AppContext);
  const { projects } = state;
  const navigate = useNavigate();
  const location = useLocation();

  // Mock status mapping
  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'Active':
        return <span className="text-[10px] border border-orange-400 text-orange-500 px-2 py-0.5 rounded-full bg-white whitespace-nowrap">进行中</span>;
      case 'Archived':
        return <span className="text-[10px] border border-red-400 text-red-500 px-2 py-0.5 rounded-full bg-white whitespace-nowrap">已结束</span>;
      case 'Pending':
        return <span className="text-[10px] border border-blue-400 text-blue-500 px-2 py-0.5 rounded-full bg-white whitespace-nowrap">未开始</span>;
      case 'Completed':
        return <span className="text-[10px] border border-green-400 text-green-500 px-2 py-0.5 rounded-full bg-white whitespace-nowrap">已完成</span>;
      default:
        return null;
    }
  };

  const handleProjectClick = (project: Project) => {
    // If we are currently on the Tasks page (or a sub-route of it), 
    // clicking a sidebar project should simply filter the tasks view for that project.
    if (location.pathname.startsWith('/tasks')) {
        navigate(`/tasks/${project.id}`);
    } else {
        // Otherwise, go to the Team/Project Detail page as usual
        navigate(`/team/${project.teamId}`);
    }
  };

  const isProjectActive = (project: Project) => {
    // Check if we are on the team detail page for this project's team
    const isTeamActive = location.pathname === `/team/${project.teamId}`;
    // Check if we are on the task page for this project
    const isTaskActive = location.pathname === `/tasks/${project.id}`;
    return isTeamActive || isTaskActive;
  };

  const myProjects = projects; 

  return (
    <div className="w-80 flex-shrink-0 flex flex-col gap-6">
      {/* My Team Section */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div 
            className="flex items-center justify-between mb-4 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors group"
            onClick={() => navigate('/')}
        >
          <h2 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">我的团队</h2>
          <ChevronRight size={18} className="text-blue-500" />
        </div>
        
        <div className="space-y-3">
          {myProjects.map(project => {
            const isActive = isProjectActive(project);
            
            // Dynamic classes based on active state only
            let containerClasses = "p-3 rounded-lg cursor-pointer transition-all border ";
            if (isActive) {
                containerClasses += "bg-blue-600 text-white shadow-md border-blue-600 ring-2 ring-blue-200 ring-offset-1";
            } else {
                containerClasses += "bg-white hover:bg-slate-50 border-transparent hover:border-slate-200 text-slate-800";
            }

            return (
              <div 
                  key={project.id} 
                  onClick={() => handleProjectClick(project)}
                  className={containerClasses}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-bold truncate pr-2 ${isActive ? 'text-white' : 'text-slate-800'}`}>
                      {project.name}
                  </span>
                  <div className="flex-shrink-0">
                      {getStatusBadge(project.status)}
                  </div>
                </div>
                <div className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                  角色: {state.currentUser.role === 'Admin' ? '管理员' : '视觉设计'}
                </div>
                <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                  截止日期: {project.deadline}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Checklist Stats */}
      {showStats && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg mb-4">项目清单</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center group cursor-default">
              <span className="text-slate-600 group-hover:text-slate-900 transition-colors">可加入项目:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{state.availableProjects.length}</span>
            </div>
            <div className="flex justify-between items-center group cursor-default">
              <span className="text-slate-600 group-hover:text-slate-900 transition-colors">已完成总数:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">15</span>
            </div>
            <div className="flex justify-between items-center group cursor-default">
              <span className="text-slate-600 group-hover:text-slate-900 transition-colors">已加入项目:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{projects.length}</span>
            </div>
            
            <div className="pt-4 space-y-3 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-orange-500 font-medium">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        即将截止
                    </span>
                    <span className="text-slate-500">1 (剩余 10 天)</span>
                </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-700 font-medium">
                        <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                        进行中
                    </span>
                    <span className="text-slate-500">2</span>
                </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-red-500 font-medium">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        已结束
                    </span>
                    <span className="text-slate-500">1 (逾期 60 天)</span>
                </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-blue-400 font-medium">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        未开始
                    </span>
                    <span className="text-slate-500">1</span>
                </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-green-500 font-medium">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        已完成
                    </span>
                    <span className="text-slate-500">1</span>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};