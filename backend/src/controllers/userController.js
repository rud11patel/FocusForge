const userService = require("../services/userService");

async function updatePrivacy(req, res) {
  const user = await userService.updatePrivacy(req.user.id, req.body.privacyLevel);
  res.json(user);
}

module.exports = { updatePrivacy };
