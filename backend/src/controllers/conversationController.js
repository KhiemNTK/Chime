import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body;
        const userId = req.user._id;

        if (!['direct', 'group'].includes(type)) {
            return res.status(400).json({ message: 'Conversation type must be direct or group' });
        }

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: 'Member IDs are required and must be an array' });
        }

        if (type === 'group' && !name?.trim()) {
            return res.status(400).json({ message: 'Group name is required for group conversations' });
        }

        // Delete duplicate IDs and remove the user's own ID
        const validMemberIds = [...new Set(memberIds.map(id => id.toString()))].filter(id => id !== userId.toString());

        let conversation;

        if (type === 'direct') {
            if (validMemberIds.length === 0) {
                return res.status(400).json({ message: 'Cannot create conversation with yourself' });
            }
            const participantId = validMemberIds[0];

            conversation = await Conversation.findOne({
                type: 'direct',
                "participants.userId": { $all: [userId, participantId] },
            });

            if (!conversation) {
                conversation = new Conversation({
                    type: 'direct',
                    participants: [
                        { userId },
                        { userId: participantId }
                    ],
                    lastMessageAt: new Date()
                });
                await conversation.save();
            }
        } else if (type === 'group') {
            if (validMemberIds.length === 0) {
                return res.status(400).json({ message: 'Group must have at least one other member' });
            }

            conversation = new Conversation({
                type: 'group',
                participants: [{ userId }, ...validMemberIds.map((id) => ({ userId: id }))],
                group: {
                    name,
                    createdBy: userId
                },
                lastMessageAt: new Date()
            });

            await conversation.save();
        }

        await conversation.populate([
            {
                path: 'participants.userId',
                select: 'displayName avatarUrl'
            },
            {
                path: 'seenBy',
                select: 'displayName avatarUrl'
            },
            {
                path: 'lastMessage.senderId',
                select: 'displayName avatarUrl'
            }
        ]);

        return res.status(201).json({ conversation });

    } catch (error) {
        console.error("Error creating conversation", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const getConversations = async (req, res) => {

    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            "participants.userId": userId
        })
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate([
                {
                    path: "participants.userId",
                    select: "displayName avatarUrl"
                },
                {
                    path: "lastMessage.senderId",
                    select: "displayName avatarUrl"
                },
                {
                    path: "seenBy",
                    select: "displayName avatarUrl"
                }
            ])
            .lean();

        //Formatted conversations for frontend
        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName ?? null,
                avatarUrl: p.userId?.avatarUrl,
                joinedAt: p.joinedAt
            }));

            return {
                ...convo, // No need for toObject() since lean() is used
                unreadCounts: convo.unreadCounts || null,
                participants
            }
        });

        return res.status(200).json({ conversations: formatted });
    } catch (error) {

        console.error("Error getting conversations", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const getMessages = async (req, res) => {
}