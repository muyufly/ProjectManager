import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../constants';
import { LeftPanel } from '../components/LeftPanel';
import { ProjectAPI, UserAPI } from '../services/api';
import { UserPlus, Settings, Users, FolderOpen, MoreVertical, Shield, Trash2, Edit3, Plus, X, Check } from 'lucide-react';
import { showAlert, showPrompt, showError } from '../components/Dialog';
import type { Project, User } from '../types';

export const ProjectDetailPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { state, setState } = useContext(AppContext);
    const { projects, users, currentUser } = state;
    const navigate = useNavigate();

    const pId = Number(projectId);
    const project = projects.find(p => p.id === pId || p.projectId === pId);

    const [groups, setGroups] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'members' | 'groups'>('members');
    const [loading, setLoading] = useState(false);

    // 编辑状态
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editError, setEditError] = useState<string | null>(null);

    // 项目成员列表
    const [projectMembers, setProjectMembers] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!project) return;
            try {
                // 获取项目成员列表（用于判断权限）
                const membersRes = await ProjectAPI.listMember(project.projectId || project.id);
                const members = membersRes.data?.items || membersRes.items || [];
                setProjectMembers(members);

                const groupsRes = await ProjectAPI.listGroup(project.projectId || project.id);
                setGroups(groupsRes.items || []);
            } catch (e) {
                console.error('Failed to fetch project details', e);
            }
        };
        fetchData();
    }, [pId]);

    if (!project) return (
        <div className="flex gap-6 h-full">
            <LeftPanel />
            <div className="flex-1 flex items-center justify-center text-slate-400">未找到项目</div>
        </div>
    );

    // 判断当前用户是否是项目创建者/管理员
    const currentUserId = currentUser?.userId || currentUser?.id;
    
    // 从项目成员列表中查找当前用户的角色
    const currentUserMember = projectMembers.find(m => m.userId === currentUserId);
    const isProjectManager = currentUserMember?.role === 'MANAGER' || currentUserMember?.role === '管理员';
    
    const isManager = project ? (
        isProjectManager ||
        currentUser?.role === '管理员' || 
        currentUser?.role === 'MANAGER'
    ) : false;

    const handleCreateGroup = async () => {
        const name = await showPrompt('新建角色组', '请输入新角色组名称:', '角色组名称');
        if (!name) return;
        try {
            const groupId = await ProjectAPI.createGroup({
                projectId: project.projectId || project.id,
                name
            });
            setGroups(prev => [...prev, { roleGroupId: groupId, name, projectId: project.projectId || project.id }]);
            await showAlert('创建成功', `角色组 "${name}" 创建成功`, 'success');
        } catch (e: any) {
            await showError(e?.message || '创建角色组失败');
        }
    };

    // 开始编辑
    const handleStartEdit = () => {
        setEditName(project.name);
        setEditDescription(project.description || '');
        setEditError(null);
        setIsEditing(true);
    };

    // 取消编辑
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditError(null);
    };

    // 保存编辑
    const handleSaveEdit = async () => {
        if (!editName.trim()) {
            setEditError('项目名称不能为空');
            return;
        }
        setLoading(true);
        setEditError(null);
        try {
            await ProjectAPI.edit({
                projectId: project.projectId || project.id,
                name: editName.trim(),
                description: editDescription.trim()
            });
            // 更新本地状态
            setState(prev => ({
                ...prev,
                projects: prev.projects.map(p =>
                    (p.id === pId || p.projectId === pId)
                        ? { ...p, name: editName.trim(), description: editDescription.trim() }
                        : p
                )
            }));
            setIsEditing(false);
        } catch (error: any) {
            const errorMessage = error?.message || error?.response?.data?.message || '编辑项目失败，请稍后重试';
            setEditError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-6 h-full">
            <LeftPanel />

            <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 pb-10 scrollbar-thin scrollbar-thumb-slate-200">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="bg-indigo-100 px-6 py-2.5 rounded-xl shadow-sm w-fit inline-flex items-center gap-2">
                            <FolderOpen size={18} className="text-indigo-600" />
                            <h2 className="text-xl font-bold text-slate-800">项目详情</h2>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate(`/tasks/${project.projectId || project.id}`)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md"
                            >
                                <Users size={18} /> 查看任务
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                        
                        {/* 编辑按钮 */}
                        {!isEditing && isManager && (
                            <button
                                onClick={handleStartEdit}
                                className="absolute top-6 right-6 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-all z-20 flex items-center gap-2 shadow-sm border border-slate-200 font-bold"
                                title="编辑项目"
                            >
                                <Edit3 size={18} /> 编辑项目
                            </button>
                        )}
                        
                        <div className="relative z-10">
                            {isEditing ? (
                                // 编辑表单
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">项目名称</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-lg font-bold text-slate-800"
                                            placeholder="输入项目名称"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">项目描述</label>
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm text-slate-600 resize-none"
                                            rows={3}
                                            placeholder="输入项目描述"
                                        />
                                    </div>
                                    
                                    {/* 错误信息 */}
                                    {editError && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                                            <X size={16} />
                                            <span>{editError}</span>
                                        </div>
                                    )}
                                    
                                    {/* 操作按钮 */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-2"
                                            disabled={loading}
                                        >
                                            <X size={18} /> 取消
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    保存中...
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={18} /> 保存
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // 展示模式
                                <>
                                    <h1 className="text-3xl font-black text-slate-800 mb-2">{project.name}</h1>
                                    <p className="text-slate-500 max-w-2xl">{project.description}</p>
                                    <div className="flex gap-6 mt-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">状态</span>
                                            <span className="text-sm font-bold text-emerald-500">{project.status}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex border-b border-slate-100 px-4">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`px-6 py-5 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'members' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                        >
                            <Users size={18} /> 项目成员
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`px-6 py-5 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'groups' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                        >
                            <Shield size={18} /> 角色组
                        </button>
                    </div>

                    <div className="p-8">
                        {activeTab === 'members' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {project.memberIds.map(mid => {
                                    const user = users.find(u => u.id === mid || u.userId === mid);
                                    if (!user) return null;
                                    return (
                                        <div key={mid} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:shadow-md hover:border-indigo-200 transition-all group">
                                            <img src={user.avatar} className="w-12 h-12 rounded-full ring-2 ring-white shadow-sm" alt="" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-slate-800 truncate">{user.name}</div>
                                                <div className="text-xs text-slate-400 truncate">{user.department}</div>
                                            </div>
                                            {project.managerId === mid && (
                                                <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">
                                                    <Shield size={16} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <button className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold">
                                    <UserPlus size={24} />
                                    <span className="text-sm">添加成员</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">所有角色组 ({groups.length})</h3>
                                    <button
                                        onClick={handleCreateGroup}
                                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={14} /> 新建角色组
                                    </button>
                                </div>
                                {groups.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 italic">
                                        暂无角色组，点击右侧按钮创建。
                                    </div>
                                ) : (
                                    groups.map(group => (
                                        <div key={group.roleGroupId} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 font-black">
                                                    {group.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{group.name}</div>
                                                    <div className="text-xs text-slate-400">ID: #{group.roleGroupId} | 分配人数: 0</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="编辑">
                                                    <Edit3 size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="删除">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
