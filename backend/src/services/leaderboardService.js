const { pool } = require("../db/pool");

async function getGlobalLeaderboard(currentUserId) {
  const result = await pool.query(
    `SELECT
       users.id,
       users.username,
       users.level,
       users.current_streak,
       users.privacy_level,
       COALESCE(SUM(focus_sessions.duration_minutes), 0) AS weekly_minutes
     FROM users
     LEFT JOIN focus_sessions
       ON focus_sessions.user_id = users.id
      AND focus_sessions.start_time >= date_trunc('week', CURRENT_DATE::timestamp)
     WHERE users.privacy_level <> 'PRIVATE'
        OR users.id = $1
     GROUP BY users.id
     ORDER BY weekly_minutes DESC, users.level DESC, users.username ASC
     LIMIT 20`,
    [currentUserId]
  );

  return result.rows.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    username: row.username,
    level: row.level,
    currentStreak: row.current_streak,
    weeklyMinutes: Number(row.weekly_minutes),
    privacyLevel: row.privacy_level,
  }));
}

module.exports = { getGlobalLeaderboard };
