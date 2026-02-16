import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';

export const DELETE = withErrorHandler(async (req) => {
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
        return NextResponse.json({ error: 'Cannot delete direct messages' }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = chat.admins.some(adminId => adminId.toString() === decoded.userId);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Only admins can delete this group' }, { status: 403 });
    }

    // Soft Delete chat
    chat.deletedAt = new Date();
    chat.deletedBy = decoded.userId;
    chat.status = 'deleted';
    chat.deleteReason = 'Admin deleted group';
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
                event: 'group:deleted',
                chatId: chatId,
                payload: {
                    message: 'This group has been deleted by the admin.',
                    deletedBy: decoded.userId
                }
            })
        });
    } catch (socketError) {
        console.error("[Socket] Delete Notification Failed:", socketError.message);
    }

    return NextResponse.json({ message: 'Group deleted successfully' }, { status: 200 });
});
