"use client";

import { useEffect, useState } from "react";
import { getMode, setMode, type ThemeMode } from "@/lib/theme";
import { IconSun, IconMoon, IconAuto } from "@/components/icons";

const ORDER: ThemeMode[] = ["auto", "light", "dark"];
const LABEL: Record<ThemeMode, string> = {
  auto: "Auto",
  light: "Light",
  dark: "Dark",
};

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setModeState] = useState<ThemeMode>("auto");

  useEffect(() => {
    setModeState(getMode());
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
      className="btn-press inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
      }}
    >
      <Icon size={16} />
      {!compact && <span>{LABEL[mode]}</span>}
    </button>
  );
}
