import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { toast } from "react-hot-toast";

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
  const [newTagName, setNewTagName] = useState("");
  const [isSubmittingTag, setIsSubmittingTag] = useState(false);

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

  const [showAddTagInline, setShowAddTagInline] = useState(false);

  async function handleAddTag(event) {
    if (event) event.preventDefault();
    const name = newTagName.trim();
    if (!name) return;

    setIsSubmittingTag(true);
    try {
      const newTag = await api.post("/tags", { name });
      setNewTagName("");
      setShowAddTagInline(false);
      setForm((current) => ({ ...current, tagId: String(newTag.id) }));
      toast.success(`Tag "${newTag.name}" created & selected`);
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to add tag");
    } finally {
      setIsSubmittingTag(false);
    }
  }

  async function handleRemoveTag(tagId, tagName) {
    try {
      await api.delete(`/tags/${tagId}`);
      toast.success(`Tag "${tagName}" deleted`);
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to delete tag");
    }
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
      <div className="space-y-6">
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
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 px-1">Tag / Category</label>
              
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-forge-400 text-white"
                value={showAddTagInline ? "CREATE_NEW_TAG" : form.tagId}
                onChange={(event) => {
                  if (event.target.value === "CREATE_NEW_TAG") {
                    setShowAddTagInline(true);
                  } else {
                    setShowAddTagInline(false);
                    setForm((current) => ({ ...current, tagId: event.target.value }));
                  }
                }}
              >
                <option value="">No tag</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name} {tag.is_default ? "" : "(Custom)"}
                  </option>
                ))}
                <option value="CREATE_NEW_TAG" className="font-bold text-forge-300">
                  + Add Custom Tag...
                </option>
              </select>

              {showAddTagInline && (
                <div className="mt-2 flex gap-2 animate-fadeIn">
                  <input
                    type="text"
                    className="flex-1 rounded-2xl border border-forge-500/40 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-forge-400"
                    placeholder="New tag name (e.g. Design, Rust)"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    maxLength={60}
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={isSubmittingTag || !newTagName.trim()}
                    onClick={handleAddTag}
                    className="rounded-2xl bg-forge-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-forge-400 disabled:opacity-50"
                  >
                    + Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTagInline(false);
                      setNewTagName("");
                    }}
                    className="rounded-2xl border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
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

        <Card title="Manage Tags" subtitle="Add custom tags to categorize your focus sessions.">
          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-forge-400"
              placeholder="New tag name (e.g. Design, Rust)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              maxLength={60}
            />
            <button
              type="submit"
              disabled={isSubmittingTag || !newTagName.trim()}
              className="rounded-2xl bg-forge-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-forge-400 disabled:opacity-50"
            >
              Add Tag
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border ${
                  tag.is_default
                    ? "bg-slate-900 border-white/10 text-slate-400"
                    : "bg-forge-500/10 border-forge-500/30 text-forge-300"
                }`}
              >
                {tag.name}
                {!tag.is_default && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.id, tag.name)}
                    className="ml-1 text-slate-400 hover:text-rose-400 transition"
                    title="Delete custom tag"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        </Card>
      </div>

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
