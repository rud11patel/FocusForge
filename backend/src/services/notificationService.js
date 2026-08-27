const { pool } = require("../db/pool");

async function createNotification(userId, title, body) {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, title, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, title, body]
  );
  return result.rows[0];
}

async function getUserNotifications(userId) {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return result.rows;
}

async function markNotificationAsRead(userId, notificationId) {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
}

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
};
