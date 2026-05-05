import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { Heatmap } from "../components/Heatmap";
import { SparkBars } from "../components/SparkBars";
import { MetricCard } from "../components/MetricCard";

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${suffix}`;
}

export function AnalyticsPage() {
  const [daily, setDaily] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [tags, setTags] = useState([]);
  const [momentum, setMomentum] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [hourly, setHourly] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/stats/daily"),
      api.get("/stats/weekly"),
      api.get("/stats/tags"),
      api.get("/stats/momentum"),
      api.get("/stats/heatmap"),
      api.get("/stats/hourly"),
    ]).then(([dailyData, weeklyData, tagData, momentumData, heatmapData, hourlyData]) => {
      setDaily(dailyData);
      setWeekly(weeklyData);
      setTags(tagData);
      setMomentum(momentumData);
      setHeatmap(heatmapData);
      setHourly(hourlyData);
    });
  }, []);

  if (!momentum) {
    return <div className="p-6 text-slate-300">Loading analytics...</div>;
  }

  const bestHour = hourly.reduce(
    (best, item) => (item.minutes > best.minutes ? item : best),
    { hour: 0, minutes: 0, sessions: 0 }
  );
  const totalDailyMinutes = daily.reduce((sum, item) => sum + item.minutes, 0);
  const averageDailyMinutes = Math.round(totalDailyMinutes / Math.max(daily.length, 1));
  const topTag = tags[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Momentum" value={`${Math.round(momentum.momentum * 100)}%`} hint="This week vs last week" />
        <MetricCard label="Daily Avg" value={formatMinutes(averageDailyMinutes)} hint="Average of last 14 days" />
        <MetricCard label="Best Time" value={bestHour.minutes ? formatHour(bestHour.hour) : "None"} hint={bestHour.minutes ? `${formatMinutes(bestHour.minutes)} in 30 days` : "No sessions yet"} />
        <MetricCard label="Consistency" value={`${momentum.consistencyScore}%`} hint="Days with focus in last 14 days" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Daily Focus Trend" subtitle="Last 14 days">
          <SparkBars items={daily} keyField="day" valueField="minutes" />
        </Card>
        <Card title="Weekly Focus Trend" subtitle="Last 8 weeks">
          <SparkBars items={weekly} keyField="weekStart" valueField="minutes" />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Best Focus Time" subtitle="Minutes by starting hour, past 30 days">
          <div className="space-y-3">
            {hourly
              .filter((item) => item.minutes > 0)
              .sort((a, b) => b.minutes - a.minutes)
              .slice(0, 6)
              .map((item) => (
                <div key={item.hour} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{formatHour(item.hour)}</p>
                    <p className="text-sm text-slate-300">{formatMinutes(item.minutes)}</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-forge-500 to-amber-300"
                      style={{ width: `${Math.max((item.minutes / Math.max(bestHour.minutes, 1)) * 100, 8)}%` }}
                    />
                  </div>
                </div>
              ))}
            {hourly.every((item) => item.minutes === 0) ? (
              <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-400">
                Finish a session to discover your strongest focus window.
              </p>
            ) : null}
          </div>
        </Card>
        <Card title="Top Tag" subtitle="Past 30 days">
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Most focused area</p>
            <p className="mt-4 text-4xl font-semibold text-white">{topTag?.tag || "None"}</p>
            <p className="mt-2 text-sm text-slate-400">
              {topTag ? `${formatMinutes(topTag.minutes)} logged` : "No tagged focus sessions yet"}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card title="Tag Distribution" subtitle="Past 30 days">
          <div className="space-y-3">
            {tags.map((tag) => (
              <div key={tag.tag} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{tag.tag}</p>
                  <p className="text-sm text-slate-300">{tag.minutes}m</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-forge-500 to-amber-300"
                    style={{ width: `${Math.max((tag.minutes / Math.max(tags[0]?.minutes || 1, 1)) * 100, tag.minutes ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Streak Calendar" subtitle="Last 12 weeks">
          <Heatmap data={heatmap} />
        </Card>
      </div>
    </div>
  );
}
