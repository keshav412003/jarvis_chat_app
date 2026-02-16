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

    const { groupCode } = await req.json();

    if (!groupCode) {
        return NextResponse.json({ error: 'Group code is required' }, { status: 400 });
    }

    const chat = await Chat.findOne({ groupCode, isGroup: true });

    if (!chat) {
        return NextResponse.json({ error: 'Invalid group code' }, { status: 404 });
    }

    // Check if already a member
    if (chat.participants.includes(decoded.userId)) {
        return NextResponse.json({ error: 'Already a member', chatId: chat._id }, { status: 200 });
    }

    // Add user to participants
    chat.participants.push(decoded.userId);
    await chat.save();

    // Trigger Socket Event via Internal Endpoint
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
                event: 'group:joined',
                chatId: chat._id,
                payload: {
                    user: { _id: decoded.userId, name: 'New Member' }
                }
            })
        });
    } catch (e) {
        console.error("[Socket] Join Notification Failed:", e.message);
    }

    return NextResponse.json({ message: 'Joined successfully', chatId: chat._id }, { status: 200 });
});
