import { useRouter } from 'next/navigation';
import { useToast } from '../providers/ToastProvider';
import { useCallback, useEffect, useState, useRef } from 'react';

import { Modal } from '../ui/Modal';
import { StatusCreate } from './StatusCreate';
import { motion } from 'framer-motion';
import { Plus, User, Trash2, Loader2, Clock } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

export function StatusFeed({ onStatusSelect }) {
    const router = useRouter();
    const { addToast } = useToast();
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        // Create abort controller for cleanup
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Fetch current user
        const fetchCurrentUser = async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    signal,
                    credentials: 'include'
                });
                const data = await res.json();
                if (data.user) setCurrentUserId(data.user._id);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Auth check error:", err);
                }
            }
        };

        // Fetch statuses
        const fetchStatuses = async () => {
            try {
                const res = await fetch('/api/status', {
                    signal,
                    credentials: 'include'
                });
                const data = await res.json();
                if (data.statuses) setStatuses(data.statuses);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Fetch Status Error:", err);
                    addToast({ title: 'Error', description: "Failed to load status updates.", type: 'error' });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
        fetchStatuses();

        // Cleanup on unmount
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [addToast]); // Only addToast in dependencies

    const myStatus = statuses.find(s => String(s.creatorId?._id || s.creatorId) === String(currentUserId));

    return (
        <div className="h-full flex flex-col bg-black/20">
            <Modal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                title="Broadcast Transmission"
            >
                <StatusCreate
                    onCancel={() => setShowCreate(false)}
                    onCreated={(newStatus) => {
                        setStatuses(prev => [newStatus, ...prev]);
                        setShowCreate(false);
                        addToast({ title: 'Success', description: 'Status transmission stabilized.', type: 'success' });
                    }}
                />
            </Modal>

            <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
                {/* My Status Entry */}
                <div className="space-y-3">
                    <h4 className="text-xs text-cyan-400 uppercase tracking-widest font-bold px-2 flex items-center gap-2">
                        <User size={12} className="text-cyan-400" />
                        MY STATUS
                    </h4>

                    {myStatus ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-2xl border border-cyan-500/50 group relative overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        >
                            <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest rounded-bl-xl z-10 shadow-lg">
                                YOU
                            </div>
                            <div
                                onClick={() => onStatusSelect(myStatus._id)}
                                className="w-16 h-16 rounded-full p-0.5 border-2 border-cyan-400 relative cursor-pointer"
                            >
                                <div className="w-full h-full rounded-full overflow-hidden border border-black bg-gray-900">
                                    <img
                                        src={myStatus.creatorId?.avatar || "https://github.com/shadcn.png"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-20" />
                            </div>
                            <div className="flex-1 cursor-pointer min-w-0" onClick={() => onStatusSelect(myStatus._id)}>
                                <h3 className="text-cyan-400 font-bold tracking-wider uppercase text-sm truncate">Broadcasting</h3>
                                <p className="text-xs text-gray-300 font-mono mt-1 line-clamp-1">
                                    {myStatus.text}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 hover:border-cyan-500/20 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-dashed border-cyan-500/50 flex items-center justify-center relative">
                                <div className="w-11 h-11 rounded-full bg-cyan-900/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                    <Plus className="text-cyan-400" size={20} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-cyan-400 font-bold tracking-wider uppercase text-sm">Add New Status</h3>
                                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">Share an update with connections</p>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10"></span>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-[#0a0a0a] px-2 text-[10px] text-gray-600 uppercase tracking-widest bg-opacity-50 backdrop-blur-sm">
                            UPDATES
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl animate-pulse">
                                    <Skeleton className="w-12 h-12 rounded-full bg-white/10" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-32 bg-white/10" />
                                        <Skeleton className="h-3 w-20 bg-white/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : statuses.filter(s => String(s.creatorId?._id || s.creatorId) !== String(currentUserId)).length === 0 ? (
                        <div className="py-20 text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto opacity-50">
                                <Clock size={24} className="text-gray-600" />
                            </div>
                            <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-mono">No active agent updates</p>
                        </div>
                    ) : (
                        statuses.filter(s => String(s.creatorId?._id || s.creatorId) !== String(currentUserId)).map(status => (
                            <motion.div
                                key={status._id}
                                layoutId={status._id}
                                whileHover={{ x: 5 }}
                                onClick={() => onStatusSelect(status._id)}
                                className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/5 cursor-pointer transition-all group"
                            >
                                <div className="w-14 h-14 rounded-full p-0.5 border-2 border-cyan-500/30 group-hover:border-cyan-500 transition-colors">
                                    <div className="w-full h-full rounded-full overflow-hidden border border-black bg-gray-900">
                                        <img
                                            src={status.creatorId?.avatar || "https://github.com/shadcn.png"}
                                            alt="User"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-gray-200 font-semibold group-hover:text-cyan-400 transition-colors truncate">{status.creatorId?.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-gray-500 font-mono">
                                            {new Date(status.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                                        <p className="text-[10px] text-cyan-500/50 uppercase tracking-widest truncate max-w-[150px]">
                                            {status.text}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
