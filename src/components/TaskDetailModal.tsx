import React, { useState, useContext, useEffect, useRef } from 'react';
import { X, MessageSquare, Paperclip, Send, Clock, User as UserIcon, CheckCircle2, AlertCircle, Loader2, FileText, Image, File, Trash2, Download, Eye } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Comment, Attachment } from '../types';
import { AppContext } from '../constants';
import { TaskAPI, CommentAPI, UploadAPI } from '../services/api';
import { showError, showSuccess } from './Dialog';

// 文件大小限制 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// 允许的文件类型
const ALLOWED_FILE_TYPES = [
    // 图片
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // 文档
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/markdown',
    // 压缩包
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    // 代码文件
    'text/javascript', 'text/typescript', 'text/html', 'text/css', 'application/json'
];

// 文件类型图标映射
const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return Image;
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(ext || '')) return FileText;
    return File;
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onUpdate?: () => void;
}

// 状态流转规则：定义每个状态可以流转到哪些状态
const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.NOT_STARTED]: [TaskStatus.OPEN_FOR_CLAIM, TaskStatus.CANCELLED],
    [TaskStatus.OPEN_FOR_CLAIM]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.IN_REVIEW, TaskStatus.CANCELLED],
    [TaskStatus.IN_REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
    [TaskStatus.DONE]: [], // 已完成不可再切换
    [TaskStatus.CANCELLED]: [TaskStatus.NOT_STARTED], // 可重新激活
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate }) => {
    const { state, setState } = useContext(AppContext);
    const { users, currentUser } = state;
    const [activeTab, setActiveTab] = useState<'comments' | 'attachments'>('comments');
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>(task.comments || []);
    const [localTask, setLocalTask] = useState<Task>(task);
    const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 当 task prop 变化时，同步更新 localTask
    useEffect(() => {
        setLocalTask(task);
    }, [task]);

    // 确认弹窗状态
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        cancelText: string;
        onConfirm: () => void;
        type: 'success' | 'danger' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '确认',
        cancelText: '取消',
        onConfirm: () => { },
        type: 'warning'
    });

    const assignee = users.find(u => u.id === localTask.assigneeId || u.userId === localTask.assigneeId);

    // 当 task prop 变化时，获取任务详情（包括附件列表）
    useEffect(() => {
        const fetchTaskDetail = async () => {
            const taskId = task.id || task.taskId || 0;
            if (!taskId) return;
            try {
                const taskDetail = await TaskAPI.info(taskId);
                if (taskDetail) {
                    // Normalize refetched fields with robust field picking
                    setLocalTask(prev => {
                        const t = taskDetail;
                        const aId = t.assigneeUserId || t.assigneeId || t.currentOwnerUserId || (t.assign && (t.assign.userId || t.assign.id)) || (t.assignee && (t.assignee.userId || t.assignee.id));

                        return {
                            ...prev,
                            ...t,
                            id: Number(t.taskId || t.id || prev.id),
                            dueDate: (t.dueAt || t.dueDate || prev.dueDate || '').split('T')[0],
                            dueAt: t.dueAt || t.dueDate || prev.dueAt,
                            assigneeId: aId ? Number(aId) : prev.assigneeId,
                            attachments: t.attachments || prev.attachments || []
                        };
                    });
                }
            } catch (e) {
                console.error('Failed to fetch task detail', e);
            }
        };
        fetchTaskDetail();
    }, [task.id, task.taskId]);

    // 当 localTask 变化时，重新获取评论列表
    useEffect(() => {
        const fetchComments = async () => {
            const taskId = localTask.id || localTask.taskId || 0;
            if (!taskId) return;
            try {
                const commentsData = await CommentAPI.list(taskId);
                setComments(commentsData);
            } catch (e) {
                console.error('Failed to fetch comments', e);
            }
        };
        fetchComments();
    }, [localTask.id, localTask.taskId]);

    // 计算文件的 SHA256 校验和
    const calculateSHA256 = async (file: File): Promise<string> => {
        try {
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn('SHA256 计算失败:', e);
            // 如果计算失败，返回一个占位符
            return '0'.repeat(64);
        }
    };

    // 验证文件
    const validateFile = (file: File): string | null => {
        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
            return `文件大小不能超过 ${formatFileSize(MAX_FILE_SIZE)}`;
        }

        // 检查文件类型
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return `不支持的文件类型: ${file.type || '未知类型'}。支持的类型: 图片、文档、压缩包、代码文件`;
        }

        return null;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 文件校验
        const validationError = validateFile(file);
        if (validationError) {
            setUploadError(validationError);
            showConfirmDialog(
                '文件上传失败',
                validationError,
                () => {
                    setUploadError(null);
                    closeConfirmDialog();
                },
                'danger',
                '知道了'
            );
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        try {
            // 1. Get presigned URL
            const presignData = await UploadAPI.getPresignUpload({
                filename: file.name,
                contentType: file.type,
                dir: 'PROJECT_FILE',
                ownerId: localTask.projectId || 0
            });

            // 2. Use local proxy to bypass CORS
            const targetUrl = new URL(presignData.uploadUrl);
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const isCdnUrl = targetUrl.hostname.includes('.cdn.');

            const uploadUrl = isDev
                ? (isCdnUrl ? `/oss-cdn-proxy${targetUrl.pathname}${targetUrl.search}` : `/oss-proxy${targetUrl.pathname}${targetUrl.search}`)
                : presignData.uploadUrl;

            console.log('Starting XHR Upload to:', uploadUrl);

            // 3. Upload using XHR for progress tracking (避免扩展拦截)
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.setRequestHeader('x-amz-acl', 'public-read');

                // 进度监听
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(progress);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`上传失败: ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error('网络请求错误'));
                xhr.send(file);
            });

            // 4. Resolve the final public URL
            const urlObj = new URL(presignData.uploadUrl);
            const cleanPath = presignData.objectKey || urlObj.pathname;
            const finalFileUrl = `https://projectmgr.sgp1.cdn.digitaloceanspaces.com/${cleanPath.replace(/^\//, '')}`;

            // 5. 计算文件 SHA256 校验和
            const checksum = await calculateSHA256(file);

            // 6. 调用 API 添加附件
            // 请求体格式: { taskId, projectId, attachments: [{ filename, fileUrl, mimeType, sizeBytes, checksumSha256 }] }
            const attachmentData = {
                taskId: localTask.id || localTask.taskId || 0,
                projectId: localTask.projectId || 0,
                attachments: [{
                    filename: file.name,
                    fileUrl: finalFileUrl,
                    mimeType: file.type || 'application/octet-stream',
                    sizeBytes: file.size,
                    checksumSha256: checksum
                }]
            };
            console.log('addAttachments 请求体:', attachmentData);
            await TaskAPI.addAttachments(attachmentData);

            // 7. Update local state
            const newAttachment: Attachment = {
                attachmentId: Date.now(), // Temporary ID until reload
                filename: file.name,
                downloadUrl: finalFileUrl,
                mimeType: file.type || 'application/octet-stream',
                sizeBytes: file.size,
                versionNo: 1,
                createdAt: new Date().toISOString()
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

            // 显示成功提示
            showConfirmDialog(
                '上传成功',
                `文件 "${file.name}" 已成功上传`,
                () => closeConfirmDialog(),
                'success',
                '知道了'
            );

        } catch (err: any) {
            console.error('Upload Error:', err);
            setUploadError(err.message || '上传附件失败');
            showConfirmDialog(
                '上传失败',
                err.message || '上传附件失败，请稍后重试',
                () => closeConfirmDialog(),
                'danger',
                '知道了'
            );
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // 删除附件
    const handleDeleteAttachment = async (attachmentId: number) => {
        showConfirmDialog(
            '删除附件',
            '确定要删除这个附件吗？此操作不可恢复。',
            async () => {
                closeConfirmDialog();
                try {
                    // TODO: 调用删除附件 API
                    // await TaskAPI.deleteAttachment(attachmentId);

                    // 本地删除
                    const updatedTask = {
                        ...localTask,
                        attachments: localTask.attachments?.filter(a => a.id !== attachmentId) || []
                    };
                    setLocalTask(updatedTask);
                    setState(prev => ({
                        ...prev,
                        tasks: prev.tasks.map(t => (t.id === localTask.id || t.taskId === localTask.taskId) ? updatedTask : t)
                    }));
                    onUpdate?.();

                    showConfirmDialog(
                        '删除成功',
                        '附件已删除',
                        () => closeConfirmDialog(),
                        'success',
                        '知道了'
                    );
                } catch (err: any) {
                    showConfirmDialog(
                        '删除失败',
                        err.message || '删除附件失败',
                        () => closeConfirmDialog(),
                        'danger',
                        '知道了'
                    );
                }
            },
            'danger',
            '确认删除',
            '取消'
        );
    };

    // 预览附件
    const handlePreviewAttachment = (attachment: Attachment) => {
        const fileName = attachment.filename || attachment.fileName || '';
        const fileUrl = attachment.downloadUrl || attachment.fileUrl || '';
        const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
        if (isImage) {
            setPreviewAttachment(attachment);
        } else {
            // 非图片直接下载
            window.open(fileUrl, '_blank');
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            // 请求体: { taskId, projectId, content }
            const commentId = await CommentAPI.create({
                taskId: localTask.id || localTask.taskId || 0,
                projectId: localTask.projectId || 0,
                content: newComment
            });
            // 创建成功后重新获取评论列表，确保数据格式一致
            const taskId = localTask.id || localTask.taskId || 0;
            const commentsData = await CommentAPI.list(taskId);
            setComments(commentsData);
            setNewComment('');
        } catch (e: any) {
            await showError(e?.message || '评论失败');
        } finally {
            setLoading(false);
        }
    };

    // 检查状态流转是否合法
    const isValidTransition = (currentStatus: TaskStatus, newStatus: TaskStatus): boolean => {
        // 相同状态直接返回 true（允许点击当前状态，相当于刷新）
        if (currentStatus === newStatus) return true;
        const allowedTransitions = validTransitions[currentStatus] || [];
        return allowedTransitions.includes(newStatus);
    };

    // 获取状态流转的提示信息
    const getTransitionHint = (currentStatus: TaskStatus): string => {
        const allowedTransitions = validTransitions[currentStatus] || [];
        if (allowedTransitions.length === 0) {
            return '当前状态为最终状态，无法继续流转';
        }
        const allowedLabels = allowedTransitions.map(s => statusMap[s]?.label || s).join('、');
        return `可流转至: ${allowedLabels}`;
    };

    // 显示确认弹窗
    const showConfirmDialog = (
        title: string,
        message: string,
        onConfirm: () => void,
        type: 'success' | 'danger' | 'warning' = 'warning',
        confirmText: string = '确认',
        cancelText: string = '取消'
    ) => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            confirmText,
            cancelText,
            onConfirm,
            type
        });
    };

    // 关闭确认弹窗
    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    const myId = Number(currentUser?.userId || currentUser?.id || 0);
    const isGlobalManager = (currentUser?.role || '').toString().trim() === '管理员' ||
        (currentUser?.role || '').toString().trim().toUpperCase() === 'MANAGER' ||
        (currentUser?.role || '').toString().trim().toUpperCase() === 'ADMIN';

    // 检查项目/团队管理员权限
    const project = state.projects.find(p => (p.id === localTask.projectId) || (p.projectId === localTask.projectId));
    const projectTeam = project ? state.teams.find(t => (t.teamId === project.teamId) || (t.id === project.teamId)) : null;
    const isTeamAdmin = projectTeam && (
        (projectTeam.adminIds || []).map(id => Number(id)).includes(myId) ||
        Number(projectTeam.creatorId || projectTeam.ownerId) === myId
    );

    const hasAdminRights = isGlobalManager || isTeamAdmin;

    const handleStatusChange = async (newStatus: TaskStatus) => {
        // 只有具备管理权限的人能操作
        if (!hasAdminRights) {
            showConfirmDialog(
                '权限不足',
                '只有管理员 (MANAGER) 可以修改任务状态。',
                () => closeConfirmDialog(),
                'warning',
                '知道了'
            );
            return;
        }

        // 校验状态流转是否合法
        if (!isValidTransition(localTask.status, newStatus)) {
            const hint = getTransitionHint(localTask.status);
            showConfirmDialog(
                '非法的状态流转',
                `当前状态: ${statusMap[localTask.status]?.label}\n${hint}`,
                () => closeConfirmDialog(),
                'warning',
                '知道了'
            );
            return;
        }

        // 对于关键状态变更，添加确认弹窗
        if (newStatus === TaskStatus.DONE || newStatus === TaskStatus.CANCELLED) {
            const isDone = newStatus === TaskStatus.DONE;
            showConfirmDialog(
                isDone ? '完成任务' : '取消任务',
                isDone
                    ? `确定要将任务 "${localTask.title}" 标记为已完成吗？\n\n完成后任务将被标记为已结束，并记录完成时间。`
                    : `确定要取消任务 "${localTask.title}" 吗？\n\n取消后任务将变为未开始状态，可以在需要时重新激活。`,
                () => {
                    closeConfirmDialog();
                    executeStatusChange(newStatus);
                },
                isDone ? 'success' : 'danger',
                isDone ? '确认完成' : '确认取消'
            );
            return;
        }

        // 直接执行状态变更
        executeStatusChange(newStatus);
    };

    // 执行状态变更
    const executeStatusChange = async (newStatus: TaskStatus) => {
        try {
            await TaskAPI.changeStatus({
                taskId: localTask.id || localTask.taskId || 0,
                status: newStatus
            });

            // 如果任务完成，记录完成时间
            const updated: Task = { ...localTask, status: newStatus };
            if (newStatus === TaskStatus.DONE) {
                updated.completedAt = new Date().toISOString();
            }

            setLocalTask(updated);
            // Update global state
            setState(prev => ({
                ...prev,
                tasks: prev.tasks.map(t => (t.id === localTask.id || t.taskId === localTask.taskId) ? updated : t)
            }));
            onUpdate?.();
        } catch (e) {
            showConfirmDialog(
                '状态更新失败',
                '任务状态更新失败，请稍后重试。',
                () => closeConfirmDialog(),
                'danger',
                '知道了'
            );
        }
    };

    // 申领项目 (领取任务)
    const handleClaimTask = async () => {
        setLoading(true);
        try {
            const taskId = localTask.id || localTask.taskId || 0;
            await TaskAPI.claim({ taskId });

            // 申领成功后，将状态改为 进行中，并将负责人设为当前用户
            const updated: Task = {
                ...localTask,
                status: TaskStatus.IN_PROGRESS,
                assigneeId: currentUser?.userId || currentUser?.id || 0
            };

            setLocalTask(updated);
            setState(prev => ({
                ...prev,
                tasks: prev.tasks.map(t => (t.id === localTask.id || t.taskId === localTask.taskId) ? updated : t)
            }));
            onUpdate?.();

            showConfirmDialog(
                '领取成功',
                '您已成功领取该任务，任务状态已变更为 "进行中"。',
                () => closeConfirmDialog(),
                'success',
                '知道了'
            );
        } catch (e: any) {
            console.error('Claim Error:', e);
            showConfirmDialog(
                '领取失败',
                e.message || '领取任务失败，请稍后重试。',
                () => closeConfirmDialog(),
                'danger',
                '知道了'
            );
        } finally {
            setLoading(false);
        }
    };

    const priorityColors = {
        [TaskPriority.LOW]: 'bg-slate-100 text-slate-600 border-slate-200',
        [TaskPriority.MEDIUM]: 'bg-blue-50 text-blue-600 border-blue-200',
        [TaskPriority.HIGH]: 'bg-orange-50 text-orange-600 border-orange-200',
        [TaskPriority.URGENT]: 'bg-red-50 text-red-600 border-red-200',
    };

    const statusMap = {
        [TaskStatus.NOT_STARTED]: { label: '未开始', color: 'text-slate-500', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
        [TaskStatus.OPEN_FOR_CLAIM]: { label: '待申领', color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
        [TaskStatus.IN_PROGRESS]: { label: '进行中', color: 'text-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
        [TaskStatus.IN_REVIEW]: { label: '审核中', color: 'text-purple-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
        [TaskStatus.DONE]: { label: '已完成', color: 'text-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
        [TaskStatus.CANCELLED]: { label: '已取消', color: 'text-gray-500', bgColor: 'bg-gray-100', borderColor: 'border-gray-300' },
    };

    return (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
                {/* Left Side: Task Info */}
                <div className="flex-1 p-8 overflow-y-auto border-r border-slate-100 h-full">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${priorityColors[localTask.priority]}`}>
                                {localTask.priority === 'LOW' ? '低' : localTask.priority === 'MEDIUM' ? '中' : localTask.priority === 'HIGH' ? '高' : localTask.priority === 'URGENT' ? '紧急' : localTask.priority}
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
                            <div className="text-slate-700 font-bold">
                                {localTask.dueDate ? new Date(localTask.dueDate).toLocaleDateString('zh-CN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                }) : '未设定'}
                            </div>
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
                        {localTask.completedAt && (
                            <div className="col-span-2">
                                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={14} /> 完成时间
                                </h4>
                                <div className="text-emerald-600 font-bold">
                                    {new Date(localTask.completedAt).toLocaleString('zh-CN', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            任务状态
                            <span className="ml-2 text-[10px] font-medium text-slate-400 normal-case">
                                ({getTransitionHint(localTask.status)})
                            </span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(TaskStatus).map(([key, value]) => {
                                const isCurrent = localTask.status === value;
                                const isValid = isValidTransition(localTask.status, value);
                                const statusStyle = statusMap[value];
                                return (
                                    <button
                                        key={value}
                                        onClick={() => handleStatusChange(value)}
                                        disabled={(!isValid && !isCurrent) || !hasAdminRights}
                                        title={!hasAdminRights ? '只有管理员可以修改状态' : (!isValid && !isCurrent ? '当前状态不支持流转至此状态' : '')}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isCurrent
                                            ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200'
                                            : isValid && hasAdminRights
                                                ? 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                                                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                                            }`}
                                    >
                                        {statusStyle?.label || value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Side: Interaction */}
                <div className="w-full md:w-[380px] bg-slate-50 flex flex-col max-h-[500px]">
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
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {activeTab === 'comments' ? (
                            <>
                                {/* 评论列表 - 可滚动区域 */}
                                <div className="flex-1 overflow-y-auto p-6">
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
                                                // 使用后端返回的 authorUserId 和 authorUsername
                                                const commenter = users.find(u => u.id === c.authorUserId || u.userId === c.authorUserId);
                                                return (
                                                    <div key={c.commentId} className="group">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <img src={commenter?.avatar} className="w-5 h-5 rounded-full" alt="" />
                                                            <span className="text-xs font-bold text-slate-700">{c.authorUsername || commenter?.name || '未知用户'}</span>
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
                                </div>

                                {/* Footer Input for Comments - 固定在底部 */}
                                <div className="p-6 bg-white border-t border-slate-100 shrink-0">
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
                            </>
                        ) : (
                            <div className="space-y-4">
                                {(!localTask.attachments || localTask.attachments.length === 0) ? (
                                    <div className="text-center py-10">
                                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                                            <Paperclip size={24} />
                                        </div>
                                        <p className="text-slate-400 text-sm">暂无附件</p>
                                        <p className="text-[10px] text-slate-300 mt-1">支持图片、文档、压缩包等格式</p>
                                    </div>
                                ) : (
                                    localTask.attachments.map(att => {
                                        // 使用后端返回的字段名
                                        const fileName = att.filename || att.fileName || '';
                                        const fileUrl = att.downloadUrl || att.fileUrl || '';
                                        const attachmentId = att.attachmentId || att.id || 0;
                                        const uploadedAt = att.createdAt || att.uploadedAt || '';
                                        const sizeBytes = att.sizeBytes || 0;

                                        const FileIcon = getFileIcon(fileName);
                                        const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                                        return (
                                            <div
                                                key={attachmentId}
                                                className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
                                            >
                                                <div className="bg-blue-50 p-2 rounded-lg text-blue-500 group-hover:bg-blue-100 transition-colors shrink-0">
                                                    <FileIcon size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-slate-700 truncate" title={fileName}>{fileName}</div>
                                                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                        <span>{uploadedAt ? new Date(uploadedAt).toLocaleDateString() : ''}</span>
                                                        {sizeBytes > 0 && (
                                                            <span className="text-blue-400">· {formatFileSize(sizeBytes)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isImage && (
                                                        <button
                                                            onClick={() => handlePreviewAttachment(att)}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                                            title="预览"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    )}
                                                    <a
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                                        title="下载"
                                                    >
                                                        <Download size={16} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleDeleteAttachment(attachmentId)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                {/* 上传进度条 */}
                                {uploading && (
                                    <div className="bg-white p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Loader2 size={18} className="animate-spin text-blue-500" />
                                            <span className="text-sm font-bold text-slate-700">上传中...</span>
                                            <span className="text-sm text-slate-500 ml-auto">{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* 上传提示 */}
                                <div className="text-[10px] text-slate-400 text-center">
                                    支持格式: 图片、PDF、Word、Excel、PPT、TXT、ZIP等 | 最大 50MB
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept={ALLOWED_FILE_TYPES.join(',')}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>
            </div>

            {/* 图片预览弹窗 */}
            {previewAttachment && (
                <div
                    className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
                    onClick={() => setPreviewAttachment(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <button
                            onClick={() => setPreviewAttachment(null)}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors"
                        >
                            <X size={28} />
                        </button>
                        <img
                            src={previewAttachment.fileUrl}
                            alt={previewAttachment.fileName}
                            className="w-full h-full object-contain rounded-xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl">
                            <p className="text-white font-bold">{previewAttachment.fileName}</p>
                            <p className="text-white/70 text-sm">{previewAttachment.uploadedAt}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 确认弹窗 */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${confirmDialog.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                confirmDialog.type === 'danger' ? 'bg-red-100 text-red-600' :
                                    'bg-amber-100 text-amber-600'
                                }`}>
                                {confirmDialog.type === 'success' ? <CheckCircle2 size={28} /> :
                                    confirmDialog.type === 'danger' ? <AlertCircle size={28} /> :
                                        <AlertCircle size={28} />}
                            </div>
                            <h3 className="text-xl font-black text-slate-800">{confirmDialog.title}</h3>
                        </div>
                        <p className="text-slate-600 mb-8 whitespace-pre-line leading-relaxed">
                            {confirmDialog.message}
                        </p>
                        <div className="flex gap-3">
                            {confirmDialog.cancelText && (
                                <button
                                    onClick={closeConfirmDialog}
                                    className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                >
                                    {confirmDialog.cancelText}
                                </button>
                            )}
                            <button
                                onClick={confirmDialog.onConfirm}
                                className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all ${confirmDialog.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200' :
                                    confirmDialog.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200' :
                                        'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200'
                                    }`}
                            >
                                {confirmDialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
