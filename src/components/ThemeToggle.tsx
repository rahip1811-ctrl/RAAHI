"use client";

import { useEffect, useState } from "react";
import { getMode, setMode, applyTheme, type ThemeMode } from "@/lib/theme";
import { IconSun, IconMoon, IconAuto } from "@/components/icons";

const ORDER: ThemeMode[] = ["auto", "light", "dark"];
const LABEL: Record<ThemeMode, string> = { auto: "Auto", light: "Light", dark: "Dark" };

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setModeState] = useState<ThemeMode>("auto");

  // On mount, read the stored mode AND re-apply it so the DOM can never
  // drift out of sync with what the toggle shows.
  useEffect(() => {
    const m = getMode();
    setModeState(m);
    applyTheme(m);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setModeState(next);
    setMode(next);
  }

  const Icon = mode === "light" ? IconSun : mode === "dark" ? IconMoon : IconAuto;

  return (
    <button
      onClick={cycle}
      title={`Theme: ${LABEL[mode]} (tap to change)`}
      className="btn-press inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold"
      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}
      >
        <Icon size={15} />
      </span>
      {!compact && <span>{LABEL[mode]}</span>}
    </button>
  );
}
