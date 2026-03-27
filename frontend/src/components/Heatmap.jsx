export function Heatmap({ data = [] }) {
  const max = Math.max(...data.map((entry) => entry.minutes), 1);

  return (
    <div className="grid grid-cols-7 gap-2">
      {data.map((entry) => {
        const intensity = entry.minutes === 0 ? 0 : Math.ceil((entry.minutes / max) * 4);
        const bg = ["bg-slate-800", "bg-forge-900", "bg-forge-700", "bg-forge-500", "bg-amber-300"][intensity];

        return <div key={entry.day} className={`aspect-square rounded-lg ${bg}`} title={`${entry.day}: ${entry.minutes}m`} />;
      })}
    </div>
  );
}
