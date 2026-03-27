const { pool } = require("../db/pool");
const { PRIVACY_LEVELS } = require("../utils/constants");
const { AppError } = require("../utils/errors");

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

module.exports = { updatePrivacy };
