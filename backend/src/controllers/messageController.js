import Conversation from "../models/Conversation.js";
import { processMessageCreation } from "../utils/index.js";
import mongoose from "mongoose";

export const sendDirectMessage = async (req, res) => {

    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    if (!content?.trim()) {
        return res.status(400).json({ message: 'Content is required' });
    }

    if (content.length > 2000) {
        return res.status(400).json({ message: 'Message is too long' });
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

        const message = await processMessageCreation(conversation, senderId, content, session);

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

    const { conversationId, content } = req.body;
    const senderId = req.user._id;

    if (!content?.trim()) {
        return res.status(400).json({ message: 'Content is required' });
    }

    if (content.length > 2000) {
        return res.status(400).json({ message: 'Message is too long' });
    }

    if (!conversationId) {
        return res.status(400).json({ message: 'Conversation ID is required' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const conversation = await Conversation.findOne({
            _id: conversationId,
            "participants.userId": senderId
        }).session(session);

        if (!conversation) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Conversation not found or you are not a participant' });
        }

        const message = await processMessageCreation(conversation, senderId, content, session);

        await session.commitTransaction();
        return res.status(201).json({ message });

    } catch (error) {

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        console.error("Error sending group message", error);
        return res.status(500).json({ message: 'Internal server error' });

    } finally {

        session.endSession();

    }
}