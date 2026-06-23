"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardMap from "@/components/DashboardMap";

type Data = {
  stats: { total: number; high: number; medium: number; low: number };
  byType: { type: string; count: number }[];
  hotspots: { name: string; count: number; score: number }[];
};

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value?: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="font-display text-3xl font-bold" style={{ color }}>
        {value ?? "—"}
      </div>
      <div className="mt-1 text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[var(--ink)] px-6 py-8 text-[var(--text)]">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/map"
          className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)]"
        >
          ← Map
        </Link>

        <div className="mt-3">
          <span className="signal-chip text-[var(--muted-2)]">Civic dashboard</span>
          <h1 className="font-display mt-2 text-3xl font-bold">
            Where Ahmedabad’s roads need attention most
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Live counts and hotspot rankings, computed straight from the spatial
            database.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Active hazards" value={data?.stats.total} color="var(--text)" />
          <Stat label="High severity" value={data?.stats.high} color="var(--danger)" />
          <Stat label="Medium" value={data?.stats.medium} color="var(--caution)" />
          <Stat label="Low" value={data?.stats.low} color="var(--clear)" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="h-80 overflow-hidden rounded-xl border border-[var(--line)] lg:col-span-2">
            <DashboardMap />
          </div>
          <div>
            <h2 className="font-display font-bold">By type</h2>
            <div className="mt-3 space-y-2">
              {!data && <p className="text-sm text-[var(--muted-2)]">Loading…</p>}
              {data?.byType.map((t) => (
                <div
                  key={t.type}
                  className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <span className="capitalize text-[var(--text)]">
                    {t.type.replace("_", " ")}
                  </span>
                  <span className="font-semibold text-[var(--muted)]">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-xl font-bold">Worst hotspots</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Clusters ranked by density × severity — computed in PostGIS with
            ST_ClusterDBSCAN.
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {data && data.hotspots.length === 0 && (
            <p className="text-sm text-[var(--muted-2)]">
              No clusters yet — hotspots appear once several hazards are reported
              close together.
            </p>
          )}
          {data?.hotspots.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="font-display flex h-7 w-7 items-center justify-center rounded-md bg-[var(--hazard)]/12 text-sm font-bold text-[var(--hazard)]">
                  {i + 1}
                </span>
                <span className="font-medium">{h.name}</span>
              </div>
              <span className="text-sm text-[var(--muted)]">
                {h.count} hazards · priority {h.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
