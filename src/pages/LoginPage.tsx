import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthAPI, UserAPI } from '../services/api';
import { AppContext } from '../constants';

export const LoginPage: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setState } = useContext(AppContext);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            console.log("Calling AuthAPI.login...");
            const res = await AuthAPI.login({ identifier, password });
            console.log("Login response:", res);
            localStorage.setItem('student_online_token', res.token);

            // Fetch full user info after login
            console.log("Fetching user info...");
            const userInfo = await UserAPI.getInfo();
            console.log("User info fetched:", userInfo);
            setState(prev => ({ ...prev, currentUser: userInfo }));
            console.log("Redirecting to root...");
            navigate('/');
        } catch (err: any) {
            console.error("Login Error:", err);
            setError(err.message || '登录失败，请检查用户名/邮箱和密码');
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
                    <h1 className="text-2xl font-bold text-slate-800">欢迎回到 Student Online</h1>
                    <p className="text-slate-500 mt-2">使用用户名或邮箱登录</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">用户名 / 邮箱</label>
                        <input
                            type="text"
                            required
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
                            placeholder="请输入用户名或邮箱"
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
                            placeholder="请输入密码"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm transition-colors flex justify-center items-center"
                    >
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    还没有账号？ <Link to="/register" className="text-blue-500 font-bold hover:underline">立即注册</Link>
                </div>
            </div>
        </div>
    );
};
