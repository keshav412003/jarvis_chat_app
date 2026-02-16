import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';

export const POST = withErrorHandler(async (req) => {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId } = await req.json();

    if (!chatId) {
        return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (!chat.isGroup) {
        return NextResponse.json({ error: 'Cannot leave a direct message chat' }, { status: 400 });
    }

    const isParticipant = chat.participants.some(id => id.toString() === decoded.userId);
    if (!isParticipant) {
        return NextResponse.json({ error: 'Forbidden: You are not a member of this group' }, { status: 403 });
    }

    // Remove user from participants
    chat.participants = chat.participants.filter(id => id.toString() !== decoded.userId);
    chat.admins = chat.admins.filter(id => id.toString() !== decoded.userId);

    await chat.save();

    // Notify Socket Server
    try {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
        const internalSecret = process.env.SOCKET_INTERNAL_KEY || 'super-secret-internal-key';

        await fetch(`${socketUrl}/internal/notify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': internalSecret
            },
            body: JSON.stringify({
                event: 'group:left',
                chatId: chat._id,
                payload: {
                    user: { _id: decoded.userId }
                }
            })
        });
    } catch (e) {
        console.error("[Socket] Leave Notification Failed:", e.message);
    }

    return NextResponse.json({ message: 'Left group successfully' }, { status: 200 });
});
