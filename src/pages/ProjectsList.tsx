import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../constants';
import { Folder, Users as UsersIcon, Calendar } from 'lucide-react';
import { getProjectProgress } from '../services/projectService';

export const ProjectsList: React.FC = () => {
  const { state } = useContext(AppContext);
  const { projects, tasks, users } = state;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => {
          const progress = getProjectProgress(tasks, project.id);
          const manager = users.find(u => u.id === project.managerId);

          return (
            <Link key={project.id} to={`/project/${project.id}`} className="block group">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition">
                    <Folder size={24} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition">{project.name}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">{project.description}</p>

                <div className="space-y-4">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span className="font-medium text-slate-700">{progress}%</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex -space-x-2">
                      {project.memberIds.slice(0, 3).map(mid => {
                        const user = users.find(u => u.id === mid);
                        return user ? (
                          <img key={mid} src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white" alt={user.name} />
                        ) : null;
                      })}
                      {project.memberIds.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                          +{project.memberIds.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                       <Calendar size={12} />
                       {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};