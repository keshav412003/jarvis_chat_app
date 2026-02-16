"use client";

import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSocket } from '@/components/providers/SocketProvider';
import { useChatStore } from '@/hooks/useChatStore';
import { ChatItem } from '@/components/features/ChatItem';
import { ChatListSkeleton } from '@/components/ui/LoadingSkeleton';

// Memoized ChatItem wrapper to prevent unnecessary re-renders
const MemoizedChatItem = memo(ChatItem);

export function ChatList({ activeChatId, currentUserId }) {
    const { socket } = useSocket();
    const { chats, isLoading, error, fetchChats, handleNewMessage, markChatAsRead } = useChatStore();

    const [statuses, setStatuses] = useState([]);
    const [statusUserIds, setStatusUserIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Fetch statuses with cleanup
    useEffect(() => {
        const abortController = new AbortController();

        // Initial fetch chats
        fetchChats();

        // Fetch statuses to show indicators
        fetch('/api/status', {
            signal: abortController.signal,
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data.statuses) {
                    setStatuses(data.statuses);
                    // Store set of creator IDs as strings
                    const ids = new Set(data.statuses.map(s => String(s.creatorId._id || s.creatorId)));
                    setStatusUserIds(ids);
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error("Failed to load status indicators:", err);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [fetchChats]); // Run once on mount

    useEffect(() => {
        if (activeChatId) {
            markChatAsRead(activeChatId);
        }
    }, [activeChatId, markChatAsRead]);

    // Memoize socket message handler
    const onReceiveMessage = useCallback((message) => {
        console.log("ChatList: Remote message received", message);
        const chatId = message.chatId || message.groupId;
        handleNewMessage({ chatId, message, currentUserId, activeChatId });
    }, [handleNewMessage, currentUserId, activeChatId]);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive_message', onReceiveMessage);

        return () => {
            socket.off('receive_message', onReceiveMessage);
        };
    }, [socket, onReceiveMessage]);

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Memoize filtered chats to prevent recalculation on every render
    const filteredChats = useMemo(() => {
        return chats.filter(chat =>
            chat.name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            (chat.isGroup && chat.groupName?.toLowerCase().includes(debouncedQuery.toLowerCase()))
        );
    }, [chats, debouncedQuery]);

    // Memoize search input props to prevent inline object creation
    const searchInputProps = useMemo(() => ({
        type: "text",
        placeholder: "Search secure channels...",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-base md:text-sm"
    }), [searchQuery]);

    if (isLoading && chats.length === 0) return <ChatListSkeleton />;

    if (error) return (
        <div className="p-4 text-center">
            <p className="text-red-500 text-xs mb-2">{error}</p>
            <button onClick={() => fetchChats()} className="text-cyan-400 text-xs hover:underline">Retry</button>
        </div>
    );

    return (
        <div className="space-y-4 p-2">
            {/* Search Input */}
            <div className="relative sticky top-0 z-10 bg-[#0a0a0a] pb-2">
                <input {...searchInputProps} />
                <div className="absolute left-3 top-3.5 text-gray-500 pt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
            </div>

            {!isLoading && filteredChats.length === 0 ? (
                <div className="p-4 text-center">
                    <p className="text-gray-500 text-sm">
                        {searchQuery ? 'No channels found.' : 'No conversations yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredChats.map((chat) => {
                        // Determine if we should show status ring
                        let hasActiveStatus = false;
                        if (!chat.isGroup && currentUserId) {
                            // Find other participant - strict string comparison
                            const other = chat.participants.find(p => {
                                const pId = String(p._id || p);
                                return pId !== String(currentUserId);
                            });

                            const otherId = other ? String(other._id || other) : null;
                            if (otherId && statusUserIds.has(otherId)) {
                                hasActiveStatus = true;
                            }
                        }

                        return (
                            <MemoizedChatItem
                                key={chat._id}
                                chat={chat}
                                isActive={activeChatId === chat._id}
                                hasStatus={hasActiveStatus}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
