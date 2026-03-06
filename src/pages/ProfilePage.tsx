import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../constants';
import {
  User as UserIcon,
  Edit2,
  X,
  Save,
  Search,
  Key,
  ShieldCheck,
  Mail,
  Upload,
  Loader2,
  BadgeCheck,
  Building2,
  CreditCard,
  Hash,
  Activity,
  Calendar,
  Lock,
  Camera,
  UserPlus,
  Plus
} from 'lucide-react';
import { UserAPI, UploadAPI, AuthAPI, TeamAPI } from '../services/api';
import type { User } from '../types';

export const ProfilePage: React.FC = () => {
  const { state, setState } = useContext(AppContext);
  const { currentUser } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false);
  const [joinToken, setJoinToken] = useState('');
  const { refreshData } = useContext(AppContext);

  const [editForm, setEditForm] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    department: currentUser?.department || '',
    role: currentUser?.role || '',
    avatarUrl: currentUser?.avatarUrl || currentUser?.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        username: currentUser.username || '',
        email: currentUser.email || '',
        department: currentUser.department || '',
        role: currentUser.role || '',
        avatarUrl: currentUser.avatarUrl || currentUser.avatar || ''
      });
    }
  }, [currentUser]);

  const handleEdit = () => {
    setEditError(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEditError(null);

    // Strictly follow request payload requirements: all 5 fields must be present
    const submitPayload = {
      username: editForm.username || '',
      email: editForm.email || '',
      department: editForm.department || '',
      role: editForm.role || '',
      avatarUrl: editForm.avatarUrl || null // Respect backend requirement for null
    };

    // Safety: don't save blob urls
    if (submitPayload.avatarUrl && submitPayload.avatarUrl.startsWith('blob:')) {
      setEditError('头像上传中或已失败，请刷新后再试');
      setLoading(false);
      return;
    }

    try {
      await UserAPI.editInfo(submitPayload);
      const updatedUser = await UserAPI.getInfo();
      setState(prev => ({ ...prev, currentUser: updatedUser }));
      setIsEditing(false);
      alert('所有资料已成功同步到云端');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setEditError('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('请选择图片文件');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError('图片大小不能超过 5MB');
      return;
    }

    setUploadingAvatar(true);
    setEditError(null);
    try {
      const presignData = await UploadAPI.getPresignUpload({
        filename: file.name,
        contentType: file.type,
        dir: 'AVATAR',
        ownerId: currentUser?.userId || 0
      });

      const targetUrl = new URL(presignData.uploadUrl);
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isCdnUrl = targetUrl.hostname.includes('.cdn.');

      const uploadUrl = isDev
        ? (isCdnUrl ? `/oss-cdn-proxy${targetUrl.pathname}${targetUrl.search}` : `/oss-proxy${targetUrl.pathname}${targetUrl.search}`)
        : presignData.uploadUrl;

      console.log('Starting XHR Upload to:', uploadUrl);

      // Using XHR instead of fetch to bypass potential extension 'window.fetch' interception
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.setRequestHeader('x-amz-acl', 'public-read');

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        };
        xhr.onerror = () => reject(new Error('网络请求错误 (XHR Error)'));
        xhr.send(file);
      });

      // Resolve the final public URL correctly to avoid duplication
      const urlObj = new URL(presignData.uploadUrl);
      const cleanPath = presignData.objectKey || urlObj.pathname;
      const finalFileUrl = `https://projectmgr.sgp1.cdn.digitaloceanspaces.com/${cleanPath.replace(/^\//, '')}`;

      setEditForm(prev => ({ ...prev, avatarUrl: finalFileUrl }));
      alert('头像已上传！请点击“保存更改”来更新资料。');
    } catch (err) {
      console.error('Upload Error:', err);
      const localUrl = URL.createObjectURL(file);
      setEditForm(prev => ({ ...prev, avatarUrl: localUrl }));
      setEditError(`预览成功但同步失败: ${(err as Error).message}`);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      await AuthAPI.changePassword(passwordForm);
      alert('密码修改成功');
      setIsChangingPassword(false);
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (e) {
      alert('修改失败: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinToken.trim()) return;

    setLoading(true);
    try {
      // Extract token if a full URL was pasted
      const tokenMatch = joinToken.match(/token=([^&\s]+)/) || joinToken.match(/accept-invite\/([a-zA-Z0-9._-]+)/);
      const actualToken = tokenMatch ? tokenMatch[1] : joinToken.trim();

      await TeamAPI.acceptInvite(actualToken);
      alert('成功加入团队！');
      setIsJoinTeamModalOpen(false);
      setJoinToken('');
      if (refreshData) await refreshData();
    } catch (e) {
      console.error('Join team error:', e);
      alert('加入失败: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-10 pr-4 scrollbar-thin scrollbar-thumb-slate-200">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">个人中心</h1>
          <p className="text-slate-500 font-medium mt-1">管理您的个人信息与账号安全</p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-sm border border-slate-200"
          >
            <Edit2 size={16} /> 编辑资料
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="bg-white hover:bg-slate-100 text-slate-600 px-5 py-2.5 rounded-2xl font-bold transition-all flex items-center gap-2 border border-slate-200 shadow-sm"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 保存更改
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

        {/* Left Column: Profile Card & Security */}
        <div className="xl:col-span-1 space-y-6">
          {/* Main ID Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center relative overflow-hidden text-center">
            {/* Background design */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-90"></div>

            <div className="relative mt-8 mb-4 group">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <img
                  src={(isEditing ? editForm.avatarUrl : currentUser?.avatar) || undefined}
                  alt="Avatar"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${(!(isEditing ? editForm.avatarUrl : currentUser?.avatar)) ? 'opacity-0' : 'opacity-100'}`}
                />
                {(!(isEditing ? editForm.avatarUrl : currentUser?.avatar)) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-300">
                    <UserIcon size={56} />
                  </div>
                )}
                {isEditing && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  >
                    {uploadingAvatar ? <Loader2 className="animate-spin mb-1" size={20} /> : <Camera size={20} className="mb-1" />}
                    <span className="text-xs font-bold">更换</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
            </div>

            <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
              {currentUser?.realname || currentUser?.username}
              <BadgeCheck size={20} className="text-blue-500" />
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">{currentUser?.role || '普通成员'}</p>

            <div className="w-full h-px bg-slate-100 my-6"></div>

            <div className="w-full space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><CreditCard size={16} /></div>
                <div>
                  <p className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest">工号 / 学号</p>
                  <p className="font-bold text-slate-700">{currentUser?.sduId || '未绑定'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><Calendar size={16} /></div>
                <div>
                  <p className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest">注册时间</p>
                  <p className="font-bold text-slate-700">{currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : '未知'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><Activity size={16} /></div>
                <div>
                  <p className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest">账号状态</p>
                  <p className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {currentUser?.isActive !== false ? '正常激活' : '已停用'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Action */}
          <div className="space-y-3">
            <button
              onClick={() => setIsChangingPassword(true)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md hover:bg-blue-50/50 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 group-hover:bg-white rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-800 transition-colors">修改登录密码</p>
                  <p className="text-xs font-bold text-slate-400">定期更新以保护安全</p>
                </div>
              </div>
              <Key size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </button>

            <button
              onClick={() => setIsJoinTeamModalOpen(true)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md hover:bg-emerald-50/50 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 group-hover:bg-white rounded-xl flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors shadow-sm">
                  <UserPlus size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-800 transition-colors">加入新团队</p>
                  <p className="text-xs font-bold text-slate-400">输入邀请令牌或链接</p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <Plus size={14} strokeWidth={3} />
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Settings Form & Search */}
        <div className="xl:col-span-3 space-y-6">

          {/* Main Info Form */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative">
            {editError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <Lock size={18} /> {editError}
              </div>
            )}

            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <UserIcon size={20} className="text-blue-600" /> 基本资料设置
            </h3>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 ml-1">用户名昵称</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500">
                      <Hash size={16} />
                    </div>
                    <input
                      type="text"
                      value={isEditing ? editForm.username : (currentUser?.username || '未设置')}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 disabled:bg-slate-50/50 text-slate-800 font-bold rounded-xl border border-slate-200 disabled:border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 ml-1">真实姓名 (实名)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <UserIcon size={16} />
                    </div>
                    <input
                      type="text"
                      value={currentUser?.realname || '未认证'}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-slate-100/50 text-slate-500 font-bold rounded-xl border border-transparent outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 ml-1">电子邮箱</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={isEditing ? editForm.email : (currentUser?.email || '')}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="user@sdu.edu.cn"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 disabled:bg-slate-50/50 text-slate-800 font-bold rounded-xl border border-slate-200 disabled:border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 ml-1">所属部门</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500">
                      <Building2 size={16} />
                    </div>
                    <input
                      type="text"
                      value={isEditing ? editForm.department : (currentUser?.department || '')}
                      onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="网络中心"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 disabled:bg-slate-50/50 text-slate-800 font-bold rounded-xl border border-slate-200 disabled:border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 ml-1">身份角色 / Identity</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500">
                      <BadgeCheck size={16} />
                    </div>
                    <input
                      type="text"
                      value={isEditing ? editForm.role : (currentUser?.role || '普通成员')}
                      onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="例如: 开发工程师"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 disabled:bg-slate-50/50 text-slate-800 font-bold rounded-xl border border-slate-200 disabled:border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Directory Search Block */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Search className="text-blue-600" size={20} /> 组织架构搜索
            </h3>

            <form onSubmit={handleSearch} className="relative flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入工号、姓名或部门进行匹配查询..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-slate-700"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 min-w-[100px] flex justify-center"
              >
                {searching ? <Loader2 className="animate-spin" size={20} /> : '查找'}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
                {searchResults.map(u => (
                  <div key={u.id || u.userId} className="flex items-center gap-4 p-3 border border-slate-100 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-md hover:border-blue-100 transition-all cursor-default group">
                    <img src={u.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{u.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{u.department || '未分配部门'}</p>
                    </div>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                      {u.role === 'Admin' ? '管理员' : '成员'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && !searching && (
              <div className="text-center py-8 text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                没有找到匹配的用户
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Password Change Modal - Kept same logic, slightly polished */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsChangingPassword(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 mx-auto mb-4 border border-blue-100">
                <Lock size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-800">修改登录密码</h3>
              <p className="text-slate-500 font-medium text-sm mt-1">请妥善保管您的新密码</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 ml-1">当前密码</label>
                <input
                  type="password"
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 ml-1">新密码</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} 确认修改
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Join Team Modal */}
      {isJoinTeamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsJoinTeamModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600 mx-auto mb-4 border border-emerald-100">
                <UserPlus size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-800">加入新团队</h3>
              <p className="text-slate-500 font-medium text-sm mt-1">粘贴邀请链接或 Token 以加入</p>
            </div>

            <form onSubmit={handleJoinTeam} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 ml-1">邀请地址 / Token</label>
                <textarea
                  required
                  rows={3}
                  placeholder="https://.../accept-invite/YOUR_TOKEN"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 text-sm resize-none"
                />
                <p className="text-[10px] text-slate-400 font-bold px-1">支持粘贴完整的邮件链接或仅粘贴 Token 字符串</p>
              </div>

              <button
                type="submit"
                disabled={loading || !joinToken.trim()}
                className="w-full mt-2 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={3} />} 立即加入
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};