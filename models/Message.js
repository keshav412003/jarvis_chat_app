import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String }, // Text content or Caption
    type: { type: String, enum: ['text', 'image', 'video', 'audio', 'file'], default: 'text' },
    mediaUrl: { type: String },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // System message flag
    system: { type: Boolean, default: false },
    // Redundant but useful for direct group queries
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
}, { timestamps: true });

// Optimize message retrieval
MessageSchema.index({ chatId: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
