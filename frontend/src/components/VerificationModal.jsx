import { useEffect, useState } from "react";

export function VerificationModal({
  isOpen,
  timeoutSecondsLeft,
  onConfirm,
  onPause,
  onStop,
}) {
  if (!isOpen) return null;

  const minutes = String(Math.floor(timeoutSecondsLeft / 60)).padStart(2, "0");
  const seconds = String(timeoutSecondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl border border-forge-500/30 bg-slate-900 p-6 shadow-2xl shadow-forge-500/10">
        <div className="flex items-center gap-3 text-forge-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forge-500/20 text-forge-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-xl text-white">Still working?</h3>
            <p className="text-xs text-slate-400">Activity Verification Check</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
          This session has been running for 4 hours continuously. Please confirm if you are still actively working so FocusForge can continue tracking your session accurately.
        </p>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950/60 px-4 py-3 border border-white/5">
          <span className="text-xs font-medium text-slate-400">Auto-pause in:</span>
          <span className="font-mono text-base font-bold text-amber-400">
            {minutes}:{seconds}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onStop}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20 transition"
          >
            Stop session
          </button>
          <button
            type="button"
            onClick={onPause}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 transition"
          >
            Pause session
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-2xl bg-forge-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 transition"
          >
            Yes, I'm still working
          </button>
        </div>
      </div>
    </div>
  );
}
