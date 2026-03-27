const tagService = require("../services/tagService");

async function listTags(req, res) {
  const tags = await tagService.listTags();
  res.json(tags);
}

module.exports = { listTags };
