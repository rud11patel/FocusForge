const { pool } = require("../db/pool");
const { getXpProgress } = require("../utils/math");

function mapDay(resultRows) {
  return resultRows.map((row) => ({
    day: row.day,
    minutes: Number(row.minutes),
  }));
}

async function getOverview(userId) {
  const [userRes, todayRes, weekRes, activeTasksRes, leaderboardRes, deepWorkRes] = await Promise.all([
    pool.query(
      `SELECT id, username, email, privacy_level, xp, level, current_streak, longest_streak, last_active_date
       FROM users WHERE id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) AS minutes
       FROM focus_sessions
       WHERE user_id = $1 AND start_time::date = CURRENT_DATE`,
      [userId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) AS minutes
       FROM focus_sessions
       WHERE user_id = $1
         AND start_time >= date_trunc('week', CURRENT_DATE::timestamp)`,
      [userId]
    ),
    pool.query(
      `SELECT COUNT(*) AS count
       FROM tasks
       WHERE user_id = $1 AND status = 'ACTIVE' AND deleted_at IS NULL`,
      [userId]
    ),
    pool.query(
      `WITH ranked AS (
         SELECT user_id, SUM(duration_minutes) AS weekly_minutes,
                RANK() OVER (ORDER BY SUM(duration_minutes) DESC, user_id ASC) AS position
         FROM focus_sessions
         WHERE start_time >= date_trunc('week', CURRENT_DATE::timestamp)
         GROUP BY user_id
       )
       SELECT position, weekly_minutes
       FROM ranked
       WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT COUNT(*) AS count
       FROM focus_sessions
       WHERE user_id = $1
         AND duration_minutes >= 90
         AND start_time >= date_trunc('week', CURRENT_DATE::timestamp)`,
      [userId]
    ),
  ]);

  const user = userRes.rows[0];

  return {
    user,
    todayMinutes: Number(todayRes.rows[0].minutes),
    weekMinutes: Number(weekRes.rows[0].minutes),
    activeTaskCount: Number(activeTasksRes.rows[0].count),
    leaderboardPosition: leaderboardRes.rowCount ? Number(leaderboardRes.rows[0].position) : null,
    weeklyLeaderboardMinutes: leaderboardRes.rowCount ? Number(leaderboardRes.rows[0].weekly_minutes) : 0,
    weeklyDeepWorkBlocks: Number(deepWorkRes.rows[0].count),
    xpProgress: getXpProgress(user.xp),
  };
}

async function getDailyStats(userId) {
  const result = await pool.query(
    `SELECT TO_CHAR(day::date, 'YYYY-MM-DD') AS day, COALESCE(SUM(duration_minutes), 0) AS minutes
     FROM (
       SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS day
     ) calendar
     LEFT JOIN focus_sessions
       ON focus_sessions.user_id = $1
      AND focus_sessions.start_time::date = calendar.day::date
     GROUP BY day
     ORDER BY day ASC`,
    [userId]
  );

  return mapDay(result.rows);
}

async function getWeeklyStats(userId) {
  const result = await pool.query(
    `SELECT TO_CHAR(date_trunc('week', start_time), 'YYYY-MM-DD') AS week_start,
            SUM(duration_minutes) AS minutes
     FROM focus_sessions
     WHERE user_id = $1
       AND start_time >= CURRENT_DATE - INTERVAL '8 weeks'
     GROUP BY week_start
     ORDER BY week_start ASC`,
    [userId]
  );

  return result.rows.map((row) => ({
    weekStart: row.week_start,
    minutes: Number(row.minutes),
  }));
}

async function getTagStats(userId) {
  const result = await pool.query(
    `SELECT COALESCE(tags.name, 'Uncategorized') AS tag, COALESCE(SUM(duration_minutes), 0) AS minutes
     FROM focus_sessions
     LEFT JOIN tags ON tags.id = focus_sessions.tag_id
     WHERE focus_sessions.user_id = $1
       AND focus_sessions.start_time >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY tag
     ORDER BY minutes DESC, tag ASC`,
    [userId]
  );

  return result.rows.map((row) => ({
    tag: row.tag,
    minutes: Number(row.minutes),
  }));
}

async function getMomentum(userId) {
  const result = await pool.query(
    `WITH weeks AS (
       SELECT
         SUM(CASE
           WHEN start_time >= date_trunc('week', CURRENT_DATE::timestamp)
           THEN duration_minutes ELSE 0 END) AS this_week,
         SUM(CASE
           WHEN start_time >= date_trunc('week', CURRENT_DATE::timestamp) - INTERVAL '7 days'
            AND start_time < date_trunc('week', CURRENT_DATE::timestamp)
           THEN duration_minutes ELSE 0 END) AS last_week
       FROM focus_sessions
       WHERE user_id = $1
         AND start_time >= date_trunc('week', CURRENT_DATE::timestamp) - INTERVAL '7 days'
     )
     SELECT this_week, last_week FROM weeks`,
    [userId]
  );

  const thisWeek = Number(result.rows[0].this_week || 0);
  const lastWeek = Number(result.rows[0].last_week || 0);
  const momentum = lastWeek === 0 ? (thisWeek > 0 ? 1 : 0) : (thisWeek - lastWeek) / lastWeek;

  const consistencyRes = await pool.query(
    `SELECT
       COUNT(DISTINCT start_time::date) AS days_with_focus,
       14 AS total_days
     FROM focus_sessions
     WHERE user_id = $1
       AND start_time::date >= CURRENT_DATE - INTERVAL '13 days'`,
    [userId]
  );

  const predictionRes = await pool.query(
    `SELECT COALESCE(AVG(minutes), 0) AS predicted_minutes
     FROM (
       SELECT start_time::date AS day, SUM(duration_minutes) AS minutes
       FROM focus_sessions
       WHERE user_id = $1
         AND start_time::date >= CURRENT_DATE - INTERVAL '13 days'
       GROUP BY day
     ) days`,
    [userId]
  );

  const daysWithFocus = Number(consistencyRes.rows[0].days_with_focus || 0);

  return {
    momentum,
    focusPrediction: Math.round(Number(predictionRes.rows[0].predicted_minutes || 0)),
    consistencyScore: Math.round((daysWithFocus / 14) * 100),
  };
}

async function getHeatmap(userId) {
  const result = await pool.query(
    `SELECT TO_CHAR(day::date, 'YYYY-MM-DD') AS day, COALESCE(SUM(duration_minutes), 0) AS minutes
     FROM (
       SELECT generate_series(CURRENT_DATE - INTERVAL '83 days', CURRENT_DATE, INTERVAL '1 day') AS day
     ) calendar
     LEFT JOIN focus_sessions
       ON focus_sessions.user_id = $1
      AND focus_sessions.start_time::date = calendar.day::date
     GROUP BY day
     ORDER BY day ASC`,
    [userId]
  );

  return mapDay(result.rows);
}

module.exports = {
  getOverview,
  getDailyStats,
  getWeeklyStats,
  getTagStats,
  getMomentum,
  getHeatmap,
};
