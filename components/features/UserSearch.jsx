"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mail, MessageCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/hooks/useChatStore';

export function UserSearch() {
    const router = useRouter();
    const { fetchChats } = useChatStore();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();

        if (!query || query.length < 3) {
            setError("Requires 3+ characters...");
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const res = await fetch(`/api/users/search-by-email?email=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Search request failed');
            const data = await res.json();
            setResults(data.users || []);
            if (data.users?.length === 0) {
                setError("No operative found.");
            }
        } catch (err) {
            console.error("Search error:", err);
            setError("Failed to locate agents.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = useCallback(async (participantId) => {
        setLoading(true);
        try {
            const res = await fetch('/api/chats/find-or-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantId }),
            });

            const data = await res.json();

            if (res.ok && data.chat) {
                fetchChats(); // Refresh the chat list in sidebar
                router.push(`/chat/${data.chat._id}`);
            } else {
                throw new Error(data.error || "Uplink failed");
            }
        } catch (err) {
            console.error("Chat initialization error:", err);
            setError("Failed to initialize secure channel.");
        } finally {
            setLoading(false);
        }
    }, [fetchChats, router]);

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setError(null);
    };

    // Memoized Results to prevent unnecessary re-renders
    const ResultsList = useMemo(() => {
        if (loading && results.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-10 text-cyan-500/50">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <span className="text-[10px] uppercase tracking-widest font-mono">Scanning Database...</span>
                </div>
            );
        }

        if (query.length >= 3 && !loading && results.length === 0 && !error) {
            return (
                <div className="text-center py-10 px-4">
                    <Mail className="mx-auto text-gray-700 mb-2 opacity-50" size={32} />
                    <p className="text-gray-500 text-sm">No operative found with that identity.</p>
                </div>
            );
        }

        return (
            <div className="space-y-2">
                {results.map(user => (
                    <motion.div
                        key={user._id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl border border-white/5 bg-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center text-cyan-500 font-bold shrink-0 overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user.name[0]
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">
                                    {user.name}
                                </h4>
                                <p className="text-[10px] text-gray-500 truncate font-mono uppercase tracking-tighter">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleStartChat(user._id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600/10 text-cyan-400 hover:bg-cyan-600 hover:text-white transition-all text-[10px] font-bold tracking-widest uppercase border border-cyan-500/20"
                        >
                            <MessageCircle size={14} />
                            Message
                        </button>
                    </motion.div>
                ))}
            </div>
        );
    }, [results, loading, query, error, handleStartChat]);

    return (
        <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden">
            {/* Search Input Container */}
            <form onSubmit={handleSearch} className="relative group">
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity ${query.length >= 3 ? 'opacity-30' : ''}`} />
                <div className="relative flex items-center bg-black/60 border border-white/10 rounded-xl px-4 py-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="Search by Email..."
                        className="flex-1 bg-transparent border-none text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-0"
                    />
                    <div className="flex items-center gap-2">
                        {query && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="text-gray-600 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`p-1.5 rounded-lg transition-all ${loading ? 'text-cyan-400 animate-pulse' : 'text-gray-500 hover:text-cyan-400 hover:bg-white/5'}`}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        </button>
                    </div>
                </div>
            </form>

            {/* Status Info */}
            {query.length > 0 && query.length < 3 && (
                <div className="flex items-center gap-2 px-2">
                    <div className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-[10px] text-cyan-500/50 font-mono tracking-widest uppercase">
                        Requires 3+ characters...
                    </span>
                </div>
            )}

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <AnimatePresence mode="popLayout">
                    {error ? (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-mono uppercase tracking-widest">
                            {error}
                        </div>
                    ) : ResultsList}
                </AnimatePresence>
            </div>
        </div>
    );
}
