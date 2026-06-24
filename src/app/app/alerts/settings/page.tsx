"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAlertPrefs, saveAlertPrefs, type AlertPrefs, type Delivery } from "@/lib/alertPrefs";
import { IconVoice, IconBell, IconMute, IconAlert, IconLayers } from "@/components/icons";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-press relative h-7 w-12 shrink-0 rounded-full transition-colors" style={{ background: on ? "var(--brand)" : "var(--surface-3)" }}>
      <span className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all" style={{ left: on ? 26 : 4 }} />
    </button>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <h2 className="font-display font-bold">{title}</h2>
      {desc && <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{desc}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3.5" style={{ borderColor: "var(--border)" }}>
      <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{title}</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</div></div>
      {children}
    </div>
  );
}

export default function AlertSettingsPage() {
  const [p, setP] = useState<AlertPrefs | null>(null);
  useEffect(() => { setP(getAlertPrefs()); }, []);

  function up(patch: Partial<AlertPrefs>) {
    setP((prev) => { const next = { ...(prev as AlertPrefs), ...patch }; saveAlertPrefs(next); return next; });
  }
  if (!p) return null;

  const deliveryOpts: { id: Delivery; label: string; sub: string; Icon: (q: { size?: number }) => React.ReactElement }[] = [
    { id: "voice", label: "Voice + visual", sub: "Spoken warnings", Icon: IconVoice },
    { id: "chime", label: "Chime only", sub: "A short ping", Icon: IconBell },
    { id: "hidden", label: "Hidden", sub: "Map markers only", Icon: IconMute },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-28 pt-5" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <Link href="/app/alerts" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>← Alerts</Link>
      <h1 className="font-display mt-2 text-2xl font-extrabold">Alert settings</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Tune exactly how and when RAAHI warns you.</p>

      <div className="mt-5">
        <Section title="Threat filtering" desc="Mute hazard types you don't care about for your vehicle.">
          <Row title="Potholes & surface cavities" desc="Holes and broken patches in the road."><Toggle on={!p.mutePothole} onClick={() => up({ mutePothole: !p.mutePothole })} /></Row>
          <Row title="Active construction zones" desc="Roadworks, digging and barriers."><Toggle on={!p.muteConstruction} onClick={() => up({ muteConstruction: !p.muteConstruction })} /></Row>
          <Row title="Debris & obstructions" desc="Rocks, rubble and objects on the road."><Toggle on={!p.muteDebris} onClick={() => up({ muteDebris: !p.muteDebris })} /></Row>
          <Row title="Accident-prone hotspots" desc="Predictive warnings from DBSCAN cluster density."><Toggle on={!p.muteHotspots} onClick={() => up({ muteHotspots: !p.muteHotspots })} /></Row>
        </Section>

        <Section title="Proximity buffers" desc="How early you hear a warning, by road type.">
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between text-sm"><span className="font-semibold">City warning buffer</span><span style={{ color: "var(--brand-strong)" }}>{p.bufferCity} m</span></div>
            <input type="range" min={50} max={300} step={10} value={p.bufferCity} onChange={(e) => up({ bufferCity: Number(e.target.value) })} className="mt-3 w-full" style={{ accentColor: "var(--brand)" }} />
            <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--text-faint)" }}><span>50 m</span><span>300 m</span></div>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between text-sm"><span className="font-semibold">Highway warning buffer</span><span style={{ color: "var(--brand-strong)" }}>{p.bufferHwy >= 1000 ? "1 km" : `${p.bufferHwy} m`}</span></div>
            <input type="range" min={200} max={1000} step={50} value={p.bufferHwy} onChange={(e) => up({ bufferHwy: Number(e.target.value) })} className="mt-3 w-full" style={{ accentColor: "var(--brand)" }} />
            <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--text-faint)" }}><span>200 m</span><span>1 km</span></div>
          </div>
        </Section>

        <Section title="Notification style" desc="How warnings are delivered.">
          <div className="grid gap-2 sm:grid-cols-3">
            {deliveryOpts.map(({ id, label, sub, Icon }) => (
              <button key={id} onClick={() => up({ delivery: id })} className="btn-press rounded-xl border p-3 text-left" style={{ borderColor: p.delivery === id ? "var(--brand)" : "var(--border)", background: p.delivery === id ? "var(--brand-soft)" : "var(--surface)" }}>
                <Icon size={18} />
                <div className="mt-1.5 text-sm font-semibold" style={{ color: p.delivery === id ? "var(--brand-strong)" : "var(--text)" }}>{label}</div>
                <div className="text-xs" style={{ color: "var(--text-faint)" }}>{sub}</div>
              </button>
            ))}
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between text-sm"><span className="font-semibold">Voice volume</span><span style={{ color: "var(--brand-strong)" }}>{p.volume}%</span></div>
            <input type="range" min={0} max={100} step={5} value={p.volume} onChange={(e) => up({ volume: Number(e.target.value) })} className="mt-3 w-full" style={{ accentColor: "var(--brand)" }} />
          </div>
          <Row title="Mute during calls" desc="Stay silent when you're on a phone call."><Toggle on={p.muteCalls} onClick={() => up({ muteCalls: !p.muteCalls })} /></Row>
        </Section>

        <Section title="Fatigue protection" desc="Stop the app from spamming you in dense areas.">
          <Row title="Aggregate clusters" desc='3+ nearby hazards become one "cluster ahead" alert.'><Toggle on={p.cluster} onClick={() => up({ cluster: !p.cluster })} /></Row>
          <Row title="Familiar-route capping" desc="Fewer alerts on routes you drive every day."><Toggle on={p.familiarCap} onClick={() => up({ familiarCap: !p.familiarCap })} /></Row>
        </Section>

        <div className="flex items-center gap-2 rounded-2xl border p-4 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <IconAlert size={16} />
          Buffers and filtering take effect the next time you start a drive. <IconLayers size={14} />
        </div>
      </div>
    </main>
  );
}
