import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';
import crypto from 'crypto';

export const POST = withErrorHandler(async (req) => {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { groupName, groupAvatar, participants } = await req.json();

    if (!groupName) {
        return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const creator = await User.findById(decoded.userId);
    if (!creator) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const groupCode = crypto.randomBytes(8).toString('hex');
    const uniqueParticipants = new Set([creator._id.toString()]);

    if (Array.isArray(participants)) {
        participants.forEach(p => {
            if (p && typeof p === 'string') uniqueParticipants.add(p);
        });
    }

    const newGroup = await Chat.create({
        isGroup: true,
        groupName,
        groupAvatar,
        groupCode,
        participants: Array.from(uniqueParticipants),
        admins: [creator._id]
    });

    return NextResponse.json({ group: newGroup }, { status: 201 });
});
