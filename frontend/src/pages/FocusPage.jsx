import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { toast } from "react-hot-toast";

const presets = [25, 50, 90, 180];

function getRemainingSeconds(activeSession) {
  if (!activeSession) return 0;
  const end = new Date(activeSession.start_time).getTime() + activeSession.planned_duration * 60 * 1000;
  return Math.max(Math.floor((end - Date.now()) / 1000), 0);
}

function formatClock(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function FocusPage() {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const audioContextRef = useRef(null);
  const completionInProgressRef = useRef(false);
  const [form, setForm] = useState({
    taskId: "",
    tagId: "",
    plannedDuration: 25,
    commitmentGoal: "",
  });

  async function load() {
    const [taskData, tagData, historyData, activeData] = await Promise.all([
      api.get("/tasks"),
      api.get("/tags"),
      api.get("/sessions/history"),
      api.get("/sessions/active"),
    ]);

    setTasks(taskData.filter((task) => task.status === "ACTIVE"));
    setTags(tagData);
    setHistory(historyData);
    setActiveSession(activeData);
    setRemaining(getRemainingSeconds(activeData));
  }

  useEffect(() => {
    load();
  }, []);

  function getTimerAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    return audioContextRef.current;
  }

  function playTimerEndSound() {
    const audioContext = getTimerAudioContext();
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const gain = audioContext.createGain();
    gain.connect(audioContext.destination);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.85);

    [660, 880, 990].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(audioContext.currentTime + index * 0.18);
      oscillator.stop(audioContext.currentTime + index * 0.18 + 0.16);
    });
  }

  async function completeActiveSession({ playSound = false } = {}) {
    if (!activeSession || completionInProgressRef.current) return;

    completionInProgressRef.current = true;
    try {
      if (playSound) playTimerEndSound();

      const res = await api.post("/sessions/complete", {
        commitmentCompleted: true,
      });

      if (res?.message) {
        toast(res.message, {
          icon: "!",
          style: {
            background: "#1e293b",
            color: "#fff",
          },
        });
      }

      await load();
    } finally {
      completionInProgressRef.current = false;
    }
  }

  useEffect(() => {
    if (!activeSession) return undefined;

    let timer;
    const updateRemaining = () => {
      const nextRemaining = getRemainingSeconds(activeSession);
      setRemaining(nextRemaining);

      if (nextRemaining === 0) {
        if (timer) clearInterval(timer);
        completeActiveSession({ playSound: true }).catch((error) => {
          toast.error(error.message || "Could not complete session");
        });
      }
    };

    timer = setInterval(updateRemaining, 1000);
    updateRemaining();
    return () => clearInterval(timer);
  }, [activeSession]);

  const selectedTask = useMemo(
    () => tasks.find((task) => String(task.id) === String(form.taskId)),
    [tasks, form.taskId]
  );

  async function startSession(event) {
    event.preventDefault();
    if (form.plannedDuration < 5) {
      toast.error("Minimum session duration is 5 minutes");
      return;
    }

    const audioContext = getTimerAudioContext();
    if (audioContext?.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const data = await api.post("/sessions/start", {
      taskId: form.taskId ? Number(form.taskId) : null,
      tagId: form.tagId ? Number(form.tagId) : selectedTask?.tag_id || null,
      plannedDuration: Number(form.plannedDuration),
      commitmentGoal: form.commitmentGoal,
    });
    setActiveSession(data);
    setRemaining(getRemainingSeconds(data));
    completionInProgressRef.current = false;
  }

  async function finishSession() {
    await completeActiveSession();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card title="Focus Timer" subtitle="The backend owns the session. The UI just reflects it.">
        {activeSession ? (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-forge-400/20 bg-gradient-to-br from-forge-700/20 to-slate-900 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-forge-300">Live Session</p>
              <p className="mt-4 font-display text-7xl text-white">{formatClock(remaining)}</p>
              <p className="mt-4 text-sm text-slate-300">
                {activeSession.task_title || "No task"} • {activeSession.tag_name || "No tag"}
              </p>
            </div>
            <button onClick={finishSession} className="w-full rounded-2xl bg-forge-500 px-4 py-3 font-medium text-white hover:bg-forge-400">
              Complete Session
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={startSession}>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, plannedDuration: minutes }))}
                  className={`rounded-2xl px-3 py-3 text-sm ${
                    Number(form.plannedDuration) === minutes ? "bg-forge-500 text-white" : "border border-white/10 text-slate-300"
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
            <input
              type="number"
              min="5"
              max="240"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-forge-400"
              value={form.plannedDuration}
              onChange={(event) => setForm((current) => ({ ...current, plannedDuration: event.target.value }))}
            />
            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-forge-400"
              value={form.taskId}
              onChange={(event) => setForm((current) => ({ ...current, taskId: event.target.value }))}
            >
              <option value="">No task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-forge-400"
              value={form.tagId}
              onChange={(event) => setForm((current) => ({ ...current, tagId: event.target.value }))}
            >
              <option value="">Auto / no tag</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-forge-400"
              placeholder="Commitment goal for this session"
              value={form.commitmentGoal}
              onChange={(event) => setForm((current) => ({ ...current, commitmentGoal: event.target.value }))}
            />
            <button type="submit" className="w-full rounded-2xl bg-forge-500 px-4 py-3 font-medium text-white hover:bg-forge-400">
              Start Session
            </button>
          </form>
        )}
      </Card>

      <Card title="Session History" subtitle="Recent append-only focus events">
        <div className="space-y-4">
          {history.map((session) => (
            <div key={session.id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{session.task_title || "Focus session"}</p>
                  <p className="mt-1 text-sm text-slate-400">{session.tag_name || "No tag"} • {session.duration_minutes} minutes</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(session.start_time).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-forge-200">+{session.xp_gained} XP</p>
                  <p className="text-sm text-slate-400">
                    {session.commitment_completed ? "Commitment met" : "Commitment pending"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
