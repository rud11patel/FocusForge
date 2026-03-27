import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}

export function LeaderboardPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    api.get("/leaderboard/global").then(setEntries);
  }, []);

  return (
    <Card title="Global Leaderboard" subtitle="Weekly focus minutes, privacy-aware">
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forge-500/20 text-lg font-semibold text-forge-200">
                {entry.rank}
              </div>
              <div>
                <p className="font-medium text-white">{entry.username}</p>
                <p className="mt-1 text-sm text-slate-400">
                  Level {entry.level} • {entry.currentStreak} day streak • {entry.privacyLevel}
                </p>
              </div>
            </div>
            <p className="text-xl font-semibold text-white">{formatMinutes(entry.weeklyMinutes)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
