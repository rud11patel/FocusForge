const { pool } = require("../db/pool");

async function listTags() {
  const result = await pool.query("SELECT * FROM tags ORDER BY is_default DESC, name ASC");
  return result.rows;
}

module.exports = { listTags };
