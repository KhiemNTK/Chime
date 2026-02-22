import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";
import { getSortedIds } from "../utils/index.js";

export const checkFriendship = async (req, res, next) => {
    try {
        const me = req.user._id.toString();

        const recipientId = req.body?.recipientId ?? null;

        if (!recipientId) {
            return res.status(400).json({ message: "Recipient ID is required" })
        }

        if (recipientId) {
            const [userA, userB] = getSortedIds(me, recipientId);

            const isFriend = await Friend.findOne({ userA, userB });

            if (!isFriend) {
                return res.status(400).json({ message: "You are not friends with this user" })
            }

            if (isFriend.status === "blocked") {
                return res.status(400).json({ message: "You can't message this user because you blocked them" })
            }

            return next();

        }

    } catch (error) {
        console.error("Error while checking friendship", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

