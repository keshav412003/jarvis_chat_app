import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    otpHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes default
    },
    attempts: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// TTL Index: Automatically delete documents after 'expiresAt' time
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure one OTP per email (we will upsert, so unique helps but application logic handles replacement)
OTPSchema.index({ email: 1 });

OTPSchema.methods.verifyOTP = async function (candidateOTP) {
    return await bcrypt.compare(candidateOTP, this.otpHash);
};

export default mongoose.models.OTP || mongoose.model('OTP', OTPSchema);
