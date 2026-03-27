const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const { AppError } = require("../utils/errors");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (error) {
    next(new AppError("Invalid token", 401));
  }
}

module.exports = { authMiddleware };
