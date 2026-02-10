import mongoose from "mongoose";

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

const friendSchema = new Schema({
    userA: requiredUserRef,
    userB: requiredUserRef,
    requester: requiredUserRef,
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending',
    },
}, {
    timestamps: true,
});


friendSchema.pre('save', function (next) {
    if (this.isModified('userA') || this.isModified('userB')) {
        const a = this.userA.toString();
        const b = this.userB.toString();
        if (a > b) {
            this.userA = b;
            this.userB = a;
        }
    }
    next();
});

friendSchema.index({ userA: 1, userB: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema);
export default Friend;