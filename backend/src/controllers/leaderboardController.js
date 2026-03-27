const leaderboardService = require("../services/leaderboardService");

async function global(req, res) {
  const data = await leaderboardService.getGlobalLeaderboard(req.user.id);
  res.json(data);
}

module.exports = { global };
