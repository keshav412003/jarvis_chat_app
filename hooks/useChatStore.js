import { create } from 'zustand';
import { chatCache } from '@/lib/cache';

export const useChatStore = create((set, get) => ({
    chats: [],
    isLoading: false,
    error: null,
    scrollPositions: {}, // chatId -> scrollOffset

    setScrollPosition: (chatId, position) => set(state => ({
        scrollPositions: { ...state.scrollPositions, [chatId]: position }
    })),

    setChats: (chats) => set({ chats }),

    fetchChats: async () => {
        // Check cache first
        const cached = chatCache.get('chat-list');
        if (cached) {
            set({ chats: cached, isLoading: false });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const res = await fetch('/api/chats', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch chats');
            const data = await res.json();

            // Cache the result for 30 seconds
            chatCache.set('chat-list', data.chats, 30000);

            set({ chats: data.chats, isLoading: false });
        } catch (error) {
            console.error("Fetch Chats Error:", error);
            set({ error: error.message, isLoading: false });
        }
    },

    // Real-time updates
    handleNewMessage: (payload) => {
        const { chatId, message, currentUserId, activeChatId } = payload;
        const currentChats = get().chats;

        // Invalidate cache when new message arrives
        chatCache.delete('chat-list');

        // Find if chat exists
        const chatIndex = currentChats.findIndex(c => c._id === chatId);

        if (chatIndex > -1) {
            const existingChat = currentChats[chatIndex];

            // Calculate unread count
            // Increment if: 
            // 1. Message is NOT from me (sender._id check)
            // 2. Chat is NOT currently active (activeChatId check)
            // Note: message.sender might be object or ID depending on population. API sends populated.
            const senderId = message.sender?._id || message.sender;
            const isFromMe = senderId === currentUserId;
            const isChatActive = chatId === activeChatId;

            let newUnreadCount = existingChat.unreadCount || 0;
            if (!isFromMe && !isChatActive) {
                newUnreadCount += 1;
            }

            // Move to top and update last Message
            const updatedChat = {
                ...existingChat,
                lastMessage: message,
                updatedAt: new Date().toISOString(),
                unreadCount: newUnreadCount
            };

            const otherChats = currentChats.filter(c => c._id !== chatId);
            set({ chats: [updatedChat, ...otherChats] });
        } else {
            // New chat (rare in this flow, usually requires refetch or specific event)
            // But if we receive a message for a chat not in list (e.g. new group), we might want to fetch it or partial add.
            // For now, simpler approach:
            get().fetchChats();
        }
    },

    markChatAsRead: async (chatId) => {
        const currentChats = get().chats;
        const updatedChats = currentChats.map(chat => {
            if (chat._id === chatId) {
                return { ...chat, unreadCount: 0 }; // Optimistic update
            }
            return chat;
        });
        set({ chats: updatedChats });

        // Invalidate cache
        chatCache.delete('chat-list');

        // API Call
        try {
            await fetch('/api/chats/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId }),
                credentials: 'include'
            });
        } catch (error) {
            console.error("Failed to mark read:", error);
        }
    },

    updateChat: (chatId, updates) => {
        const currentChats = get().chats;
        const updatedChats = currentChats.map(chat => {
            if (chat._id === chatId) {
                return { ...chat, ...updates };
            }
            return chat;
        });
        set({ chats: updatedChats });

        // Update cache
        chatCache.set('chat-list', updatedChats, 30000);
    },

    resetStore: () => {
        chatCache.clear();
        set({ chats: [], isLoading: false, error: null });
    }
}));

