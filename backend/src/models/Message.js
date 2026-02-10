import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const messageSchema = new Schema({
    conversationId: {
        type: ObjectId,
        ref: 'Conversation',
        required: true,
        index: true,
    },
    senderId: {
        type: ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    imgUrl: {
        type: String,
    },
}, {
    timestamps: true,
});

// Compound index for efficient message pagination within a conversation
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
