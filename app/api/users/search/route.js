import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';

export const GET = withErrorHandler(async (req) => {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const query = searchParams.get('query');

    // Validation
    if (!query || query.length < 2) {
        return NextResponse.json({ users: [] });
    }

    if (!['name', 'email'].includes(mode)) {
        return NextResponse.json({ error: 'Invalid search mode' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const currentUserId = decoded.userId;

    // Escape regex special characters
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const searchCriteria = {
        _id: { $ne: currentUserId }
    };

    if (mode === 'email') {
        searchCriteria.email = { $regex: safeQuery, $options: 'i' };
    } else {
        searchCriteria.$text = { $search: query };
    }

    const users = await User.find(searchCriteria)
        .select('name email avatar about')
        .limit(20)
        .lean();

    return NextResponse.json({ users });
});
