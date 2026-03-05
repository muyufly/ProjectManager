import React, { useContext, useState } from 'react';
import { AppContext } from '../constants';
import { Clock, User as UserIcon, Briefcase, Edit2, X, Save, Search, Key, ShieldCheck, Mail, UserPlus } from 'lucide-react';
import { UserAPI } from '../services/api';
import type { User } from '../types';

export const ProfilePage: React.FC = () => {
  const { state, setState } = useContext(AppContext);
  const { currentUser, projects, workLogs } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const [editForm, setEditForm] = useState({
    name: currentUser?.name || '',
    department: currentUser?.department || '',
    jobTitle: currentUser?.jobTitle || '',
    avatar: currentUser?.avatar || ''
  });
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setEditForm({
      name: currentUser?.name || '',
      department: currentUser?.department || '',
      jobTitle: currentUser?.jobTitle || '',
      avatar: currentUser?.avatar || ''
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await UserAPI.editInfo(editForm);
      const updatedUser = await UserAPI.getInfo();
      setState(prev => ({ ...prev, currentUser: updatedUser }));
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await UserAPI.search(searchQuery, 1, 10);
      setSearchResults(res.items || []);
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setSearching(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await UserAPI.changePassword(passwordForm);
      alert('密码修改成功');
      setIsChangingPassword(false);
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (e) {
      alert('修改失败: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-10 pr-2 scrollbar-thin scrollbar-thumb-slate-200 relative">
      {/* Personal Info Header */}
      <div className="flex items-center justify-between">
        <div className="bg-blue-100 px-6 py-2.5 rounded-xl shadow-sm w-fit inline-flex items-center gap-2">
          <UserIcon size={18} className="text-blue-600" />
          <h2 className="text-xl font-bold text-slate-800">个人中心</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsChangingPassword(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <Key size={16} />
            修改密码
          </button>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-100"
          >
            <Edit2 size={16} />
            编辑资料
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {currentUser && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-32 -translate-y-32"></div>
              <div className="w-32 h-32 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100 shrink-0 relative z-10">
                <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4 flex-1 relative z-10 w-full">
                <div className="flex items-center border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-400 w-24 uppercase text-[10px] tracking-widest">姓名</span>
                  <span className="text-2xl text-slate-800 font-black">{currentUser.name}</span>
                </div>
                <div className="flex items-center border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-400 w-24 uppercase text-[10px] tracking-widest">院系</span>
                  <span className="text-lg text-slate-700 font-bold">{currentUser.department || '校开发委员会'}</span>
                </div>
                <div className="flex items-center pb-2">
                  <span className="font-bold text-slate-400 w-24 uppercase text-[10px] tracking-widest">职位</span>
                  <span className="text-lg text-slate-700 font-bold">{currentUser.jobTitle || currentUser.role}</span>
                </div>
              </div>
            </div>
          )}

          {/* Work Logs */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" /> 工作动态
            </h3>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
              {workLogs.length === 0 ? (
                <div className="pl-12 text-slate-400 italic py-4">暂无动态</div>
              ) : (
                workLogs.map((log) => (
                  <div key={log.id} className="relative flex items-center group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 group-hover:bg-blue-500 transition-colors shadow-sm shrink-0 z-10">
                      <Clock size={16} className="text-white" />
                    </div>
                    <div className="ml-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex-1 hover:border-blue-200 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-800">{log.date}</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">{log.hours} HOURS</span>
                      </div>
                      <p className="text-slate-600 text-sm">{log.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* User Search */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Search size={20} className="text-blue-500" /> 用户搜索
            </h3>
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="输入姓名搜索..."
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm transition-all"
              />
              <button type="submit" className="absolute right-2 top-2 p-1 text-slate-400 hover:text-blue-500 transition-colors">
                <Search size={18} />
              </button>
            </form>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {searching ? <div className="text-center py-4 text-slate-400 text-sm">搜索中...</div> :
                searchResults.length === 0 && searchQuery ? <div className="text-center py-4 text-slate-400 text-sm">未找到相关用户</div> :
                  searchResults.map(u => (
                    <div key={u.userId || u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                      <img src={u.avatar} className="w-8 h-8 rounded-full" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{u.department || 'SDU'}</div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="邀请">
                        <UserPlus size={16} />
                      </button>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Status Stats */}
          <div className="bg-indigo-600 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/50 to-transparent"></div>
            <ShieldCheck size={120} className="absolute -bottom-10 -right-10 text-white/10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <h4 className="font-bold text-indigo-100 text-xs uppercase tracking-widest mb-4">项目参与度</h4>
              <div className="text-5xl font-black mb-2">{projects.length}</div>
              <p className="text-indigo-100 text-sm">活跃项目总数</p>
              <div className="mt-8 pt-6 border-t border-indigo-500/30 flex justify-between">
                <div>
                  <div className="text-xl font-bold">12</div>
                  <div className="text-[10px] text-indigo-200 uppercase">已完成任务</div>
                </div>
                <div>
                  <div className="text-xl font-bold">4</div>
                  <div className="text-[10px] text-indigo-200 uppercase">待办事项</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">编辑资料</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              {/* Form Fields... */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">姓名</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">院系</label>
                    <input type="text" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">职位</label>
                    <input type="text" value={editForm.jobTitle} onChange={e => setEditForm({ ...editForm, jobTitle: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">头像 URL</label>
                  <input type="text" value={editForm.avatar} onChange={e => setEditForm({ ...editForm, avatar: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">取消</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 px-6 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                  <Save size={18} /> 保存更改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white">
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">修改密码</h3>
              <button onClick={() => setIsChangingPassword(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">旧密码</label>
                  <input type="password" required value={passwordForm.oldPassword} onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">新密码</label>
                  <input type="password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                {loading ? '同步中...' : <><Key size={18} /> 确认修改</>}
              </button>
            </form>
          </div>
        </div>
      )}

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
                    <span className={`font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wide border ${project.status === 'Active' ? 'bg-orange-50 text-orange-600 border-orange-200' :
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