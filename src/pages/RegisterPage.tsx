import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthAPI } from '../services/api';

export const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // basic validation matching OpenAPI constraints
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
            setError('用户名只能包含字母、数字、下划线和汉字');
            return;
        }
        if (username.length < 2 || username.length > 20) {
            setError('用户名长度需在2-20字之间');
            return;
        }
        if (password.length < 6 || password.length > 32) {
            setError('密码长度需在6-32字之间');
            return;
        }

        setLoading(true);
        try {
            await AuthAPI.register({ username, email, password, avatarUrl: '' });
            navigate('/login');
        } catch (err: any) {
            console.error("Register Error:", err);
            setError(err.message || '注册失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f0f6fa] flex items-center justify-center p-4">
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">S</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">创建 学生在线 账号</h1>
                    <p className="text-slate-500 mt-2">开始你的项目协作之旅</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">用户名</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
                            placeholder="2-20位字符"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">邮箱</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">密码</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
                            placeholder="最少6位密码"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center mt-2"
                    >
                        {loading ? '注册中...' : '注册'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    已有账号？ <Link to="/login" className="text-blue-500 font-bold hover:underline">去登录</Link>
                </div>
            </div>
        </div>
    );
};
