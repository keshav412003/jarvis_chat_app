import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import Message from '@/models/Message';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';
// Rebuilding with relative import to bypass cache issues
import { checkChatMembership } from '../../../../lib/chat-utils';

export const GET = withErrorHandler(async (req, { params }) => {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId } = await params;

    // Membership Check (IDOR Prevention)
    const isMember = await checkChatMembership(chatId, decoded.userId);
    if (!isMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const chat = await Chat.findById(chatId)
        .populate('participants', 'name avatar isOnline email')
        .populate('admins', 'name email');

    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    if (chat.status === 'deleted') {
        return NextResponse.json({ error: 'This group has been deleted' }, { status: 410 });
    }

    // Privacy Filter for Group Chats
    if (chat.isGroup) {
        const isAdmin = chat.admins.some(admin => admin._id.toString() === decoded.userId);

        if (!isAdmin) {
            // Filter participants: Only show admins and self
            chat.participants = chat.participants.filter(p =>
                p._id.toString() === decoded.userId ||
                chat.admins.some(admin => admin._id.toString() === p._id.toString())
            );
        }
    }

    return NextResponse.json({ chat }, { status: 200 });
});
