import React, { useContext } from 'react';
import { AppContext } from '../constants';
import { Mail, Shield, User as UserIcon } from 'lucide-react';

export const TeamView: React.FC = () => {
  const { state } = useContext(AppContext);
  const { users, teams } = state;
  const currentTeam = teams[0]; // Simplification for demo

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{currentTeam.name}</h1>
            <p className="text-slate-500 mt-1">Manage your team members and permissions.</p>
          </div>
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm">
            Invite Member
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Team Members ({currentTeam.memberIds.length})</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50">
                <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Member</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {currentTeam.memberIds.map(memberId => {
                const user = users.find(u => u.id === memberId);
                if (!user) return null;
                return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        <div>
                            <div className="font-medium text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail size={12} /> {user.name.toLowerCase().replace(' ', '.')}@example.com
                            </div>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        user.role === 'Manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {user.role === 'Admin' && <Shield size={12} />}
                        {user.role}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                        </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                    </td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};