"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = { uid: string; email: string; name: string } | null;

export default function AuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<User>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOpen(false);
    router.refresh();
  }

  if (!loaded) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        className="btn-press pointer-events-auto rounded-full border px-4 py-2 text-sm font-semibold"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
          boxShadow: "var(--shadow)",
        }}
      >
        Log in
      </Link>
    );
  }

  const displayName = user.name || user.email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="pointer-events-auto relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-press flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
          boxShadow: "var(--shadow)",
        }}
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
        >
          {initial}
        </span>
        <span className="max-w-[120px] truncate font-medium">{displayName}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="flex items-center gap-3 p-4">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-base font-bold"
              style={{ background: "var(--brand)", color: "var(--brand-ink)" }}
            >
              {initial}
            </span>
            <div className="min-w-0">
              <div className="truncate font-semibold">{displayName}</div>
              <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                {user.email}
              </div>
            </div>
          </div>
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            <Link href="/app/profile" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm">
              Profile
            </Link>
            <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm">
              Command Center
            </Link>
            <Link href="/leaderboard" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm">
              Leaderboard
            </Link>
            <button
              onClick={logout}
              className="block w-full px-4 py-3 text-left text-sm font-medium"
              style={{ color: "var(--danger)" }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
