const { pool } = require("../db/pool");
const { TASK_STATUSES } = require("../utils/constants");
const { AppError } = require("../utils/errors");

async function listTasks(userId) {
  const result = await pool.query(
    `SELECT tasks.*, tags.name AS tag_name
     FROM tasks
     LEFT JOIN tags ON tags.id = tasks.tag_id
     WHERE tasks.user_id = $1 AND tasks.deleted_at IS NULL
     ORDER BY tasks.status ASC, tasks.created_at DESC`,
    [userId]
  );

  return result.rows;
}

async function createTask(userId, payload) {
  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, description, tag_id, estimated_sessions)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      payload.title,
      payload.description || "",
      payload.tagId || null,
      payload.estimatedSessions || 1,
    ]
  );

  return result.rows[0];
}

async function updateTask(userId, taskId, payload) {
  const status = payload.status || TASK_STATUSES.ACTIVE;

  if (!Object.values(TASK_STATUSES).includes(status)) {
    throw new AppError("Invalid task status", 400);
  }

  const result = await pool.query(
    `UPDATE tasks
     SET title = $1,
         description = $2,
         tag_id = $3,
         status = $4,
         estimated_sessions = $5,
         updated_at = NOW()
     WHERE id = $6 AND user_id = $7 AND deleted_at IS NULL
     RETURNING *`,
    [
      payload.title,
      payload.description || "",
      payload.tagId || null,
      status,
      payload.estimatedSessions || 1,
      taskId,
      userId,
    ]
  );

  if (!result.rowCount) {
    throw new AppError("Task not found", 404);
  }

  return result.rows[0];
}

async function deleteTask(userId, taskId) {
  const result = await pool.query(
    `UPDATE tasks
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [taskId, userId]
  );

  if (!result.rowCount) {
    throw new AppError("Task not found", 404);
  }

  return { success: true };
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
