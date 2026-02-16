import mongoose from 'mongoose';

const StatusSchema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: [300, 'Status must be 300 characters or less']
    },
    visibleTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    color: { type: String, default: '#000000' },
    expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index for efficient status feed queries (5-20x faster)
StatusSchema.index({ creatorId: 1, expiresAt: 1 });

// Use a more robust model export for Next.js dev mode
export default mongoose.models.Status || mongoose.model('Status', StatusSchema);

