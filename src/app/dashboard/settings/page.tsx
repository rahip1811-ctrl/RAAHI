"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashHeader from "@/components/DashHeader";
import { Card, Button } from "@/components/ui";
import { getMode, setMode, type ThemeMode } from "@/lib/theme";
import { IconSun, IconMoon, IconAuto } from "@/components/icons";

const OPTS: { id: ThemeMode; label: string; Icon: (p: { size?: number }) => React.ReactElement }[] = [
  { id: "auto", label: "Auto (day / night)", Icon: IconAuto },
  { id: "light", label: "Light", Icon: IconSun },
  { id: "dark", label: "Dark", Icon: IconMoon },
];

export default function SettingsPage() {
  const router = useRouter();
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [me, setMe] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    setModeState(getMode());
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user)).catch(() => {});
  }, []);

  function pick(m: ThemeMode) {
    setModeState(m);
    setMode(m);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="max-w-2xl px-6 py-7 lg:px-8">
      <DashHeader title="Settings" />

      <Card className="p-5">
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Auto follows the time of day — dark at night, light by day.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {OPTS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => pick(id)}
              className="btn-press flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold"
              style={{
                borderColor: mode === id ? "var(--brand)" : "var(--border)",
                background: mode === id ? "var(--brand-soft)" : "var(--surface)",
                color: mode === id ? "var(--brand-strong)" : "var(--text)",
              }}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
      </Card>

      {me && (
        <Card className="mt-5 p-5">
          <h2 className="font-semibold">Account</h2>
          <div className="mt-3 text-sm">
            <div><span style={{ color: "var(--text-muted)" }}>Name: </span>{me.name || "—"}</div>
            <div className="mt-1"><span style={{ color: "var(--text-muted)" }}>Email: </span>{me.email}</div>
          </div>
          <Button variant="outline" className="mt-4" onClick={logout}>Sign out</Button>
        </Card>
      )}
    </main>
  );
}
