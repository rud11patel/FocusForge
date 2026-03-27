const authService = require("../services/authService");

async function register(req, res) {
  const data = await authService.register(req.body);
  res.status(201).json(data);
}

async function login(req, res) {
  const data = await authService.login(req.body);
  res.json(data);
}

async function me(req, res) {
  const user = await authService.getMe(req.user.id);
  res.json(user);
}

module.exports = { register, login, me };
