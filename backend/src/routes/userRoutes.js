const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/search", asyncHandler(userController.search));
router.get("/me/privacy", asyncHandler(userController.getPrivacy));
router.patch("/me/privacy", asyncHandler(userController.updatePrivacy));
router.put("/privacy", asyncHandler(userController.updatePrivacy));

router.get("/:userId/profile", asyncHandler(userController.getProfile));
router.get("/:userId/friendship-status", asyncHandler(userController.getFriendshipStatus));
router.get("/:userId/stats", asyncHandler(userController.getStats));

module.exports = router;
