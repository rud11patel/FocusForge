const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");
const statsController = require("../controllers/statsController");

const router = express.Router();

router.get("/overview", asyncHandler(statsController.overview));
router.get("/daily", asyncHandler(statsController.daily));
router.get("/weekly", asyncHandler(statsController.weekly));
router.get("/tags", asyncHandler(statsController.tags));
router.get("/momentum", asyncHandler(statsController.momentum));
router.get("/heatmap", asyncHandler(statsController.heatmap));
router.get("/hourly", asyncHandler(statsController.hourly));

module.exports = router;
