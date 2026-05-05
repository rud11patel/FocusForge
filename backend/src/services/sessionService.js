const { pool } = require("../db/pool");
const {
  ACTIVE_SESSION_STATUSES,
  DAILY_STREAK_MINUTES,
  MAX_SESSION_MINUTES,
  XP_PER_MINUTE,
} = require("../utils/constants");
const { AppError } = require("../utils/errors");
const { getLevelFromXp } = require("../utils/math");

async function getActiveSession(userId) {
  const result = await pool.query(
    `SELECT active_sessions.*, tasks.title AS task_title, tags.name AS tag_name
     FROM active_sessions
     LEFT JOIN tasks ON tasks.id = active_sessions.task_id
     LEFT JOIN tags ON tags.id = active_sessions.tag_id
     WHERE active_sessions.user_id = $1 AND active_sessions.status = 'RUNNING'`,
    [userId]
  );

  return result.rows[0] || null;
}

// async function startSession(userId, payload) {
//   const plannedDuration = Number(payload.plannedDuration);

//   if (!plannedDuration || plannedDuration < 5 || plannedDuration > MAX_SESSION_MINUTES) {
//     throw new AppError(
//       `plannedDuration must be between 5 and ${MAX_SESSION_MINUTES}`,
//       400
//     );
//   }

//   try {
//     const result = await pool.query(
//       `INSERT INTO active_sessions 
//        (user_id, task_id, tag_id, start_time, planned_duration, commitment_goal, status)
//        VALUES ($1, $2, $3, NOW(), $4, $5, $6)
//        RETURNING *`,
//       [
//         userId,
//         payload.taskId || null,
//         payload.tagId || null,
//         plannedDuration,
//         payload.commitmentGoal || null,
//         ACTIVE_SESSION_STATUSES.RUNNING,
//       ]
//     );

//     return result.rows[0];
//   } catch (err) {
//     if (err.code === "23505") {
//       throw new AppError(
//         "Finish the active session before starting a new one",
//         409
//       );
//     }
//     throw err;
//   }
// }

async function startSession(userId, payload) {
  const plannedDuration = Number(payload.plannedDuration);

  if (!plannedDuration || plannedDuration < 5 || plannedDuration > MAX_SESSION_MINUTES) {
    throw new AppError(
      `plannedDuration must be between 5 and ${MAX_SESSION_MINUTES}`,
      400
    );
  }

  try {
    const insertResult = await pool.query(
      `INSERT INTO active_sessions 
       (user_id, task_id, tag_id, start_time, planned_duration, commitment_goal, status)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6)
       RETURNING id`,
      [
        userId,
        payload.taskId || null,
        payload.tagId || null,
        plannedDuration,
        payload.commitmentGoal || null,
        ACTIVE_SESSION_STATUSES.RUNNING,
      ]
    );

    const sessionId = insertResult.rows[0].id;

    // 🔥 fetch enriched data (same as getActiveSession)
    const result = await pool.query(
      `SELECT active_sessions.*, tasks.title AS task_title, tags.name AS tag_name
       FROM active_sessions
       LEFT JOIN tasks ON tasks.id = active_sessions.task_id
       LEFT JOIN tags ON tags.id = active_sessions.tag_id
       WHERE active_sessions.id = $1`,
      [sessionId]
    );

    return result.rows[0];
  } catch (err) {
    if (err.code === "23505") {
      throw new AppError(
        "Finish the active session before starting a new one",
        409
      );
    }
    throw err;
  }
}

async function completeSession(userId, payload) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const activeResult = await client.query(
      "SELECT * FROM active_sessions WHERE user_id = $1 AND status = 'RUNNING' FOR UPDATE",
      [userId]
    );

    // ✅ Idempotent: if already completed, don't crash
    if (!activeResult.rowCount) {
      await client.query("ROLLBACK");
      return { message: "Session already completed" };
    }

    const active = activeResult.rows[0];
    const minDurationSeconds = 300;
    const start = new Date(active.start_time);
    const plannedEnd = new Date(
      start.getTime() + active.planned_duration * 60 * 1000
    );
    const now = new Date();
    const endTime = now > plannedEnd ? plannedEnd : now;

    const durationSeconds = Math.floor((endTime - start) / 1000);
    if (durationSeconds < minDurationSeconds) {
      await client.query(
        "DELETE FROM active_sessions WHERE id = $1",
        [active.id]
      );

      await client.query("COMMIT");

      return {
        message: "Session too short, not counted",
      };
    }

    let durationMinutes = Math.floor(durationSeconds / 60);
    durationMinutes = Math.min(durationMinutes, MAX_SESSION_MINUTES);

    const xpGained = durationMinutes * XP_PER_MINUTE;

    const sessionResult = await client.query(
      `INSERT INTO focus_sessions
       (user_id, task_id, tag_id, start_time, end_time, duration_minutes, xp_gained, commitment_goal, commitment_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        active.task_id,
        active.tag_id,
        active.start_time,
        endTime.toISOString(),
        durationMinutes,
        xpGained,
        active.commitment_goal,
        payload.commitmentCompleted ?? null,
      ]
    );

    const userRes = await client.query(
      `SELECT xp, current_streak, longest_streak, last_active_date
       FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );

    const user = userRes.rows[0];
    const totalXp = user.xp + xpGained;
    const level = getLevelFromXp(totalXp);

    const activityDate = new Date(active.start_time).toISOString().slice(0, 10);
    const lastActiveDate = user.last_active_date
      ? new Date(user.last_active_date).toISOString().slice(0, 10)
      : null;

    const todayFocusRes = await client.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) AS minutes
       FROM focus_sessions
       WHERE user_id = $1 AND start_time::date = $2::date`,
      [userId, activityDate]
    );

    const todayFocusMinutes = Number(todayFocusRes.rows[0].minutes);

    let currentStreak = user.current_streak;
    let longestStreak = user.longest_streak;

    if (todayFocusMinutes >= DAILY_STREAK_MINUTES && lastActiveDate !== activityDate) {
      if (!lastActiveDate) {
        currentStreak = 1;
      } else {
        const diffInDays = Math.round(
          (new Date(activityDate) - new Date(lastActiveDate)) /
            (24 * 60 * 60 * 1000)
        );
        currentStreak = diffInDays === 1 ? currentStreak + 1 : 1;
      }

      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (lastActiveDate && lastActiveDate !== activityDate) {
      const diffInDays = Math.round(
        (new Date(activityDate) - new Date(lastActiveDate)) /
          (24 * 60 * 60 * 1000)
      );
      if (diffInDays > 1) {
        currentStreak =
          todayFocusMinutes >= DAILY_STREAK_MINUTES ? 1 : 0;
      }
    }

    await client.query(
      `UPDATE users
       SET xp = $1,
           level = $2,
           current_streak = $3,
           longest_streak = $4,
           last_active_date = CASE
             WHEN $5::int >= $6 THEN $7::date
             ELSE last_active_date
           END
       WHERE id = $8`,
      [
        totalXp,
        level,
        currentStreak,
        longestStreak,
        todayFocusMinutes,
        DAILY_STREAK_MINUTES,
        activityDate,
        userId,
      ]
    );

    // ✅ critical: delete active session
    await client.query(
      "DELETE FROM active_sessions WHERE id = $1",
      [active.id]
    );

    await client.query("COMMIT");

    return {
      session: sessionResult.rows[0],
      xpGained,
      totalXp,
      level,
      currentStreak,
      longestStreak,
      todayFocusMinutes,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getSessionHistory(userId) {
  const result = await pool.query(
    `SELECT focus_sessions.*, tasks.title AS task_title, tags.name AS tag_name
     FROM focus_sessions
     LEFT JOIN tasks ON tasks.id = focus_sessions.task_id
     LEFT JOIN tags ON tags.id = focus_sessions.tag_id
     WHERE focus_sessions.user_id = $1
     ORDER BY focus_sessions.start_time DESC
     LIMIT 50`,
    [userId]
  );

  return result.rows;
}

module.exports = {
  getActiveSession,
  startSession,
  completeSession,
  getSessionHistory,
};
