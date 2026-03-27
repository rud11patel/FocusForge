export function SparkBars({ items = [], keyField, valueField }) {
  const max = Math.max(...items.map((item) => item[valueField]), 1);

  return (
    <div className="flex h-40 items-end gap-2">
      {items.map((item) => (
        <div key={item[keyField]} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-2xl bg-gradient-to-t from-forge-600 to-amber-300"
            style={{ height: `${Math.max((item[valueField] / max) * 100, item[valueField] ? 8 : 2)}%` }}
          />
          <span className="text-xs text-slate-400">{item[keyField].slice(5)}</span>
        </div>
      ))}
    </div>
  );
}
