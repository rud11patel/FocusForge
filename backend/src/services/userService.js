const { pool } = require("../db/pool");
const { PRIVACY_LEVELS } = require("../utils/constants");
const { AppError } = require("../utils/errors");
const { canViewUserStats } = require("./privacyService");
const { getFriendshipStatus } = require("./friendshipService");

async function updatePrivacy(userId, privacyLevel) {
  if (!Object.values(PRIVACY_LEVELS).includes(privacyLevel)) {
    throw new AppError("Invalid privacy level", 400);
  }

  const result = await pool.query(
    "UPDATE users SET privacy_level = $1 WHERE id = $2 RETURNING id, privacy_level",
    [privacyLevel, userId]
  );

  return result.rows[0];
}

async function searchUsers(query, currentUserId) {
  const searchTerm = `%${(query || "").trim()}%`;
  const result = await pool.query(
    `SELECT id, username, level, current_streak, privacy_level
     FROM users
     WHERE username ILIKE $1 AND id <> $2
     ORDER BY username ASC
     LIMIT 20`,
    [searchTerm, currentUserId]
  );

  const usersWithStatus = await Promise.all(
    result.rows.map(async (user) => {
      const friendshipStatus = await getFriendshipStatus(currentUserId, user.id);
      return {
        id: user.id,
        username: user.username,
        level: user.level,
        current_streak: user.current_streak,
        friendshipStatus,
      };
    })
  );

  return usersWithStatus;
}

async function getUserProfile(viewerId, targetUserId) {
  const userRes = await pool.query(
    `SELECT id, username, level, xp, current_streak, longest_streak, privacy_level
     FROM users WHERE id = $1`,
    [targetUserId]
  );

  if (userRes.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  const user = userRes.rows[0];
  const friendshipStatus = await getFriendshipStatus(viewerId, targetUserId);
  const privacyAuth = await canViewUserStats(viewerId, targetUserId);

  return {
    id: user.id,
    username: user.username,
    level: user.level,
    privacyLevel: user.privacy_level,
    friendshipStatus,
    statsVisible: privacyAuth.allowed,
    statsVisibilityReason: privacyAuth.reason,
  };
}

async function getUserStats(viewerId, targetUserId) {
  const privacyAuth = await canViewUserStats(viewerId, targetUserId);

  if (!privacyAuth.allowed) {
    if (privacyAuth.reason === "FRIENDS_ONLY") {
      throw new AppError("You must be friends with this user to view their statistics.", 403);
    }
    throw new AppError("This user's statistics are private.", 403);
  }

  const [userRes, sessionRes] = await Promise.all([
    pool.query(
      `SELECT xp, level, current_streak, longest_streak
       FROM users WHERE id = $1`,
      [targetUserId]
    ),
    pool.query(
      `SELECT 
         COALESCE(SUM(duration_minutes), 0) AS total_minutes,
         COALESCE(SUM(duration_seconds), 0) AS total_seconds,
         COUNT(*) AS completed_sessions
       FROM focus_sessions WHERE user_id = $1`,
      [targetUserId]
    ),
  ]);

  if (userRes.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  const user = userRes.rows[0];
  const sessionStats = sessionRes.rows[0];

  return {
    xp: user.xp,
    level: user.level,
    currentStreak: user.current_streak,
    longestStreak: user.longest_streak,
    totalFocusMinutes: Number(sessionStats.total_minutes),
    totalFocusSeconds: Number(sessionStats.total_seconds),
    completedSessionsCount: Number(sessionStats.completed_sessions),
  };
}

module.exports = {
  updatePrivacy,
  searchUsers,
  getUserProfile,
  getUserStats,
};
