const fs = require("fs");
const path = require("path");
const { pool } = require("./pool");

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, "../../schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      await pool.query(sql);
      console.log("Database schema initialized successfully.");
    }
  } catch (err) {
    console.error("Error initializing database schema:", err);
  }
}

module.exports = { initDb };
