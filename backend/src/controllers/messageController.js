import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { updateConversationAfterCreateMessage } from "../utils/index.js";
import mongoose from "mongoose";

export const sendDirectMessage = async (req, res) => {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    if (!content?.trim()) {
        return res.status(400).json({ message: 'Content is required' });
    }

    if (!conversationId && !recipientId) {
        return res.status(400).json({ message: 'Recipient ID or Conversation ID is required' });
    }

    if (!conversationId && senderId.toString() === recipientId?.toString()) {
        return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        let conversation;

        if (conversationId) {
            conversation = await Conversation.findOne({
                _id: conversationId,
                "participants.userId": senderId
            }).session(session);

        } else {

            conversation = await Conversation.findOneAndUpdate(
                {
                    type: 'direct',
                    "participants": { $size: 2 },
                    "participants.userId": { $all: [senderId, recipientId] }
                },
                {
                    $setOnInsert: {
                        type: 'direct',
                        participants: [
                            { userId: senderId, joinedAt: new Date() },
                            { userId: recipientId, joinedAt: new Date() },
                        ],
                        unreadCounts: {}
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true, session }
            );
        }

        if (!conversation) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Conversation not found or you are not a participant' });
        }

        const [message] = await Message.create([{
            conversationId: conversation._id,
            senderId,
            content,
        }], { session });

        const participantIds = conversation.participants.map(p => p.userId);
        const updateData = updateConversationAfterCreateMessage(message, senderId, participantIds);

        await Conversation.updateOne({ _id: conversation._id }, updateData, { session });

        await session.commitTransaction();
        return res.status(201).json({ message });

    } catch (error) {

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        console.error("Error sending direct message", error);
        return res.status(500).json({ message: 'Internal server error' });

    } finally {

        session.endSession();

    }
}

export const sendGroupMessage = async (req, res) => {
    try {

    } catch (error) {
        console.error("Error sending group message", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}