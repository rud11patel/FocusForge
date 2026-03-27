const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.get("/me", authMiddleware, asyncHandler(authController.me));

module.exports = router;
