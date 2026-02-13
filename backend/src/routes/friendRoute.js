import express from "express";

import { sendFriendRequest, getAllFriends, getFriendRequests, removeFriend, blockUser, unblockUser, acceptFriendRequest, declineFriendRequest } from "../controllers/friendController.js";

const router = express.Router();

router.post("/requests", sendFriendRequest);
router.get("/requests", getFriendRequests);
router.get("/", getAllFriends);
router.delete("/:id", removeFriend);
router.post("/:id/block", blockUser);
router.delete("/:id/block", unblockUser);
router.post("/requests/:requestId/accept", acceptFriendRequest);
router.post("/requests/:requestId/decline", declineFriendRequest);

export default router;