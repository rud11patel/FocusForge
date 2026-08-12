const { pool } = require("../db/pool");
const { AppError } = require("../utils/errors");

async function listTags(userId) {
  const result = await pool.query(
    `SELECT * FROM tags
     WHERE is_default = TRUE OR user_id = $1
     ORDER BY is_default DESC, name ASC`,
    [userId]
  );
  return result.rows;
}

async function createTag(userId, payload) {
  const name = String(payload.name || "").trim();

  if (!name || name.length < 1 || name.length > 60) {
    throw new AppError("Tag name must be between 1 and 60 characters", 400);
  }

  const existing = await pool.query(
    `SELECT * FROM tags
     WHERE (is_default = TRUE OR user_id = $1)
       AND LOWER(name) = LOWER($2)`,
    [userId, name]
  );

  if (existing.rowCount > 0) {
    return existing.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO tags (name, is_default, user_id)
     VALUES ($1, FALSE, $2)
     RETURNING *`,
    [name, userId]
  );

  return result.rows[0];
}

async function deleteTag(userId, tagId) {
  const result = await pool.query(
    `DELETE FROM tags
     WHERE id = $1 AND user_id = $2 AND is_default = FALSE
     RETURNING *`,
    [tagId, userId]
  );

  if (!result.rowCount) {
    throw new AppError("Custom tag not found or cannot delete default tag", 404);
  }

  return { message: "Custom tag deleted" };
}

module.exports = {
  listTags,
  createTag,
  deleteTag,
};
