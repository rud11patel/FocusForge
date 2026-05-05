
// FocusPage.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { toast } from "react-hot-toast";

const presets = [25, 50, 90, 180];

function getRemainingSeconds(activeSession) {
  if (!activeSession) return 0;
  const pausedDurationSeconds = Number(
    activeSession.paused_duration_seconds || 0
  );
  const timerNow =
    activeSession.status === "PAUSED" && activeSession.paused_at
      ? new Date(activeSession.paused_at).getTime()
      : Date.now();
  const elapsedSeconds = Math.max(
    Math.floor(
      (timerNow - new Date(activeSession.start_time).getTime()) / 1000
    ) - pausedDurationSeconds,
    0
  );
  const end =
    activeSession.planned_duration * 60;
  return Math.max(end - elapsedSeconds, 0);
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
  const [showSessionCompletePopup, setShowSessionCompletePopup] =
    useState(false);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [abandonReason, setAbandonReason] = useState("");

  const audioContextRef = useRef(null);
  const completionInProgressRef = useRef(false);
  const sessionEndHandledRef = useRef(false);
  const wasTabInactiveRef = useRef(document.visibilityState === "hidden");
  const initialLoadCompleteRef = useRef(false);

  const originalTitleRef = useRef(document.title);
  const titleAlertTimerRef = useRef(null);
  const titleAlertStopTimerRef = useRef(null);

  const [form, setForm] = useState({
    taskId: "",
    tagId: "",
    plannedDuration: 25,
    commitmentGoal: "",
  });

  async function load() {
    const [taskData, tagData, historyData, activeData] =
      await Promise.all([
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

    if (!initialLoadCompleteRef.current) {
      setShowRecoveryBanner(Boolean(activeData));
      initialLoadCompleteRef.current = true;
    }
  }

  useEffect(() => {
    load();
  }, []);

  function getTimerAudioContext() {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    return audioContextRef.current;
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    try {
      await Notification.requestPermission();
    } catch {}
  }

  function showSessionEndNotification() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const notification = new Notification("FocusForge session complete", {
      body: "Nice work. Your focus session has ended.",
      tag: "focusforge-session-ended",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  function startTitleAlert() {
    stopTitleAlert();

    let show = true;
    document.title = "Session complete - FocusForge";

    titleAlertTimerRef.current = setInterval(() => {
      document.title = show
        ? "Session complete - FocusForge"
        : originalTitleRef.current;
      show = !show;
    }, 1200);

    titleAlertStopTimerRef.current = setTimeout(stopTitleAlert, 30000);
  }

  function stopTitleAlert() {
    if (titleAlertTimerRef.current) clearInterval(titleAlertTimerRef.current);
    if (titleAlertStopTimerRef.current) clearTimeout(titleAlertStopTimerRef.current);

    titleAlertTimerRef.current = null;
    titleAlertStopTimerRef.current = null;

    document.title = originalTitleRef.current;
  }

  async function unlockTimerAudio() {
    const ctx = getTimerAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      gain.gain.value = 0;
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.01);
    } catch {}
  }

  function playTimerEndSound() {
    const ctx = getTimerAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);

    [660, 880, 990].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(ctx.currentTime + index * 0.18);
      oscillator.stop(ctx.currentTime + index * 0.18 + 0.16);
    });
  }

  async function completeActiveSession() {
    if (!activeSession || completionInProgressRef.current) return;

    completionInProgressRef.current = true;
    try {
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

  function handleSessionEnd() {
    if (sessionEndHandledRef.current) return;
    sessionEndHandledRef.current = true;

    const endedWhileUserWasAway =
      document.visibilityState === "hidden" || wasTabInactiveRef.current;

    playTimerEndSound();
    showSessionEndNotification();
    startTitleAlert();

    if (endedWhileUserWasAway) {
      setShowSessionCompletePopup(true);
      wasTabInactiveRef.current = false;
    }

    completeActiveSession().catch((error) => {
      toast.error(error.message || "Could not complete session");
    });
  }

  useEffect(() => {
    if (!activeSession) return;

    let timer;

    const updateRemaining = () => {
      if (document.visibilityState === "hidden") {
        wasTabInactiveRef.current = true;
      }

      const nextRemaining = getRemainingSeconds(activeSession);
      setRemaining((prev) => (prev !== nextRemaining ? nextRemaining : prev));

      if (document.visibilityState === "visible" && nextRemaining > 0) {
        wasTabInactiveRef.current = false;
      }

      if (nextRemaining === 0) {
        if (timer) clearInterval(timer);
        if (activeSession.status !== "PAUSED") {
          handleSessionEnd();
        }
      }
    };

    timer = setInterval(updateRemaining, 1000);

    window.addEventListener("focus", updateRemaining);
    document.addEventListener("visibilitychange", updateRemaining);

    updateRemaining();

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", updateRemaining);
      document.removeEventListener("visibilitychange", updateRemaining);
    };
  }, [activeSession]);

  useEffect(() => {
    const onFocus = () => stopTitleAlert();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (activeSession) stopTitleAlert();
  }, [activeSession]);

  useEffect(() => {
    if (!showSessionCompletePopup) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setShowSessionCompletePopup(false);
        stopTitleAlert();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showSessionCompletePopup]);

  const selectedTask = useMemo(
    () =>
      tasks.find((task) => String(task.id) === String(form.taskId)),
    [tasks, form.taskId]
  );

  async function startSession(event) {
    event.preventDefault();

    if (form.plannedDuration < 5) {
      toast.error("Minimum session duration is 5 minutes");
      return;
    }

    sessionEndHandledRef.current = false;
    wasTabInactiveRef.current = false;
    setShowSessionCompletePopup(false);

    await Promise.all([
      requestNotificationPermission(),
      unlockTimerAudio(),
    ]);

    const data = await api.post("/sessions/start", {
      taskId: form.taskId ? Number(form.taskId) : null,
      tagId: form.tagId
        ? Number(form.tagId)
        : selectedTask?.tag_id || null,
      plannedDuration: Number(form.plannedDuration),
      commitmentGoal: form.commitmentGoal,
    });

    setActiveSession(data);
    setRemaining(getRemainingSeconds(data));
    completionInProgressRef.current = false;
    setShowRecoveryBanner(false);
  }

  async function finishSession() {
    setShowRecoveryBanner(false);
    await completeActiveSession();
  }

  async function pauseSession() {
    const data = await api.post("/sessions/pause", {});
    setActiveSession(data);
    setRemaining(getRemainingSeconds(data));
  }

  async function resumeSession() {
    const data = await api.post("/sessions/resume", {});
    setActiveSession(data);
    setRemaining(getRemainingSeconds(data));
  }

  async function abandonSession() {
    await api.post("/sessions/abandon", {
      reason: abandonReason,
    });
    setActiveSession(null);
    setRemaining(0);
    setAbandonReason("");
    setShowAbandonDialog(false);
    setShowRecoveryBanner(false);
    sessionEndHandledRef.current = false;
    toast("Session abandoned", {
      icon: "!",
      style: {
        background: "#1e293b",
        color: "#fff",
      },
    });
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      {showSessionCompletePopup ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-complete-title"
            className="w-full max-w-md rounded-3xl border border-forge-300/30 bg-slate-950 p-6 text-center shadow-2xl shadow-forge-950/40"
          >
            <p
              id="session-complete-title"
              className="font-display text-3xl text-white"
            >
              Session completed
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Your focus timer ended while you were away. The session has been
              saved to your history.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSessionCompletePopup(false);
                stopTitleAlert();
              }}
              className="mt-6 w-full rounded-2xl bg-forge-500 px-4 py-3 font-medium text-white hover:bg-forge-400"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}

      {showAbandonDialog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="abandon-session-title"
            className="w-full max-w-md rounded-3xl border border-rose-300/30 bg-slate-950 p-6 shadow-2xl shadow-rose-950/30"
          >
            <p
              id="abandon-session-title"
              className="font-display text-3xl text-white"
            >
              Abandon session?
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This will stop the timer without awarding XP. You can leave a
              quick reason for your own review later.
            </p>
            <textarea
              className="mt-5 min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-forge-400"
              placeholder="Interrupted, wrong task, needed a break..."
              value={abandonReason}
              onChange={(event) => setAbandonReason(event.target.value)}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowAbandonDialog(false)}
                className="rounded-2xl border border-white/10 px-4 py-3 font-medium text-slate-200 hover:bg-white/5"
              >
                Keep session
              </button>
              <button
                type="button"
                onClick={abandonSession}
                className="rounded-2xl bg-rose-500 px-4 py-3 font-medium text-white hover:bg-rose-400"
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Card title="Focus Timer" subtitle="The backend owns the session. The UI just reflects it.">
        {showRecoveryBanner && activeSession ? (
          <div className="mb-5 rounded-2xl border border-forge-300/30 bg-forge-500/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-white">
                  Session recovered
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {formatClock(remaining)} left from your previous active
                  session.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryBanner(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {activeSession ? (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-forge-400/20 bg-gradient-to-br from-forge-700/20 to-slate-900 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-forge-300">Live Session</p>
              <p className="mt-4 font-display text-7xl text-white">{formatClock(remaining)}</p>
              {activeSession.status === "PAUSED" ? (
                <p className="mt-3 text-sm font-medium text-amber-200">
                  Paused
                </p>
              ) : null}
              <p className="mt-4 text-sm text-slate-300">
                {activeSession.task_title || "No task"} • {activeSession.tag_name || "No tag"}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {activeSession.status === "PAUSED" ? (
                <button
                  onClick={resumeSession}
                  className="rounded-2xl bg-forge-500 px-4 py-3 font-medium text-white hover:bg-forge-400"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseSession}
                  className="rounded-2xl border border-white/10 px-4 py-3 font-medium text-slate-200 hover:bg-white/5"
                >
                  Pause
                </button>
              )}
              <button
                onClick={finishSession}
                className="rounded-2xl bg-forge-500 px-4 py-3 font-medium text-white hover:bg-forge-400"
              >
                Complete
              </button>
              <button
                onClick={() => setShowAbandonDialog(true)}
                className="rounded-2xl border border-rose-300/20 px-4 py-3 font-medium text-rose-200 hover:bg-rose-500/10"
              >
                Abandon
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={startSession}>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      plannedDuration: minutes,
                    }))
                  }
                  className={`rounded-2xl px-3 py-3 text-sm ${
                    Number(form.plannedDuration) === minutes
                      ? "bg-forge-500 text-white"
                      : "border border-white/10 text-slate-300"
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
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  plannedDuration: e.target.value,
                }))
              }
            />

            <select
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none transition focus:border-forge-400"
              value={form.taskId}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  taskId: e.target.value,
                }))
              }
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
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  tagId: e.target.value,
                }))
              }
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
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  commitmentGoal: e.target.value,
                }))
              }
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-forge-500 px-4 py-3 font-medium text-white hover:bg-forge-400"
            >
              Start Session
            </button>
          </form>
        )}
      </Card>

      <Card title="Session History" subtitle="Recent append-only focus events">
        <div className="space-y-4">
          {history.map((session) => (
            <div
              key={session.id}
              className="rounded-3xl border border-white/10 bg-slate-900/60 p-5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {session.task_title || "Focus session"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {session.tag_name || "No tag"} • {session.duration_minutes} minutes
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(session.start_time).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-forge-200">
                    +{session.xp_gained} XP
                  </p>
                  <p className="text-sm text-slate-400">
                    {session.commitment_completed
                      ? "Commitment met"
                      : "Commitment pending"}
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
