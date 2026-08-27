const { pool } = require("../db/pool");

async function isFriend(userA, userB) {
  if (Number(userA) === Number(userB)) return true;
  const result = await pool.query(
    `SELECT id FROM friendships 
     WHERE status = 'ACCEPTED' 
       AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
    [userA, userB]
  );
  return result.rows.length > 0;
}

async function canViewUserStats(viewerId, targetUserId) {
  if (Number(viewerId) === Number(targetUserId)) {
    return { allowed: true, reason: "SELF" };
  }

  const userRes = await pool.query(
    "SELECT privacy_level FROM users WHERE id = $1",
    [targetUserId]
  );

  if (userRes.rows.length === 0) {
    return { allowed: false, reason: "NOT_FOUND" };
  }

  const privacyLevel = userRes.rows[0].privacy_level || "PRIVATE";

  if (privacyLevel === "PUBLIC") {
    return { allowed: true, reason: "PUBLIC" };
  }

  if (privacyLevel === "PRIVATE") {
    return { allowed: false, reason: "PRIVATE" };
  }

  if (privacyLevel === "FRIENDS_ONLY") {
    const areFriends = await isFriend(viewerId, targetUserId);
    if (areFriends) {
      return { allowed: true, reason: "FRIENDS_ONLY" };
    }
    return { allowed: false, reason: "FRIENDS_ONLY" };
  }

  return { allowed: false, reason: "PRIVATE" };
}

module.exports = { canViewUserStats, isFriend };
