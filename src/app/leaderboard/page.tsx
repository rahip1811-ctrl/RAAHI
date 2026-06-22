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

  const medal = (i: number) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/map" className="text-sm text-zinc-400 hover:text-white">
          ← Map
        </Link>
        <h1 className="mt-3 text-2xl font-bold">🏆 Top Contributors</h1>
        <p className="text-sm text-zinc-400">
          People keeping Raahi&apos;s roads safer.
        </p>

        <div className="mt-6 space-y-2">
          {!loaded && <p className="text-zinc-500">Loading…</p>}
          {loaded && leaders.length === 0 && (
            <p className="text-zinc-500">No reports yet — be the first!</p>
          )}
          {leaders.map((l, i) => (
            <div
              key={l.id}
              className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 text-center text-lg font-bold text-amber-400">
                  {medal(i)}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950">
                  {l.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium">{l.name}</span>
              </div>
              <span className="text-sm text-zinc-400">
                {l.reports} report{l.reports === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
