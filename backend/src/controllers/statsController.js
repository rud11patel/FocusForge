const statsService = require("../services/statsService");

async function overview(req, res) {
  const data = await statsService.getOverview(req.user.id);
  res.json(data);
}

async function daily(req, res) {
  const data = await statsService.getDailyStats(req.user.id);
  res.json(data);
}

async function weekly(req, res) {
  const data = await statsService.getWeeklyStats(req.user.id);
  res.json(data);
}

async function tags(req, res) {
  const data = await statsService.getTagStats(req.user.id);
  res.json(data);
}

async function momentum(req, res) {
  const data = await statsService.getMomentum(req.user.id);
  res.json(data);
}

async function heatmap(req, res) {
  const data = await statsService.getHeatmap(req.user.id);
  res.json(data);
}

async function hourly(req, res) {
  const data = await statsService.getHourlyStats(req.user.id);
  res.json(data);
}

module.exports = { overview, daily, weekly, tags, momentum, heatmap, hourly };
