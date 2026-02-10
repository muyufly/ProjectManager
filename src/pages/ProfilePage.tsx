import React, { useContext } from 'react';
import { AppContext } from '../constants';
import { Clock, User as UserIcon, Briefcase } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { state } = useContext(AppContext);
  const { currentUser, projects, workLogs } = state;

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-10 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
        {/* Personal Info Header */}
        <div className="bg-blue-100 px-6 py-2.5 rounded-xl shadow-sm w-fit inline-flex items-center gap-2">
             <UserIcon size={18} className="text-blue-600" />
             <h2 className="text-xl font-bold text-slate-800">个人信息</h2>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-32 h-32 rounded-full bg-slate-200 overflow-hidden border-4 border-slate-50 shadow-md ring-1 ring-slate-200 shrink-0">
                 <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-4 flex-1">
                <div className="flex items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-500 w-32 uppercase text-xs tracking-wider">姓名</span>
                    <span className="text-xl text-slate-800 font-bold">{currentUser.name}</span>
                </div>
                <div className="flex items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-500 w-32 uppercase text-xs tracking-wider">院系</span>
                    <span className="text-lg text-slate-800">{currentUser.department || 'N/A'}</span>
                </div>
                <div className="flex items-center pb-2">
                    <span className="font-bold text-slate-500 w-32 uppercase text-xs tracking-wider">职位</span>
                    <span className="text-lg text-slate-800">{currentUser.jobTitle || currentUser.role}</span>
                </div>
            </div>
        </div>

        {/* Work Logs Section */}
        <div className="bg-blue-100 px-6 py-2.5 rounded-xl shadow-sm w-fit inline-flex items-center gap-2 mt-4">
             <Clock size={18} className="text-blue-600" />
             <h2 className="text-xl font-bold text-slate-800">工作日志</h2>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                {workLogs.map((log) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                         {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-300 group-hover:bg-blue-500 transition-colors shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Clock size={16} className="text-white" />
                        </div>
                        
                        {/* Content Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group-hover:border-blue-200">
                            <div className="flex items-center justify-between space-x-2 mb-2">
                                <span className="font-bold text-slate-800 text-lg">{log.date}</span>
                                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{log.hours}小时工作</span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {log.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* My Projects Section */}
        <div className="bg-blue-100 px-6 py-2.5 rounded-xl shadow-sm w-fit inline-flex items-center gap-2 mt-4">
             <Briefcase size={18} className="text-blue-600" />
             <h2 className="text-xl font-bold text-slate-800">我的项目</h2>
        </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 text-center font-bold text-slate-700 uppercase text-xs tracking-wider w-1/4">项目名称</th>
                  <th className="px-6 py-5 text-center font-bold text-slate-700 uppercase text-xs tracking-wider w-1/3">项目简介</th>
                  <th className="px-6 py-5 text-center font-bold text-slate-700 uppercase text-xs tracking-wider">状态</th>
                  <th className="px-6 py-5 text-center font-bold text-slate-700 uppercase text-xs tracking-wider">截止日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-6 font-bold text-slate-800 text-center text-base">{project.name}</td>
                    <td className="px-6 py-6 text-slate-600 text-sm leading-relaxed">{project.description}</td>
                    <td className="px-6 py-6 text-center">
                        <span className={`font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wide border ${
                             project.status === 'Active' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                             project.status === 'Archived' ? 'bg-red-50 text-red-600 border-red-200' : 
                             project.status === 'Pending' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200'
                        }`}>
                            {project.status === 'Active' ? '进行中' : 
                             project.status === 'Archived' ? '已结束' : 
                             project.status === 'Pending' ? '未开始' : '已完成'}
                        </span>
                    </td>
                    <td className="px-6 py-6 text-slate-800 font-bold text-base text-center">{project.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
};