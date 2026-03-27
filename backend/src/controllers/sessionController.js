const sessionService = require("../services/sessionService");

async function startSession(req, res) {
  const session = await sessionService.startSession(req.user.id, req.body);
  res.status(201).json(session);
}

async function completeSession(req, res) {
  const result = await sessionService.completeSession(req.user.id, req.body);
  res.json(result);
}

async function getActiveSession(req, res) {
  const session = await sessionService.getActiveSession(req.user.id);
  res.json(session);
}

async function getHistory(req, res) {
  const sessions = await sessionService.getSessionHistory(req.user.id);
  res.json(sessions);
}

module.exports = {
  startSession,
  completeSession,
  getActiveSession,
  getHistory,
};
