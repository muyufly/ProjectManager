import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Task, TaskPriority } from '../types';

interface EditTaskModalProps {
    task: Task;
    onClose: () => void;
    onSubmit: (data: {
        taskId: number;
        title: string;
        description: string;
        priority: TaskPriority;
        dueAt: string;
        startAt?: string;
        currentOwnerUserId?: number
    }) => Promise<void>;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onSubmit }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState<TaskPriority>(task.priority);
    const stripTime = (dateStr?: string) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
    };
    // 兼容后端返回的两种字段名
    const [dueAt, setDueAt] = useState(stripTime(task.dueAt || task.dueDate));
    const [startAt, setStartAt] = useState(stripTime(task.startAt));
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 格式化日期为 2026-03-25T00:00:00.000000Z
        const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            // 如果已经是长格式则不处理
            if (dateStr.includes('T')) return dateStr;
            return `${dateStr}T00:00:00.000000Z`;
        };

        try {
            await onSubmit({
                taskId: task.id || task.taskId || 0,
                title,
                description,
                priority,
                dueAt: formatDate(dueAt),
                startAt: formatDate(startAt),
                currentOwnerUserId: task.assigneeId
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('编辑任务失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-[110] p-4 text-left">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-8 border-b border-slate-50">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">编辑任务</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">任务名称</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">优先级</label>
                        <select
                            value={priority}
                            onChange={e => setPriority(e.target.value as TaskPriority)}
                            className="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-slate-800"
                        >
                            <option value={TaskPriority.LOW}>低 (Low)</option>
                            <option value={TaskPriority.MEDIUM}>中 (Medium)</option>
                            <option value={TaskPriority.HIGH}>高 (High)</option>
                            <option value={TaskPriority.URGENT}>紧急 (Urgent)</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">开始日期</label>
                            <input
                                type="date"
                                value={startAt}
                                onChange={e => setStartAt(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">截止日期</label>
                            <input
                                type="date"
                                required
                                value={dueAt}
                                onChange={e => setDueAt(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-slate-800"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">任务描述</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-5 py-3 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-600 resize-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {loading ? '保存中...' : '确认更新'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
