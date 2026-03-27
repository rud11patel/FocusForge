import { useState } from "react";
import { Card } from "../components/Card";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/client";

const levels = ["PUBLIC", "FRIENDS_ONLY", "PRIVATE"];

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [privacyLevel, setPrivacyLevel] = useState(user?.privacy_level || "PRIVATE");
  const [message, setMessage] = useState("");

  async function savePrivacy() {
    await api.put("/users/privacy", { privacyLevel });
    await refreshUser();
    setMessage("Privacy saved.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Privacy Settings" subtitle="Control leaderboard visibility">
        <div className="space-y-3">
          {levels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setPrivacyLevel(level)}
              className={`w-full rounded-2xl border px-4 py-4 text-left ${
                privacyLevel === level ? "border-forge-400 bg-forge-500/10 text-white" : "border-white/10 text-slate-300"
              }`}
            >
              <p className="font-medium">{level.replace("_", " ")}</p>
              <p className="mt-1 text-sm text-slate-400">
                {level === "PUBLIC"
                  ? "Visible on global surfaces."
                  : level === "FRIENDS_ONLY"
                    ? "Reserved for social surfaces later."
                    : "Hidden from leaderboards."}
              </p>
            </button>
          ))}
        </div>
        <button onClick={savePrivacy} className="mt-5 w-full rounded-2xl bg-forge-500 px-4 py-3 font-medium text-white hover:bg-forge-400">
          Save Privacy
        </button>
        {message ? <p className="mt-3 text-sm text-forge-200">{message}</p> : null}
      </Card>

      <Card title="Account Snapshot" subtitle="Current profile data">
        <dl className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <dt className="text-sm text-slate-400">Username</dt>
            <dd className="mt-2 text-lg text-white">{user?.username}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <dt className="text-sm text-slate-400">Email</dt>
            <dd className="mt-2 text-lg text-white">{user?.email}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <dt className="text-sm text-slate-400">Privacy</dt>
            <dd className="mt-2 text-lg text-white">{user?.privacy_level}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
