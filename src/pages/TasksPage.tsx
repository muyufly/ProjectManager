import React, { useContext } from 'react';
import { AppContext } from '../constants';
import type { Project } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, Send, MessageSquare, Users as UsersIcon, Plus } from 'lucide-react';

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
  const { state } = useContext(AppContext);
  const { projects, tasks, users } = state;
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [showDivision, setShowDivision] = React.useState<Record<string, boolean>>({});

  const toggleDivision = (projectId: string) => {
    setShowDivision(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  // Filter projects if ID is present
  const visibleProjects = projectId 
    ? projects.filter(p => p.id === projectId)
    : projects;

  const handleAction = (actionName: string) => {
    // Placeholder for interaction feedback
    alert(`${actionName} 功能即将上线!`);
  };

  const renderProjectCard = (project: Project) => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    
    // Sort by date descending for timeline view
    const sortedTasks = [...projectTasks].sort((a, b) => {
        const dateA = a.completedAt || a.dueDate;
        const dateB = b.completedAt || b.dueDate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return (
      <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/50 gap-4">
           <div className="flex items-center gap-3">
                <div className="w-3 h-8 bg-blue-500 rounded-full"></div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            project.status === 'Active' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                            project.status === 'Completed' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                            {project.status === 'Active' ? '进行中' : 
                             project.status === 'Completed' ? '已完成' :
                             project.status === 'Archived' ? '已结束' : '未开始'}
                        </span>
                    </div>
                </div>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
                <button 
                    onClick={() => toggleDivision(project.id)}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-full border border-blue-400 text-sm font-bold transition-colors shadow-sm ${
                        showDivision[project.id] 
                        ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-200' 
                        : 'text-blue-500 hover:bg-blue-50'
                    }`}
                >
                    查看分工
                </button>
                <button 
                    onClick={() => handleAction('发布任务')}
                    className="flex-1 md:flex-none px-4 py-2 rounded-full border border-blue-400 text-blue-500 text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm"
                >
                    发布任务
                </button>
                <button 
                    onClick={() => handleAction('查看我的发布')}
                    className="flex-1 md:flex-none px-4 py-2 rounded-full border border-blue-400 text-blue-500 text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm"
                >
                    查看我的发布
                </button>
           </div>
        </div>
        
        {/* Card Body */}
        <div className="p-6 md:p-8">
            {/* Role Groups Section */}
            {showDivision[project.id] && (
                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <UsersIcon className="text-blue-500" size={24} />
                            <h4 className="text-lg font-bold text-slate-800">项目分工</h4>
                        </div>
                        <button 
                            onClick={() => handleAction('新建小组')}
                            className="flex items-center gap-1 text-sm text-blue-600 font-bold hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            新建小组
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {MOCK_GROUPS.map(group => (
                            <div key={group.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
                                    <h5 className="font-bold text-slate-700">{group.name}</h5>
                                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">
                                        {group.members.length}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {group.members.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-3 group/member p-1 rounded-lg hover:bg-slate-50 transition-colors">
                                            <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-slate-100" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700">{member.name}</span>
                                                <span className="text-[10px] text-slate-400">{member.role}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full py-2 mt-2 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-1">
                                        <Plus size={12} />
                                        添加成员
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline Section */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 shadow-inner">
                <div className="flex items-center gap-2 mb-8">
                    <Calendar className="text-blue-500" size={24} />
                    <h4 className="text-lg font-bold text-slate-800">团队日历</h4>
                </div>
                
                <div className="relative border-l-2 border-slate-200 ml-3 md:ml-6 space-y-8 pl-8 md:pl-10 py-2">
                    {sortedTasks.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">暂无时间轴记录。</p>
                    ) : (
                        sortedTasks.map((task, index) => {
                            const assignee = users.find(u => u.id === task.assigneeId);
                            const date = task.completedAt || task.dueDate;
                            const dateObj = new Date(date);
                            const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                            
                            // Visual variation for the latest task
                            const isLatest = index === 0;

                            return (
                                <div key={task.id} className="relative group">
                                    {/* Timeline Node */}
                                    <span className={`absolute -left-[41px] md:-left-[49px] top-1 h-5 w-5 rounded-full border-4 border-white shadow-sm transition-all duration-300 ${isLatest ? 'bg-blue-500 scale-110' : 'bg-slate-300 group-hover:bg-blue-400'}`}></span>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 bg-white p-4 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                        <div className="text-slate-500 font-medium min-w-[120px] text-sm md:text-base">
                                            {formattedDate}
                                        </div>
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                             {assignee && (
                                                <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full" />
                                             )}
                                             <span className="font-bold text-slate-700">{assignee?.name || '未知'}</span>
                                        </div>
                                        <div className="text-slate-800 flex-1 font-medium text-base">
                                            {task.title}
                                        </div>
                                        <div className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500">
                                            {task.status === 'DONE' ? '已完成' : 
                                             task.status === 'IN_PROGRESS' ? '进行中' :
                                             task.status === 'REVIEW' ? '审核中' : '待办'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            {/* Actions Footer */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex gap-4 w-full md:w-auto">
                     <button 
                        onClick={() => handleAction('相关文件')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border-2 border-blue-100 text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-200 transition-all text-sm"
                     >
                        <FileText size={16} /> 相关文件
                    </button>
                     <button 
                        onClick={() => handleAction('提交我的部分')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-blue-500 text-white font-bold hover:bg-blue-600 shadow-sm hover:shadow transition-all text-sm"
                     >
                        <Send size={16} /> 提交我的部分
                    </button>
                </div>
                 <div className="flex gap-4 w-full md:w-auto">
                     <button 
                        onClick={() => handleAction('发布评论')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-800 transition-all text-sm"
                     >
                        <MessageSquare size={16} /> 发布评论
                    </button>
                     <button 
                        onClick={() => handleAction('查看评论')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-800 transition-all text-sm"
                     >
                        查看评论
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">任务管理</h1>
        {visibleProjects.map(renderProjectCard)}
      </div>
    </div>
  );
};