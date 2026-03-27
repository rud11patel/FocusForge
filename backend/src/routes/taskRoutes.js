const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.get("/", asyncHandler(taskController.listTasks));
router.post("/", asyncHandler(taskController.createTask));
router.put("/:id", asyncHandler(taskController.updateTask));
router.delete("/:id", asyncHandler(taskController.deleteTask));

module.exports = router;
