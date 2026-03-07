import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface CreateProjectModalProps {
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; teamId: number }) => Promise<void>;
    teams: { id: number; name: string }[];
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onSubmit, teams }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const [teamId, setTeamId] = useState(teams[0]?.id || 0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onSubmit({ name, description, teamId });
            onClose();
        } catch (error: any) {
            console.error(error);
            // 提取具体的错误信息
            const errorMessage = error?.message || error?.response?.data?.message || '创建项目失败，请稍后重试';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-800/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">创建新项目</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">项目名称</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
                            placeholder="例如：官网重构工作组"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">所属团队</label>
                        <select
                            required
                            value={teamId}
                            onChange={e => setTeamId(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
                        >
                            {teams.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">项目简介 (选填)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 resize-none"
                            placeholder="简要描述此项目的目标和规划..."
                        />
                    </div>

                    {/* 错误信息显示 */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

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
                            {loading ? '创建中...' : '确认创建'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
