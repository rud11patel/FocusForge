const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const friendController = require("../controllers/friendController");

const router = express.Router();

router.get("/", asyncHandler(friendController.listFriends));
router.get("/requests/incoming", asyncHandler(friendController.listIncomingRequests));
router.get("/requests/outgoing", asyncHandler(friendController.listOutgoingRequests));

router.post("/requests/:userId", asyncHandler(friendController.sendRequest));
router.delete("/requests/:userId", asyncHandler(friendController.cancelRequest));
router.post("/requests/:userId/accept", asyncHandler(friendController.acceptRequest));
router.post("/requests/:userId/reject", asyncHandler(friendController.rejectRequest));

router.delete("/:userId", asyncHandler(friendController.removeFriend));

module.exports = router;
