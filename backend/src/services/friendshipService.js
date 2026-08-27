const { pool } = require("../db/pool");
const { AppError } = require("../utils/errors");
const { createNotification } = require("./notificationService");

async function getFriendshipStatus(userA, userB) {
  const idA = Number(userA);
  const idB = Number(userB);

  if (idA === idB) {
    return "SELF";
  }

  const result = await pool.query(
    `SELECT requester_id, addressee_id, status
     FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [idA, idB]
  );

  if (result.rows.length === 0) {
    return "NONE";
  }

  const row = result.rows[0];

  if (row.status === "ACCEPTED") {
    return "FRIENDS";
  }

  if (row.status === "PENDING") {
    return row.requester_id === idA ? "PENDING_OUTGOING" : "PENDING_INCOMING";
  }

  if (row.status === "REJECTED") {
    return "REJECTED";
  }

  return "NONE";
}

async function sendFriendRequest(requesterId, addresseeId) {
  const reqId = Number(requesterId);
  const addrId = Number(addresseeId);

  if (reqId === addrId) {
    throw new AppError("Cannot send friend request to yourself", 400);
  }

  const targetUserRes = await pool.query(
    "SELECT id, username FROM users WHERE id = $1",
    [addrId]
  );

  if (targetUserRes.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  const requesterUserRes = await pool.query(
    "SELECT id, username FROM users WHERE id = $1",
    [reqId]
  );
  const requesterUsername = requesterUserRes.rows[0]?.username || "A user";

  const existingRes = await pool.query(
    `SELECT * FROM friendships
     WHERE (requester_id = $1 AND addressee_id = $2)
        OR (requester_id = $2 AND addressee_id = $1)`,
    [reqId, addrId]
  );

  if (existingRes.rows.length > 0) {
    const existing = existingRes.rows[0];

    if (existing.status === "ACCEPTED") {
      throw new AppError("You are already friends with this user", 409);
    }

    if (existing.status === "PENDING") {
      if (existing.requester_id === reqId) {
        throw new AppError("Friend request already sent", 409);
      }

      // Opposite direction pending request exists -> auto accept!
      await pool.query(
        `UPDATE friendships
         SET status = 'ACCEPTED', responded_at = NOW()
         WHERE id = $1`,
        [existing.id]
      );

      await createNotification(
        addrId,
        "Friend Request Accepted",
        `${requesterUsername} accepted your friend request.`
      );

      return { status: "ACCEPTED", autoAccepted: true };
    }

    if (existing.status === "REJECTED") {
      // Re-send request
      await pool.query(
        `UPDATE friendships
         SET requester_id = $1, addressee_id = $2, status = 'PENDING', created_at = NOW(), responded_at = NULL
         WHERE id = $3`,
        [reqId, addrId, existing.id]
      );

      await createNotification(
        addrId,
        "New Friend Request",
        `${requesterUsername} sent you a friend request.`
      );

      return { status: "PENDING" };
    }
  }

  await pool.query(
    `INSERT INTO friendships (requester_id, addressee_id, status)
     VALUES ($1, $2, 'PENDING')`,
    [reqId, addrId]
  );

  await createNotification(
    addrId,
    "New Friend Request",
    `${requesterUsername} sent you a friend request.`
  );

  return { status: "PENDING" };
}

async function cancelFriendRequest(requesterId, addresseeId) {
  const reqId = Number(requesterId);
  const addrId = Number(addresseeId);

  const result = await pool.query(
    `DELETE FROM friendships
     WHERE requester_id = $1 AND addressee_id = $2 AND status = 'PENDING'`,
    [reqId, addrId]
  );

  if (result.rowCount === 0) {
    throw new AppError("Pending request not found", 404);
  }

  return { success: true };
}

async function acceptFriendRequest(addresseeId, requesterId) {
  const addrId = Number(addresseeId);
  const reqId = Number(requesterId);

  const result = await pool.query(
    `UPDATE friendships
     SET status = 'ACCEPTED', responded_at = NOW()
     WHERE requester_id = $1 AND addressee_id = $2 AND status = 'PENDING'
     RETURNING *`,
    [reqId, addrId]
  );

  if (result.rowCount === 0) {
    throw new AppError("Pending friend request not found", 404);
  }

  const addresseeUserRes = await pool.query(
    "SELECT username FROM users WHERE id = $1",
    [addrId]
  );
  const addresseeUsername = addresseeUserRes.rows[0]?.username || "A user";

  await createNotification(
    reqId,
    "Friend Request Accepted",
    `${addresseeUsername} accepted your friend request.`
  );

  return { success: true, status: "ACCEPTED" };
}

async function rejectFriendRequest(addresseeId, requesterId) {
  const addrId = Number(addresseeId);
  const reqId = Number(requesterId);

  const result = await pool.query(
    `UPDATE friendships
     SET status = 'REJECTED', responded_at = NOW()
     WHERE requester_id = $1 AND addressee_id = $2 AND status = 'PENDING'
     RETURNING *`,
    [reqId, addrId]
  );

  if (result.rowCount === 0) {
    throw new AppError("Pending friend request not found", 404);
  }

  return { success: true, status: "REJECTED" };
}

async function removeFriend(userId1, userId2) {
  const id1 = Number(userId1);
  const id2 = Number(userId2);

  const result = await pool.query(
    `DELETE FROM friendships
     WHERE status = 'ACCEPTED'
       AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
    [id1, id2]
  );

  if (result.rowCount === 0) {
    throw new AppError("Friend relationship not found", 404);
  }

  return { success: true };
}

async function listFriends(userId) {
  const id = Number(userId);
  const result = await pool.query(
    `SELECT u.id, u.username, u.level, u.xp, u.current_streak, u.privacy_level, f.created_at AS "friendSince"
     FROM friendships f
     JOIN users u ON (CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END) = u.id
     WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'ACCEPTED'
     ORDER BY u.username ASC`,
    [id]
  );

  return result.rows;
}

async function listIncomingRequests(userId) {
  const id = Number(userId);
  const result = await pool.query(
    `SELECT f.id AS request_id, u.id AS user_id, u.username, u.level, f.created_at
     FROM friendships f
     JOIN users u ON f.requester_id = u.id
     WHERE f.addressee_id = $1 AND f.status = 'PENDING'
     ORDER BY f.created_at DESC`,
    [id]
  );

  return result.rows;
}

async function listOutgoingRequests(userId) {
  const id = Number(userId);
  const result = await pool.query(
    `SELECT f.id AS request_id, u.id AS user_id, u.username, u.level, f.created_at
     FROM friendships f
     JOIN users u ON f.addressee_id = u.id
     WHERE f.requester_id = $1 AND f.status = 'PENDING'
     ORDER BY f.created_at DESC`,
    [id]
  );

  return result.rows;
}

module.exports = {
  getFriendshipStatus,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
};
