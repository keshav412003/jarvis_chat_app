import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withErrorHandler } from '@/lib/error';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

export const PUT = withErrorHandler(async (req) => {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decoded.userId;
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
    const result = await uploadImage(buffer, 'jarvis/users');

    // Find user to get old avatar URL if exists
    const user = await User.findById(userId);
    if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Optional: Delete old avatar
    if (user.avatar && user.avatar.includes('cloudinary.com')) {
        // Extract public ID. This is a bit naive but works for standard Cloudinary URLs
        // Example: https://res.cloudinary.com/demo/image/upload/v12345678/jarvis/users/abc.webp
        try {
            const parts = user.avatar.split('/');
            const filename = parts[parts.length - 1];
            const folder = parts[parts.length - 2];
            const publicId = `jarvis/users/${filename.split('.')[0]}`;
            // Note: This logic assumes the folder structure. 
            // A better way would be to store the publicId in the DB, but let's stick to the prompt.
            // We can also try to extract it more reliably.
            await deleteImage(publicId);
        } catch (error) {
            console.error('Failed to delete old avatar:', error);
        }
    }

    // Update user avatar
    user.avatar = result.secure_url;
    await user.save();

    // Return user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return NextResponse.json({
        success: true,
        message: 'Profile picture updated successfully',
        user: updatedUser
    });
});
