import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { MetricCard } from "../components/MetricCard";
import { SparkBars } from "../components/SparkBars";

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

export function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/stats/overview"),
      api.get("/stats/daily"),
      api.get("/tasks"),
      api.get("/leaderboard/global"),
    ]).then(([overviewData, dailyData, tasksData, leaderboardData]) => {
      setOverview(overviewData);
      setDaily(dailyData);
      setTasks(tasksData);
      setLeaderboard(leaderboardData.slice(0, 5));
    });
  }, []);

  if (!overview) {
    return <div className="p-6 text-slate-300">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-forge-900/70 via-slate-900/80 to-slate-900/90 p-6">
        <p className="text-sm uppercase tracking-[0.28em] text-forge-200">Dashboard</p>
        <h2 className="mt-4 font-display text-4xl text-white">Your work is only real when it gets logged.</h2>
        <p className="mt-3 max-w-2xl text-slate-300">
          Track focused minutes, guard your streak, and convert sessions into visible progress.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today" value={formatMinutes(overview.todayMinutes)} hint="Focused so far" />
        <MetricCard label="This Week" value={formatMinutes(overview.weekMinutes)} hint="Rolling weekly total" />
        <MetricCard label="Current Streak" value={`${overview.user.current_streak} days`} hint="60 minutes keeps it alive" />
        <MetricCard label="Level" value={`Lv. ${overview.user.level}`} hint={`${overview.user.xp} XP total`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Daily Focus" subtitle="Last 14 days">
          <SparkBars items={daily} keyField="day" valueField="minutes" />
        </Card>
        <Card title="XP Progress" subtitle={`Next level: ${overview.xpProgress.nextLevel}`}>
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-semibold text-white">{overview.xpProgress.currentXp}</p>
                <p className="mt-1 text-sm text-slate-400">XP into current level</p>
              </div>
              <p className="text-sm text-slate-400">{overview.xpProgress.requiredXp} needed</p>
            </div>
            <div className="mt-5 h-3 rounded-full bg-slate-800">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-forge-500 to-amber-300"
                style={{
                  width: `${Math.min((overview.xpProgress.currentXp / overview.xpProgress.requiredXp) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Active tasks</p>
                <p className="mt-2 text-2xl text-white">{overview.activeTaskCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Deep work blocks</p>
                <p className="mt-2 text-2xl text-white">{overview.weeklyDeepWorkBlocks}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-400">Leaderboard</p>
                <p className="mt-2 text-2xl text-white">
                  {overview.leaderboardPosition ? `#${overview.leaderboardPosition}` : "Unranked"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Active Tasks" subtitle="Keep the next session obvious">
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div>
                  <p className="font-medium text-white">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{task.tag_name || "No tag"} • {task.status}</p>
                </div>
                <p className="text-sm text-slate-500">{task.estimated_sessions} sessions</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Leaderboard Preview" subtitle="Weekly minutes">
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forge-500/20 text-forge-200">
                    #{entry.rank}
                  </div>
                  <div>
                    <p className="font-medium text-white">{entry.username}</p>
                    <p className="text-sm text-slate-400">Level {entry.level} • {entry.currentStreak} day streak</p>
                  </div>
                </div>
                <p className="font-medium text-white">{formatMinutes(entry.weeklyMinutes)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
