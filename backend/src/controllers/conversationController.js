import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';
import { io } from '../socket/index.js';

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
    const validMemberIds = [...new Set(memberIds.map((id) => id.toString()))].filter(
      (id) => id !== userId.toString(),
    );

    let conversation;

    if (type === 'direct') {
      if (validMemberIds.length === 0) {
        return res.status(400).json({ message: 'Cannot create conversation with yourself' });
      }
      const participantId = validMemberIds[0];

      conversation = await Conversation.findOne({
        type: 'direct',
        participants: { $size: 2 },
        'participants.userId': { $all: [userId, participantId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: 'direct',
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });
        await conversation.save();
      }
    } else if (type === 'group') {
      if (validMemberIds.length < 2) {
        return res.status(400).json({ message: 'Group must have at least two members' });
      }

      conversation = new Conversation({
        type: 'group',
        participants: [{ userId }, ...validMemberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    await conversation.populate([
      {
        path: 'participants.userId',
        select: 'displayName avatarUrl',
      },
      {
        path: 'seenBy',
        select: 'displayName avatarUrl',
      },
      {
        path: 'lastMessage.senderId',
        select: 'displayName avatarUrl',
      },
    ]);

    return res.status(201).json({ conversation });
  } catch (error) {
    console.error('Error creating conversation', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      'participants.userId': userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate([
        {
          path: 'participants.userId',
          select: 'displayName avatarUrl',
        },
        {
          path: 'lastMessage.senderId',
          select: 'displayName avatarUrl',
        },
        {
          path: 'seenBy',
          select: 'displayName avatarUrl',
        },
      ])
      .lean();

    const validConversations = conversations.filter((convo) => {
      if (convo.type === 'group' && (!convo.participants || convo.participants.length <= 1)) {
        return false;
      }
      return true;
    });

    const formatted = validConversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName ?? null,
        avatarUrl: p.userId?.avatarUrl,
        joinedAt: p.joinedAt,
      }));

      const unreadCounts =
        convo.unreadCounts instanceof Map
          ? Object.fromEntries(convo.unreadCounts)
          : (convo.unreadCounts ?? {});

      return { ...convo, unreadCounts, participants };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error('Error getting conversations', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID format' });
    }

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);

    const isParticipant = await Conversation.exists({
      _id: conversationId,
      'participants.userId': userId,
    });

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied: You are not a participant' });
    }

    const query = { conversationId };

    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return res.status(400).json({ message: 'Invalid cursor format' });
      }
      query._id = { $lt: cursor };
    }

    let messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(parsedLimit + 1)
      .populate('senderId', 'displayName avatarUrl')
      .lean();

    let nextCursor = null;

    if (messages.length > parsedLimit) {
      messages.pop();
      const lastMessage = messages[messages.length - 1];
      nextCursor = lastMessage._id;
    }

    messages = messages.reverse();

    const formatted = messages.map((m) => ({
      ...m,
      senderId: m.senderId?._id?.toString() ?? m.senderId?.toString(),
      sender: {
        _id: m.senderId?._id?.toString() ?? m.senderId?.toString(),
        displayName: m.senderId?.displayName ?? null,
        avatarUrl: m.senderId?.avatarUrl ?? null,
      },
    }));

    return res.status(200).json({ messages: formatted, nextCursor });
  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Security check: ensure the user is actually a participant
    const isParticipant = conversation.participants?.some(
      (p) => p.userId.toString() === userId.toString(),
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied: You are not a participant' });
    }

    const last = conversation.lastMessage;
    if (!last) {
      return res.status(200).json({ message: 'No message to be seen' });
    }

    // Optimization: Skip db update if already seen and unreadCount is 0
    const hasSeen = conversation.seenBy?.some((id) => id.toString() === userId.toString());
    const unreadCount = conversation.unreadCounts
      ? conversation.unreadCounts[userId.toString()]
      : 0;

    if (hasSeen && unreadCount === 0) {
      return res.status(200).json({
        message: 'Already marked as seen',
        seenBy: conversation.seenBy || [],
        myUnreadCount: 0,
      });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 },
      },
      { new: true },
    ).lean();

    io.to(conversationId).emit('read-message', {
      conversation: updated,
      lastMessage: {
        _id: updated.lastMessage._id,
        content: updated.lastMessage.content,
        createdAt: updated.lastMessage.createdAt,
        sender: {
          _id: updated.lastMessage.senderId,
        },
      },
    });

    return res.status(200).json({
      message: 'Marked as seen',
      seenBy: updated.seenBy || [],
      myUnreadCount: updated.unreadCounts ? updated.unreadCounts[userId.toString()] || 0 : 0,
    });
  } catch (error) {
    console.error('Error marking as seen:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find({ 'participants.userId': userId }, { _id: 1 });
    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error('Error getting conversations for socket io', error);
    return [];
  }
};
