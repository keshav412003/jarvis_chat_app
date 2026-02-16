import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/models/Chat';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { checkChatAdmin } from '@/lib/chat-utils';

export const PUT = withErrorHandler(async (req, { params }) => {
    await dbConnect();
    const { chatId } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Check if user is admin
    const isAdmin = await checkChatAdmin(chatId, userId);
    if (!isAdmin) {
        return NextResponse.json({ success: false, message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return NextResponse.json({ success: false, message: 'Invalid file type. Only JPEG, PNG and WebP are allowed.' }, { status: 400 });
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: 'File size too large. Max 5MB allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await uploadImage(buffer, 'jarvis/groups');

    const chat = await Chat.findById(chatId);
    if (!chat) {
        return NextResponse.json({ success: false, message: 'Chat not found' }, { status: 404 });
    }

    // Optional: Delete old group avatar
    if (chat.groupAvatar && chat.groupAvatar.includes('cloudinary.com')) {
        try {
            const parts = chat.groupAvatar.split('/');
            const filename = parts[parts.length - 1];
            const publicId = `jarvis/groups/${filename.split('.')[0]}`;
            await deleteImage(publicId);
        } catch (error) {
            console.error('Failed to delete old group avatar:', error);
        }
    }

    // Update group avatar
    chat.groupAvatar = result.secure_url;
    await chat.save();

    return NextResponse.json({
        success: true,
        message: 'Group avatar updated successfully',
        chat
    });
});
