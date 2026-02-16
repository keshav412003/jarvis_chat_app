import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Status from '@/models/Status';
import StatusComment from '@/models/StatusComment';
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
        const { comment } = await req.json();

        if (!comment || comment.length > 200) {
            return NextResponse.json({ error: 'Invalid comment length (max 200)' }, { status: 400 });
        }

        // 1. Verify Status exists and user has visibility
        const status = await Status.findOne({
            _id: id,
            $or: [{ creatorId: userId }, { visibleTo: userId }],
            expiresAt: { $gt: new Date() }
        });

        if (!status) {
            return NextResponse.json({ error: 'Status not found or no access' }, { status: 404 });
        }

        // 2. Block self-comments
        if (status.creatorId.toString() === userId) {
            return NextResponse.json({
                error: 'Admin are not allowed to react in their own status, it is against our values'
            }, { status: 400 });
        }

        // 3. Enforce one comment per user
        const existingComment = await StatusComment.findOne({ statusId: id, userId });
        if (existingComment) {
            return NextResponse.json({ error: 'Transmission limit reached. Only one comment per status allowed.' }, { status: 400 });
        }

        // 2. Create comment with SAME expiry as status
        const newComment = await StatusComment.create({
            statusId: id,
            userId,
            comment,
            expiresAt: status.expiresAt
        });

        return NextResponse.json({ comment: newComment }, { status: 201 });

    } catch (error) {
        console.error("Comment Status Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    await dbConnect();
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = decoded.userId;

        // Visibility check on the status itself before returning comments
        const status = await Status.findOne({
            _id: id,
            $or: [{ creatorId: userId }, { visibleTo: userId }]
        });

        if (!status) return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });

        const comments = await StatusComment.find({ statusId: id })
            .populate('userId', 'name avatar')
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json({ comments });

    } catch (error) {
        console.error("Get Comments Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
