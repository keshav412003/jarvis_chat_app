import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OTP from '@/models/OTP';
import { signToken } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error';

export const POST = withErrorHandler(async (req) => {
    await dbConnect();
    const { email, otp } = await req.json();

    if (!email || !otp) {
        return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
        return NextResponse.json({ error: 'OTP expired or not found' }, { status: 400 });
    }

    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ email });
        return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 });
    }

    const isValid = await otpRecord.verifyOTP(otp);

    if (!isValid) {
        await OTP.updateOne({ email }, { $inc: { attempts: 1 } });
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const verificationToken = signToken({ email, type: 'email_verification' });

    return NextResponse.json({
        success: true,
        message: 'Email verified',
        verificationToken
    });
});
