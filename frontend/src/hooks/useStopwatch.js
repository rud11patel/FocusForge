import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const FIRST_CHECK_SECONDS = 14400; // 4 hours
const SUBSEQUENT_CHECK_SECONDS = 3600; // 60 minutes
const TIMEOUT_SECONDS = 300; // 5 minutes

export function useStopwatch(activeSession, onSessionUpdated, playNotificationChime) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [timeoutSecondsLeft, setTimeoutSecondsLeft] = useState(TIMEOUT_SECONDS);

  const broadcastRef = useRef(null);
  const promptedAtRef = useRef(null);

  const isStopwatch = activeSession?.session_type === "STOPWATCH";
  const isRunning = activeSession?.status === "RUNNING";
  const isPaused = activeSession?.status === "PAUSED";

  // Calculate total active elapsed seconds using delta timestamps
  useEffect(() => {
    if (!activeSession || !isStopwatch) {
      setElapsedSeconds(0);
      setIsVerificationOpen(false);
      return;
    }

    function calculate() {
      const now = isPaused && activeSession.paused_at
        ? new Date(activeSession.paused_at).getTime()
        : Date.now();
      const start = new Date(activeSession.start_time).getTime();
      const pausedDuration = Number(activeSession.paused_duration_seconds || 0);

      const totalActiveSec = Math.max(
        Math.floor((now - start) / 1000) - pausedDuration,
        0
      );
      setElapsedSeconds(totalActiveSec);

      // Calculate uninterrupted run duration since last uninterrupted start / resume
      const lastUninterrupted = activeSession.last_uninterrupted_start
        ? new Date(activeSession.last_uninterrupted_start).getTime()
        : start;

      const uninterruptedSec = isRunning
        ? Math.max(Math.floor((now - lastUninterrupted) / 1000), 0)
        : 0;

      // Check if verification threshold reached
      const confirmationsCount = Number(activeSession.confirmations_count || 0);
      const thresholdNeeded = confirmationsCount === 0 ? FIRST_CHECK_SECONDS : SUBSEQUENT_CHECK_SECONDS;

      if (isRunning && uninterruptedSec >= thresholdNeeded && !isVerificationOpen && !activeSession.verification_prompted_at) {
        triggerVerificationPrompt();
      }
    }

    calculate();
    const interval = setInterval(calculate, 1000);

    return () => clearInterval(interval);
  }, [activeSession, isStopwatch, isRunning, isPaused, isVerificationOpen]);

  // BroadcastChannel for multi-tab sync
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("focusforge_stopwatch");
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === "VERIFICATION_PROMPT") {
          setIsVerificationOpen(true);
        } else if (event.data?.type === "VERIFICATION_DISMISSED") {
          setIsVerificationOpen(false);
        } else if (event.data?.type === "SESSION_CHANGED") {
          if (onSessionUpdated) onSessionUpdated();
        }
      };

      return () => channel.close();
    }
  }, [onSessionUpdated]);

  // Handle 5-minute countdown when verification is pending
  useEffect(() => {
    if (!isVerificationOpen) return;

    const interval = setInterval(() => {
      if (!promptedAtRef.current) return;
      const elapsedSincePrompt = Math.floor((Date.now() - promptedAtRef.current) / 1000);
      const left = Math.max(TIMEOUT_SECONDS - elapsedSincePrompt, 0);
      setTimeoutSecondsLeft(left);

      if (left <= 0) {
        clearInterval(interval);
        handleTimeoutAutoPause();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isVerificationOpen]);

  async function triggerVerificationPrompt() {
    promptedAtRef.current = Date.now();
    setIsVerificationOpen(true);
    setTimeoutSecondsLeft(TIMEOUT_SECONDS);

    if (playNotificationChime) playNotificationChime();
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: "VERIFICATION_PROMPT" });
    }

    try {
      await api.post("/sessions/verify", { action: "PROMPT" });
    } catch (err) {
      console.error("Failed to notify backend of prompt", err);
    }
  }

  async function handleConfirmStillWorking() {
    setIsVerificationOpen(false);
    promptedAtRef.current = null;
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: "VERIFICATION_DISMISSED" });
    }

    try {
      const updated = await api.post("/sessions/verify", { action: "CONFIRM" });
      if (onSessionUpdated) onSessionUpdated(updated);
    } catch (err) {
      console.error("Failed to confirm working", err);
    }
  }

  async function handleTimeoutAutoPause() {
    setIsVerificationOpen(false);
    promptedAtRef.current = null;
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: "VERIFICATION_DISMISSED" });
    }

    try {
      const updated = await api.post("/sessions/verify", { action: "TIMEOUT_AUTOPAUSE" });
      if (onSessionUpdated) onSessionUpdated(updated);
    } catch (err) {
      console.error("Failed auto-pause on timeout", err);
    }
  }

  return {
    isStopwatch,
    elapsedSeconds,
    isVerificationOpen,
    timeoutSecondsLeft,
    handleConfirmStillWorking,
    handleTimeoutAutoPause,
  };
}
