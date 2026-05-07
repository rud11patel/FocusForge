
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

  const startTimestamp =
    activeSession.client_started_at ||
    new Date(activeSession.start_time).getTime();

  const elapsedSeconds = Math.max(
    Math.floor((timerNow - startTimestamp) / 1000) -
      pausedDurationSeconds,
    0
  );

  const totalSeconds =
    activeSession.planned_duration * 60;

  return Math.max(totalSeconds - elapsedSeconds, 0);
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
      }
    };

    timer = setInterval(updateRemaining, 1000);

    window.addEventListener("focus", updateRemaining);
    document.addEventListener("visibilitychange", updateRemaining);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", updateRemaining);
      document.removeEventListener("visibilitychange", updateRemaining);
    };
  }, [activeSession]);

  async function startSession(event) {
    event.preventDefault();

    if (form.plannedDuration < 5) {
      toast.error("Minimum session duration is 5 minutes");
      return;
    }

    sessionEndHandledRef.current = false;
    wasTabInactiveRef.current = false;
    setShowSessionCompletePopup(false);

    const clientStartedAt = Date.now();

    const data = await api.post("/sessions/start", {
      taskId: form.taskId ? Number(form.taskId) : null,
      tagId: form.tagId
        ? Number(form.tagId)
        : null,
      plannedDuration: Number(form.plannedDuration),
      commitmentGoal: form.commitmentGoal,
    });

    const enrichedSession = {
      ...data,
      client_started_at: clientStartedAt,
    };

    setActiveSession(enrichedSession);
    setRemaining(Number(form.plannedDuration) * 60);

    completionInProgressRef.current = false;
    setShowRecoveryBanner(false);
  }
}
