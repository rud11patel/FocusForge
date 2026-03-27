import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { Heatmap } from "../components/Heatmap";
import { SparkBars } from "../components/SparkBars";
import { MetricCard } from "../components/MetricCard";

export function AnalyticsPage() {
  const [daily, setDaily] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [tags, setTags] = useState([]);
  const [momentum, setMomentum] = useState(null);
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/stats/daily"),
      api.get("/stats/weekly"),
      api.get("/stats/tags"),
      api.get("/stats/momentum"),
      api.get("/stats/heatmap"),
    ]).then(([dailyData, weeklyData, tagData, momentumData, heatmapData]) => {
      setDaily(dailyData);
      setWeekly(weeklyData);
      setTags(tagData);
      setMomentum(momentumData);
      setHeatmap(heatmapData);
    });
  }, []);

  if (!momentum) {
    return <div className="p-6 text-slate-300">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Momentum" value={`${Math.round(momentum.momentum * 100)}%`} hint="This week vs last week" />
        <MetricCard label="Prediction" value={`${momentum.focusPrediction}m`} hint="Average of last 14 days" />
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
        <Card title="Focus Heatmap" subtitle="Last 12 weeks">
          <Heatmap data={heatmap} />
        </Card>
      </div>
    </div>
  );
}
