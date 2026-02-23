import FriendRequest from "../models/FriendRequest.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";
import { getSortedIds } from "../utils/index.js";

export const sendFriendRequest = async (req, res) => {
    try {
        const { to, message } = req.body;
        const from = req.user._id.toString();

        if (from === to) {
            return res.status(400).json({ message: "You cannot send friend request to yourself" })
        }

        const userExists = await User.exists({ _id: to });
        if (!userExists) {
            return res.status(400).json({ message: "User does not exist" })
        }

        const [userA, userB] = getSortedIds(from, to);

        const [alreadyFriends, existingRequest] = await Promise.all([
            Friend.findOne({
                userA,
                userB,
            }),
            FriendRequest.findOne({
                $or: [
                    { from, to },
                    { from: to, to: from }, // Check both requests sent and received
                ],
            })
        ]);

        if (alreadyFriends) {
            if (alreadyFriends.status === 'blocked') {
                return res.status(400).json({ message: "Unable to send friend request" }); // Generic message for blocked
            }
            return res.status(400).json({ message: 'You are already friends' });
        }

        if (existingRequest) {
            return res.status(400).json({ message: 'Friend request already pending' });
        }

        const request = new FriendRequest({
            from, to, message
        });

        await request.save();

        return res.status(201).json({ message: 'Friend request sent successfully', request });

    } catch (error) {
        console.error('Error while sending friend request', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id.toString();

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (request.to.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to accept this request" });
        }

        const [userA, userB] = getSortedIds(request.from.toString(), userId);

        // Check if already exist
        const existingFriend = await Friend.findOne({ userA, userB });
        if (existingFriend) {
            if (existingFriend.status === 'blocked') {
                return res.status(400).json({ message: "Unable to accept request" });
            }
            // Already friends, just delete request
            await FriendRequest.findByIdAndDelete(requestId);
            return res.status(200).json({ message: "You are already friends" });
        }

        const newFriend = new Friend({
            userA,
            userB,
            requester: request.from,
            status: 'accepted'
        });

        await newFriend.save();
        await FriendRequest.findByIdAndDelete(requestId);

        const from = await User.findById(request.from)
            .select("_id displayName avatarUrl")
            .lean();

        return res.status(200).json({
            message: "Friend request accepted",
            newFriend: {
                _id: from?._id,
                displayName: from?.displayName,
                avatarUrl: from?.avatarUrl,
            },
        });

    } catch (error) {
        console.error('Error while accepting friend request', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const declineFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id.toString();

        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        if (request.to.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to decline this request" });
        }

        await FriendRequest.findByIdAndDelete(requestId);

        return res.sendStatus(204);

    } catch (error) {
        console.log('Error while declining friend request', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const getAllFriends = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const friends = await Friend.find({
            $or: [{ userA: userId }, { userB: userId }],
            status: 'accepted'
        }).populate('userA', '_id displayName username avatarUrl')
            .populate('userB', '_id displayName username avatarUrl')
            .lean();

        if (!friends.length) {
            return res.status(200).json({ formattedFriends: [] });
        }

        const formattedFriends = friends.map(friend => {
            if (friend.userA._id.toString() === userId) {
                return friend.userB;
            }
            return friend.userA;
        });

        return res.status(200).json({ formattedFriends });

    } catch (error) {
        console.error('Error while getting all friends', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const populateFields = "_id displayName username avatarUrl";

        const [sent, received] = await Promise.all([
            FriendRequest.find({ from: userId, status: 'pending' })
                .populate("to", populateFields)
                .select("to status message createdAt")
                .sort({ createdAt: -1 })
                .lean(),
            FriendRequest.find({ to: userId, status: 'pending' })
                .populate("from", populateFields)
                .select("from status message createdAt")
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        return res.status(200).json({ sent, received });

    } catch (error) {
        console.error('Error while getting all friend requests', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const removeFriend = async (req, res) => {
    try {
        const { id: otherUserId } = req.params;
        const userId = req.user._id.toString();

        const [userA, userB] = getSortedIds(userId, otherUserId);

        const result = await Friend.findOneAndDelete({
            userA,
            userB,
            status: 'accepted'
        });

        if (!result) {
            return res.status(404).json({ message: "You and this user are not friends" });
        }

        return res.status(200).json({ message: "Friend removed successfully" });

    } catch (error) {
        console.error('Error while removing friend', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const blockUser = async (req, res) => {
    try {
        const { id: blockUserId } = req.params;
        const userId = req.user._id.toString();

        if (userId === blockUserId) {
            return res.status(400).json({ message: "Cannot block yourself" });
        }

        const [userA, userB] = getSortedIds(userId, blockUserId);

        const existingRelationship = await Friend.findOne({ userA, userB });

        if (existingRelationship?.status === 'blocked' && existingRelationship.blockedBy?.toString() === userId) {
            return res.status(400).json({ message: "You already blocked this user" });
        }

        await FriendRequest.deleteMany({
            $or: [
                { from: userId, to: blockUserId },
                { from: blockUserId, to: userId }
            ]
        });

        const friendDoc = await Friend.findOneAndUpdate(
            { userA, userB },
            {
                $set: {
                    status: 'blocked',
                    blockedBy: userId,
                    requester: userId
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({ message: "Block user successfully" });

    } catch (error) {
        console.error('Error while blocking friend', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const unblockUser = async (req, res) => {
    try {
        const { id: unblockUserId } = req.params;
        const userId = req.user._id.toString();

        const [userA, userB] = getSortedIds(userId, unblockUserId);

        if (userId === unblockUserId) {
            return res.status(400).json({ message: "You cannot unblock yourself" });
        }

        const result = await Friend.findOneAndDelete({
            userA,
            userB,
            status: 'blocked',
            blockedBy: userId
        });

        if (!result) {
            return res.status(400).json({ message: "User is not blocked or you didn't block them" });
        }

        return res.status(200).json({ message: "User unblocked successfully" });

    } catch (error) {
        console.error('Error while unblocking friend', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}