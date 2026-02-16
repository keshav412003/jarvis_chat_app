"use client";

import { Users, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function ChatHeader({ chatDetails, user, socket, onShowInfo }) {
    const router = useRouter();
    const otherParticipant = chatDetails?.participants?.find(p => p._id !== user?._id);

    return (
        <div className="p-4 bg-black/60 border-b border-white/10 backdrop-blur-md flex justify-between items-center z-20 sticky top-0">
            <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                    onClick={() => router.push('/chat')}
                    className="md:hidden p-1 -ml-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center relative overflow-hidden ring-1 ring-cyan-500/30">
                    {chatDetails?.isGroup ? (
                        chatDetails.groupAvatar ? (
                            <img src={chatDetails.groupAvatar} className="w-full h-full object-cover" alt="Group" />
                        ) : (
                            <Users size={18} className="text-cyan-500" />
                        )
                    ) : (
                        otherParticipant?.avatar ? (
                            <img src={otherParticipant.avatar} className="w-full h-full object-cover" alt="User" />
                        ) : (
                            <div className="text-cyan-500 font-bold">{otherParticipant?.name?.[0]}</div>
                        )
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white tracking-wide leading-tight">
                        {chatDetails?.isGroup ? chatDetails.groupName : otherParticipant?.name || 'Loading...'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">
                            {chatDetails?.isGroup
                                ? `${chatDetails.participants?.length || 0} Operatives`
                                : (otherParticipant?.isOnline ? 'Online' : 'Offline')}
                        </p>
                        <div
                            className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
                            title={socket?.connected ? 'Secure Link Established' : 'Link Offline'}
                        />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 text-white">
                {chatDetails?.isGroup && (
                    <Button onClick={onShowInfo} variant="ghost" className="text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        <Info size={20} />
                    </Button>
                )}
            </div>
        </div>
    );
}
