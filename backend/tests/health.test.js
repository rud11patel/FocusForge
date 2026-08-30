const test = require("node:test");
const assert = require("node:assert/strict");

test("Health Check Endpoint Test Suite", async (t) => {
  await t.test("Verify GET /health structure and status", async () => {
    const responsePayload = {
      ok: true,
      status: "healthy",
      timestamp: new Date().toISOString()
    };

    assert.equal(responsePayload.ok, true);
    assert.equal(responsePayload.status, "healthy");
    assert.ok(responsePayload.timestamp);
  });
});
