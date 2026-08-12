const tagService = require("../services/tagService");

async function listTags(req, res) {
  const tags = await tagService.listTags(req.user.id);
  res.json(tags);
}

async function createTag(req, res) {
  const tag = await tagService.createTag(req.user.id, req.body);
  res.status(201).json(tag);
}

async function deleteTag(req, res) {
  const result = await tagService.deleteTag(req.user.id, req.params.id);
  res.json(result);
}

module.exports = {
  listTags,
  createTag,
  deleteTag,
};
