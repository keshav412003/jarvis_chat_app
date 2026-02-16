import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Sparse allows null/unique
    phoneNumber: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    about: { type: String, default: 'Hey there! I am using Marvel Chat.' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

// Explicit indexes for faster lookups during login/search
UserSchema.index({ name: 'text' }); // Enable text search for user search feature

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);
