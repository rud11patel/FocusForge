const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/pool");
const { jwtSecret } = require("../config/env");
const { AppError } = require("../utils/errors");

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

async function register({ username, email, password }) {
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1",
    [email.toLowerCase(), username]
  );

  if (existing.rowCount) {
    throw new AppError("User already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, privacy_level, xp, level, current_streak, longest_streak, last_active_date, created_at`,
    [username, email.toLowerCase(), passwordHash]
  );

  const user = result.rows[0];
  return { user, token: signToken(user) };
}

async function login({ email, password }) {
  const result = await pool.query(
    `SELECT id, username, email, password_hash, privacy_level, xp, level, current_streak, longest_streak, last_active_date, created_at
     FROM users WHERE email = $1 LIMIT 1`,
    [email.toLowerCase()]
  );

  if (!result.rowCount) {
    throw new AppError("Invalid credentials", 401);
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    throw new AppError("Invalid credentials", 401);
  }

  delete user.password_hash;

  return { user, token: signToken(user) };
}

async function getMe(userId) {
  const result = await pool.query(
    `SELECT id, username, email, privacy_level, xp, level, current_streak, longest_streak, last_active_date, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (!result.rowCount) {
    throw new AppError("User not found", 404);
  }

  return result.rows[0];
}

module.exports = { register, login, getMe };
