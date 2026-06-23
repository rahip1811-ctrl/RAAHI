"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Leader = { id: string; name: string; reports: number };

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaders(d.leaders ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const rankColor = (i: number) =>
    i === 0 ? "#f5c518" : i === 1 ? "#9aa7b5" : i === 2 ? "#cd7f32" : "var(--brand-strong)";

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="mx-auto max-w-md">
        <Link href="/app" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          ← Map
        </Link>
        <h1 className="font-display mt-3 text-2xl font-extrabold">Top contributors</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Drivers keeping RAAHI’s roads safer.
        </p>

        <div className="mt-6 space-y-2">
          {!loaded && <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading…</p>}
          {loaded && leaders.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No reports yet — be the first!</p>
          )}
          {leaders.map((l, i) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-2xl border p-3.5"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <span className="font-display w-6 text-center text-lg font-extrabold" style={{ color: rankColor(i) }}>
                  {i + 1}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
                  {l.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium">{l.name}</span>
              </div>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {l.reports} report{l.reports === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
