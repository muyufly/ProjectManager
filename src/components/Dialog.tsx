import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type DialogType = 'success' | 'danger' | 'warning' | 'info';

interface DialogState {
    isOpen: boolean;
    title: string;
    message: string;
    type: DialogType;
    confirmText: string;
    cancelText: string | null;
    showInput: boolean;
    inputValue: string;
    inputPlaceholder: string;
    onConfirm: (value?: string) => void;
    onCancel: () => void;
}

const initialState: DialogState = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: '确认',
    cancelText: null,
    showInput: false,
    inputValue: '',
    inputPlaceholder: '',
    onConfirm: () => {},
    onCancel: () => {},
};

// 全局状态管理
let globalSetDialog: React.Dispatch<React.SetStateAction<DialogState>> | null = null;

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dialog, setDialog] = useState<DialogState>(initialState);
    
    // 保存 setDialog 到全局变量
    React.useEffect(() => {
        globalSetDialog = setDialog;
        return () => {
            globalSetDialog = null;
        };
    }, []);

    const handleClose = () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = () => {
        dialog.onConfirm(dialog.showInput ? dialog.inputValue : undefined);
        handleClose();
    };

    const handleCancel = () => {
        dialog.onCancel();
        handleClose();
    };

    const getIcon = () => {
        switch (dialog.type) {
            case 'success':
                return <CheckCircle2 size={28} className="text-emerald-600" />;
            case 'danger':
                return <AlertCircle size={28} className="text-red-600" />;
            case 'warning':
                return <AlertCircle size={28} className="text-amber-600" />;
            default:
                return <AlertCircle size={28} className="text-blue-600" />;
        }
    };

    const getIconBg = () => {
        switch (dialog.type) {
            case 'success':
                return 'bg-emerald-100';
            case 'danger':
                return 'bg-red-100';
            case 'warning':
                return 'bg-amber-100';
            default:
                return 'bg-blue-100';
        }
    };

    const getButtonColor = () => {
        switch (dialog.type) {
            case 'success':
                return 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200';
            case 'danger':
                return 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200';
            case 'warning':
                return 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200';
            default:
                return 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-200';
        }
    };

    return (
        <>
            {children}
            {dialog.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getIconBg()}`}>
                                {getIcon()}
                            </div>
                            <h3 className="text-xl font-black text-slate-800">{dialog.title}</h3>
                        </div>
                        
                        <p className="text-slate-600 mb-6 whitespace-pre-line leading-relaxed">
                            {dialog.message}
                        </p>

                        {/* 输入框 */}
                        {dialog.showInput && (
                            <div className="mb-6">
                                <input
                                    type="text"
                                    value={dialog.inputValue}
                                    onChange={(e) => setDialog(prev => ({ ...prev, inputValue: e.target.value }))}
                                    placeholder={dialog.inputPlaceholder}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-slate-800"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirm();
                                        if (e.key === 'Escape') handleCancel();
                                    }}
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            {dialog.cancelText && (
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                >
                                    {dialog.cancelText}
                                </button>
                            )}
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 px-6 py-3 rounded-xl font-bold text-white transition-all ${getButtonColor()}`}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// 全局弹窗函数
export const showAlert = (title: string, message: string, type: DialogType = 'info'): Promise<void> => {
    return new Promise((resolve) => {
        if (!globalSetDialog) {
            console.error('DialogProvider not mounted');
            resolve();
            return;
        }
        globalSetDialog({
            ...initialState,
            isOpen: true,
            title,
            message,
            type,
            confirmText: '知道了',
            cancelText: null,
            onConfirm: () => resolve(),
            onCancel: () => resolve(),
        });
    });
};

export const showConfirm = (title: string, message: string, type: DialogType = 'warning'): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!globalSetDialog) {
            console.error('DialogProvider not mounted');
            resolve(false);
            return;
        }
        globalSetDialog({
            ...initialState,
            isOpen: true,
            title,
            message,
            type,
            confirmText: '确认',
            cancelText: '取消',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
        });
    });
};

export const showPrompt = (title: string, message: string, placeholder: string = ''): Promise<string | null> => {
    return new Promise((resolve) => {
        if (!globalSetDialog) {
            console.error('DialogProvider not mounted');
            resolve(null);
            return;
        }
        globalSetDialog({
            ...initialState,
            isOpen: true,
            title,
            message,
            type: 'info',
            confirmText: '确认',
            cancelText: '取消',
            showInput: true,
            inputValue: '',
            inputPlaceholder: placeholder,
            onConfirm: (value) => resolve(value || null),
            onCancel: () => resolve(null),
        });
    });
};

// 错误提示
export const showError = (message: string, title: string = '操作失败'): Promise<void> => {
    return showAlert(title, message, 'danger');
};

// 成功提示
export const showSuccess = (message: string, title: string = '操作成功'): Promise<void> => {
    return showAlert(title, message, 'success');
};
