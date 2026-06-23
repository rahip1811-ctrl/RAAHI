"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import { IconChart, IconUsers, IconChevronRight } from "@/components/icons";

type Me = { uid: string; email: string; name: string } | null;

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);
  const [reports, setReports] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!me) return;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        const leaders: { id: string; reports: number }[] = d.leaders ?? [];
        const idx = leaders.findIndex((l) => l.id === me.uid);
        if (idx >= 0) {
          setReports(leaders[idx].reports);
          setRank(idx + 1);
        } else {
          setReports(0);
        }
      })
      .catch(() => {});
  }, [me]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!loaded) return null;

  if (!me) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 text-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <h1 className="font-display text-2xl font-extrabold">You’re not logged in</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Log in to track your reports and contribution.
        </p>
        <Button className="mt-5" onClick={() => router.push("/login")}>Log in</Button>
      </main>
    );
  }

  const name = me.name || me.email.split("@")[0];
  const initial = name.charAt(0).toUpperCase();

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-28 pt-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Profile</h1>
        <ThemeToggle />
      </div>

      <Card className="mt-5 flex items-center gap-4 p-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
          {initial}
        </span>
        <div className="min-w-0">
          <div className="truncate text-lg font-bold">{name}</div>
          <div className="truncate text-sm" style={{ color: "var(--text-muted)" }}>{me.email}</div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Your reports</div>
          <div className="font-display mt-1 text-3xl font-extrabold" style={{ color: "var(--brand-strong)" }}>
            {reports ?? "—"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Leaderboard rank</div>
          <div className="font-display mt-1 text-3xl font-extrabold">
            {rank ? `#${rank}` : "—"}
          </div>
        </Card>
      </div>

      <div className="mt-4 space-y-2">
        <NavRow href="/dashboard" icon={<IconChart size={20} />} label="Command Center" />
        <NavRow href="/leaderboard" icon={<IconUsers size={20} />} label="Leaderboard" />
      </div>

      <Button variant="outline" full className="mt-6" onClick={logout}>
        Sign out
      </Button>
    </main>
  );
}

function NavRow({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="btn-press flex items-center justify-between rounded-2xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <span className="flex items-center gap-3 font-semibold">
        <span style={{ color: "var(--brand-strong)" }}>{icon}</span>
        {label}
      </span>
      <IconChevronRight size={18} />
    </Link>
  );
}
