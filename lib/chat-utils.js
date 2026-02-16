import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';

export const checkChatMembership = async (chatId, userId) => {
    await dbConnect();
    const chat = await Chat.findOne({
        _id: chatId,
        participants: userId,
        status: { $ne: 'deleted' }
    });
    return !!chat;
};

export const checkChatAdmin = async (chatId, userId) => {
    await dbConnect();
    const chat = await Chat.findOne({
        _id: chatId,
        admins: userId,
        status: { $ne: 'deleted' }
    });
    return !!chat;
};
