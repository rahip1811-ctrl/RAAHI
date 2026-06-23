type Slice = { label: string; value: number; color: string };

export default function Donut({
  data,
  size = 168,
  thickness = 24,
  centerValue,
  centerLabel,
}: {
  data: Slice[];
  size?: number;
  thickness?: number;
  centerValue?: string | number;
  centerLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const dash = (d.value / total) * c;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return el;
          })}
        </g>
        {centerValue !== undefined && (
          <>
            <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="font-display" style={{ fill: "var(--text)", fontSize: 26, fontWeight: 800 }}>
              {centerValue}
            </text>
            {centerLabel && (
              <text x="50%" y="61%" textAnchor="middle" dominantBaseline="middle" style={{ fill: "var(--text-muted)", fontSize: 11 }}>
                {centerLabel}
              </text>
            )}
          </>
        )}
      </svg>

      <div className="space-y-2.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
            <span style={{ color: "var(--text-muted)" }}>{d.label}</span>
            <span className="ml-auto font-semibold">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
