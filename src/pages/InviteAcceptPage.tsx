import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TeamAPI } from '../services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const InviteAcceptPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const accept = async () => {
            if (!token) return;
            try {
                await TeamAPI.acceptInvite(token);
                setStatus('success');
                setTimeout(() => navigate('/'), 3000);
            } catch (e: any) {
                setStatus('error');
                setMessage(e.message || '接受邀请失败，可能已过期');
            }
        };
        accept();
    }, [token, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-blue-500 animate-spin" />
                    <p className="text-xl font-bold text-slate-700">正在验证邀请...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="flex flex-col items-center gap-4 bg-white p-12 rounded-3xl shadow-xl border border-green-100">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800">加入成功!</h1>
                    <p className="text-slate-500 max-w-sm">您已成功加入团队。正在为您跳转到首页...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="flex flex-col items-center gap-4 bg-white p-12 rounded-3xl shadow-xl border border-red-100">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <XCircle size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800">邀请无效</h1>
                    <p className="text-slate-500 max-w-sm">{message}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all"
                    >
                        返回首页
                    </button>
                </div>
            )}
        </div>
    );
};
