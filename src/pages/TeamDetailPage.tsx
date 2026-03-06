import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../constants';
import { LeftPanel } from '../components/LeftPanel';
import type { User } from '../types';
import { Users, UserPlus, Shield, ShieldAlert, Trash2, LogOut } from 'lucide-react';
import { TeamAPI } from '../services/api';

export const TeamDetailPage: React.FC = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const { state, setState } = useContext(AppContext);
    const { teams, projects, users, currentUser } = state;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const tId = Number(teamId);
    const team = teams.find(t => t.id === tId || t.teamId === tId);
    const project = projects.find(p => p.teamId === tId);

    if (!team) return (
        <div className="flex-1 flex items-center justify-center text-slate-400">未找到团队</div>
    );

    const isOwner = currentUser?.userId === team.ownerId;
    const isAdmin = team.adminIds?.includes(currentUser?.userId || 0) || isOwner;

    const handleRemoveMember = async (memberId: number) => {
        if (!window.confirm('确定要移除该成员吗？')) return;
        setLoading(true);
        try {
            await TeamAPI.removeMember({ teamId: team.teamId || team.id, memberId });
            setState(prev => ({
                ...prev,
                teams: prev.teams.map(t =>
                    (t.id === tId || t.teamId === tId)
                        ? { ...t, memberIds: t.memberIds.filter(id => id !== memberId), adminIds: t.adminIds?.filter(id => id !== memberId) }
                        : t
                )
            }));
        } catch (e) {
            alert('移除失败');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAdmin = async (memberId: number, currentIsAdmin: boolean) => {
        setLoading(true);
        try {
            const apiCall = currentIsAdmin ? TeamAPI.removeAdmin : TeamAPI.addAdmin;
            await apiCall({ teamId: team.teamId || team.id, adminId: memberId });
            setState(prev => ({
                ...prev,
                teams: prev.teams.map(t =>
                    (t.id === tId || t.teamId === tId)
                        ? {
                            ...t,
                            adminIds: currentIsAdmin
                                ? t.adminIds?.filter(id => id !== memberId)
                                : [...(t.adminIds || []), memberId]
                        }
                        : t
                )
            }));
        } catch (e) {
            alert('操作失败');
        } finally {
            setLoading(false);
        }
    };

    const handleQuit = async () => {
        if (!window.confirm('确定要退出该团队吗？')) return;
        setLoading(true);
        try {
            await TeamAPI.quit({ teamId: team.teamId || team.id });
            setState(prev => ({
                ...prev,
                teams: prev.teams.filter(t => t.id !== tId && t.teamId !== tId)
            }));
            navigate('/');
        } catch (e) {
            alert('退出失败');
        } finally {
            setLoading(false);
        }
    };

    const getResponsibility = (user: User) => {
        if (user.department === '视觉设计') return '设计项目协作管理系统网页';
        if (user.role === 'Manager' || team.adminIds?.includes(user.userId || user.id)) return '项目整体统筹，进度追踪及需求分析。';
        return '前端开发，React组件实现及后端API对接。';
    };

    return (
        <div className="flex gap-6 h-full">
            <LeftPanel />

            <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-slate-200">

                {/* Header Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="bg-blue-100 px-6 py-2.5 rounded-xl shadow-sm w-fit inline-flex items-center gap-2">
                            <Users size={18} className="text-blue-600" />
                            <h2 className="text-xl font-bold text-slate-800">团队详情</h2>
                        </div>
                        <div className="flex gap-3">
                            {isAdmin && (
                                <button
                                    onClick={() => alert('请在“个人中心-搜索”中邀请新成员')}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-sm"
                                >
                                    <UserPlus size={18} /> 邀请成员
                                </button>
                            )}
                            <button
                                onClick={handleQuit}
                                className="px-4 py-2 border border-red-200 text-red-500 rounded-xl font-bold flex items-center gap-2 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={18} /> 退出团队
                            </button>
                        </div>
                    </div>

                    <div className="mt-2">
                        <div className="bg-white px-8 py-4 rounded-xl shadow-sm border border-slate-200 w-fit">
                            <h1 className="text-2xl font-bold text-slate-800">{team.name}</h1>
                            {team.description && <p className="text-slate-500 mt-1 text-sm">{team.description}</p>}
                        </div>
                    </div>
                </div>

                {/* Unified Card for Intro and Members */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* Project Introduction Section */}
                    {project && (
                        <>
                            <div className="p-8 md:p-10">
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                                        关联项目: {project.name}
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed text-base">
                                        {project.description}
                                        {project.requirements && <><br /><br />{project.requirements}</>}
                                    </p>
                                </div>
                            </div>
                            <div className="h-px bg-slate-100 mx-10"></div>
                        </>
                    )}

                    {/* Member List Section */}
                    <div className="p-8 md:p-10 pt-6">
                        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            团队成员 ({team.memberIds.length})
                        </h3>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">成员信息</th>
                                        <th className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">院系/职位</th>
                                        <th className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">负责内容</th>
                                        {isAdmin && <th className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider text-right">操作</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {team.memberIds.map(memberId => {
                                        const user = users.find(u => u.id === memberId || u.userId === memberId);
                                        if (!user) return null;

                                        const isUserOwner = user.userId === team.ownerId || user.id === team.ownerId;
                                        const isUserAdmin = team.adminIds?.includes(user.userId || user.id) || isUserOwner;

                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 flex items-center gap-1">
                                                                {user.name}
                                                                {isUserOwner && <ShieldAlert size={14} className="text-orange-500" />}
                                                                {isUserAdmin && !isUserOwner && <Shield size={14} className="text-blue-500" />}
                                                            </div>
                                                            <div className="text-xs text-slate-400">{user.role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-slate-600">
                                                    <div className="text-sm font-medium">{user.department || '开发部'}</div>
                                                    <div className="text-xs text-slate-400">{user.jobTitle || '开发者'}</div>
                                                </td>
                                                <td className="px-6 py-6 text-slate-500 text-sm italic">{getResponsibility(user)}</td>
                                                {isAdmin && (
                                                    <td className="px-6 py-6 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!isUserOwner && user.userId !== currentUser?.userId && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleToggleAdmin(user.userId || user.id, isUserAdmin)}
                                                                        className={`p-2 rounded-lg transition-colors ${isUserAdmin ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-200' : 'text-blue-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                                        title={isUserAdmin ? '取消管理员' : '设为管理员'}
                                                                    >
                                                                        <Shield size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRemoveMember(user.userId || user.id)}
                                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="移除成员"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
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