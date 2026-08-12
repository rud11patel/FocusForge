const path = require("path");
const dotenv = require("dotenv");

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });
dotenv.config({ path: path.resolve(process.cwd(), "../", envFile), override: true });
dotenv.config({ path: path.resolve(__dirname, "../../", envFile), override: true });
dotenv.config({ path: path.resolve(__dirname, "../../../", envFile), override: true });

module.exports = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL,
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT || 5432),
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : "",
  dbName: process.env.DB_NAME || "focus_forge_db",
  jwtSecret: process.env.JWT_SECRET || "change-me",
};

