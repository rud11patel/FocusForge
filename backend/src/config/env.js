const dotenv = require("dotenv");

dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

module.exports = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5174",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "change-me",
};
