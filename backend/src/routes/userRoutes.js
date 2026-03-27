const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const userController = require("../controllers/userController");

const router = express.Router();

router.put("/privacy", asyncHandler(userController.updatePrivacy));

module.exports = router;
