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

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
        className="pointer-events-auto rounded-full bg-zinc-900/90 px-4 py-2 text-sm font-semibold text-white shadow"
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
        className="flex items-center gap-2 rounded-full bg-zinc-900/90 py-1.5 pl-1.5 pr-3 text-sm text-white shadow"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-zinc-950">
          {initial}
        </span>
        <span className="max-w-[120px] truncate font-medium">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl">
          <div className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-base font-bold text-zinc-950">
              {initial}
            </span>
            <div className="min-w-0">
              <div className="truncate font-semibold">{displayName}</div>
              <div className="truncate text-xs text-zinc-500">{user.email}</div>
            </div>
          </div>
          <div className="border-t border-zinc-100">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm hover:bg-zinc-50"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/leaderboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm hover:bg-zinc-50"
            >
              🏆 Leaderboard
            </Link>
            <button
              onClick={logout}
              className="block w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-zinc-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
