import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";
import { getSortedIds } from "../utils/index.js";

export const checkFriendship = async (req, res, next) => {
    try {
        const me = req.user._id.toString();

        const recipientId = req.body?.recipientId ?? null;

        const memberIds = req.body?.memberIds ?? [];

        if (!recipientId && memberIds.length === 0) {
            return res.status(400).json({ message: "Recipient ID or member IDs are required" })
        }

        if (recipientId) {
            const [userA, userB] = getSortedIds(me, recipientId);

            const isFriend = await Friend.findOne({ userA, userB });

            if (!isFriend) {
                return res.status(400).json({ message: "You are not friends with this user" })
            }

            if (isFriend.status === "blocked") {
                return res.status(400).json({ message: "You can't message this user because you blocked them" })
            } else if (isFriend.status !== "accepted") {
                return res.status(400).json({ message: "You are not friends with this user" })
            }

            return next();
        }

        // For group or direct when passing memberIds
        const validMemberIds = [...new Set(memberIds)].filter(id => id.toString() !== me);

        if (validMemberIds.length === 0) {
            return res.status(400).json({ message: "No valid members provided" });
        }

        const friendChecks = validMemberIds.map(async (memberId) => {
            const memberIdStr = memberId.toString();
            const [userA, userB] = getSortedIds(me, memberIdStr);
            const friend = await Friend.findOne({ userA, userB, status: 'accepted' });
            return friend ? null : memberId;
        });

        const results = await Promise.all(friendChecks);
        const notFriends = results.filter(Boolean);

        if (notFriends.length > 0) {
            return res.status(403).json({ message: "You can only add friends to the conversation", notFriends })
        }

        next()

    } catch (error) {
        console.error("Error while checking friendship", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

