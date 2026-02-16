import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import Message from '@/models/Message';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';

export const GET = withErrorHandler(async (req) => {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = decoded.userId;

    // Fetch chats where user is participant and not deleted
    // Optimized with .lean() for read-only data and limited projections
    const chats = await Chat.find({
        participants: userId,
        status: { $ne: 'deleted' }
    })
        .select('participants lastMessage unreadCounts isGroup groupName groupAvatar updatedAt')
        .populate('participants', 'name avatar') // Removed 'email' - not needed
        .populate({
            path: 'lastMessage',
            select: 'content type createdAt sender',
            populate: { path: 'sender', select: 'name' }
        })
        .sort({ updatedAt: -1 })
        .lean(); // Use lean() for better performance (30-50% faster)

    // Transform data for frontend
    const formattedChats = chats.map(chat => {
        const unreadCount = chat.unreadCounts ? (chat.unreadCounts[userId] || 0) : 0;
        let displayName = 'Unknown';
        let displayAvatar = '';

        if (chat.isGroup) {
            displayName = chat.groupName;
            displayAvatar = chat.groupAvatar;
        } else {
            const otherParticipant = chat.participants.find(p => p._id.toString() !== userId);
            if (otherParticipant) {
                displayName = otherParticipant.name;
                displayAvatar = otherParticipant.avatar;
            } else {
                displayName = "Deleted User";
            }
        }

        return {
            _id: chat._id,
            isGroup: chat.isGroup,
            name: displayName,
            avatar: displayAvatar,
            lastMessage: chat.lastMessage,
            unreadCount,
            updatedAt: chat.updatedAt,
            participants: chat.participants
        };
    });

    return NextResponse.json({ chats: formattedChats });
});

export const POST = withErrorHandler(async (req) => {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { participantId } = await req.json();

    if (!participantId) {
        return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    const currentUserId = decoded.userId;

    const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [currentUserId, participantId], $size: 2 },
        status: { $ne: 'deleted' }
    });

    if (existingChat) {
        return NextResponse.json({ chat: existingChat });
    }

    const newChat = await Chat.create({
        participants: [currentUserId, participantId],
        isGroup: false,
        admins: [currentUserId]
    });

    return NextResponse.json({ chat: newChat }, { status: 201 });
});
