const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const leaderboardController = require("../controllers/leaderboardController");

const router = express.Router();

router.get("/global", asyncHandler(leaderboardController.global));

module.exports = router;
