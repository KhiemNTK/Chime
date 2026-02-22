export const updateConversationAfterCreateMessage = (message, senderId, participantIds) => {
    const update = {
        $set: {
            lastMessageAt: message.createdAt,
            lastMessage: {
                id: message._id,
                content: message.content,
                senderId,
                createdAt: message.createdAt
            },
            seenBy: [senderId]
        },
        $inc: {}
    };

    if (participantIds && Array.isArray(participantIds)) {
        participantIds.forEach((userId) => {
            const memberId = userId.toString();
            if (memberId !== senderId.toString()) {
                update.$inc[`unreadCounts.${memberId}`] = 1;
            }
        });
    }

    if (Object.keys(update.$inc).length === 0) {
        delete update.$inc;
    }

    return update;
}

// Utility to sort user IDs
export const getSortedIds = (id1, id2) => (id1 > id2 ? [id2, id1] : [id1, id2]);
