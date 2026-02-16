import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { withErrorHandler } from '@/lib/error';

export const POST = withErrorHandler(async (req) => {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await OTP.findOneAndUpdate(
        { email },
        {
            email,
            otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
            attempts: 0,
            isVerified: false
        },
        { upsert: true, new: true }
    );

    await sendEmail({
        to: email,
        subject: 'Password Reset Code - Jarvis Chat',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Reset Your Password</h2>
                <p>You requested a password reset for Jarvis Chat.</p>
                <p>Your verification code is:</p>
                <h1 style="color: #ef4444; letter-spacing: 5px;">${otp}</h1>
                <p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
            </div>
        `
    });

    return NextResponse.json({
        success: true,
        message: 'OTP sent to email'
    });
});
