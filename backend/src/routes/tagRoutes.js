const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const tagController = require("../controllers/tagController");

const router = express.Router();

router.get("/", asyncHandler(tagController.listTags));
router.post("/", asyncHandler(tagController.createTag));
router.delete("/:id", asyncHandler(tagController.deleteTag));

module.exports = router;
