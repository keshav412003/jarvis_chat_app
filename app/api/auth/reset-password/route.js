import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { verifyToken } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error';

export const POST = withErrorHandler(async (req) => {
    await dbConnect();
    const { email, password, verificationToken } = await req.json();

    if (!email || !password || !verificationToken) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const decoded = verifyToken(verificationToken);
    if (!decoded || decoded.email !== email || decoded.type !== 'email_verification') {
        return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.password = password;
    await user.save();

    await OTP.deleteOne({ email });

    return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
    });
});
