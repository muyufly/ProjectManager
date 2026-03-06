import React, { useContext, useState } from 'react';
import { AppContext } from '../constants';
import { LayoutGrid, Users as UsersIcon, FolderPlus, Plus, ArrowRight, ChevronDown, ChevronUp, Clock, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project, Team, Task } from '../types';
import { TaskStatus } from '../types';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { TaskAPI, ProjectAPI, TeamAPI } from '../services/api';
import { TaskDetailModal } from '../components/TaskDetailModal';

// Mock Role Groups (Same as in TasksPage)
interface RoleGroup {
    id: string;
    name: string;
    members: { name: string; avatar: string; role: string }[];
}

export const ProjectTeamPage: React.FC = () => {
    const { state, setState } = useContext(AppContext);
    const { tasks, users, teams } = state;
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'projects' | 'teams'>('projects');
    const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
    const [expandedTeams, setExpandedTeams] = useState<Record<number, boolean>>({});
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editMode, setEditMode] = useState<Record<number, boolean>>({});
    const [groupsByProject, setGroupsByProject] = useState<Record<number, RoleGroup[]>>({});

    // Use state data
    const displayProjects = state.projects;
    const displayTeams = state.teams;

    const toggleProjectExpand = (projectId: number) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    const handleCreateTask = (projectId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveProjectId(projectId);
        setIsTaskModalOpen(true);
    };

    const toggleTeamExpand = (teamId: number) => {
        setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
    };

    const resolveUser = (id?: number) => {
        if (!id) return undefined;
        return users.find(u => (u.userId || u.id) === id);
    };

    const getGroups = (projectId: number) => {
        return groupsByProject[projectId] || [];
    };

    const setGroups = (projectId: number, groups: RoleGroup[]) => {
        setGroupsByProject(prev => ({ ...prev, [projectId]: groups }));
    };

    const toggleEdit = (projectId: number) => {
        setEditMode(prev => ({ ...prev, [projectId]: !prev[projectId] }));
    };

    const addGroup = (projectId: number) => {
        const current = getGroups(projectId);
        const newGroup: RoleGroup = { id: `g${Date.now()}`, name: '新小组', members: [] };
        setGroups(projectId, [...current, newGroup]);
    };

    const addMember = (projectId: number, groupId: string) => {
        const current = getGroups(projectId).map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    members: [...g.members, { name: '新成员', avatar: 'https://ui-avatars.com/api/?name=NM&background=random', role: '成员' }]
                };
            }
            return g;
        });
        setGroups(projectId, current);
    };

    const removeMember = (projectId: number, groupId: string, index: number) => {
        const current = getGroups(projectId).map(g => {
            if (g.id === groupId) {
                const list = [...g.members];
                list.splice(index, 1);
                return { ...g, members: list };
            }
            return g;
        });
        setGroups(projectId, current);
    };

    const renameGroup = (projectId: number, groupId: string, name: string) => {
        const current = getGroups(projectId).map(g => (g.id === groupId ? { ...g, name } : g));
        setGroups(projectId, current);
    };

    return (
        <div className="flex gap-8 h-full min-h-0 min-w-0">
            <div className="flex-1 space-y-8 overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-slate-200">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">项目与团队管理</h1>
                        <p className="text-slate-500 mt-2">管理您的所有项目进度与团队成员协作</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'projects'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                        >
                            我的项目
                        </button>
                        <button
                            onClick={() => setActiveTab('teams')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'teams'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                        >
                            我的团队
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                <div className="space-y-6">
                    {activeTab === 'projects' ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <LayoutGrid className="text-blue-500" size={24} />
                                    项目列表
                                </h2>
                                <button
                                    onClick={() => setIsProjectModalOpen(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    <Plus size={18} /> 新建项目
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                {displayProjects.map(project => {
                                    const pId = project.projectId || project.id;
                                    const isExpanded = expandedProjects[pId];
                                    const canEdit = !!editMode[pId];
                                    const groups = getGroups(pId);
                                    const projectTasks = tasks.filter(t => t.projectId === pId);
                                    const sortedTasks = [...projectTasks].sort((a, b) => {
                                        const dateA = a.completedAt || a.dueDate;
                                        const dateB = b.completedAt || b.dueDate;
                                        return new Date(dateB).getTime() - new Date(dateA).getTime();
                                    });

                                    return (
                                        <div
                                            key={project.id}
                                            className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-xl border-blue-200 ring-1 ring-blue-100' : 'shadow-sm border-slate-100 hover:shadow-md'
                                                }`}
                                        >
                                            {/* Project Card Header (Always Visible) */}
                                            <div
                                                onClick={() => toggleProjectExpand(pId)}
                                                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                            >
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                                                        <FolderPlus size={28} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-xl font-black text-slate-800">{project.name}</h3>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-widest ${project.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                                                }`}>
                                                                {project.status || 'Active'}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-500 text-sm line-clamp-1">{project.description}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">截止日期</span>
                                                        <span className="text-sm font-bold text-slate-700">{project.deadline}</span>
                                                    </div>
                                                    
                                                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-slate-50">
                                                    <div className="flex justify-end items-center gap-3 py-6 flex-wrap">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => toggleEdit(pId)}
                                                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${canEdit ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                                            >
                                                                {canEdit ? '完成' : '编辑分工'}
                                                            </button>
                                                            {canEdit && (
                                                                <button
                                                                    onClick={() => addGroup(pId)}
                                                                    className="px-4 py-2 bg-white text-blue-600 font-bold rounded-xl border border-blue-200 hover:bg-blue-50 transition-all text-sm"
                                                                >
                                                                    添加小组
                                                                </button>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => handleCreateTask(pId, e)}
                                                            className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all flex items-center gap-2 text-sm"
                                                        >
                                                            <Plus size={18} /> 发布任务
                                                        </button>
                                                    </div>

                                                    {/* Project Roles Division */}
                                                    <div className="mb-8">
                                                        <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                                            <UsersIcon size={20} className="text-indigo-500" />
                                                            项目分工
                                                        </h4>
                                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                {groups.map(group => (
                                                                    <div key={group.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
                                                                            {canEdit ? (
                                                                                <input
                                                                                    value={group.name}
                                                                                    onChange={(e) => renameGroup(pId, group.id, e.target.value)}
                                                                                    className="font-bold text-slate-700 text-sm bg-transparent border border-transparent focus:border-blue-200 rounded px-1 -mx-1 outline-none"
                                                                                    placeholder="小组名称"
                                                                                />
                                                                            ) : (
                                                                                <h5 className="font-bold text-slate-700 text-sm">{group.name}</h5>
                                                                            )}
                                                                            <span className="bg-slate-50 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                                                {group.members.length}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {group.members.map((member, idx) => (
                                                                                <div key={idx} className="flex items-center justify-between gap-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-lg bg-slate-100" />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-xs font-bold text-slate-700">{member.name}</span>
                                                                                            <span className="text-[8px] font-bold text-slate-400 uppercase">{member.role}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    {canEdit && (
                                                                                        <button
                                                                                            onClick={() => removeMember(pId, group.id, idx)}
                                                                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200"
                                                                                        >
                                                                                            <X size={12} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {canEdit && (
                                                                            <button
                                                                                onClick={() => addMember(pId, group.id)}
                                                                                className="w-full py-2 mt-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-xs font-bold hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/50 transition-all"
                                                                            >
                                                                                添加成员
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Project Timeline & Tasks */}
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                                            <Clock size={20} className="text-blue-500" />
                                                            任务时间线 ({projectTasks.length})
                                                        </h4>
                                                        
                                                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pl-8 py-2">
                                                            {sortedTasks.length === 0 ? (
                                                                <div className="text-slate-400 text-sm italic py-4">暂无任务动态</div>
                                                            ) : (
                                                                sortedTasks.map((task, index) => {
                                                                    const assignee = users.find(u => (u.userId || u.id) === task.assigneeId);
                                                                    const date = task.completedAt || task.dueDate;
                                                                    const dateObj = new Date(date);
                                                                    const formattedDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                                                                    
                                                                    return (
                                                                        <div key={task.id} className="relative group cursor-pointer" onClick={() => setSelectedTask(task)}>
                                                                            <div className="absolute -left-[41px] top-3 w-4 h-4 rounded-full border-2 border-white bg-slate-200 group-hover:bg-blue-500 transition-colors shadow-sm"></div>
                                                                            
                                                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between gap-4">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden border border-white shadow-sm">
                                                                                        <img src={assignee?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="" className="w-full h-full object-cover" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-sm font-bold text-slate-800">{task.title}</span>
                                                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                                                                                task.status === TaskStatus.DONE ? 'bg-emerald-50 text-emerald-600' :
                                                                                                task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600' :
                                                                                                'bg-slate-50 text-slate-400'
                                                                                            }`}>
                                                                                                {task.status}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                                                            <span className="font-bold">{assignee?.name || '待认领'}</span>
                                                                                            <span>•</span>
                                                                                            <span>{formattedDate}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <ChevronRight size={16} className="text-slate-300" />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    <UsersIcon className="text-indigo-500" size={24} />
                                    团队列表
                                </h2>
                                <button
                                    onClick={() => setIsTeamModalOpen(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    <Plus size={18} /> 新建团队
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                {displayTeams.map(team => {
                                    const tId = team.teamId || team.id;
                                    const isExpanded = expandedTeams[tId];
                                    const creator = resolveUser(team.creatorId || team.ownerId);
                                    const adminIds = team.adminIds || [];
                                    const memberIds = team.memberIds || [];

                                    return (
                                        <div key={team.id} className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-xl border-indigo-200 ring-1 ring-indigo-100' : 'shadow-sm border-slate-100 hover:shadow-md'}`}>
                                            {/* Team Card Header */}
                                            <div
                                                onClick={() => toggleTeamExpand(tId)}
                                                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                            >
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shrink-0">
                                                        <UsersIcon size={28} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-xl font-black text-slate-800">{team.name}</h3>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-widest bg-slate-50 text-slate-500">
                                                                团队
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-500 text-sm line-clamp-1">{team.description || '暂无团队描述'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">成员数</div>
                                                        <div className="text-sm font-bold text-slate-700">{memberIds.length}</div>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-slate-50">
                                                    <div className="mb-2">
                                                        <h4 className="text-lg font-black text-slate-800 mb-4">团队成员</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {memberIds.length === 0 && (
                                                                <>
                                                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between opacity-90">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-white shadow-sm">
                                                                                <img src="https://ui-avatars.com/api/?name=GL&background=random" alt="" className="w-full h-full object-cover" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-bold text-slate-700">管理员示例</span>
                                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ADMIN</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">管理员</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between opacity-90">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-white shadow-sm">
                                                                                <img src="https://ui-avatars.com/api/?name=CY&background=random" alt="" className="w-full h-full object-cover" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-bold text-slate-700">成员示例</span>
                                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MEMBER</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">成员</span>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                            {(() => {
                                                                const coreIds = [team.creatorId || team.ownerId, ...adminIds].filter(Boolean) as number[];
                                                                const uniqueCore = Array.from(new Set(coreIds));
                                                                const ordered = [...uniqueCore, ...memberIds.filter(id => !uniqueCore.includes(id))];
                                                                return ordered;
                                                            })().map((id, idx) => {
                                                                const user = resolveUser(id);
                                                                const isAdmin = adminIds.includes(id);
                                                                const isCreator = (team.creatorId || team.ownerId) === id;
                                                                return (
                                                                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-white shadow-sm">
                                                                                <img src={user?.avatar || 'https://ui-avatars.com/api/?name=U&background=random'} alt="" className="w-full h-full object-cover" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-bold text-slate-700">{user?.name || `用户#${id}`}</span>
                                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || '成员'}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            {isCreator && <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">创建者</span>}
                                                                            {isAdmin && <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">管理员</span>}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

            </div>

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                />
            )}

            {isProjectModalOpen && (
                <CreateProjectModal
                    onClose={() => setIsProjectModalOpen(false)}
                    onSubmit={async (data) => {
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
                    }}
                    teams={teams.map(t => ({ id: t.teamId || t.id, name: t.name }))}
                />
            )}

            {isTeamModalOpen && (
                <CreateTeamModal
                    onClose={() => setIsTeamModalOpen(false)}
                    onSubmit={async (data) => {
                        try {
                            const teamId = await TeamAPI.create(data);
                            const newTeam: Team = {
                                id: teamId,
                                teamId: teamId,
                                name: data.name,
                                description: data.description || '',
                                ownerId: state.currentUser?.userId || 0,
                                memberIds: [state.currentUser?.userId || 0],
                                adminIds: [state.currentUser?.userId || 0]
                            };
                            setState(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
                        } catch (e) {
                            alert('创建团队失败');
                        }
                    }}
                />
            )}

            {isTaskModalOpen && activeProjectId && (
                <CreateTaskModal
                    projectId={activeProjectId}
                    onClose={() => setIsTaskModalOpen(false)}
                    onSubmit={async (data) => {
                        try {
                            const taskId = await TaskAPI.create(data);
                            const newTask: Task = {
                                id: taskId,
                                taskId: taskId,
                                title: data.title,
                                description: data.description,
                                priority: data.priority,
                                status: TaskStatus.NOT_STARTED,
                                projectId: data.projectId,
                                dueDate: data.dueDate,
                                dependencies: [],
                                comments: []
                            };
                            setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
                        } catch (e) {
                            alert('创建任务失败');
                        }
                    }}
                />
            )}
        </div>
    );
};
