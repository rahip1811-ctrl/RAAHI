export type Delivery = "voice" | "chime" | "hidden";

export type AlertPrefs = {
  mutePothole: boolean;
  muteConstruction: boolean;
  muteDebris: boolean;
  muteHotspots: boolean;
  bufferCity: number; // 50–300 m
  bufferHwy: number; // 200–1000 m
  delivery: Delivery;
  volume: number; // 0–100
  muteCalls: boolean;
  cluster: boolean;
  familiarCap: boolean;
};

export const DEFAULT_PREFS: AlertPrefs = {
  mutePothole: false,
  muteConstruction: false,
  muteDebris: false,
  muteHotspots: false,
  bufferCity: 150,
  bufferHwy: 500,
  delivery: "voice",
  volume: 100,
  muteCalls: false,
  cluster: true,
  familiarCap: false,
};

const KEY = "raahi-alert-prefs";

export function getAlertPrefs(): AlertPrefs {
  if (typeof localStorage === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveAlertPrefs(p: AlertPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function isTypeMuted(p: AlertPrefs, type: string): boolean {
  if (type === "pothole") return p.mutePothole;
  if (type === "construction") return p.muteConstruction;
  if (type === "debris") return p.muteDebris;
  return false;
}
