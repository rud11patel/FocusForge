// const express = require("express");
// const cors = require("cors");
// const rateLimit = require("express-rate-limit");
// const { port, clientUrl } = require("./config/env");
// const { authMiddleware } = require("./middlewares/auth");
// const { errorHandler } = require("./middlewares/errorHandler");
// const authRoutes = require("./routes/authRoutes");
// const taskRoutes = require("./routes/taskRoutes");
// const tagRoutes = require("./routes/tagRoutes");
// const sessionRoutes = require("./routes/sessionRoutes");
// const statsRoutes = require("./routes/statsRoutes");
// const leaderboardRoutes = require("./routes/leaderboardRoutes");
// const userRoutes = require("./routes/userRoutes");

// const app = express();
// require("dotenv").config();
// app.use(
//   cors({
//     origin: clientUrl,
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 300,
//   })
// );

// app.get("/api/health", (req, res) => {
//   res.json({ ok: true });
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/tags", authMiddleware, tagRoutes);
// app.use("/api/tasks", authMiddleware, taskRoutes);
// app.use("/api/sessions", authMiddleware, sessionRoutes);
// app.use("/api/stats", authMiddleware, statsRoutes);
// app.use("/api/leaderboard", authMiddleware, leaderboardRoutes);
// app.use("/api/users", authMiddleware, userRoutes);

// app.use(errorHandler);
// //console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
// app.listen(port, () => {
//   console.log(`FocusForge backend running on port ${port}`);
// });

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");

const { port, clientUrl } = require("./config/env");
const { authMiddleware } = require("./middlewares/auth");
const { errorHandler } = require("./middlewares/errorHandler");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const tagRoutes = require("./routes/tagRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const statsRoutes = require("./routes/statsRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const userRoutes = require("./routes/userRoutes");

require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  })
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/tags", authMiddleware, tagRoutes);
app.use("/api/tasks", authMiddleware, taskRoutes);
app.use("/api/sessions", authMiddleware, sessionRoutes);
app.use("/api/stats", authMiddleware, statsRoutes);
app.use("/api/leaderboard", authMiddleware, leaderboardRoutes);
app.use("/api/users", authMiddleware, userRoutes);

/*
  Serve frontend build
  Make sure your frontend build folder is named "dist"
  and exists inside backend root directory.
*/

app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`FocusForge backend running on port ${port}`);
});