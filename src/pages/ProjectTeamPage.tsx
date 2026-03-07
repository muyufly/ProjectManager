import React, { useContext, useState } from 'react';
import { AppContext } from '../constants';
import { LayoutGrid, Users as UsersIcon, FolderPlus, Plus, ArrowRight, ChevronDown, ChevronUp, Clock, ChevronRight, X, Trash2, LogOut, XCircle, ShieldAlert, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project, Team, Task } from '../types';
import { TaskStatus } from '../types';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { TaskAPI, ProjectAPI, TeamAPI } from '../services/api';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { InviteProjectMemberModal } from '../components/InviteProjectMemberModal';
import { UserPlus } from 'lucide-react';

// Role Groups (Real backend data)
interface RoleGroup {
    roleGroupId: number;
    name: string;
    description: string;
    members: any[]; // User objects from listGroupMember
}

export const ProjectTeamPage: React.FC = () => {
    const { state, setState, refreshData } = useContext(AppContext);
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
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteTeam, setInviteTeam] = useState<{ id: number, name: string } | null>(null);
    const [isProjectInviteModalOpen, setIsProjectInviteModalOpen] = useState(false);
    const [inviteProject, setInviteProject] = useState<{ id: number, name: string } | null>(null);

    // Use state data
    const displayProjects = state.projects;
    const displayTeams = state.teams;

    const fetchGroupsForProject = async (projectId: number) => {
        try {
            const res = await ProjectAPI.listGroup(projectId);
            if (res.items) {
                const groupsWithMembers = await Promise.all(res.items.map(async (group: any) => {
                    const mRes = await ProjectAPI.listGroupMember(group.roleGroupId);
                    return {
                        ...group,
                        members: mRes.items || []
                    };
                }));
                setGroupsByProject(prev => ({ ...prev, [projectId]: groupsWithMembers }));
            }
        } catch (e) {
            console.error('Failed to fetch groups', e);
        }
    };

    const toggleProjectExpand = async (projectId: number) => {
        const isCurrentlyExpanded = expandedProjects[projectId];
        if (!isCurrentlyExpanded) {
            await fetchGroupsForProject(projectId);
        }
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

    const handleManageAdmin = async (team: Team, requestMemberId: number, currentIsAdmin: boolean, targetUserId: number) => {
        const myId = Number(state.currentUser?.userId || state.currentUser?.id || 0);
        const ownerId = Number(team.creatorId || team.ownerId || 0);
        const isCreatorOfTeam = myId > 0 && myId === ownerId;

        if (!isCreatorOfTeam) {
            alert('只有项目团队创建者才有权更改管理员身份');
            return;
        }

        // Skip if target is the creator/owner (they can't be modified)
        if (targetUserId === ownerId) {
            alert('无法更改创建者的自身权限');
            return;
        }

        const action = currentIsAdmin ? '移除管理员权限' : '设为管理员';
        if (!window.confirm(`确认将该成员${action}吗？`)) return;

        try {
            const tId = Number(team.teamId || team.id);
            if (currentIsAdmin) {
                await TeamAPI.removeAdmin({ teamId: tId, memberId: requestMemberId });
            } else {
                await TeamAPI.addAdmin({ teamId: tId, memberId: requestMemberId });
            }
            if (refreshData) await refreshData();
        } catch (e: any) {
            console.error('ManageAdmin failed:', e);
            alert(`操作失败: ${e.message}`);
        }
    };

    const handleRemoveMember = async (team: Team, memberId: number) => {
        if (!window.confirm('确认将该成员移出团队吗？')) return;
        try {
            await TeamAPI.removeMember({ teamId: Number(team.id || team.teamId), memberId });
            if (refreshData) await refreshData();
        } catch (e: any) {
            alert(`移除失败: ${e.message}`);
        }
    };

    const handleQuitTeam = async (teamId: number) => {
        if (!window.confirm('确认退出该团队吗？退出后将无法查看内部项目。')) return;
        try {
            await TeamAPI.quit({ teamId });
            if (refreshData) await refreshData();
        } catch (e: any) {
            alert(`退出失败: ${e.message}`);
        }
    };

    const handleDisbandTeam = async (teamId: number) => {
        if (!window.confirm('【确认 1/3】您真的要解散这个团队吗？所有数据将永久清除。')) return;
        const confirmText = window.prompt('【确认 2/3】解散团队不可撤销，请手动输入“解散团队”以确认');
        if (confirmText !== '解散团队') return;
        if (!window.confirm('【确认 3/3】最后一次机会：真的要彻底删除所有相关数据吗？')) return;

        try {
            await TeamAPI.disband({ teamId });
            if (refreshData) await refreshData();
        } catch (e: any) {
            alert(`解散失败: ${e.message}`);
        }
    };

    const resolveUser = (id?: number | string) => {
        if (!id) return undefined;
        // Search by userId or id (loose equality for string/number mix)
        const user = users.find(u => u.userId == id || u.id == id);
        if (user) return user;
        // Fallback for cases where id might be missing but we have more info elsewhere
        return undefined;
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

    const handleAddGroup = async (projectId: number) => {
        const name = window.prompt('请输入新的小组/角色组名称', '开发组');
        if (!name) return;
        try {
            await ProjectAPI.createGroup({ projectId, name });
            await fetchGroupsForProject(projectId);
        } catch (e: any) {
            alert(`创建失败: ${e.message}`);
        }
    };

    const handleRenameGroup = async (projectId: number, group: RoleGroup, newName: string) => {
        if (!newName || newName === group.name) return;
        try {
            await ProjectAPI.editGroup({ groupId: group.roleGroupId, name: newName });
            await fetchGroupsForProject(projectId);
        } catch (e: any) {
            alert(`重命名失败: ${e.message}`);
        }
    };

    const handleDeleteGroup = async (projectId: number, groupId: number) => {
        if (!window.confirm('确认删除该小组吗？')) return;
        try {
            await ProjectAPI.deleteGroup({ roleGroupId: groupId });
            await fetchGroupsForProject(projectId);
        } catch (e: any) {
            alert(`删除失败: ${e.message}`);
        }
    };

    const handleAddMemberToGroup = async (projectId: number, group: RoleGroup) => {
        const project = displayProjects.find(p => (p.projectId || p.id) === projectId);
        const memberIds = (project as any)?.memberIds || [];

        if (memberIds.length === 0) {
            alert('项目暂无成员可以添加，请先在团队中邀请或在项目中管理成员');
            return;
        }

        const selectableMembers = memberIds.map((mid: number) => {
            const u = resolveUser(mid);
            return u ? `${u.userId || u.id}: ${u.name}` : `用户#${mid}`;
        });

        const choice = window.prompt(`请选择要加入小组的成员ID:\n${selectableMembers.join('\n')}`);
        if (!choice) return;

        const targetUserId = parseInt(choice);
        if (isNaN(targetUserId)) {
            alert('无效的用户ID');
            return;
        }

        try {
            await ProjectAPI.addGroupMember({ groupId: group.roleGroupId, userId: targetUserId });
            await fetchGroupsForProject(projectId);
        } catch (e: any) {
            alert(`添加失败: ${e.message}`);
        }
    };

    const handleRemoveMemberFromGroup = async (projectId: number, groupId: number, userId: number) => {
        if (!window.confirm('确认将该成员从小组中移除吗？')) return;
        try {
            await ProjectAPI.removeGroupMember({ groupId, userId });
            await fetchGroupsForProject(projectId);
        } catch (e: any) {
            alert(`移除失败: ${e.message}`);
        }
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

                                                <div className="flex items-center gap-4">
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
                                                                    onClick={() => handleAddGroup(pId)}
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

                                                    {/* Project Members Section */}
                                                    <div className="mb-8 text-left">
                                                        <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                                            <UsersIcon size={20} className="text-blue-500" />
                                                            项目成员
                                                        </h4>
                                                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                                            <div className="flex flex-wrap gap-4">
                                                                {(project as any).memberIds?.map((mId: number) => {
                                                                    const u = resolveUser(mId);
                                                                    if (!u) return null;
                                                                    return (
                                                                        <div key={mId} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
                                                                            <img src={u.avatar} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />
                                                                            <span className="text-sm font-bold text-slate-700">{u.name}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                                <button
                                                                    onClick={() => {
                                                                        setInviteProject({ id: pId, name: project.name });
                                                                        setIsProjectInviteModalOpen(true);
                                                                    }}
                                                                    className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-dashed border-blue-200 text-blue-600 hover:bg-blue-100 transition-all text-sm font-bold"
                                                                >
                                                                    <UserPlus size={16} />
                                                                    邀请成员
                                                                </button>
                                                            </div>
                                                        </div>
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
                                                                    <div key={group.roleGroupId} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative group/card">
                                                                        {canEdit && (
                                                                            <button
                                                                                onClick={() => handleDeleteGroup(pId, group.roleGroupId)}
                                                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 transition-all"
                                                                                title="删除小组"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
                                                                            {canEdit ? (
                                                                                <input
                                                                                    defaultValue={group.name}
                                                                                    onBlur={(e) => handleRenameGroup(pId, group, e.target.value)}
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
                                                                            {group.members.map((m, idx) => {
                                                                                const u = resolveUser(m.userId);
                                                                                return (
                                                                                    <div key={idx} className="flex items-center justify-between gap-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <img src={u?.avatar || `https://ui-avatars.com/api/?name=U&background=random`} alt="" className="w-6 h-6 rounded-lg bg-slate-100" />
                                                                                            <div className="flex flex-col">
                                                                                                <span className="text-xs font-bold text-slate-700">{u?.name || u?.username || `用户#${m.userId}`}</span>
                                                                                                <span className="text-[8px] font-bold text-slate-400 uppercase">{m.role}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                        {canEdit && (
                                                                                            <button
                                                                                                onClick={() => handleRemoveMemberFromGroup(pId, group.roleGroupId, m.userId)}
                                                                                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200"
                                                                                            >
                                                                                                <X size={12} />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                        {canEdit && (
                                                                            <button
                                                                                onClick={() => handleAddMemberToGroup(pId, group)}
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
                                                                        <div key={task.id} className="relative group">
                                                                            <div className="absolute -left-[41px] top-3 w-4 h-4 rounded-full border-2 border-white bg-slate-200 group-hover:bg-blue-500 transition-colors shadow-sm"></div>

                                                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden border border-white shadow-sm">
                                                                                        <img src={assignee?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="" className="w-full h-full object-cover" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-sm font-bold text-slate-800">{task.title}</span>
                                                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${task.status === TaskStatus.DONE ? 'bg-emerald-50 text-emerald-600' :
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
                                    const myId = Number(state.currentUser?.userId || state.currentUser?.id || 0);
                                    const tId = Number(team.teamId || team.id);
                                    const isExpanded = expandedTeams[tId];
                                    const ownerId = Number(team.creatorId || team.ownerId || 0);
                                    const adminIds = (team.adminIds || []).map(id => Number(id));
                                    const memberIds = (team.memberIds || []).map(id => Number(id));
                                    const isTeamAdmin = (myId > 0) && (adminIds.includes(myId) || (ownerId === myId));

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
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setInviteTeam({ id: tId, name: team.name });
                                                                setIsInviteModalOpen(true);
                                                            }}
                                                            className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                            title="邀请成员"
                                                        >
                                                            <UserPlus size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleQuitTeam(tId);
                                                            }}
                                                            className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="退出团队"
                                                        >
                                                            <LogOut size={18} />
                                                        </button>
                                                        {Number(team.creatorId || team.ownerId) === Number(state.currentUser?.userId) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDisbandTeam(tId);
                                                                }}
                                                                className="p-3 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all"
                                                                title="解散团队"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-4 duration-300 border-t border-slate-50 text-left">
                                                    <div className="mb-2">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-lg font-black text-slate-800">团队成员</h4>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {memberIds.length === 0 && (
                                                                <div className="col-span-full py-10 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                                                    <div className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-2">暂无团队成员</div>
                                                                    <div className="text-slate-300 text-xs">点击上方图标邀请成员加入</div>
                                                                </div>
                                                            )}
                                                            {(() => {
                                                                const ownerId = Number(team.creatorId || team.ownerId);
                                                                const adminNums = (adminIds || []).map(id => Number(id));
                                                                const memberNums = (memberIds || []).map(id => Number(id));

                                                                // Primary source is memberNums. Sort them: Owner first, then Admins.
                                                                return memberNums.sort((a, b) => {
                                                                    if (a === ownerId) return -1;
                                                                    if (b === ownerId) return 1;
                                                                    const aIsAdmin = adminNums.includes(a);
                                                                    const bIsAdmin = adminNums.includes(b);
                                                                    if (aIsAdmin && !bIsAdmin) return -1;
                                                                    if (!aIsAdmin && bIsAdmin) return 1;
                                                                    return 0;
                                                                });
                                                            })().map((id, idx) => {
                                                                const user = resolveUser(id);
                                                                const isAdmin = (adminIds || []).some(aid => Number(aid) === Number(id)) || user?.teamRole === 'ADMIN' || user?.teamRole === 'MANAGER';
                                                                const isCreator = (Number(team.creatorId || team.ownerId || 0) === Number(id)) || user?.teamRole === 'CREATOR';
                                                                if (!id && !user) return null;
                                                                return (
                                                                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-white shadow-sm">
                                                                                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=random`} alt="" className="w-full h-full object-cover" />
                                                                            </div>
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-bold text-slate-700">{user?.name || user?.username || `用户#${id}`}</span>
                                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || (isAdmin ? '管理员' : '成员')}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {(() => {
                                                                                const role = isCreator ? 'CREATOR' : (isAdmin ? 'ADMIN' : (user?.teamRole || 'MEMBER'));
                                                                                const roleMap: Record<string, { label: string, color: string, bg: string, border: string }> = {
                                                                                    'CREATOR': { label: '创建者', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                                                                                    'ADMIN': { label: '管理员', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                                                                                    'MANAGER': { label: '管理员', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                                                                                    'MEMBER': { label: '成员', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' }
                                                                                };
                                                                                const s = roleMap[role as string] || roleMap['MEMBER'];
                                                                                const myId = Number(state.currentUser?.userId || state.currentUser?.id || 0);
                                                                                const amICreator = (myId > 0) && Number(team.creatorId || team.ownerId || 0) === myId;
                                                                                const amIAdmin = (myId > 0) && (adminIds.includes(myId) || amICreator);

                                                                                const targetRequestMemberId = Number(user?.memberId || id);

                                                                                return (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span
                                                                                            className={`text-[10px] font-black ${s.color} ${s.bg} border ${s.border} px-2 py-0.5 rounded ${amICreator ? 'cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md' : ''}`}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleManageAdmin(team, targetRequestMemberId, isAdmin, id);
                                                                                            }}
                                                                                            title={amICreator ? "点击切换管理员权限" : ""}
                                                                                        >
                                                                                            {s.label}
                                                                                        </span>
                                                                                        {((amICreator || amIAdmin) && id !== myId && !isCreator) && (
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleRemoveMember(team, targetRequestMemberId);
                                                                                                }}
                                                                                                className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                                                                                title="移出团队"
                                                                                            >
                                                                                                <UserMinus size={14} />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()}
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

            {isProjectInviteModalOpen && inviteProject && (
                <InviteProjectMemberModal
                    projectId={inviteProject.id}
                    projectName={inviteProject.name}
                    teamId={displayProjects.find(p => (p.projectId || p.id) === inviteProject.id)?.teamId || 0}
                    onClose={() => {
                        setIsProjectInviteModalOpen(false);
                        setInviteProject(null);
                        refreshData?.();
                    }}
                />
            )}

            {isTeamModalOpen && (
                <CreateTeamModal
                    onClose={() => setIsTeamModalOpen(false)}
                    onSubmit={async (data) => {
                        try {
                            const teamId = await TeamAPI.create(data);

                            // Immediately fetch actual members to sync state with backend
                            const membersRes = await TeamAPI.members(teamId);
                            const actualMembers = Array.isArray(membersRes) ? membersRes : [];

                            const memberIds = actualMembers.map((m: any) => m.userId || m.id);
                            const adminIds = actualMembers
                                .filter((m: any) => m.teamRole === 'CREATOR' || m.teamRole === 'ADMIN' || m.teamRole === 'MANAGER')
                                .map((m: any) => m.userId || m.id);

                            const newTeam: Team = {
                                id: teamId,
                                teamId: teamId,
                                name: data.name,
                                description: data.description || '',
                                ownerId: state.currentUser?.userId || state.currentUser?.id || 0,
                                memberIds: memberIds.length > 0 ? memberIds : [state.currentUser?.userId || state.currentUser?.id || 0],
                                adminIds: adminIds.length > 0 ? adminIds : [state.currentUser?.userId || state.currentUser?.id || 0]
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

            {isInviteModalOpen && inviteTeam && (
                <InviteMemberModal
                    teamId={inviteTeam.id}
                    teamName={inviteTeam.name}
                    onClose={() => {
                        setIsInviteModalOpen(false);
                        setInviteTeam(null);
                    }}
                />
            )}
        </div>
    );
};
