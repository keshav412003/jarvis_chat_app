import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';

export const GET = withErrorHandler(async (req) => {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const emailQuery = searchParams.get('email');

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!emailQuery || emailQuery.length < 3) {
        return NextResponse.json({ users: [] });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isLikelyEmail = emailRegex.test(emailQuery);

    const currentUserId = decoded.userId;

    const searchCriteria = {
        _id: { $ne: currentUserId },
        email: { $regex: emailQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    };

    const users = await User.find(searchCriteria)
        .select('name email avatar about')
        .limit(10)
        .lean();

    return NextResponse.json({ users });
});
