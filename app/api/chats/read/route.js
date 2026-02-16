import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';
import { MarkReadSchema } from '@/lib/validation';
import { checkChatMembership } from '@/lib/chat-utils';

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
        const { chatId } = MarkReadSchema.parse(body);

        const userId = decoded.userId;

        // membership check
        const isMember = await checkChatMembership(chatId, userId);
        if (!isMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update Chat unread count for this user to 0
        await Chat.findByIdAndUpdate(chatId, {
            $set: { [`unreadCounts.${userId}`]: 0 }
        });

        // Also mark all messages in this chat as read by this user
        await Message.updateMany(
            { chatId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        throw error;
    }
});
