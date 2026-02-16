import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Status from '@/models/Status';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req, { params }) {
    await dbConnect();
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = decoded.userId;

        // 1. Explicit Owner Check for Value-based Messaging
        const status = await Status.findById(id);
        if (status && status.creatorId.toString() === userId) {
            return NextResponse.json({
                error: 'Admin are not allowed to react in their own status, it is against our values'
            }, { status: 400 });
        }

        // 2. Atomic Check and Update
        const updatedStatus = await Status.findOneAndUpdate(
            {
                _id: id,
                creatorId: { $ne: userId }, // Double safety
                likes: { $ne: userId }, // Cannot like if already liked
                $or: [{ creatorId: userId }, { visibleTo: userId }], // Visibility check
                expiresAt: { $gt: new Date() } // Not expired
            },
            { $addToSet: { likes: userId } },
            { new: true }
        );

        if (!updatedStatus) {
            return NextResponse.json({ error: 'Likability check failed (Already liked, no access, or expired)' }, { status: 400 });
        }

        return NextResponse.json({ success: true, likeCount: updatedStatus.likes.length });

    } catch (error) {
        console.error("Like Status Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
