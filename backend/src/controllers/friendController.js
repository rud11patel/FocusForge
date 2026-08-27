const friendshipService = require("../services/friendshipService");

async function sendRequest(req, res) {
  const result = await friendshipService.sendFriendRequest(
    req.user.id,
    req.params.userId
  );
  res.json(result);
}

async function cancelRequest(req, res) {
  const result = await friendshipService.cancelFriendRequest(
    req.user.id,
    req.params.userId
  );
  res.json(result);
}

async function acceptRequest(req, res) {
  const result = await friendshipService.acceptFriendRequest(
    req.user.id,
    req.params.userId
  );
  res.json(result);
}

async function rejectRequest(req, res) {
  const result = await friendshipService.rejectFriendRequest(
    req.user.id,
    req.params.userId
  );
  res.json(result);
}

async function removeFriend(req, res) {
  const result = await friendshipService.removeFriend(
    req.user.id,
    req.params.userId
  );
  res.json(result);
}

async function listFriends(req, res) {
  const friends = await friendshipService.listFriends(req.user.id);
  res.json({ friends });
}

async function listIncomingRequests(req, res) {
  const requests = await friendshipService.listIncomingRequests(req.user.id);
  res.json({ requests });
}

async function listOutgoingRequests(req, res) {
  const requests = await friendshipService.listOutgoingRequests(req.user.id);
  res.json({ requests });
}

module.exports = {
  sendRequest,
  cancelRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
};
