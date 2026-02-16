import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { memo } from 'react';

const ChatItemComponent = ({ chat, isActive, onClick, hasStatus }) => {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) onClick(chat._id);
        router.push(`/chat/${chat._id}`);
    };

    // ... (helper functions same)
    const getLastMessagePreview = () => {
        if (!chat.lastMessage) return 'Initialized secure channel.';
        const { type, content, sender } = chat.lastMessage;

        if (type === 'image') return '📷 Image';
        if (type === 'video') return '🎥 Video';
        if (type === 'audio') return '🎵 Audio';
        if (type === 'file') return '📁 File';

        // Truncate content
        return content.length > 30 ? content.substring(0, 30) + '...' : content;
    };

    const getTimeDisplay = () => {
        if (!chat.updatedAt && !chat.lastMessage?.createdAt) return '';
        const date = new Date(chat.lastMessage?.createdAt || chat.updatedAt);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div
            layout // Helper for smooth reordering
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleClick}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-300 border group ${isActive ? 'bg-cyan-500/10 border-cyan-500/30' : 'border-transparent hover:bg-white/5 hover:border-white/10'}`}
        >
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 relative shrink-0">
                    {/* Status Indicator Ring */}
                    {hasStatus && (
                        <>
                            <div className="absolute -inset-1.5 rounded-full border border-cyan-500 border-dashed animate-[spin_8s_linear_infinite] opacity-60" />
                            <div className="absolute -inset-1.5 rounded-full border border-cyan-400 opacity-20 animate-pulse" />
                        </>
                    )}

                    <div className="w-full h-full rounded-full bg-gray-700 relative overflow-hidden ring-2 ring-transparent group-hover:ring-cyan-500/30 transition-all z-10">
                        {chat.avatar ? (
                            <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-900 to-black flex items-center justify-center text-cyan-500 font-bold">
                                {chat.name?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className={`font-semibold truncate flex items-center gap-2 ${chat.isGroup ? 'text-cyan-400' : 'text-gray-200 group-hover:text-cyan-300'}`}>
                            {chat.isGroup && <Users size={14} className="opacity-80" />}
                            {chat.name}
                        </h3>
                        {chat.lastMessage && (
                            <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                                {getTimeDisplay()}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className={`text-xs truncate max-w-[85%] ${isActive ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-400'}`}>
                            {chat.lastMessage?.sender?.name && chat.isGroup ? `${chat.lastMessage.sender.name}: ` : ''}
                            {getLastMessagePreview()}
                        </p>
                        {chat.unreadCount > 0 && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-black text-[10px] font-bold shadow-[0_0_8px_cyan]">
                                {chat.unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Export memoized version
export const ChatItem = memo(ChatItemComponent);

