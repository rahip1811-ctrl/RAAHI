"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashHeader from "@/components/DashHeader";
import { getMode, setMode, type ThemeMode } from "@/lib/theme";
import { IconSun, IconMoon, IconAuto, IconVoice, IconBell, IconLayers, IconChevronRight, IconX, IconCheck } from "@/components/icons";
import { ShieldMark } from "@/components/Brand";

const OPTS: { id: ThemeMode; label: string; sub: string; Icon: (p: { size?: number }) => React.ReactElement }[] = [
  { id: "auto", label: "Auto", sub: "Follow system settings", Icon: IconAuto },
  { id: "light", label: "Light", sub: "Light mode", Icon: IconSun },
  { id: "dark", label: "Dark", sub: "Dark mode", Icon: IconMoon },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-press relative h-7 w-12 shrink-0 rounded-full transition-colors" style={{ background: on ? "var(--brand)" : "var(--surface-3)" }}>
      <span className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? 26 : 4 }} />
    </button>
  );
}

function usePref(key: string, def: boolean): [boolean, () => void] {
  const [v, setV] = useState(def);
  useEffect(() => { const s = localStorage.getItem(key); if (s != null) setV(s === "1"); }, [key]);
  const toggle = () => setV((p) => { localStorage.setItem(key, p ? "0" : "1"); return !p; });
  return [v, toggle];
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border p-5 ${className}`} style={{ background: "var(--surface)", borderColor: "var(--border)" }}>{children}</div>;
}

export default function SettingsPage() {
  const router = useRouter();
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [me, setMe] = useState<{ email: string; name: string } | null>(null);
  const [voice, toggleVoice] = usePref("raahi-voice", true);
  const [vibrate, toggleVibrate] = usePref("raahi-vibrate", true);
  const [resolved, toggleResolved] = usePref("raahi-show-resolved", false);
  const [radius, setRadius] = useState(300);
  const [mapView, setMapView] = useState("standard");
  const [modal, setModal] = useState<null | "usage" | "privacy">(null);
  const [pubReports, togglePubReports] = usePref("raahi-public-reports", true);
  const [showOnBoard, toggleShowOnBoard] = usePref("raahi-show-leaderboard", true);

  async function downloadData() {
    try {
      const [meRes, lbRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/leaderboard").then((r) => r.json()),
      ]);
      const mine = (lbRes.leaders ?? []).find((l: { id: string }) => l.id === meRes.user?.uid) ?? null;
      const payload = { account: meRes.user, contribution: mine, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "raahi-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    setModeState(getMode());
    const r = localStorage.getItem("raahi-radius"); if (r) setRadius(Number(r));
    const mv = localStorage.getItem("raahi-mapview"); if (mv) setMapView(mv);
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user)).catch(() => {});
  }, []);

  const name = me?.name || me?.email?.split("@")[0] || "—";

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }

  return (
    <main className="relative px-6 py-7 lg:px-8">
      <span className="page-glow" style={{ top: -120, left: 120 }} />
      <div className="relative">
        <DashHeader title="Settings" subtitle="Make RAAHI work the way you drive." />

        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          {/* left */}
          <div className="space-y-5">
            <Card>
              <h2 className="font-display font-bold">Appearance</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Choose how the app looks.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {OPTS.map(({ id, label, sub, Icon }) => (
                  <button key={id} onClick={() => { setModeState(id); setMode(id); }} className="btn-press rounded-xl border p-3 text-left"
                    style={{ borderColor: mode === id ? "var(--brand)" : "var(--border)", background: mode === id ? "var(--brand-soft)" : "var(--surface)" }}>
                    <Icon size={18} />
                    <div className="mt-1.5 text-sm font-semibold" style={{ color: mode === id ? "var(--brand-strong)" : "var(--text)" }}>{label}</div>
                    <div className="text-xs" style={{ color: "var(--text-faint)" }}>{sub}</div>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="font-display font-bold">Driving alerts</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>How RAAHI warns you on the road.</p>
              <div className="mt-4 space-y-2">
                <Row icon={<IconVoice size={18} />} title="Voice alerts" desc="Speak warnings aloud as you approach hazards."><Toggle on={voice} onClick={toggleVoice} /></Row>
                <Row icon={<IconBell size={18} />} title="Vibrate on alert" desc="Buzz when a high-severity hazard is ahead."><Toggle on={vibrate} onClick={toggleVibrate} /></Row>
                <Row icon={<IconLayers size={18} />} title="Show resolved hazards on map" desc="Keep fixed hazards visible on the map."><Toggle on={resolved} onClick={toggleResolved} /></Row>
              </div>
            </Card>

            <Card>
              <h2 className="font-display font-bold">Driving preferences</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Customize your driving experience.</p>
              <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between text-sm"><span className="font-semibold">Warning distance</span><span style={{ color: "var(--brand-strong)" }}>{radius} m</span></div>
                <input type="range" min={100} max={1000} step={50} value={radius} onChange={(e) => { setRadius(Number(e.target.value)); localStorage.setItem("raahi-radius", e.target.value); }} className="mt-3 w-full" style={{ accentColor: "var(--brand)" }} />
                <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--text-faint)" }}><span>100 m</span><span>1 km</span></div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                <span className="text-sm font-semibold">Default map view</span>
                <select value={mapView} onChange={(e) => { setMapView(e.target.value); localStorage.setItem("raahi-mapview", e.target.value); }} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                  <option value="standard">Standard map</option>
                  <option value="clustered">Clustered view</option>
                </select>
              </div>
            </Card>
          </div>

          {/* right */}
          <div className="space-y-5">
            <Card>
              <h2 className="font-display font-bold">Account</h2>
              {me && (
                <>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>{name.charAt(0).toUpperCase()}</span>
                    <div className="min-w-0"><div className="font-semibold">{name}</div><div className="truncate text-sm" style={{ color: "var(--text-muted)" }}>{me.email}</div></div>
                  </div>
                  <button onClick={logout} className="btn-press mt-4 w-full rounded-lg border py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--danger)" }}>Sign out</button>
                </>
              )}
            </Card>

            <Card>
              <h2 className="font-display font-bold">About RAAHI</h2>
              <div className="mt-3 flex items-center gap-3">
                <ShieldMark size={40} />
                <div><div className="font-display text-sm font-extrabold">RAAHI · Command Center</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Community road-hazard intelligence for Indian roads.</div></div>
              </div>
              <div className="mt-3 text-xs" style={{ color: "var(--text-faint)" }}>Version 1.0.0</div>
            </Card>

            <Card>
              <h2 className="font-display font-bold">Data &amp; privacy</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Control how your data is used.</p>
              <div className="mt-3 space-y-2">
                <PrivBtn label="Data usage" onClick={() => setModal("usage")} />
                <PrivBtn label="Privacy settings" onClick={() => setModal("privacy")} />
                <PrivBtn label="Download my data" onClick={downloadData} />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6" onClick={() => setModal(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{modal === "usage" ? "Data usage" : "Privacy settings"}</h3>
              <button onClick={() => setModal(null)} style={{ color: "var(--text-faint)" }}><IconX size={18} /></button>
            </div>
            {modal === "usage" ? (
              <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <p>RAAHI stores only what it needs to keep roads safe:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2"><IconCheck size={16} /> Your name &amp; email — to sign you in.</div>
                  <div className="flex items-center gap-2"><IconCheck size={16} /> Hazards you report — type, severity, location, photo.</div>
                  <div className="flex items-center gap-2"><IconCheck size={16} /> Your contribution stats — reports, confirmations, impact.</div>
                </div>
                <p className="pt-1">We never sell your data and never show ads.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <Row icon={<IconCheck size={18} />} title="Show my reports publicly" desc="Let other drivers see hazards you report."><Toggle on={pubReports} onClick={togglePubReports} /></Row>
                <Row icon={<IconCheck size={18} />} title="Appear on the leaderboard" desc="Show your name among top contributors."><Toggle on={showOnBoard} onClick={toggleShowOnBoard} /></Row>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function PrivBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-press flex w-full items-center justify-between rounded-xl border p-3 text-sm font-medium" style={{ borderColor: "var(--border)" }}>
      {label} <IconChevronRight size={16} />
    </button>
  );
}

function Row({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>{icon}</span>
      <div className="min-w-0 flex-1"><div className="font-semibold">{title}</div><div className="text-sm" style={{ color: "var(--text-muted)" }}>{desc}</div></div>
      {children}
    </div>
  );
}
