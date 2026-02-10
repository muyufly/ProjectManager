import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../constants';
import { TaskStatus, TaskPriority } from '../types';
import type { Task } from '../types';
import { Plus, MoreHorizontal, Calendar as CalendarIcon, Link as LinkIcon } from 'lucide-react';
import { DependencyGraph } from '../components/DependencyGraph';

export const ProjectBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { state, setState } = useContext(AppContext);
  const [viewMode, setViewMode] = useState<'board' | 'graph'>('board');

  const project = state.projects.find(p => p.id === projectId);
  const tasks = state.tasks.filter(t => t.projectId === projectId);

  if (!project) return <div>Project not found</div>;

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return 'bg-slate-100 border-slate-200';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-50 border-blue-200';
      case TaskStatus.REVIEW: return 'bg-amber-50 border-amber-200';
      case TaskStatus.DONE: return 'bg-emerald-50 border-emerald-200';
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const updatedTasks = state.tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setState({ ...state, tasks: updatedTasks });
  };

  const renderTaskCard = (task: Task) => {
    const assignee = state.users.find(u => u.id === task.assigneeId);
    
    return (
      <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-3 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            task.priority === TaskPriority.HIGH ? 'bg-red-100 text-red-600' :
            task.priority === TaskPriority.MEDIUM ? 'bg-orange-100 text-orange-600' :
            'bg-slate-100 text-slate-600'
          }`}>
            {task.priority}
          </span>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreHorizontal size={16} />
          </button>
        </div>
        <h4 className="text-sm font-semibold text-slate-800 mb-1">{task.title}</h4>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
        
        <div className="flex items-center justify-between border-t border-slate-50 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
             {task.dependencies.length > 0 && <LinkIcon size={12} className="text-indigo-500" />}
             <div className="flex items-center gap-1">
               <CalendarIcon size={12} />
               {task.dueDate}
             </div>
          </div>
          {assignee && (
            <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full border border-white shadow-sm" title={assignee.name} />
          )}
        </div>
        
        {/* Simple Status Move Controls */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex gap-1 justify-end">
             {task.status !== TaskStatus.TODO && (
                 <button onClick={() => handleStatusChange(task.id, TaskStatus.TODO)} className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600">Todo</button>
             )}
             {task.status !== TaskStatus.IN_PROGRESS && (
                 <button onClick={() => handleStatusChange(task.id, TaskStatus.IN_PROGRESS)} className="text-[10px] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-blue-600">Prog</button>
             )}
             {task.status !== TaskStatus.REVIEW && (
                 <button onClick={() => handleStatusChange(task.id, TaskStatus.REVIEW)} className="text-[10px] bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded text-amber-600">Rev</button>
             )}
              {task.status !== TaskStatus.DONE && (
                 <button onClick={() => handleStatusChange(task.id, TaskStatus.DONE)} className="text-[10px] bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded text-emerald-600">Done</button>
             )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
          <p className="text-slate-500 text-sm max-w-2xl">{project.description}</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-lg flex text-sm">
                <button 
                    onClick={() => setViewMode('board')}
                    className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Kanban
                </button>
                <button 
                    onClick={() => setViewMode('graph')}
                    className={`px-3 py-1.5 rounded-md transition-all ${viewMode === 'graph' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Dependencies
                </button>
            </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
            <Plus size={16} />
            New Task
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold mb-4">Task Dependency Graph</h3>
              <p className="text-slate-500 text-sm mb-4">Visualizing the order of operations. Tasks with arrows pointing to them depend on the source task.</p>
              <DependencyGraph tasks={tasks} onNodeClick={(id) => console.log('Clicked', id)} />
          </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
            <div className="flex gap-6 min-w-[1000px] h-full pb-4">
            {Object.values(TaskStatus).map((status) => (
                <div key={status} className="flex-1 min-w-[280px] flex flex-col">
                <div className={`flex items-center justify-between p-3 rounded-t-lg border-b-2 ${getStatusColor(status)}`}>
                    <h3 className="font-semibold text-slate-700 text-sm">{status.replace('_', ' ')}</h3>
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold text-slate-600">
                    {tasks.filter(t => t.status === status).length}
                    </span>
                </div>
                <div className={`flex-1 bg-slate-50/50 p-3 rounded-b-lg border-x border-b border-slate-200 overflow-y-auto`}>
                    {tasks.filter(t => t.status === status).map(renderTaskCard)}
                </div>
                </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
};