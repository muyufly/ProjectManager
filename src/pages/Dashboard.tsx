import React, { useContext, useState } from 'react';
import { AppContext } from '../constants';
import { LeftPanel } from '../components/LeftPanel';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { ProjectAPI, TeamAPI, NotifyAPI } from '../services/api';
import { Plus, LayoutGrid, Megaphone, ArrowRight, FolderPlus, Users as UsersIcon, CheckCircle2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';

export const Dashboard: React.FC = () => {
    const { state, setState } = useContext(AppContext);
    const { projects, announcements, availableProjects, teams } = state;
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleCreateProject = async (data: { name: string; description: string; deadline: string; teamId: number }) => {
        try {
            const projectId = await ProjectAPI.create(data);
            const newProject: Project = {
                id: projectId,
                projectId: projectId,
                name: data.name,
                description: data.description,
                deadline: data.deadline,
                teamId: data.teamId,
                status: 'Active',
                memberIds: [state.currentUser?.userId || 0],
                managerId: state.currentUser?.userId || 0,
                creatorId: state.currentUser?.userId || 0,
                createdAt: new Date().toISOString()
            };
            setState(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
        } catch (e) {
            alert('创建项目失败');
        }
    };

    const handleCreateTeam = async (data: { name: string; description?: string }) => {
        try {
            const teamId = await TeamAPI.create(data);

            // Immediately fetch actual members to sync state with backend
            const membersRes = await TeamAPI.members(teamId);
            const actualMembers = membersRes.data || [];
            const memberIds = actualMembers.map((m: any) => m.userId || m.id);
            const adminIds = actualMembers
                .filter((m: any) => m.teamRole === 'CREATOR' || m.teamRole === 'ADMIN')
                .map((m: any) => m.userId || m.id);

            const newTeam = {
                id: teamId,
                teamId: teamId,
                name: data.name,
                description: data.description || '',
                ownerId: state.currentUser?.userId || state.currentUser?.id || 0,
                memberIds: memberIds.length > 0 ? memberIds : [state.currentUser?.userId || 0],
                adminIds: adminIds.length > 0 ? adminIds : [state.currentUser?.userId || 0]
            };
            setState(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
        } catch (e) {
            alert('创建团队失败');
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadIds = announcements.filter(a => !a.isRead).map(a => a.id);
        if (unreadIds.length === 0) return;
        try {
            await NotifyAPI.read({ messageIds: unreadIds });
            setState(prev => ({
                ...prev,
                announcements: prev.announcements.map(a => ({ ...a, isRead: true }))
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
                announcements: prev.announcements.map(a => a.id === id ? { ...a, isRead: true } : a)
            }));
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    };

    return (
        <div className="flex gap-8 h-full min-h-0 min-w-0 overflow-hidden">
            <LeftPanel showStats />

            <div className="flex-1 space-y-8 overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-slate-200">
                {/* Hero Section */}
                <div className="relative bg-blue-600 rounded-[2rem] p-10 text-white overflow-hidden shadow-2xl shadow-blue-200 group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32"></div>

                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">欢迎回来, {state.currentUser?.name}!</h1>
                        <p className="text-blue-100 text-lg mb-8 opacity-90">在这里管理您的 学生在线 项目，追踪任务进度，并与您的团队成员展开高效协作。</p>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => setIsProjectModalOpen(true)}
                                className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg"
                            >
                                <Plus size={20} /> 创建新项目
                            </button>
                            <button
                                onClick={() => setIsTeamModalOpen(true)}
                                className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl border border-blue-400 flex items-center gap-2 hover:bg-blue-400 transition-all"
                            >
                                <UsersIcon size={20} /> 组建团队
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left: Project List */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="text-slate-400" size={20} />
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">活跃项目</h2>
                            </div>
                            <button
                                onClick={() => navigate('/tasks')}
                                className="text-sm font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 group"
                            >
                                查看全部 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.length === 0 ? (
                                <div className="col-span-full py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 font-medium">
                                    暂无活跃项目，立即创建一个吧！
                                </div>
                            ) : (
                                projects.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => navigate(`/project/${p.projectId || p.id}`)}
                                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <FolderPlus size={24} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-widest">{p.status || 'Active'}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 mb-2 truncate">{p.name}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10">{p.description}</p>

                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-slate-400">项目周期</span>
                                                <span className="text-blue-500">{p.deadline}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full w-[65%] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Announcements */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Megaphone className="text-slate-400" size={20} />
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">最新通知</h2>
                            </div>
                            {announcements.some(a => !a.isRead) && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 uppercase tracking-widest"
                                >
                                    <Check size={12} /> 全部已读
                                </button>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full max-h-[600px] flex flex-col">
                            <div className="p-6 flex-1 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-100">
                                {announcements.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm italic">暂无通知</div>
                                ) : (
                                    announcements.map(a => (
                                        <div
                                            key={a.id}
                                            className={`group cursor-pointer p-2 rounded-2xl transition-all ${!a.isRead ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                            onClick={() => {
                                                if (!a.isRead) handleMarkAsRead(a.id);

                                                // Extract invite token if present in content (common for team invites)
                                                // Handles both URL query style and text labels
                                                const tokenMatch = a.content?.match(/token=([^&\s]+)/) || a.content?.match(/Token:?\s*([a-zA-Z0-9._-]+)/i);
                                                const token = tokenMatch ? tokenMatch[1] : null;

                                                if (token) {
                                                    // Navigate to local invite acceptance handler
                                                    navigate(`/accept-invite/${token}`);
                                                } else {
                                                    navigate(`/announcement/${a.id}`);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${!a.isRead ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-300'}`}></span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.time || a.date}</span>
                                                </div>
                                                {!a.isRead && <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">NEW</span>}
                                            </div>
                                            <h4 className={`font-bold group-hover:text-blue-500 transition-colors line-clamp-1 ${!a.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{a.title}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{a.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/announcements')}
                                className="w-full py-4 bg-slate-50 border-t border-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                            >
                                查看全部通知 <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Available Projects to Join */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500" size={20} /> 可加入项目
                    </h2>
                    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-100">
                                    <tr>
                                        <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">项目</th>
                                        <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest">描述</th>
                                        <th className="pb-4 font-bold text-slate-400 text-[10px] uppercase tracking-widest text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {availableProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-slate-400 italic">暂无可加入项目</td>
                                        </tr>
                                    ) : (
                                        availableProjects.map(p => (
                                            <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-5">
                                                    <div className="font-bold text-slate-800">{p.name}</div>
                                                    <div className="text-[10px] text-slate-400">{p.deadline} 截止</div>
                                                </td>
                                                <td className="py-5 text-sm text-slate-600 max-w-md truncate">{p.description}</td>
                                                <td className="py-5 text-right">
                                                    <button
                                                        onClick={() => alert('已发送加入申请！')}
                                                        className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:border-blue-500 hover:text-blue-500 transition-all"
                                                    >
                                                        申请加入
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {isProjectModalOpen && (
                <CreateProjectModal
                    onClose={() => setIsProjectModalOpen(false)}
                    onSubmit={handleCreateProject}
                    teams={teams}
                />
            )}

            {isTeamModalOpen && (
                <CreateTeamModal
                    onClose={() => setIsTeamModalOpen(false)}
                    onSubmit={handleCreateTeam}
                />
            )}
        </div>
    );
};