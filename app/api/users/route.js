import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';

export const GET = withErrorHandler(async (req) => {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const users = await User.find({ _id: { $ne: decoded.userId } })
        .select('name avatar about isOnline lastSeen email phoneNumber');

    return NextResponse.json({ users });
});
