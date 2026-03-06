import React, { useState, useContext } from 'react';
import { X, Search, Loader2, Mail, Shield, Users, CheckCircle2 } from 'lucide-react';
import { ProjectAPI } from '../services/api';
import { AppContext } from '../constants';
import type { User } from '../types';

interface InviteProjectMemberModalProps {
    projectId: number;
    projectName: string;
    teamId: number;
    onClose: () => void;
}

export const InviteProjectMemberModal: React.FC<InviteProjectMemberModalProps> = ({ projectId, projectName, teamId, onClose }) => {
    const { state, refreshData } = useContext(AppContext);
    const [keyword, setKeyword] = useState('');
    const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'COLLABORATOR'>('COLLABORATOR');
    const [inviting, setInviting] = useState<number[]>([]);
    const [invited, setInvited] = useState<number[]>([]);

    // Filter team members from global state
    const team = state.teams.find(t => (t.teamId || t.id) === teamId);
    const teamMemberIds = team?.memberIds || [];

    // Get current project to check existing members
    const project = state.projects.find(p => (p.projectId || p.id) === projectId);
    const projectMemberIds = project?.memberIds || [];
    const currentUserId = state.currentUser?.userId || state.currentUser?.id;

    // Resolve full user objects for team members, EXCLUDING self and existing project members
    const teamMembers = teamMemberIds
        .filter(mid => mid !== currentUserId && !projectMemberIds.includes(mid))
        .map(mid => state.users.find(u => (u.userId || u.id) === mid))
        .filter((u): u is User => !!u);

    // Filter by keyword if any
    const filteredMembers = teamMembers.filter(u =>
        (u.username || u.name || '').toLowerCase().includes(keyword.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(keyword.toLowerCase())
    );

    const handleInvite = async (userId: number) => {
        setInviting(prev => [...prev, userId]);
        try {
            await ProjectAPI.invite({
                projectId,
                userId,
                role: selectedRole
            });
            setInvited(prev => [...prev, userId]);
            if (refreshData) await refreshData();
        } catch (error) {
            console.error('Invite failed:', error);
            alert('邀请失败: ' + (error as Error).message);
        } finally {
            setInviting(prev => prev.filter(id => id !== userId));
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-8 border-b border-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">邀请项目成员</h2>
                        <p className="text-slate-400 text-sm mt-1 font-medium italic">来自团队所有可见成员</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-6 flex-1 flex flex-col min-h-0">
                    {/* Role Selection */}
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                        <button
                            onClick={() => setSelectedRole('COLLABORATOR')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${selectedRole === 'COLLABORATOR'
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100'
                                : 'text-slate-400 hover:bg-white/50'
                                }`}
                        >
                            <Users size={16} /> COLLABORATOR (协作)
                        </button>
                        <button
                            onClick={() => setSelectedRole('MANAGER')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${selectedRole === 'MANAGER'
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100'
                                : 'text-slate-400 hover:bg-white/50'
                                }`}
                        >
                            <Shield size={16} /> MANAGER (经理)
                        </button>
                    </div>

                    {/* Search Bar within team members */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 font-medium"
                            placeholder="在团队中筛选成员..."
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-[300px] scrollbar-thin scrollbar-thumb-slate-100">
                        <div className="space-y-3 pr-2">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map(user => {
                                    const uId = user.userId || user.id;
                                    const isInviting = inviting.includes(uId);
                                    const isInvited = invited.includes(uId);

                                    return (
                                        <div key={uId} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/10 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 p-0.5 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-700 truncate">{user.username || user.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.department || '团队成员'}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => !isInvited && !isInviting && handleInvite(uId)}
                                                disabled={isInviting || isInvited}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${isInvited
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : isInviting
                                                        ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed'
                                                        : selectedRole === 'MANAGER'
                                                            ? 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-95'
                                                            : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95'
                                                    }`}
                                            >
                                                {isInvited ? (
                                                    <><CheckCircle2 size={14} /> 已在项目中</>
                                                ) : isInviting ? (
                                                    <><Loader2 size={14} className="animate-spin" /></>
                                                ) : (
                                                    <><Mail size={14} /> 确认邀请</>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 py-20 opacity-50">
                                    <Users size={48} strokeWidth={1} />
                                    <span className="font-bold text-sm tracking-widest uppercase text-center">暂无符合条件的团队成员</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center text-xs text-slate-400 font-bold">
                    <span>* 仅显示同一团队内的成员</span>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-2xl text-slate-600 font-black hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                    >
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
};
