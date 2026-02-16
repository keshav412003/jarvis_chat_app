"use client";

import { MessageSquare, Disc, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function BottomNav({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'chats', label: 'Chats', icon: MessageSquare },
        { id: 'status', label: 'Status', icon: Disc },
        { id: 'users', label: 'People', icon: Users },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 flex justify-around items-center px-2 z-50 pb-[env(safe-area-inset-bottom)]">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <div className="relative">
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-indicator"
                                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_cyan]"
                                />
                            )}
                        </div>
                        <span className="text-[10px] font-medium tracking-wide text-center w-full">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
