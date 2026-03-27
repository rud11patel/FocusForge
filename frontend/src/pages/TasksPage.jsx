import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";

const initialForm = {
  title: "",
  description: "",
  tagId: "",
  estimatedSessions: 1,
};

export function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState(initialForm);

  async function load() {
    const [tasksData, tagsData] = await Promise.all([api.get("/tasks"), api.get("/tags")]);
    setTasks(tasksData);
    setTags(tagsData);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    await api.post("/tasks", {
      ...form,
      tagId: form.tagId ? Number(form.tagId) : null,
      estimatedSessions: Number(form.estimatedSessions),
    });
    setForm(initialForm);
    await load();
  }

  async function toggleTask(task) {
    await api.put(`/tasks/${task.id}`, {
      title: task.title,
      description: task.description,
      tagId: task.tag_id,
      estimatedSessions: task.estimated_sessions,
      status: task.status === "ACTIVE" ? "COMPLETED" : "ACTIVE",
    });
    await load();
  }

  async function removeTask(taskId) {
    await api.delete(`/tasks/${taskId}`);
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card title="Create Task" subtitle="Tasks are optional, but they keep sessions intentional.">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-forge-400"
            placeholder="Task title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <textarea
            className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-forge-400"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <select
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-forge-400"
            value={form.tagId}
            onChange={(event) => setForm((current) => ({ ...current, tagId: event.target.value }))}
          >
            <option value="">No tag</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-forge-400"
            value={form.estimatedSessions}
            onChange={(event) => setForm((current) => ({ ...current, estimatedSessions: event.target.value }))}
          />
          <button type="submit" className="w-full rounded-2xl bg-forge-500 px-4 py-3 font-medium text-white hover:bg-forge-400">
            Add Task
          </button>
        </form>
      </Card>

      <Card title="Task Queue" subtitle="Close loops before they turn into anxiety.">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{task.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{task.description || "No description provided."}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                    {task.tag_name || "No tag"} • {task.estimated_sessions} sessions • {task.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    className="rounded-2xl border border-forge-400/40 px-4 py-2 text-sm text-forge-200"
                  >
                    {task.status === "ACTIVE" ? "Complete" : "Reopen"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
