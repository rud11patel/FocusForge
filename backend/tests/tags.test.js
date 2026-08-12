const test = require("node:test");
const assert = require("node:assert/strict");
const { pool } = require("../src/db/pool");
const tagService = require("../src/services/tagService");
const authService = require("../src/services/authService");

test("Custom Tags Test Suite", async (t) => {
  let user1, user2;

  t.before(async () => {
    user1 = await authService.register({
      username: `tag_user1_${Date.now()}`,
      email: `tag_user1_${Date.now()}@example.com`,
      password: "password123",
    });

    user2 = await authService.register({
      username: `tag_user2_${Date.now()}`,
      email: `tag_user2_${Date.now()}@example.com`,
      password: "password123",
    });
  });

  t.after(async () => {
    if (user1?.user?.id) await pool.query("DELETE FROM users WHERE id = $1", [user1.user.id]);
    if (user2?.user?.id) await pool.query("DELETE FROM users WHERE id = $1", [user2.user.id]);
  });

  await t.test("1. List Default Tags", async () => {
    const tags = await tagService.listTags(user1.user.id);
    assert.ok(tags.length >= 6);
    const defaultTagNames = tags.filter((t) => t.is_default).map((t) => t.name);
    assert.ok(defaultTagNames.includes("Study"));
    assert.ok(defaultTagNames.includes("Development"));
  });

  await t.test("2. Create Custom Tag for User 1", async () => {
    const customTag = await tagService.createTag(user1.user.id, { name: "Rust Programming" });
    assert.ok(customTag.id);
    assert.equal(customTag.name, "Rust Programming");
    assert.equal(customTag.is_default, false);
    assert.equal(customTag.user_id, user1.user.id);
  });

  await t.test("3. Privacy Isolation (User 2 should NOT see User 1 custom tag)", async () => {
    const user2Tags = await tagService.listTags(user2.user.id);
    const user2TagNames = user2Tags.map((t) => t.name);
    assert.equal(user2TagNames.includes("Rust Programming"), false);

    const user1Tags = await tagService.listTags(user1.user.id);
    const user1TagNames = user1Tags.map((t) => t.name);
    assert.equal(user1TagNames.includes("Rust Programming"), true);
  });

  await t.test("4. Delete Custom Tag", async () => {
    const user1Tags = await tagService.listTags(user1.user.id);
    const rustTag = user1Tags.find((t) => t.name === "Rust Programming");

    const deleteResult = await tagService.deleteTag(user1.user.id, rustTag.id);
    assert.equal(deleteResult.message, "Custom tag deleted");

    const updatedTags = await tagService.listTags(user1.user.id);
    assert.equal(updatedTags.some((t) => t.name === "Rust Programming"), false);
  });
});
