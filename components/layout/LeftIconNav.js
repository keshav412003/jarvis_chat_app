"use client";

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Disc, Users, Settings, LogOut } from 'lucide-react';
import { LogoutModal } from '@/components/features/LogoutModal';

const NavItem = memo(({ icon: Icon, active, onClick, color }) => (
    <button
        onClick={onClick}
        className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'} ${color || ''}`}
    >
        <Icon size={24} />
        {active && (
            <motion.div
                layoutId="active-indicator"
                className="absolute left-0 w-1 h-8 bg-cyan-500 rounded-r-full shadow-[0_0_10px_cyan]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
        )}
    </button>
));

NavItem.displayName = 'NavItem';

const LeftIconNav = ({ activeTab, setActiveTab, user }) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
            // Clear storage
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
            }
            window.location.href = '/';
        } catch (err) {
            console.error("Logout failed", err);
            window.location.href = '/';
        }
    };

    return (
        <>
            <AnimatePresence>
                {showLogoutConfirm && (
                    <LogoutModal
                        onClose={() => setShowLogoutConfirm(false)}
                        onConfirm={handleLogout}
                    />
                )}
            </AnimatePresence>

            <div className="w-20 h-full flex flex-col items-center py-8 space-y-8 border-r border-white/5 bg-black/40 backdrop-blur-xl z-20">
                {/* User Avatar */}
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(0,243,255,0.3)] marker-avatar">
                    <img
                        src={user?.avatar || "https://github.com/shadcn.png"}
                        alt="User"
                        className="w-full h-full rounded-full object-cover p-0.5"
                    />
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 flex flex-col gap-6 w-full items-center">
                    <NavItem
                        icon={MessageSquare}
                        active={activeTab === 'chats'}
                        onClick={() => setActiveTab('chats')}
                    />
                    <NavItem
                        icon={Disc}
                        active={activeTab === 'status'}
                        onClick={() => setActiveTab('status')}
                    />
                    <NavItem
                        icon={Users}
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                    />
                </nav>

                {/* Bottom Actions */}
                <div className="mt-auto flex flex-col gap-6 items-center">
                    <NavItem
                        icon={Settings}
                        active={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                    />
                    <NavItem
                        icon={LogOut}
                        active={false}
                        onClick={() => setShowLogoutConfirm(true)}
                        color="text-red-500 hover:text-red-400"
                    />
                </div>
            </div>
        </>
    );
};

export default memo(LeftIconNav);
