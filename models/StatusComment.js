import mongoose from 'mongoose';

const StatusCommentSchema = new mongoose.Schema({
    statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Status', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Comment must be 200 characters or less']
    },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

// Cascade delete logic is handled at the API level or via TTL on Status.
// Note: If we want comments to auto-delete, we can either:
// 1. Add TTL to comments too (but we'd need a way to link it to status expiry)
// 2. Just let them stay until a cleanup job runs or status is gone.
// However, the prompt says "All comments under that status must also auto-delete after 24 hours."
// We'll add an expiresAt to comments as well, matching the status expiry.

StatusCommentSchema.add({
    expiresAt: { type: Date, required: true, index: true }
});

StatusCommentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.StatusComment || mongoose.model('StatusComment', StatusCommentSchema);
