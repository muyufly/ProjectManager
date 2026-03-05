import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../constants';
import type { Project, Task } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, Send, MessageSquare, ListTodo, Plus, ChevronRight, LayoutGrid, Clock, Users as UsersIcon } from 'lucide-react';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { TaskAPI } from '../services/api';
import { TaskStatus } from '../types';

interface RoleGroup {
    id: string;
    name: string;
    members: { name: string; avatar: string; role: string }[];
}

const MOCK_GROUPS: RoleGroup[] = [
    {
        id: 'g1',
        name: '产品组',
        members: [
            { name: '成员3', avatar: 'https://ui-avatars.com/api/?name=M3&background=random', role: '产品经理' }
        ]
    },
    {
        id: 'g2',
        name: '视觉设计',
        members: [
            { name: 'Xiangmu', avatar: 'https://ui-avatars.com/api/?name=Xiangmu&background=random', role: 'UI设计师' }
        ]
    },
    {
        id: 'g3',
        name: '前端开发',
        members: [
            { name: '成员1', avatar: 'https://ui-avatars.com/api/?name=M1&background=random', role: '前端工程师' }
        ]
    },
    {
        id: 'g4',
        name: '后端开发',
        members: [
            { name: '成员2', avatar: 'https://ui-avatars.com/api/?name=M2&background=random', role: '后端工程师' }
        ]
    }
];

export const TasksPage: React.FC = () => {
    const { state, setState } = useContext(AppContext);
    const { projects, tasks, users } = state;
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [showDivision, setShowDivision] = useState<Record<string, boolean>>({});

    const toggleDivision = (pId: string | number) => {
        const key = String(pId);
        setShowDivision(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const visibleProjects = useMemo(() => {
        const pId = projectId ? Number(projectId) : undefined;
        if (!pId) return projects;
        return projects.filter(p => (p.projectId || p.id) === pId);
    }, [projects, projectId]);

    const renderProjectCard = (project: Project) => {
        const projectTasks = tasks.filter(t => t.projectId === (project.projectId || project.id));
        const sortedTasks = [...projectTasks].sort((a, b) => {
            const dateA = a.completedAt || a.dueDate;
            const dateB = b.completedAt || b.dueDate;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        const currentProjectId = project.projectId || project.id;
        const isDivisionVisible = showDivision[String(project.id)];

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
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => toggleDivision(project.id)}
                            className={`px-6 py-2.5 rounded-2xl border border-blue-400 text-sm font-bold transition-all ${isDivisionVisible
                                    ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-200'
                                    : 'text-blue-500 hover:bg-blue-50'
                                }`}
                        >
                            {isDivisionVisible ? '隐藏分工' : '查看分工'}
                        </button>
                        <button
                            onClick={() => {
                                setActiveProjectId(currentProjectId);
                                setIsTaskModalOpen(true);
                            }}
                            className="px-8 py-3.5 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> 发布任务
                        </button>
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-8">
                    {/* Role Groups Section */}
                    {isDivisionVisible && (
                        <div className="bg-slate-50 rounded-[2rem] p-8 mb-8 border border-slate-100 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                                        <UsersIcon size={20} />
                                    </div>
                                    <h4 className="text-xl font-black text-slate-800">项目分工矩阵</h4>
                                </div>
                                <button
                                    onClick={() => alert('此功能开发中')}
                                    className="flex items-center gap-1 text-sm text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors border border-transparent hover:border-blue-100"
                                >
                                    <Plus size={16} /> 新建小组
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {MOCK_GROUPS.map(group => (
                                    <div key={group.id} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                                            <h5 className="font-bold text-slate-700">{group.name}</h5>
                                            <span className="bg-slate-50 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                                {group.members.length} Members
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            {group.members.map((member, idx) => (
                                                <div key={idx} className="flex items-center gap-3 group/member p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 overflow-hidden border border-white shadow-sm ring-2 ring-transparent group-hover/member:ring-blue-100 transition-all">
                                                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-700">{member.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <button className="w-full py-3 mt-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 text-xs font-bold hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2">
                                                <Plus size={14} /> 添加成员
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline Section */}
                    <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                        <div className="flex items-center justify-between mb-10">
                            <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <Clock className="text-blue-500" size={24} /> 项目生命周期
                            </h4>
                            <div className="flex gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已完成 {projectTasks.filter(t => t.status === TaskStatus.DONE).length}</span>
                                <span className="text-[10px] font-bold text-slate-300">/</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">总量 {projectTasks.length}</span>
                            </div>
                        </div>

                        <div className="relative border-l-4 border-slate-100 ml-4 space-y-12 pl-10 py-2">
                            {sortedTasks.length === 0 ? (
                                <div className="text-center py-12 text-slate-300 italic font-medium">暂无任务动态</div>
                            ) : (
                                sortedTasks.map((task, index) => {
                                    const assignee = users.find(u => (u.userId || u.id) === task.assigneeId);
                                    const date = task.completedAt || task.dueDate;
                                    const dateObj = new Date(date);
                                    const formattedDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                                    const isLatest = index === 0;

                                    return (
                                        <div
                                            key={task.id}
                                            className="relative group cursor-pointer"
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            <div className={`absolute -left-[54px] top-4 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 transition-all duration-500 ${isLatest ? 'bg-blue-600 scale-125 ring-4 ring-blue-100' : 'bg-slate-200 group-hover:bg-blue-400'}`}></div>

                                            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 group-hover:shadow-xl group-hover:border-blue-100 transition-all flex flex-col md:flex-row md:items-center gap-6">
                                                <div className="flex items-center gap-4 min-w-[160px]">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-white shadow-sm ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                                                        <img src={assignee?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800">{assignee?.name || '待认领'}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formattedDate}</div>
                                                    </div>
                                                </div>

                                                <div className="flex-1">
                                                    <h5 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight">{task.title}</h5>
                                                    <p className="text-slate-400 text-sm mt-1 line-clamp-1 font-medium italic opacity-80">{task.description}</p>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.1em] shadow-sm ${task.status === TaskStatus.DONE ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            task.status === TaskStatus.IN_PROGRESS ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                                                'bg-slate-50 text-slate-400 border border-slate-100'
                                                        }`}>
                                                        {task.status}
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
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">任务指挥中心</h1>
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
                />
            )}
        </div>
    );
};