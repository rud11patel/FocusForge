const taskService = require("../services/taskService");

async function listTasks(req, res) {
  const tasks = await taskService.listTasks(req.user.id);
  res.json(tasks);
}

async function createTask(req, res) {
  const task = await taskService.createTask(req.user.id, req.body);
  res.status(201).json(task);
}

async function updateTask(req, res) {
  const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
  res.json(task);
}

async function deleteTask(req, res) {
  const result = await taskService.deleteTask(req.user.id, req.params.id);
  res.json(result);
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
