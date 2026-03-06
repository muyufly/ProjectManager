import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TaskPriority } from '../types';

interface CreateTaskModalProps {
    onClose: () => void;
    onSubmit: (data: { title: string; description: string; priority: TaskPriority; dueDate: string; projectId: number }) => Promise<void>;
    projectId: number;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onSubmit, projectId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({ title, description, priority, dueDate, projectId });
            onClose();
        } catch (error) {
            console.error(error);
            alert('创建任务失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">创建新任务</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">任务名称</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
                            placeholder="例如：设计首页UI"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">优先级</label>
                        <select
                            value={priority}
                            onChange={e => setPriority(e.target.value as TaskPriority)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
                        >
                            <option value={TaskPriority.LOW}>低</option>
                            <option value={TaskPriority.MEDIUM}>中</option>
                            <option value={TaskPriority.HIGH}>高</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">截止日期</label>
                        <input
                            type="date"
                            required
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">任务描述 (选填)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 resize-none"
                            placeholder="简述任务要求..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-colors"
                        >
                            {loading ? '创建中...' : '确认下发'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
