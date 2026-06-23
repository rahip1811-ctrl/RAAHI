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
    <div className="rounded-xl bg-zinc-900 p-4">
      <div className={`text-3xl font-bold ${color}`}>{value ?? "—"}</div>
      <div className="text-xs text-zinc-400">{label}</div>
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
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/map" className="text-sm text-zinc-400 hover:text-white">
          ← Map
        </Link>
        <h1 className="mt-2 text-2xl font-bold">📊 Civic Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Where Ahmedabad&apos;s roads need attention most.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Active hazards" value={data?.stats.total} color="text-white" />
          <Stat label="High severity" value={data?.stats.high} color="text-red-400" />
          <Stat label="Medium" value={data?.stats.medium} color="text-amber-400" />
          <Stat label="Low" value={data?.stats.low} color="text-green-400" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="h-80 overflow-hidden rounded-xl lg:col-span-2">
            <DashboardMap />
          </div>
          <div>
            <h2 className="font-semibold">By type</h2>
            <div className="mt-3 space-y-2">
              {!data && <p className="text-sm text-zinc-500">Loading…</p>}
              {data?.byType.map((t) => (
                <div
                  key={t.type}
                  className="flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-2 text-sm"
                >
                  <span className="capitalize text-zinc-300">
                    {t.type.replace("_", " ")}
                  </span>
                  <span className="font-semibold text-zinc-400">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 className="mt-8 font-semibold">🔥 Worst hotspots</h2>
        <p className="text-xs text-zinc-500">
          Clusters ranked by density × severity — computed in PostGIS with
          DBSCAN clustering.
        </p>
        <div className="mt-3 space-y-2">
          {data && data.hotspots.length === 0 && (
            <p className="text-sm text-zinc-500">
              No clusters yet — hotspots appear once several hazards are reported
              close together.
            </p>
          )}
          {data?.hotspots.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-amber-400">
                  {i + 1}
                </span>
                <span className="font-medium">{h.name}</span>
              </div>
              <span className="text-sm text-zinc-400">
                {h.count} hazards · priority {h.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
