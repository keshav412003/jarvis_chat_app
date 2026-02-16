"use client";

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Link } from 'lucide-react';
import { ChatList } from '@/components/features/ChatList';
import { UserSearch } from '@/components/features/UserSearch';
import { StatusFeed } from '@/components/features/StatusFeed';
import { ProfileSettings } from '@/components/features/ProfileSettings';
import { CreateGroupModal, JoinGroupModal } from '@/components/features/GroupModals';
import { useRouter, useParams } from 'next/navigation';

const SidebarPanel = ({ activeTab, user, setActiveTab, onStatusSelect, isMobile = false }) => {
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showJoinGroup, setShowJoinGroup] = useState(false);
    const [chatListKey, setChatListKey] = useState(0);
    const router = useRouter();
    const params = useParams();
    const activeChatId = params?.chatId;

    const refreshChats = () => setChatListKey(prev => prev + 1);

    return (
        <>
            <AnimatePresence>
                {showCreateGroup && (
                    <CreateGroupModal
                        user={user}
                        onClose={() => setShowCreateGroup(false)}
                        onCreated={() => {
                            refreshChats();
                        }}
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
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${isMobile ? 'flex w-full' : 'hidden md:flex w-80'} h-full flex-col border-r border-white/10 bg-black/60 md:bg-black/40 backdrop-blur-xl relative z-20`}
            >
                {/* Header Area */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center h-[72px] flex-shrink-0">
                    <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
                        {activeTab === 'chats' && 'MESSAGE CHANNELS'}
                        {activeTab === 'users' && 'ACTIVE DIRECTORY'}
                        {activeTab === 'status' && 'LIVE BROADCASTS'}
                        {activeTab === 'settings' && 'SYSTEM CONFIG'}
                    </h2>

                    {activeTab === 'chats' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreateGroup(true)}
                                className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-colors"
                                title="Create Group"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={() => setShowJoinGroup(true)}
                                className="p-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
                                title="Join via Code"
                            >
                                <Link size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area - Persistent Tabs */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <div className={`h-full ${activeTab === 'chats' ? 'block' : 'hidden'}`}>
                        <ChatList key={chatListKey} activeChatId={activeChatId} currentUserId={user?._id || user?.id} />
                    </div>
                    <div className={`h-full ${activeTab === 'users' ? 'block' : 'hidden'}`}>
                        <UserSearch />
                    </div>
                    <div className={`h-full ${activeTab === 'status' ? 'block' : 'hidden'}`}>
                        <StatusFeed onStatusSelect={onStatusSelect} />
                    </div>
                    <div className={`h-full ${activeTab === 'settings' ? 'block' : 'hidden'}`}>
                        <ProfileSettings user={user} />
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default memo(SidebarPanel);
