export type ThemeMode = "auto" | "light" | "dark";

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "auto") {
    const h = new Date().getHours();
    return h >= 19 || h < 6 ? "dark" : "light";
  }
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolveTheme(mode));
}

export function getMode(): ThemeMode {
  if (typeof localStorage === "undefined") return "auto";
  return (localStorage.getItem("raahi-theme") as ThemeMode) || "auto";
}

export function setMode(mode: ThemeMode) {
  try {
    localStorage.setItem("raahi-theme", mode);
  } catch {
    /* ignore */
  }
  applyTheme(mode);
}
