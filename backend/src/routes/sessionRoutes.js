const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const sessionController = require("../controllers/sessionController");

const router = express.Router();

router.post("/start", asyncHandler(sessionController.startSession));
router.post("/complete", asyncHandler(sessionController.completeSession));
router.get("/active", asyncHandler(sessionController.getActiveSession));
router.get("/history", asyncHandler(sessionController.getHistory));

module.exports = router;
