const test = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../src/db/pool");
const sessionService = require("../src/services/sessionService");
const authService = require("../src/services/authService");
const { XP_PER_MINUTE } = require("../src/utils/constants");

test("Stopwatch Session Test Suite", async (t) => {
  let testUser;

  t.before(async () => {
    // Create a temporary test user
    const username = `test_stopwatch_${Date.now()}`;
    const email = `${username}@example.com`;
    testUser = await authService.register({
      username,
      email,
      password: "password123",
    });
  });

  t.after(async () => {
    if (testUser?.user?.id) {
      await pool.query("DELETE FROM users WHERE id = $1", [testUser.user.id]);
    }
  });

  await t.test("1. Per-second XP Calculation Formula", () => {
    function calcXp(durationSeconds) {
      return Math.floor((durationSeconds * XP_PER_MINUTE) / 60);
    }

    assert.equal(calcXp(15), 0); // 15s * 2 / 60 = 0.5 -> 0
    assert.equal(calcXp(30), 1); // 30s * 2 / 60 = 1
    assert.equal(calcXp(60), 2); // 60s * 2 / 60 = 2
    assert.equal(calcXp(300), 10); // 300s * 2 / 60 = 10
    assert.equal(calcXp(14400), 480); // 4h = 480 XP
  });

  await t.test("2. Start Stopwatch Session", async () => {
    const session = await sessionService.startSession(testUser.user.id, {
      sessionType: "STOPWATCH",
      commitmentGoal: "Build feature",
    });

    assert.ok(session);
    assert.equal(session.session_type, "STOPWATCH");
    assert.equal(session.status, "RUNNING");
    assert.ok(session.last_uninterrupted_start);
  });

  await t.test("3. Pause and Resume Stopwatch Session", async () => {
    const paused = await sessionService.pauseSession(testUser.user.id);
    assert.equal(paused.status, "PAUSED");
    assert.ok(paused.paused_at);
    assert.equal(paused.last_uninterrupted_start, null);

    const resumed = await sessionService.resumeSession(testUser.user.id);
    assert.equal(resumed.status, "RUNNING");
    assert.equal(resumed.paused_at, null);
    assert.ok(resumed.last_uninterrupted_start);
  });

  await t.test("4. Verification Prompt & Confirmation", async () => {
    const prompted = await sessionService.verifySession(testUser.user.id, {
      action: "PROMPT",
    });
    assert.equal(prompted.verifications_count, 1);
    assert.ok(prompted.verification_prompted_at);

    const confirmed = await sessionService.verifySession(testUser.user.id, {
      action: "CONFIRM",
    });
    assert.equal(confirmed.confirmations_count, 1);
    assert.equal(confirmed.verification_prompted_at, null);
    assert.ok(confirmed.last_uninterrupted_start);
  });

  await t.test("5. Unanswered Verification Auto-Pause (5-Minute Rule)", async () => {
    // Set verification_prompted_at to 5 minutes ago (300 seconds)
    const promptedTime = new Date(Date.now() - 300000).toISOString();
    await pool.query(
      `UPDATE active_sessions
       SET verification_prompted_at = $1
       WHERE user_id = $2`,
      [promptedTime, testUser.user.id]
    );

    const autoPaused = await sessionService.verifySession(testUser.user.id, {
      action: "TIMEOUT_AUTOPAUSE",
    });

    assert.equal(autoPaused.status, "PAUSED");
    assert.equal(autoPaused.verification_prompted_at, null);
    assert.ok(autoPaused.paused_duration_seconds >= 300);
  });

  await t.test("6. Complete Stopwatch Session & Verify Metrics", async () => {
    // Resume session and set start_time to 60s ago
    await sessionService.resumeSession(testUser.user.id);
    await pool.query(
      `UPDATE active_sessions
       SET start_time = NOW() - INTERVAL '60 seconds',
           paused_duration_seconds = 0
       WHERE user_id = $1`,
      [testUser.user.id]
    );

    const result = await sessionService.completeSession(testUser.user.id, {
      commitmentCompleted: true,
    });

    assert.ok(result.session);
    assert.equal(result.session.session_type, "STOPWATCH");
    assert.ok(result.session.duration_seconds >= 50);
    assert.ok(result.xpGained >= 1);
    assert.equal(result.session.confirmations_count, 1);
  });
});
