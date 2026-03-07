import React, { useState } from 'react';
import { X, Search, Check, User as UserIcon } from 'lucide-react';
import { User, Task } from '../types';

interface AssignTaskModalProps {
    task: Task;
    users: User[];
    onClose: () => void;
    onSubmit: (data: { taskId: number; projectId: number; userId: number }) => Promise<void>;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ task, users, onClose, onSubmit }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(task.assigneeId || null);
    const [loading, setLoading] = useState(false);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!selectedUserId) return;
        setLoading(true);
        try {
            await onSubmit({
                taskId: task.id || task.taskId || 0,
                projectId: task.projectId || 0,
                userId: selectedUserId
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('分配任务失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-[110] p-4 text-left">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-8 border-b border-slate-50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">分配负责人</h2>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Assign responsible member</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 pb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="搜索成员姓名或用户名..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-slate-800 shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic">未找到匹配成员</div>
                    ) : (
                        filteredUsers.map(u => {
                            const isSelected = selectedUserId === u.id || selectedUserId === u.userId;
                            return (
                                <div
                                    key={u.id || u.userId}
                                    onClick={() => setSelectedUserId(u.userId || u.id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-50' : 'border-slate-50 hover:bg-slate-50 hover:border-slate-100'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm">
                                            <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm leading-tight">{u.name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{u.role}</div>
                                        </div>
                                    </div>
                                    {isSelected && <div className="bg-blue-600 text-white p-1 rounded-lg"><Check size={14} /></div>}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-8 pt-4 border-t border-slate-50 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-4 rounded-2xl border border-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedUserId}
                        className="py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                        {loading ? '保存中...' : '确认分配'}
                    </button>
                </div>
            </div>
        </div>
    );
};
