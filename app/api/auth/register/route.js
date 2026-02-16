import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { signToken, verifyToken } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error';

export const POST = withErrorHandler(async (req) => {
    await dbConnect();
    const payload = await req.json();
    const { name, email, phoneNumber, password, verificationToken } = payload;

    if (!verificationToken) {
        return NextResponse.json({ error: 'Email verification required' }, { status: 400 });
    }

    const decoded = verifyToken(verificationToken);
    if (!decoded || decoded.email !== email || decoded.type !== 'email_verification') {
        return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    if (!name || !password || !email) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({
        $or: [
            { email: email },
            { phoneNumber: phoneNumber || 'null_phone' }
        ]
    });

    if (existingUser) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const newUser = await User.create({
        name,
        email,
        phoneNumber,
        password
    });

    await OTP.deleteOne({ email });

    const token = signToken({ userId: newUser._id });

    const userObj = newUser.toObject();
    delete userObj.password;

    const response = NextResponse.json({ user: userObj }, { status: 201 });

    response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
    });

    return response;
});
