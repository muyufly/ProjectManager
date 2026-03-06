import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../constants';
import { UserAPI } from '../services/api';

export const AuthCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshData } = useContext(AppContext);

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');

            if (token) {
                try {
                    localStorage.setItem('student_online_token', token);
                    await refreshData();
                    navigate('/');
                } catch (err) {
                    console.error('Unified auth callback error:', err);
                    navigate('/login?error=auth_failed');
                }
            } else {
                navigate('/login');
            }
        };

        handleCallback();
    }, [location, navigate, refreshData]);

    return (
        <div className="min-h-screen bg-[#f0f6fa] flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">正在完成统一身份认证...</p>
            </div>
        </div>
    );
};
