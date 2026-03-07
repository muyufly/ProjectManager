import React, { useContext } from 'react';
import { ChevronRight, LayoutGrid, Users } from 'lucide-react';
import { AppContext } from '../constants';
import type { Project, Team } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

interface LeftPanelProps {
  showStats?: boolean;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({ showStats = false }) => {
  const { state } = useContext(AppContext);
  const { projects, teams, tasks } = state;
  const navigate = useNavigate();
  const location = useLocation();

  const handleTeamClick = (team: Team) => {
    const tId = team.teamId || team.id;
    navigate(`/team/${tId}`);
  };

  const isTeamActive = (team: Team) => {
    const tId = team.teamId || team.id;
    return location.pathname === `/team/${tId}`;
  };

  // 任务统计
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // 即将截止（3日内且未完成的）
  const approachingCount = tasks.filter(t => {
    const status = String(t.status);
    if (status === 'DONE' || status === 'CANCELLED') return false;
    const dueDateStr = (t as any).dueAt || (t as any).dueDate;
    if (!dueDateStr) return false;
    const dueDate = new Date(dueDateStr);
    return dueDate >= now && dueDate <= threeDaysLater;
  }).length;

  // 进行中
  const inProgressCount = tasks.filter(t => String(t.status) === 'IN_PROGRESS').length;

  // 已结束（已取消）
  const endedCount = tasks.filter(t => String(t.status) === 'CANCELLED').length;

  // 未开始
  const notStartedCount = tasks.filter(t => String(t.status) === 'NOT_STARTED').length;

  // 已完成
  const completedCount = tasks.filter(t => String(t.status) === 'DONE').length;

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
          {teams.length === 0 ? (
             <div className="text-sm text-slate-400 text-center py-4">暂无团队</div>
          ) : (
             teams.map(team => {
            const isActive = isTeamActive(team);

            // Dynamic classes based on active state only
            let containerClasses = "p-3 rounded-lg cursor-pointer transition-all border ";
            if (isActive) {
              containerClasses += "bg-blue-600 text-white shadow-md border-blue-600 ring-2 ring-blue-200 ring-offset-1";
            } else {
              containerClasses += "bg-white hover:bg-slate-50 border-transparent hover:border-slate-200 text-slate-800";
            }

            const memberCount = team.memberIds?.length || 0;
            const isOwner = team.ownerId === state.currentUser?.id || team.ownerId === state.currentUser?.userId;
            const isAdmin = team.adminIds?.includes(state.currentUser?.id || 0) || team.adminIds?.includes(state.currentUser?.userId || 0);
            
            let roleLabel = '成员';
            if (isOwner) roleLabel = '所有者';
            else if (isAdmin) roleLabel = '管理员';

            return (
              <div
                key={team.id}
                onClick={() => handleTeamClick(team)}
                className={containerClasses}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-bold truncate pr-2 ${isActive ? 'text-white' : 'text-slate-800'}`}>
                    {team.name}
                  </span>
                  <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Users size={10} />
                    {memberCount}
                  </div>
                </div>
                <div className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                  角色: {roleLabel}
                </div>
                <div className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  {team.description || '暂无描述'}
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* Project Checklist Stats - 任务统计 */}
      {showStats && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg mb-4">项目清单</h3>

          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-orange-500 font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                即将截止
              </span>
              <span className="font-bold text-slate-700 bg-orange-50 px-2.5 py-1 rounded-full min-w-[28px] text-center">{approachingCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-blue-600 font-medium">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                进行中
              </span>
              <span className="font-bold text-slate-700 bg-blue-50 px-2.5 py-1 rounded-full min-w-[28px] text-center">{inProgressCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-red-500 font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                已结束
              </span>
              <span className="font-bold text-slate-700 bg-red-50 px-2.5 py-1 rounded-full min-w-[28px] text-center">{endedCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-500 font-medium">
                <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                未开始
              </span>
              <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full min-w-[28px] text-center">{notStartedCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-green-500 font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                已完成
              </span>
              <span className="font-bold text-slate-700 bg-green-50 px-2.5 py-1 rounded-full min-w-[28px] text-center">{completedCount}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>任务总数</span>
              <span className="font-bold text-slate-700">{tasks.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};