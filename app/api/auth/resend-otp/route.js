import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OTP from '@/models/OTP';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { withErrorHandler } from '@/lib/error';

export const POST = withErrorHandler(async (req) => {
    await dbConnect();
    const { email } = await req.json();

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const existingOTP = await OTP.findOne({ email });
    if (existingOTP) {
        const timeDiff = (Date.now() - new Date(existingOTP.updatedAt).getTime()) / 1000;
        if (timeDiff < 60) {
            return NextResponse.json({ error: 'Please wait before resending OTP' }, { status: 429 });
        }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await OTP.findOneAndUpdate(
        { email },
        {
            otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            attempts: 0
        },
        { upsert: true }
    );

    await sendEmail({
        to: email,
        subject: 'Resend Verification Code - Jarvis Chat',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>New Verification Code</h2>
                <p>Your new code is:</p>
                <h1 style="color: #06b6d4; letter-spacing: 5px;">${otp}</h1>
            </div>
        `
    });

    return NextResponse.json({ success: true, message: 'OTP resent' });
});
