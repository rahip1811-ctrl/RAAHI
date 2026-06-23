"use client";

import { useEffect, useState } from "react";
import DashHeader from "@/components/DashHeader";
import Donut from "@/components/Donut";
import { Card } from "@/components/ui";

type Dash = {
  stats: { total: number; high: number; medium: number; low: number };
  byType: { type: string; count: number }[];
};

const typeLabel = (t: string) =>
  t === "pothole" ? "Pothole" : t === "debris" ? "Debris" : "Construction";
const TYPE_COLORS: Record<string, string> = { pothole: "#ef4444", debris: "#f59e0b", construction: "#6366f1" };

export default function AnalyticsPage() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const s = data?.stats;
  const maxType = Math.max(1, ...(data?.byType.map((t) => t.count) ?? [1]));

  return (
    <main className="px-6 py-7 lg:px-8">
      <DashHeader title="Analytics" subtitle="Distribution of what's on the roads right now." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Hazard types</h2>
          {data && (
            <Donut
              centerValue={data.byType.reduce((a, b) => a + b.count, 0)}
              centerLabel="reports"
              data={data.byType.map((t) => ({ label: typeLabel(t.type), value: t.count, color: TYPE_COLORS[t.type] ?? "var(--text-faint)" }))}
            />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Severity split</h2>
          {s && (
            <Donut
              centerValue={s.total}
              centerLabel="active"
              data={[
                { label: "High", value: s.high, color: "var(--danger)" },
                { label: "Medium", value: s.medium, color: "var(--caution)" },
                { label: "Low", value: s.low, color: "var(--clear)" },
              ]}
            />
          )}
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="mb-4 font-semibold">Reports by type</h2>
        <div className="space-y-3">
          {data?.byType.map((t) => (
            <div key={t.type}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>{typeLabel(t.type)}</span>
                <span className="font-semibold">{t.count}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                <div className="h-full rounded-full" style={{ width: `${(t.count / maxType) * 100}%`, background: TYPE_COLORS[t.type] ?? "var(--brand)" }} />
              </div>
            </div>
          ))}
          {!data && <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
        </div>
      </Card>
    </main>
  );
}
