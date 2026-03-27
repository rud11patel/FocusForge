const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const tagController = require("../controllers/tagController");

const router = express.Router();

router.get("/", asyncHandler(tagController.listTags));

module.exports = router;
