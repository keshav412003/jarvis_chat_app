import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';
import { ChatCreateSchema } from '@/lib/validation';

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
        const { participantId } = ChatCreateSchema.parse(body);

        const currentUserId = decoded.userId;

        // 1. Check for existing direct chat
        let chat = await Chat.findOne({
            isGroup: false,
            participants: { $all: [currentUserId, participantId], $size: 2 },
            status: { $ne: 'deleted' }
        }).populate('participants', 'name avatar email');

        if (chat) {
            return NextResponse.json({ chat });
        }

        // 2. Create new chat if not found
        chat = await Chat.create({
            participants: [currentUserId, participantId],
            isGroup: false,
            admins: [currentUserId]
        });

        // Re-populate for consistency
        chat = await Chat.findById(chat._id).populate('participants', 'name avatar email');

        return NextResponse.json({ chat }, { status: 201 });

    } catch (error) {
        throw error;
    }
});
