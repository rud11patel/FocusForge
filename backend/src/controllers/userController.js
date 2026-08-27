const userService = require("../services/userService");
const friendshipService = require("../services/friendshipService");

async function updatePrivacy(req, res) {
  const user = await userService.updatePrivacy(req.user.id, req.body.privacyLevel);
  res.json(user);
}

async function getPrivacy(req, res) {
  res.json({ privacyLevel: req.user.privacy_level });
}

async function search(req, res) {
  const users = await userService.searchUsers(req.query.q, req.user.id);
  res.json({ users });
}

async function getProfile(req, res) {
  const profile = await userService.getUserProfile(req.user.id, req.params.userId);
  res.json(profile);
}

async function getFriendshipStatus(req, res) {
  const status = await friendshipService.getFriendshipStatus(
    req.user.id,
    req.params.userId
  );
  res.json({ status });
}

async function getStats(req, res) {
  const stats = await userService.getUserStats(req.user.id, req.params.userId);
  res.json(stats);
}

module.exports = {
  updatePrivacy,
  getPrivacy,
  search,
  getProfile,
  getFriendshipStatus,
  getStats,
};
