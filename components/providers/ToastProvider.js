"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext({});

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ title, description, type = 'info', duration = 5000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, title, description, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }) {
    const icons = {
        success: <CheckCircle size={20} className="text-green-400" />,
        error: <AlertCircle size={20} className="text-red-400" />,
        info: <Info size={20} className="text-cyan-400" />,
        warning: <AlertCircle size={20} className="text-yellow-400" />
    };

    const borders = {
        success: 'border-green-500/20 bg-green-500/10',
        error: 'border-red-500/20 bg-red-500/10',
        info: 'border-cyan-500/20 bg-cyan-500/10',
        warning: 'border-yellow-500/20 bg-yellow-500/10'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto w-80 p-4 rounded-xl border backdrop-blur-md shadow-lg flex items-start gap-3 ${borders[toast.type] || borders.info}`}
        >
            <div className="mt-0.5">{icons[toast.type] || icons.info}</div>
            <div className="flex-1">
                {toast.title && <h4 className="text-sm font-semibold text-gray-200">{toast.title}</h4>}
                {toast.description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{toast.description}</p>}
            </div>
            <button onClick={() => onDismiss(toast.id)} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
            </button>
        </motion.div>
    );
}

export const useToast = () => useContext(ToastContext);
