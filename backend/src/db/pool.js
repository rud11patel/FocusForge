// const { Pool } = require("pg");
// const { databaseUrl } = require("../config/env");

// if (!databaseUrl) {
//   throw new Error("DATABASE_URL is required");
// }

// const pool = new Pool({
//   connectionString: databaseUrl,
// });

// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// module.exports = { pool }; // export the pool;
const { Pool } = require("pg");
const { databaseUrl, dbHost, dbPort, dbUser, dbPassword, dbName } = require("../config/env");

const poolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    }
  : {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: String(dbPassword ?? ""),
      database: dbName,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

module.exports = { pool };

//
