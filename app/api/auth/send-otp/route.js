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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
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
        subject: 'Your Verification Code - Jarvis Chat',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Verify your email</h2>
                <p>Your verification code for Jarvis Chat is:</p>
                <h1 style="color: #06b6d4; letter-spacing: 5px;">${otp}</h1>
                <p>This code expires in 10 minutes.</p>
            </div>
        `
    });

    return NextResponse.json({
        success: true,
        message: 'OTP sent successfully'
    });
});
