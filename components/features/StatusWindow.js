"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Send, Clock, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

export function StatusWindow({ initialStatusId, onClose }) {
    const [statuses, setStatuses] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [liking, setLiking] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.user) setCurrentUserId(data.user.id);
        } catch (err) {
            console.error("Auth check error:", err);
        }
    }, []);

    const fetchAllStatuses = useCallback(async () => {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            if (data.statuses) {
                setStatuses(data.statuses);
                const startIdx = data.statuses.findIndex(s => s._id === initialStatusId);
                if (startIdx !== -1) setCurrentIndex(startIdx);
            }
        } catch (err) {
            console.error("Status fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [initialStatusId]);

    useEffect(() => {
        fetchCurrentUser();
        fetchAllStatuses();
    }, [fetchCurrentUser, fetchAllStatuses]);

    const currentStatus = statuses[currentIndex];

    const handleDelete = async () => {
        if (!currentStatus) return;
        if (!confirm('Terminate this broadcast?')) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/status?id=${currentStatus._id}`, { method: 'DELETE' });
            if (res.ok) {
                onClose(); // Close window immediately
            }
        } catch (err) {
            console.error("Delete error:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchComments = useCallback(async (statusId) => {
        try {
            const res = await fetch(`/api/status/${statusId}/comment`);
            const data = await res.json();
            if (data.comments) setComments(data.comments);
        } catch (err) {
            console.error("Comment fetch error:", err);
        }
    }, []);

    useEffect(() => {
        if (currentStatus?._id) {
            fetchComments(currentStatus._id);
        }
    }, [currentStatus?._id, fetchComments]);

    const handleLike = async () => {
        if (liking || currentStatus.hasLiked) return;
        setLiking(true);

        // Optimistic UI Update
        const updatedStatuses = [...statuses];
        updatedStatuses[currentIndex] = {
            ...currentStatus,
            hasLiked: true,
            likeCount: currentStatus.likeCount + 1
        };
        setStatuses(updatedStatuses);

        try {
            const res = await fetch(`/api/status/${currentStatus._id}/like`, { method: 'POST' });
            if (!res.ok) throw new Error('Like failed');
        } catch (err) {
            console.error(err);
            // Revert on failure
            fetchAllStatuses();
        } finally {
            setLiking(false);
        }
    };

    const handleComment = async (e) => {
        if (e) e.preventDefault();
        if (!newComment.trim() || commenting) return;
        setCommenting(true);

        try {
            const res = await fetch(`/api/status/${currentStatus._id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: newComment })
            });
            const data = await res.json();
            if (res.ok) {
                setComments(prev => [...prev, data.comment]);
                setNewComment('');
                // Update comment count in local status state if desired
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCommenting(false);
        }
    };

    const next = () => {
        if (currentIndex < statuses.length - 1) setCurrentIndex(prev => prev + 1);
        else onClose();
    };

    const prev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const hasAlreadyCommented = useMemo(() => {
        return comments.some(c => c.userId?._id === currentUserId);
    }, [comments, currentUserId]);

    // Auto-advance logic
    useEffect(() => {
        if (!currentStatus) return;
        const timer = setTimeout(next, 8000); // 8 seconds per status
        return () => clearTimeout(timer);
    }, [currentIndex, statuses.length]);

    const timeString = useMemo(() => {
        if (!currentStatus) return '';
        const hours = Math.floor(currentStatus.timeRemaining / 3600);
        const mins = Math.floor((currentStatus.timeRemaining % 3600) / 60);
        return `${hours}h ${mins}m left`;
    }, [currentStatus?.timeRemaining]);

    if (loading) return (
        <div className="absolute inset-0 z-[70] bg-black flex items-center justify-center">
            <Loader2 className="text-cyan-500 animate-spin" size={48} />
        </div>
    );

    if (!currentStatus) return null;

    return (
        <div className="absolute inset-0 z-[70] bg-black flex flex-col md:flex-row overflow-hidden">
            {/* Main Status Area */}
            <div className="flex-1 relative flex flex-col bg-gray-950">
                {/* Progress Indicators */}
                <div className="flex gap-1.5 p-3 pt-6 z-20">
                    {statuses.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-cyan-500"
                                initial={{ width: "0%" }}
                                animate={{ width: idx < currentIndex ? "100%" : idx === currentIndex ? "100%" : "0%" }}
                                transition={{ duration: idx === currentIndex ? 8 : 0, ease: "linear" }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 z-20">
                    <div className="flex items-center gap-4">
                        <img
                            src={currentStatus.creatorId?.avatar || "https://github.com/shadcn.png"}
                            className="w-12 h-12 rounded-full border-2 border-cyan-500 p-0.5"
                        />
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-white font-bold tracking-wider">{currentStatus.creatorId?.name}</h2>
                                {currentStatus.creatorId?._id === currentUserId && (
                                    <span className="px-1.5 py-0.5 bg-cyan-500 text-black text-[8px] font-black uppercase tracking-tighter rounded">YOU</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-[10px] font-mono uppercase">
                                <Clock size={10} />
                                {timeString}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentStatus.creatorId?._id === currentUserId && (
                            <button
                                onClick={handleDelete}
                                className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Terminate Broadcast"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Status Text Content */}
                <div
                    className="flex-1 flex items-center justify-center p-12 text-center transition-colors duration-1000"
                    style={{ backgroundColor: currentStatus.color }}
                >
                    <AnimatePresence mode="wait">
                        <motion.h1
                            key={currentStatus._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-2xl font-mono tracking-tight"
                        >
                            {currentStatus.text}
                        </motion.h1>
                    </AnimatePresence>
                </div>

                {/* Mobile Tap Areas for Navigation */}
                <div className="absolute inset-y-0 left-0 w-[30%] z-30 md:hidden" onClick={prev} />
                <div className="absolute inset-y-0 right-0 w-[70%] z-30 md:hidden" onClick={next} />

                {/* Interaction Footer (Desktop) / Navigation */}
                <div className="absolute inset-y-0 left-0 w-20 z-10 hidden md:flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button onClick={prev} className="p-4 text-white/50 hover:text-white cursor-pointer"><ChevronLeft size={48} /></button>
                </div>
                <div className="absolute inset-y-0 right-0 w-20 z-10 hidden md:flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button onClick={next} className="p-4 text-white/50 hover:text-white cursor-pointer"><ChevronRight size={48} /></button>
                </div>
            </div>

            {/* Side Panel: Interactions */}
            <div className="w-full md:w-[400px] h-1/2 md:h-full bg-black border-l border-white/10 flex flex-col z-20">
                {/* Stats & Actions */}
                {/* Stats & Actions */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex gap-6">
                        {currentStatus.creatorId?._id !== currentUserId && (
                            <button
                                onClick={handleLike}
                                disabled={currentStatus.hasLiked || liking}
                                className={`flex flex-col items-center gap-1 transition-all ${currentStatus.hasLiked ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Heart size={28} fill={currentStatus.hasLiked ? "currentColor" : "none"} className={liking ? 'animate-ping' : ''} />
                                <span className="text-xs font-bold font-mono">{currentStatus.likeCount}</span>
                            </button>
                        )}
                        <div className="flex flex-col items-center gap-1 text-gray-500">
                            <MessageSquare size={28} />
                            <span className="text-xs font-bold font-mono">{comments.length}</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/10">
                        {currentStatus.creatorId?._id === currentUserId ? 'Broadcast Station' : 'Secure Uplink Active'}
                    </div>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {comments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-2 opacity-50">
                            <MessageSquare size={32} />
                            <p className="text-[10px] uppercase font-mono tracking-widest">No transmissions yet.</p>
                        </div>
                    ) : (
                        comments.map(c => (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={c._id || Math.random()}
                                className="flex gap-3"
                            >
                                <img src={c.userId?.avatar || "https://github.com/shadcn.png"} className="w-8 h-8 rounded-full border border-white/10" />
                                <div className="flex-1 bg-white/5 rounded-2xl px-4 py-3 border border-white/5 relative group">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                                            {c.userId?.name} {c.userId?._id === currentUserId && "(YOU)"}
                                        </h4>
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed font-sans">{c.comment}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Comment Input / Status */}
                <div className="p-4 bg-gray-950 border-t border-white/10">
                    {currentStatus.creatorId?._id === currentUserId ? (
                        <div className="py-3 text-center border border-dashed border-white/5 rounded-2xl bg-white/2">
                            <p className="text-[10px] text-gray-600 uppercase font-mono tracking-[0.2em]">Monitoring Transmission...</p>
                        </div>
                    ) : hasAlreadyCommented ? (
                        <div className="flex items-center justify-center gap-2 py-3 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
                            <Clock size={14} className="text-cyan-500/50" />
                            <p className="text-[10px] text-cyan-500/50 uppercase font-mono tracking-widest font-black">Message Transmitted</p>
                        </div>
                    ) : (
                        <form onSubmit={handleComment} className="relative flex items-center bg-black/60 border border-white/10 rounded-2xl px-4 py-1.5 focus-within:border-cyan-500/50 transition-all">
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a secure comment..."
                                className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none focus:ring-0 py-2"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || commenting}
                                className={`p-2 rounded-xl transition-all ${newComment.trim() && !commenting ? 'text-cyan-400 hover:bg-cyan-500/10' : 'text-gray-700'}`}
                            >
                                {commenting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
