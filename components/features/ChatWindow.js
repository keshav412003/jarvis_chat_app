"use client";

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useApi } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { MessageListSkeleton } from '@/components/ui/LoadingSkeleton';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/hooks/useChatStore';
import { GroupInfoModal } from './GroupInfoModal';
import { ChatHeader } from './ChatHeader';
// This is a view action, using replace to trigger logic check - actually I'll just skip this check if I trust previous analysis or just do a quick read with view_file.
// Reverting to view_file logic manually.
import { MessageInput } from './MessageInput';

// Memoized Message Item Component
const MessageItem = memo(({ msg, isMe }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
    >
        <div className={`max-w-[85%] md:max-w-[70%] p-3 relative group transition-all duration-300 ${isMe ? 'bg-cyan-900/20 text-cyan-50 border border-cyan-500/30 rounded-t-xl rounded-bl-xl ml-10' : 'bg-gray-900/40 text-gray-200 border border-white/10 rounded-t-xl rounded-br-xl mr-10'}`}>
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${isMe ? 'from-cyan-500/10 to-transparent' : 'from-red-500/10 to-transparent'}`} />
            {!isMe && (
                <p className="text-[10px] text-cyan-500 mb-1 font-bold tracking-wider">{msg.sender.name || 'Unknown Agent'}</p>
            )}
            <p className="text-sm font-sans relative z-10 leading-relaxed">{msg.content}</p>
            <div className="mt-1 flex justify-end items-center gap-1 opacity-60">
                <span className="text-[10px] font-mono">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className={`absolute -bottom-[1px] ${isMe ? '-right-[1px] border-r-2 border-b-2 border-cyan-500/50' : '-left-[1px] border-l-2 border-b-2 border-gray-500/50'} w-3 h-3`} />
        </div>
    </motion.div>
));

MessageItem.displayName = 'MessageItem';

const MessageList = memo(({ messages, user, typingUsers, messagesEndRef, onScroll, loadingMore, hasMore, scrollRef }) => {
    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && hasMore && !loadingMore) {
            onScroll();
        }
    };

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-scrollbar-hidden z-10"
        >
            {loadingMore && (
                <div className="flex justify-center py-2">
                    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            {messages.map((msg, idx) => {
                const isMe = msg.sender._id === user?._id || msg.sender === user?._id;
                // Use combination of _id and index to ensure uniqueness
                const uniqueKey = msg._id ? `${msg._id}-${idx}` : `msg-${idx}`;
                return <MessageItem key={uniqueKey} msg={msg} isMe={isMe} />;
            })}
            <div ref={messagesEndRef} />
            {typingUsers.size > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-cyan-500/50 text-xs font-mono ml-4">
                    <div className="flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce delay-100">●</span>
                        <span className="animate-bounce delay-200">●</span>
                    </div>
                    <span>Agent is typing...</span>
                </motion.div>
            )}
        </div>
    );
});

MessageList.displayName = 'MessageList';

export function ChatWindow({ chatId, user }) {
    const { socket } = useSocket();
    const { addToast } = useToast();
    const { request } = useApi();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const [typingUsers, setTypingUsers] = useState(new Set());
    const typingTimeoutRef = useRef(null);
    const [isGroupAdmin, setIsGroupAdmin] = useState(false);
    const [chatDetails, setChatDetails] = useState(null);
    const [showInfo, setShowInfo] = useState(false);

    // Pagination states
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchChatDetails = useCallback(async () => {
        if (!chatId || !user) return;
        const { data } = await request(`/api/chats/${chatId}`);
        if (data?.chat) {
            setChatDetails(data.chat);
            if (data.chat.isGroup) {
                const isAdmin = data.chat.admins.some(admin =>
                    String(typeof admin === 'string' ? admin : admin._id) === String(user?._id)
                );
                setIsGroupAdmin(isAdmin);
            }
        }
    }, [chatId, user, request]);

    useEffect(() => {
        fetchChatDetails();
    }, [fetchChatDetails]);

    const { scrollPositions, setScrollPosition } = useChatStore();

    const scrollToBottom = useCallback((behavior = "smooth") => {
        if (!scrollContainerRef.current) return;
        requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
        });
    }, []);

    const fetchMessages = useCallback(async (isInitial = true, cursor = null, signal) => {
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        const url = `/api/messages?chatId=${chatId}${cursor ? `&cursor=${cursor}` : ''}&limit=50`;
        const { data } = await request(url, { signal });

        if (data?.messages) {
            const formattedMessages = [...data.messages].reverse();

            if (isInitial) {
                setMessages(formattedMessages);

                // Restore scroll position or scroll to bottom
                requestAnimationFrame(() => {
                    if (scrollContainerRef.current) {
                        const savedPos = scrollPositions[chatId];
                        if (savedPos !== undefined) {
                            scrollContainerRef.current.scrollTop = savedPos;
                        } else {
                            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                        }
                    }
                });
            } else {
                // Preserve scroll position for older messages
                const container = scrollContainerRef.current;
                const oldHeight = container?.scrollHeight || 0;

                setMessages(prev => [...formattedMessages, ...prev]);

                requestAnimationFrame(() => {
                    if (container) {
                        const newHeight = container.scrollHeight;
                        container.scrollTop = newHeight - oldHeight;
                    }
                });
            }
            setHasMore(data.hasMore);
            setNextCursor(data.nextCursor);
        }

        if (isInitial) setLoading(false);
        else setLoadingMore(false);
    }, [chatId, request, scrollPositions]);

    // Save scroll position before switching
    useEffect(() => {
        const container = scrollContainerRef.current;
        return () => {
            if (container && chatId) {
                setScrollPosition(chatId, container.scrollTop);
            }
        };
    }, [chatId, setScrollPosition]);

    // Memoize socket event handlers to prevent re-registration
    const handleReceiveMessage = useCallback((message) => {
        if (String(message.chatId || message.groupId) === String(chatId)) {
            // Skip if this message was sent by the current user (already added optimistically)
            const messageSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
            if (String(messageSenderId) === String(user?._id)) {
                return; // Don't add own messages from socket
            }

            setMessages((prev) => {
                // Check for duplicates
                if (prev.some(m => String(m._id) === String(message._id))) return prev;
                return [...prev, message];
            });
            scrollToBottom();
        }
    }, [chatId, scrollToBottom, user]);

    const handleTyping = useCallback(({ chatId: room, userId }) => {
        if (String(room) === String(chatId)) {
            setTypingUsers(prev => new Set(prev).add(userId));
        }
    }, [chatId]);

    const handleStopTyping = useCallback(({ chatId: room, userId }) => {
        if (String(room) === String(chatId)) {
            setTypingUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    }, [chatId]);

    const handleGroupDeleted = useCallback(() => {
        addToast({ title: 'Protocol Terminated', description: "This group has been deleted.", type: 'warning' });
        window.location.href = '/';
    }, [addToast]);

    const handleGroupEvent = useCallback(() => fetchChatDetails(), [fetchChatDetails]);

    useEffect(() => {
        const abortController = new AbortController();
        fetchMessages(true, null, abortController.signal);

        if (socket) {
            socket.emit('join_room', String(chatId));

            socket.on('receive_message', handleReceiveMessage);
            socket.on('group:typing', handleTyping);
            socket.on('group:stop_typing', handleStopTyping);
            socket.on('group:deleted', handleGroupDeleted);
            socket.on('group:joined', handleGroupEvent);
            socket.on('group:left', handleGroupEvent);

            const handleReconnect = () => socket.emit('join_room', String(chatId));
            socket.on('connect', handleReconnect);

            return () => {
                abortController.abort();
                socket.off('receive_message', handleReceiveMessage);
                socket.off('group:typing', handleTyping);
                socket.off('group:stop_typing', handleStopTyping);
                socket.off('group:deleted', handleGroupDeleted);
                socket.off('group:joined', handleGroupEvent);
                socket.off('group:left', handleGroupEvent);
                socket.off('connect', handleReconnect);
                socket.emit('leave_room', String(chatId));
            };
        }

        return () => {
            abortController.abort();
        };
    }, [chatId, socket, fetchMessages, handleReceiveMessage, handleTyping, handleStopTyping, handleGroupDeleted, handleGroupEvent]);

    const handleInputChange = useCallback((e) => {
        setNewMessage(e.target.value);
        if (socket) {
            socket.emit('group:typing', String(chatId));
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('group:stop_typing', String(chatId));
            }, 3000);
        }
    }, [socket, chatId]);

    const handleDeleteGroup = useCallback(async () => {
        if (!confirm("Are you sure you want to DELETE this room?")) return;
        const { data } = await request('/api/groups/delete', { method: 'DELETE', body: JSON.stringify({ chatId }) });
        if (data) window.location.href = '/';
    }, [chatId, request]);

    const handleLeaveGroup = useCallback(async () => {
        if (!confirm("Are you sure you want to DISENGAGE from this protocol?")) return;
        const { data } = await request('/api/groups/leave', { method: 'POST', body: JSON.stringify({ chatId }) });
        if (data) window.location.href = '/';
    }, [chatId, request]);

    const handleSendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const messageText = newMessage.trim();
        setNewMessage('');

        // Optimistic Update
        const optimisticId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: optimisticId,
            chatId,
            content: messageText,
            sender: user, // Use current user object
            createdAt: new Date().toISOString(),
            status: 'sending'
        };

        setMessages(prev => [...prev, optimisticMessage]);
        scrollToBottom();

        setSending(true);
        const { data, error } = await request('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ chatId, content: messageText, type: 'text' }),
        });

        if (data?.message) {
            setMessages((prev) =>
                prev.map(m => m._id === optimisticId ? data.message : m)
            );
        } else {
            // Revert on error
            setMessages((prev) => prev.filter(m => m._id !== optimisticId));
            addToast({ title: 'Protocol Failure', description: 'Message delivery failed.', type: 'error' });
        }
        setSending(false);
    }, [newMessage, sending, chatId, scrollToBottom, request, user, addToast]);

    return (
        <div className="flex w-full h-full bg-transparent overflow-hidden relative">
            <div className="flex flex-col flex-1 h-full relative transition-all duration-300">
                <ChatHeader
                    chatDetails={chatDetails}
                    user={user}
                    socket={socket}
                    onShowInfo={() => setShowInfo(true)}
                />

                {loading ? (
                    <MessageListSkeleton />
                ) : (
                    <MessageList
                        messages={messages}
                        user={user}
                        typingUsers={typingUsers}
                        messagesEndRef={messagesEndRef}
                        scrollRef={scrollContainerRef}
                        onScroll={() => fetchMessages(false, nextCursor)}
                        loadingMore={loadingMore}
                        hasMore={hasMore}
                    />
                )}

                <MessageInput
                    newMessage={newMessage}
                    onInputChange={handleInputChange}
                    onSendMessage={handleSendMessage}
                    sending={sending}
                    isGroup={chatDetails?.isGroup}
                />
            </div>

            <AnimatePresence>
                {showInfo && chatDetails?.isGroup && (
                    <GroupInfoModal
                        chatDetails={chatDetails}
                        user={user}
                        isGroupAdmin={isGroupAdmin}
                        onClose={() => setShowInfo(false)}
                        onLeaveGroup={handleLeaveGroup}
                        onDeleteGroup={handleDeleteGroup}
                        onAvatarUpdate={(newAvatar) => {
                            setChatDetails(prev => ({ ...prev, groupAvatar: newAvatar }));
                            useChatStore.getState().updateChat(chatId, { groupAvatar: newAvatar });
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
