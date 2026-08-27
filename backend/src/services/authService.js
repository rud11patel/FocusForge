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

async function generateUsernameSuggestions(baseUsername) {
  const clean = (baseUsername || "").toLowerCase().trim().replace(/[^a-z0-9._]/g, "") || "user";
  const candidates = [
    `${clean}_1`,
    `${clean}_12`,
    `${clean}_99`,
    `real_${clean}`,
    `the_${clean}`,
    `official_${clean}`,
    `${clean}.official`,
    `${clean}_forge`,
    `${clean}_${Math.floor(100 + Math.random() * 900)}`,
    `${clean}_${Math.floor(1000 + Math.random() * 9000)}`,
  ];

  const uniqueCandidates = Array.from(new Set(candidates));

  const existingRes = await pool.query(
    "SELECT LOWER(username) as username FROM users WHERE LOWER(username) = ANY($1)",
    [uniqueCandidates]
  );

  const existingUsernames = new Set(existingRes.rows.map((r) => r.username));

  const available = uniqueCandidates.filter((cand) => !existingUsernames.has(cand));

  return available.slice(0, 4);
}

async function register({ username, email, password }) {
  const emailLower = (email || "").toLowerCase().trim();
  const usernameTrimmed = (username || "").trim();

  if (!usernameTrimmed) {
    throw new AppError("Username is required", 400);
  }

  if (!emailLower) {
    throw new AppError("Email is required", 400);
  }

  // 1. Check if email exists
  const existingEmail = await pool.query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [emailLower]
  );

  if (existingEmail.rowCount) {
    throw new AppError("An account with this email already exists", 409);
  }

  // 2. Check if username exists
  const existingUsername = await pool.query(
    "SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
    [usernameTrimmed]
  );

  if (existingUsername.rowCount) {
    const suggestions = await generateUsernameSuggestions(usernameTrimmed);
    const err = new AppError(`Username "${usernameTrimmed}" is taken.`, 409);
    err.suggestions = suggestions;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, privacy_level, xp, level, current_streak, longest_streak, last_active_date, created_at`,
    [usernameTrimmed, emailLower, passwordHash]
  );

  const user = result.rows[0];
  return { user, token: signToken(user) };
}

async function checkUsername(username) {
  if (!username || !username.trim()) {
    return { available: false, message: "Username cannot be empty", suggestions: [] };
  }

  const usernameTrimmed = username.trim();
  const existing = await pool.query(
    "SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
    [usernameTrimmed]
  );

  if (existing.rowCount) {
    const suggestions = await generateUsernameSuggestions(usernameTrimmed);
    return {
      available: false,
      message: `Username "${usernameTrimmed}" is taken.`,
      suggestions,
    };
  }

  return { available: true };
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

module.exports = { register, login, getMe, checkUsername };
