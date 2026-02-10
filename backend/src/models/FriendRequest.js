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

const friendRequestSchema = new Schema({
    from: requiredUserRef,
    to: requiredUserRef,
    message: { type: String, maxlength: 300, trim: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending',
    },
},
    {
        timestamps: true,
    });

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

friendRequestSchema.index({ from: 1 });

friendRequestSchema.index({ to: 1 });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
export default FriendRequest;