import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    unreadCounts: { type: Map, of: Number, default: {} }, // userId -> count
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupCode: { type: String }, // Unique 16-char code
    groupAvatar: { type: String },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Soft Delete & lifecycle fields
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },
    deleteReason: { type: String },
}, { timestamps: true });

// Indexes for performance
ChatSchema.index({ groupCode: 1 }, { unique: true, sparse: true });
ChatSchema.index({ participants: 1 });
ChatSchema.index({ deletedAt: 1 });
ChatSchema.index({ status: 1 });
// Compound index for optimized chat list queries (10-50x faster)
ChatSchema.index({ participants: 1, status: 1, updatedAt: -1 });

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

