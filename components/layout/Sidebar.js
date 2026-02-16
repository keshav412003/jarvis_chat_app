"use client";

import { ChatList } from '@/components/features/ChatList';
import { UserSearch } from '@/components/features/UserSearch';
import { StatusFeed } from '@/components/features/StatusFeed';
import { ProfileSettings } from '@/components/features/ProfileSettings';
import { CreateGroupModal, JoinGroupModal } from '@/components/features/GroupModals';
import { LogoutModal } from '@/components/features/LogoutModal';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Disc, Settings, LogOut, Phone, Plus, Link, Search } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { useChatStore } from '@/hooks/useChatStore';

export function Sidebar({ user, activeTab, setActiveTab }) {
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showJoinGroup, setShowJoinGroup] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [chatListKey, setChatListKey] = useState(0); // For forcing refresh
    const router = useRouter();
    const params = useParams();
    const activeChatId = params?.chatId;

    const refreshChats = () => setChatListKey(prev => prev + 1);

    const { socket } = useSocket();

    // Join User-Specific Room for Real-Time Updates
    useEffect(() => {
        if (socket && user?._id) {
            const roomName = `user_${user._id}`;
            socket.emit("join_room", roomName);
            console.log(`Joined real-time channel: ${roomName}`);
        }
    }, [socket, user]);


    // Navigation Icons extraction
    const NavItem = ({ icon: Icon, active, onClick, color }) => (
        <button
            onClick={onClick}
            className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'} ${color}`}
        >
            <Icon size={24} />
            {active && (
                <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-8 bg-cyan-500 rounded-r-full shadow-[0_0_10px_cyan]"
                />
            )}
        </button>
    );

    const { resetStore } = useChatStore(); // Import resetStore

    const handleLogout = async () => {
        try {
            // 1. Call Backend Logout
            await fetch('/api/auth/logout', {
                method: 'POST',
                cache: 'no-store'
            });

            // 2. Clear Client State
            resetStore();
            if (socket) socket.disconnect();

            // Clear any localStorage if used (just in case)
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
            }

            // 3. Force Redirect (Hard Reload to clear memory/cache)
            window.location.href = '/';
        } catch (err) {
            console.error("Logout failed", err);
            // Force client logout even if API fails
            window.location.href = '/';
        }
    };

    return (
        <>
            <AnimatePresence>
                {showCreateGroup && (
                    <CreateGroupModal
                        onClose={() => setShowCreateGroup(false)}
                        onCreated={refreshChats}
                    />
                )}
                {showJoinGroup && (
                    <JoinGroupModal
                        onClose={() => setShowJoinGroup(false)}
                        onJoined={(chatId) => {
                            refreshChats();
                            router.push(`/chat/${chatId}`);
                            setActiveTab('chats');
                        }}
                    />
                )}
                {showLogoutConfirm && (
                    <LogoutModal
                        onClose={() => setShowLogoutConfirm(false)}
                        onConfirm={handleLogout}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-20 md:w-80 h-screen border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col md:flex-row relative z-20"
            >
                {/* Navigation Rail */}
                <div className="w-20 h-full flex flex-col items-center py-8 space-y-8 border-r border-white/5 bg-black/20">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                        <img src={user?.avatar || "https://github.com/shadcn.png"} alt="User" className="w-full h-full rounded-full object-cover p-0.5" />
                    </div>

                    <nav className="flex-1 flex flex-col gap-6 w-full items-center">
                        <NavItem icon={MessageSquare} active={activeTab === 'chats'} onClick={() => setActiveTab('chats')} />
                        <NavItem icon={Disc} active={activeTab === 'status'} onClick={() => setActiveTab('status')} />
                        <NavItem icon={Search} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    </nav>

                    <div className="mt-auto flex flex-col gap-6 items-center">
                        <NavItem icon={Settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                        <NavItem icon={LogOut} active={false} onClick={() => { console.log("Sidebar: Logout Clicked"); setShowLogoutConfirm(true); }} color="text-red-500 hover:text-red-400" />
                    </div>
                </div>

                {/* Expanded Panel */}
                <div className="hidden md:flex flex-1 flex-col h-full bg-transparent">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
                            {activeTab === 'chats' && 'SECURE CHANNELS'}
                            {activeTab === 'users' && 'GLOBAL SEARCH'}
                            {activeTab === 'status' && 'STATUS UDPATES'}
                            {activeTab === 'settings' && 'SYSTEM CONFIG'}
                        </h2>

                        {/* Group Actions (Only visible in Chats Tab) */}
                        {activeTab === 'chats' && (
                            <div className="flex gap-2">
                                <button onClick={() => setShowCreateGroup(true)} className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors" title="Create Group">
                                    <Plus size={18} />
                                </button>
                                <button onClick={() => setShowJoinGroup(true)} className="p-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors" title="Join via Code">
                                    <Link size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto relative">
                        <div className={activeTab === 'chats' ? 'block h-full' : 'hidden'}>
                            <ChatList key={chatListKey} activeChatId={activeChatId} currentUserId={user?._id} />
                        </div>
                        <div className={activeTab === 'users' ? 'block h-full' : 'hidden'}>
                            <UserSearch />
                        </div>
                        <div className={activeTab === 'status' ? 'block h-full' : 'hidden'}>
                            <StatusFeed />
                        </div>
                        <div className={activeTab === 'settings' ? 'block h-full' : 'hidden'}>
                            <ProfileSettings user={user} />
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
