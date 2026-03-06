import React, { useState, useContext, useEffect, useRef } from 'react';
import { X, MessageSquare, Paperclip, Send, Clock, User as UserIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Comment } from '../types';
import { AppContext } from '../constants';
import { TaskAPI, CommentAPI, UploadAPI } from '../services/api';

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onUpdate?: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate }) => {
    const { state, setState } = useContext(AppContext);
    const { users, currentUser } = state;
    const [activeTab, setActiveTab] = useState<'comments' | 'attachments'>('comments');
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [comments, setComments] = useState<Comment[]>(task.comments || []);
    const [localTask, setLocalTask] = useState<Task>(task);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const assignee = users.find(u => u.id === localTask.assigneeId || u.userId === localTask.assigneeId);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await CommentAPI.list(localTask.id || localTask.taskId || 0);
                setComments(res.items || []);
            } catch (e) {
                console.error('Failed to fetch comments', e);
            }
        };
        fetchComments();
    }, [localTask.id, localTask.taskId]);

    const calculateSHA256 = async (file: File) => {
        try {
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn('Failed to calculate SHA-256', e);
            return "";
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. Get presigned URL
            const presignData = await UploadAPI.getPresignUpload({
                fileName: file.name,
                size: file.size,
                fileType: file.type,
                storageType: 2, // Assuming 2 for attachments
                dir: 'task_attachments'
            });

            // 2. Upload to storage
            const uploadRes = await fetch(presignData.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            if (!uploadRes.ok) {
                throw new Error('上传文件失败');
            }

            // 3. Compute Checksum
            const checksum = await calculateSHA256(file);

            // 4. Update task attachment via TaskAPI
            await TaskAPI.editAttachments({
                attachmentId: 0,
                taskId: localTask.id || localTask.taskId || 0,
                filename: file.name,
                fileUrl: presignData.fileUrl,
                mimeType: file.type || 'application/octet-stream',
                sizeBytes: file.size,
                checksumSha256: checksum
            });

            // 5. Update local state
            const newAttachment = {
                id: Date.now(), // Temporary ID until reload
                fileName: file.name,
                fileUrl: presignData.fileUrl,
                uploadedAt: new Date().toISOString().split('T')[0]
            };

            const updatedTask = {
                ...localTask,
                attachments: [...(localTask.attachments || []), newAttachment]
            };
            setLocalTask(updatedTask);
            setState(prev => ({
                ...prev,
                tasks: prev.tasks.map(t => (t.id === localTask.id || t.taskId === localTask.taskId) ? updatedTask : t)
            }));
            onUpdate?.();

        } catch (err: any) {
            console.error(err);
            alert(err.message || '上传附件失败');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            const commentId = await CommentAPI.create({
                taskId: localTask.id || localTask.taskId || 0,
                content: newComment
            });
            const comment: Comment = {
                id: commentId,
                userId: currentUser?.userId || 0,
                content: newComment,
                createdAt: new Date().toISOString()
            };
            setComments(prev => [comment, ...prev]);
            setNewComment('');
        } catch (e) {
            alert('评论失败');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: TaskStatus) => {
        try {
            await TaskAPI.changeStatus({
                taskId: localTask.id || localTask.taskId || 0,
                status: newStatus
            });
            const updated = { ...localTask, status: newStatus };
            setLocalTask(updated);
            // Update global state
            setState(prev => ({
                ...prev,
                tasks: prev.tasks.map(t => (t.id === localTask.id || t.taskId === localTask.taskId) ? updated : t)
            }));
            onUpdate?.();
        } catch (e) {
            alert('状态更新失败');
        }
    };

    const priorityColors = {
        [TaskPriority.LOW]: 'bg-slate-100 text-slate-600 border-slate-200',
        [TaskPriority.MEDIUM]: 'bg-blue-50 text-blue-600 border-blue-200',
        [TaskPriority.HIGH]: 'bg-orange-50 text-orange-600 border-orange-200',
        [TaskPriority.URGENT]: 'bg-red-50 text-red-600 border-red-200',
    };

    const statusMap = {
        [TaskStatus.NOT_STARTED]: { label: '未开始', color: 'text-slate-500' },
        [TaskStatus.OPEN_FOR_CLAIM]: { label: '待申领', color: 'text-blue-500' },
        [TaskStatus.IN_PROGRESS]: { label: '进行中', color: 'text-orange-500' },
        [TaskStatus.IN_REVIEW]: { label: '审核中', color: 'text-purple-500' },
        [TaskStatus.DONE]: { label: '已完成', color: 'text-green-500' },
        [TaskStatus.CANCELLED]: { label: '已取消', color: 'text-slate-400' },
    };

    return (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
                {/* Left Side: Task Info */}
                <div className="flex-1 p-8 overflow-y-auto border-r border-slate-100 h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${priorityColors[localTask.priority]}`}>
                                {localTask.priority}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-500 border-slate-200`}>
                                ID: #{localTask.id || localTask.taskId}
                            </span>
                        </div>
                        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>

                    <h2 className="text-3xl font-black text-slate-800 mb-4">{localTask.title}</h2>

                    <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">任务描述</h4>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {localTask.description || '暂无详细描述。'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Clock size={14} /> 截止日期
                            </h4>
                            <div className="text-slate-700 font-bold">{localTask.dueDate || '未设定'}</div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <UserIcon size={14} /> 负责人
                            </h4>
                            <div className="flex items-center gap-2">
                                {assignee ? (
                                    <>
                                        <img src={assignee.avatar} className="w-6 h-6 rounded-full" alt="" />
                                        <span className="text-slate-700 font-bold">{assignee.name}</span>
                                    </>
                                ) : (
                                    <span className="text-slate-400 italic text-sm">暂无负责人</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">任务状态</h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(TaskStatus).map(([key, value]) => (
                                <button
                                    key={value}
                                    onClick={() => handleStatusChange(value)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${localTask.status === value
                                        ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                                        }`}
                                >
                                    {statusMap[value]?.label || value}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Interaction */}
                <div className="w-full md:w-[380px] bg-slate-50 h-full flex flex-col">
                    <div className="hidden md:flex justify-end p-4">
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'comments' ? 'text-blue-500 border-b-2 border-blue-500 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <MessageSquare size={18} /> 评论 ({comments.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('attachments')}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === 'attachments' ? 'text-blue-500 border-b-2 border-blue-500 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Paperclip size={18} /> 附件 ({localTask.attachments?.length || 0})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'comments' ? (
                            <div className="space-y-6">
                                {comments.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                                            <MessageSquare size={24} />
                                        </div>
                                        <p className="text-slate-400 text-sm">暂无评论，说点什么吧...</p>
                                    </div>
                                ) : (
                                    comments.map(c => {
                                        const commenter = users.find(u => u.id === c.userId || u.userId === c.userId);
                                        return (
                                            <div key={c.id} className="group">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <img src={commenter?.avatar} className="w-5 h-5 rounded-full" alt="" />
                                                    <span className="text-xs font-bold text-slate-700">{commenter?.name || '未知用户'}</span>
                                                    <span className="text-[10px] text-slate-400 ml-auto">{new Date(c.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-sm text-slate-600">
                                                    {c.content}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(!localTask.attachments || localTask.attachments.length === 0) ? (
                                    <div className="text-center py-10">
                                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                                            <Paperclip size={24} />
                                        </div>
                                        <p className="text-slate-400 text-sm">暂无附件</p>
                                    </div>
                                ) : (
                                    localTask.attachments.map(att => (
                                        <a
                                            key={att.id}
                                            href={att.fileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
                                        >
                                            <div className="bg-blue-50 p-2 rounded-lg text-blue-500 group-hover:bg-blue-100 transition-colors">
                                                <Paperclip size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-slate-700 truncate">{att.fileName}</div>
                                                <div className="text-[10px] text-slate-400">{att.uploadedAt}</div>
                                            </div>
                                        </a>
                                    ))
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? (
                                        <><Loader2 size={18} className="animate-spin" /> 上传中...</>
                                    ) : (
                                        <><Paperclip size={18} /> 上传附件</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer Input for Comments */}
                    {activeTab === 'comments' && (
                        <div className="p-6 bg-white border-t border-slate-100">
                            <form onSubmit={handleAddComment} className="relative">
                                <textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="输入评论..."
                                    rows={2}
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !newComment.trim()}
                                    className="absolute right-2 bottom-2 p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 disabled:bg-slate-300 disabled:shadow-none transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
