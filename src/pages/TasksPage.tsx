import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../constants';
import type { Project, Task } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, Send, MessageSquare, ListTodo, Plus, ChevronRight, LayoutGrid, Clock, Users as UsersIcon, Filter, CheckCircle2, Circle, RotateCcw, XCircle, Search, Pencil, UserPlus } from 'lucide-react';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { AssignTaskModal } from '../components/AssignTaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { TaskAPI } from '../services/api';
import { TaskStatus, TaskPriority } from '../types';

type TaskFilter = 'all' | 'done' | 'in_progress' | 'pending' | 'cancelled';

export const TasksPage: React.FC = () => {
    const { state, setState } = useContext(AppContext);
    const { projects, tasks, users } = state;
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [assigningTask, setAssigningTask] = useState<Task | null>(null);
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCelebration, setShowCelebration] = useState<number | null>(null);

    const isManager = state.currentUser?.role === '管理员' || state.currentUser?.role === 'MANAGER';

    // 筛选任务 - 使用当前状态值
    const filterTasks = (projectTasks: Task[], filter: TaskFilter, query: string): Task[] => {
        let filtered = [...projectTasks];

        // 按状态筛选
        switch (filter) {
            case 'done':
                filtered = filtered.filter(t => t.status === TaskStatus.DONE);
                break;
            case 'in_progress':
                filtered = filtered.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.IN_REVIEW);
                break;
            case 'pending':
                filtered = filtered.filter(t => t.status === TaskStatus.NOT_STARTED || t.status === TaskStatus.OPEN_FOR_CLAIM);
                break;
            case 'cancelled':
                filtered = filtered.filter(t => t.status === TaskStatus.CANCELLED);
                break;
        }

        // 按搜索词筛选
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(lowerQuery) ||
                t.description?.toLowerCase().includes(lowerQuery)
            );
        }

        return filtered;
    };

    // 触发完成庆祝动画
    const triggerCelebration = (taskId: number) => {
        setShowCelebration(taskId);
        setTimeout(() => setShowCelebration(null), 2000);
    };

    const visibleProjects = useMemo(() => {
        const pId = projectId ? Number(projectId) : undefined;
        if (!pId) return projects;
        return projects.filter(p => (p.projectId || p.id) === pId);
    }, [projects, projectId]);

    const renderProjectCard = (project: Project) => {
        const projectId = project.projectId || project.id;
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        // 使用当前状态值进行筛选
        const filteredTasks = filterTasks(projectTasks, taskFilter, searchQuery);
        const sortedTasks = [...filteredTasks].sort((a, b) => {
            const dateA = a.completedAt || a.dueDate || new Date().toISOString();
            const dateB = b.completedAt || b.dueDate || new Date().toISOString();
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        // 计算进度
        const totalTasks = projectTasks.length;
        const doneTasks = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
        const progressPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        return (
            <div key={project.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-12">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-slate-50 to-white gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                            <LayoutGrid size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-2xl font-black text-slate-800">{project.name}</h3>
                                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">{project.status}</span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium">{project.description || '暂无项目描述'}</p>
                            {/* 进度条 */}
                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-48">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-500">{progressPercentage}%</span>
                                <span className="text-[10px] text-slate-400">({doneTasks}/{totalTasks})</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-8">
                    {/* Timeline Section */}
                    <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                            <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <Clock className="text-blue-500" size={24} /> 任务详情
                            </h4>

                            {/* 筛选器 */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* 搜索框 */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="搜索任务..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none w-40"
                                    />
                                </div>

                                {/* 状态筛选 */}
                                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                                    {[
                                        { key: 'all', label: '全部', icon: Filter },
                                        { key: 'done', label: '已完成', icon: CheckCircle2 },
                                        { key: 'in_progress', label: '进行中', icon: RotateCcw },
                                        { key: 'pending', label: '待处理', icon: Circle },
                                        { key: 'cancelled', label: '已取消', icon: XCircle },
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setTaskFilter(key as TaskFilter)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${taskFilter === key
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            title={label}
                                        >
                                            <Icon size={14} />
                                            <span className="hidden sm:inline">{label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>显示 {filteredTasks.length}</span>
                                    <span className="text-slate-300">/</span>
                                    <span>总量 {projectTasks.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative border-l-4 border-slate-100 ml-4 space-y-12 pl-10 py-2">
                            {sortedTasks.length === 0 ? (
                                <div className="text-center py-12 text-slate-300 italic font-medium">暂无任务动态</div>
                            ) : (
                                sortedTasks.map((task, index) => {
                                    const assignee = users.find(u => (u.userId || u.id) === task.assigneeId);
                                    const date = task.completedAt || task.dueDate || new Date().toISOString();
                                    const dateObj = new Date(date);
                                    const formattedDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                                    const isLatest = index === 0;
                                    const isDone = task.status === TaskStatus.DONE;
                                    const isCancelled = task.status === TaskStatus.CANCELLED;

                                    const taskId = task.id || task.taskId;

                                    return (
                                        <div
                                            key={taskId}
                                            className={`relative group cursor-pointer ${isCancelled ? 'opacity-60' : ''}`}
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            {/* 庆祝动画 */}
                                            {showCelebration === taskId && (
                                                <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                                                    <div className="absolute inset-0 bg-emerald-500/10 rounded-[2rem] animate-ping" />
                                                    <div className="text-4xl animate-bounce">🎉</div>
                                                </div>
                                            )}

                                            <div className={`absolute -left-[54px] top-4 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 transition-all duration-500 ${isDone ? 'bg-emerald-500 scale-110 ring-4 ring-emerald-100' : isCancelled ? 'bg-gray-400 ring-4 ring-gray-100' : isLatest ? 'bg-blue-600 scale-125 ring-4 ring-blue-100' : 'bg-slate-200 group-hover:bg-blue-400'}`}></div>

                                            <div className={`bg-white p-6 rounded-[2rem] shadow-sm border group-hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center gap-6 ${isDone ? 'border-emerald-100 group-hover:border-emerald-200' : isCancelled ? 'border-gray-200 group-hover:border-gray-300 bg-gray-50' : 'border-slate-50 group-hover:border-blue-100'}`}>
                                                <div className="flex items-center gap-4 min-w-[160px]">
                                                    <div className={`w-12 h-12 rounded-2xl overflow-hidden border border-white shadow-sm ring-2 ring-transparent transition-all ${isCancelled ? 'bg-gray-200 grayscale' : 'bg-slate-100 group-hover:ring-blue-100'}`}>
                                                        <img src={assignee?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm font-black ${isCancelled ? 'text-gray-500' : 'text-slate-800'}`}>{assignee?.name || '待认领'}</div>
                                                        <div className={`text-[10px] font-bold uppercase tracking-widest ${isDone ? 'text-emerald-500' : isCancelled ? 'text-gray-400' : 'text-slate-400'}`}>
                                                            {isDone ? '✓ 已完成 · ' : isCancelled ? '✗ 已取消 · ' : ''}{formattedDate}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <h5 className={`font-bold text-lg transition-colors uppercase tracking-tight ${isCancelled ? 'text-gray-500 line-through decoration-gray-300' : isDone ? 'text-slate-600 line-through decoration-slate-300 group-hover:text-blue-600' : 'text-slate-800 group-hover:text-blue-600'}`}>{task.title}</h5>
                                                    <p className={`text-sm mt-1 line-clamp-1 font-medium italic opacity-80 ${isCancelled ? 'text-gray-400' : 'text-slate-400'}`}>{task.description}</p>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    {isManager && !isDone && (
                                                        <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setAssigningTask(task);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                                title="分配负责人"
                                                            >
                                                                <UserPlus size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingTask(task);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                                title="编辑任务"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.1em] shadow-sm ${task.status === TaskStatus.DONE ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        task.status === TaskStatus.IN_PROGRESS ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                            'bg-slate-50 text-slate-400 border border-slate-100'
                                                        }`}>
                                                        {task.status === TaskStatus.CANCELLED ? '已取消' : task.status}
                                                    </span>
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                        <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-12 px-6">
                <div className="flex items-center gap-6">
                    <div className="bg-white p-5 rounded-[2rem] shadow-2xl shadow-blue-100 border border-blue-50">
                        <ListTodo className="text-blue-600" size={40} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">我的任务</h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1.5 opacity-60">Task Strategic Command</p>
                    </div>
                </div>
                {projectId && (
                    <button
                        onClick={() => navigate('/tasks')}
                        className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm"
                    >
                        显示所有项目
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-4 pb-12 scrollbar-thin scrollbar-thumb-slate-200">
                {visibleProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-100/50">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                            <LayoutGrid size={48} className="text-slate-200" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">未找到活跃项目</h3>
                        <p className="text-slate-400 mt-3 font-medium">您可以返回首页加入新项目，或者创建一个新项目</p>
                    </div>
                ) : (
                    visibleProjects.map(renderProjectCard)
                )}
            </div>

            {isTaskModalOpen && activeProjectId && (
                <CreateTaskModal
                    projectId={activeProjectId}
                    onClose={() => setIsTaskModalOpen(false)}
                    onSubmit={async (data) => {
                        try {
                            const taskId = await TaskAPI.create(data);
                            const newTask: Task = {
                                id: taskId,
                                taskId: taskId,
                                title: data.title,
                                description: data.description,
                                priority: data.priority,
                                status: TaskStatus.NOT_STARTED,
                                projectId: data.projectId,
                                dueDate: data.dueDate,
                                dependencies: [],
                                comments: []
                            };
                            setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
                        } catch (e) {
                            alert('创建任务失败');
                        }
                    }}
                />
            )}

            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={() => {
                        // 刷新 selectedTask 以获取最新的附件数据
                        const taskId = selectedTask.id || selectedTask.taskId;
                        const updatedTask = tasks.find(t => (t.id === taskId || t.taskId === taskId));
                        if (updatedTask) {
                            setSelectedTask(updatedTask);
                        }
                    }}
                />
            )}

            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSubmit={async (data) => {
                        try {
                            const taskId = editingTask.id || editingTask.taskId || 0;
                            await TaskAPI.edit({
                                taskId: data.taskId,
                                title: data.title,
                                description: data.description,
                                priority: data.priority,
                                dueAt: data.dueAt,
                                startAt: data.startAt,
                                currentOwnerUserId: data.currentOwnerUserId || 0
                            });

                            const updated: Task = {
                                ...editingTask,
                                title: data.title,
                                description: data.description,
                                priority: data.priority,
                                dueDate: data.dueAt
                            };

                            setState(prev => ({
                                ...prev,
                                tasks: prev.tasks.map(t => (t.id === taskId || t.taskId === taskId) ? updated : t)
                            }));
                        } catch (e) {
                            alert('更新任务失败');
                        }
                    }}
                />
            )}

            {assigningTask && (
                <AssignTaskModal
                    task={assigningTask}
                    users={users}
                    onClose={() => setAssigningTask(null)}
                    onSubmit={async (data) => {
                        try {
                            const taskId = assigningTask.id || assigningTask.taskId || 0;
                            await TaskAPI.assign({
                                taskId: data.taskId,
                                projectId: data.projectId,
                                userId: data.userId
                            });

                            const updated: Task = {
                                ...assigningTask,
                                assigneeId: data.userId
                            };

                            setState(prev => ({
                                ...prev,
                                tasks: prev.tasks.map(t => (t.id === taskId || t.taskId === taskId) ? updated : t)
                            }));
                        } catch (e) {
                            alert('分配任务失败');
                        }
                    }}
                />
            )}
        </div>
    );
};
