

export function SparkBars({ items = [], keyField, valueField }) {
  const containerHeight = 160;
  const labelHeight = 20;
  const chartHeight = containerHeight - labelHeight;

  const values = items.map((item) => item[valueField]);
  const max = Math.max(...values, 1);

  return (
    <div style={{ width: "100%" }}>
      {/* CHART AREA */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          height: `${chartHeight}px`,
          gap: "6px",
          padding: "0 6px",
        }}
      >
        {items.map((item, index) => {
          const value = item[valueField];

          const height =
            value === 0
              ? 6
              : Math.max((value / max) * chartHeight, 12);

          const isToday = index === items.length - 1;

          return (
            <div key={item[keyField]} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div
                title={`${value} min`}
                style={{
                  width: "60%",
                  height: `${height}px`,
                  borderRadius: "4px",
                  background:
                    value === 0
                      ? "#475569"
                      : isToday
                      ? "#facc15"
                      : "linear-gradient(to top, #f59e0b, #fde68a)",
                  opacity: value === 0 ? 0.4 : 1,
                  boxShadow: isToday
                    ? "0 0 8px rgba(250, 204, 21, 0.4)"
                    : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* LABELS */}
      <div
        style={{
          display: "flex",
          height: `${labelHeight}px`,
          gap: "6px",
          padding: "0 6px",
          marginTop: "4px",
        }}
      >
        {items.map((item) => (
          <div
            key={item[keyField]}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "10px",
              color: "#94a3b8",
            }}
          >
            {item[keyField].slice(5)}
          </div>
        ))}
      </div>
    </div>
  );
}

