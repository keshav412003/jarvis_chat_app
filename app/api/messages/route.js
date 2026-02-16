import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';
import { MessageSchema } from '@/lib/validation';
import { checkChatMembership } from '@/lib/chat-utils';

export const GET = withErrorHandler(async (req) => {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // membership check
    const isMember = await checkChatMembership(chatId, decoded.userId);
    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const limit = parseInt(searchParams.get('limit')) || 50;
    const cursor = searchParams.get('cursor'); // createdAt timestamp

    const query = { chatId };
    if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
    }

    // Optimized with .lean() and explicit projection
    const messages = await Message.find(query)
        .select('chatId sender content type createdAt') // Explicit projection
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(); // Use lean() for read-only data (20-40% faster)

    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[messages.length - 1].createdAt : null;

    return NextResponse.json({
        messages,
        nextCursor,
        hasMore
    });
});

export const POST = withErrorHandler(async (req) => {
    await dbConnect();

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = MessageSchema.parse(body);
        const { chatId, content, type } = validatedData;

        // membership check
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(decoded.userId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (chat.isGroup) {
            if (type && type !== 'text') {
                return NextResponse.json({ error: 'Encrypted Protocol: Text Only. File transfer is disabled.' }, { status: 400 });
            }
        }

        const newMessage = await Message.create({
            chatId,
            sender: decoded.userId,
            content,
            type: type || 'text'
        });

        // Update chat last message and unread counts
        const unreadUpdate = {};
        chat.participants.forEach(participantId => {
            if (participantId.toString() !== decoded.userId) {
                const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
                unreadUpdate[`unreadCounts.${participantId.toString()}`] = currentCount + 1;
            }
        });

        await Chat.findByIdAndUpdate(chatId, {
            $set: {
                lastMessage: newMessage._id,
                updatedAt: Date.now(),
                ...unreadUpdate
            }
        });

        const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name avatar');

        // Trigger Socket Event via Internal Endpoint
        try {
            const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
            const recipientRooms = chat.participants.map(p => `user_${p.toString()}`);
            const targetRooms = [chatId, ...recipientRooms];

            await fetch(`${socketUrl}/internal/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-secret': process.env.SOCKET_INTERNAL_KEY || "super-secret-internal-key"
                },
                body: JSON.stringify({
                    event: 'receive_message',
                    chatId: targetRooms,
                    payload: populatedMessage
                })
            });
        } catch (socketError) {
            console.error("Failed to trigger socket event:", socketError);
        }

        return NextResponse.json({ message: populatedMessage }, { status: 201 });
    } catch (error) {
        throw error; // Re-throw to be caught by withErrorHandler
    }
});
