import mongoose from 'mongoose';

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const userRef = {
    type: ObjectId,
    ref: 'User',
};

const requiredUserRef = {
    ...userRef,
    required: true,
};

const requiredString = {
    type: String,
    required: true,
};


const participantSchema = new Schema({
    userId: requiredUserRef,
    joinedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    _id: false, // don't create _id for participant
});

const groupSchema = new Schema({
    name: { ...requiredString, trim: true },
    createdBy: userRef,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    _id: false,
});

const lastMessageSchema = new Schema({
    _id: { type: String },
    content: requiredString,
    senderId: userRef,
    createdAt: {
        type: Date,
        default: null,
    },
},
    {
        _id: false,
    });

const conversationSchema = new Schema({
    type: {
        type: String,
        enum: ['direct', 'group'],
        required: true,
    },
    participants: {
        type: [participantSchema],
        required: true,
    },
    group: {
        type: groupSchema,
    },
    lastMessageAt: {
        type: Date,
        default: null,
    },
    seenBy: [userRef],
    lastMessage: {
        type: lastMessageSchema,
        default: null,
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {},
    },
},
    {
        timestamps: true,
    });

conversationSchema.index({ "participants.userId": 1, lastMessageAt: -1 })

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;