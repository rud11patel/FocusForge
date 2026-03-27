export function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
    </div>
  );
}
