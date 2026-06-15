import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    content: { type: String, required: true, maxlength: 500 },
    type: { type: String, enum: ['chat', 'system', 'trade'], default: 'chat' },
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});

export default mongoose.model('Message', messageSchema);
