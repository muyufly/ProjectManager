import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { UserAPI, TeamAPI } from '../services/api';
import type { User } from '../types';

interface InviteMemberModalProps {
    teamId: number;
    teamName: string;
    onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ teamId, teamName, onClose }) => {
    const [keyword, setKeyword] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [inviting, setInviting] = useState<number[]>([]); // Track which userIds are being invited
    const [invited, setInvited] = useState<number[]>([]); // Track which userIds have been invited successfully

    const handleSearch = async () => {
        if (!keyword.trim()) return;
        setLoading(true);
        try {
            const res = await UserAPI.search(keyword, 1, 20);
            setUsers(res.items || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (userId: number) => {
        setInviting(prev => [...prev, userId]);
        try {
            await TeamAPI.invite({ teamId, userId });
            setInvited(prev => [...prev, userId]);
            // Optional: alert('已发送邀请');
        } catch (error) {
            console.error('Invite failed:', error);
            alert('邀请失败: ' + (error as Error).message);
        } finally {
            setInviting(prev => prev.filter(id => id !== userId));
        }
    };

    // Auto-search when keyword changes (with debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (keyword.trim()) {
                handleSearch();
            } else {
                setUsers([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword]);

    return (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-8 border-b border-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">邀请新成员</h2>
                        <p className="text-slate-400 text-sm mt-1 font-medium">邀请成员加入 <span className="text-blue-600 font-bold">{teamName}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-6 flex-1 flex flex-col min-h-0">
                    {/* Search Bar */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            autoFocus
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 font-medium"
                            placeholder="输入用户名、邮箱或部门搜索用户..."
                        />
                    </div>

                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto min-h-[300px] scrollbar-thin scrollbar-thumb-slate-100">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400 py-10">
                                <Loader2 size={32} className="animate-spin text-blue-500" />
                                <span className="font-bold text-sm tracking-widest uppercase">正在查找全球用户...</span>
                            </div>
                        ) : users.length > 0 ? (
                            <div className="space-y-3 pr-2">
                                {users.map(user => {
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
                                                    <div className="font-bold text-slate-700 truncate">{user.username}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.department || '普通成员'} · {user.role || '无备注'}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => !isInvited && !isInviting && handleInvite(uId)}
                                                disabled={isInviting || isInvited}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${isInvited
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : isInviting
                                                        ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed'
                                                        : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-100 active:scale-95'
                                                    }`}
                                            >
                                                {isInvited ? (
                                                    <>
                                                        <Mail size={14} /> 邮件已发送
                                                    </>
                                                ) : isInviting ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" /> 发送中
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail size={14} /> 发送邀请邮件
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : keyword.trim() ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 py-10 opacity-50">
                                <Search size={48} strokeWidth={1} />
                                <span className="font-bold text-sm tracking-wider uppercase">未找到匹配的用户</span>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 py-10 opacity-50">
                                <UserPlus size={48} strokeWidth={1} />
                                <span className="font-bold text-sm tracking-wider uppercase text-center max-w-[200px]">输入名称开始寻找你的团队精英</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-2xl text-slate-600 font-black hover:bg-white border border-transparent hover:border-slate-100 transition-all text-sm"
                    >
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
};
