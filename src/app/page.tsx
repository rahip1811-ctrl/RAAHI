"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import ThemeToggle from "@/components/ThemeToggle";
import { ShieldMark } from "@/components/Brand";
import {
  IconVoice, IconNav, IconUsers, IconPin, IconArrowRight, IconCheck,
  IconLayers, IconThumbUp, IconThumbDown, IconHome, IconNear, IconBell,
  IconUser, IconPlus,
} from "@/components/icons";

/* ── inline icon primitives ──────────────────────────────────── */
const Road = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3 4 21M18 3l2 18M12 4v2M12 10v2M12 16v2" /></svg>);
const Trophy = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1.5A3 3 0 0 0 7 10.5M17 6h3v1.5a3 3 0 0 1-3 3M9.5 14h5M10 18h4M9 21h6" /></svg>);
const Heart = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.6-9.3-9C1 8.5 2.7 5.5 6 5.5c1.9 0 3.2 1.1 4 2.3.8-1.2 2.1-2.3 4-2.3 3.3 0 5 3 3.3 6.5C19 16.4 12 21 12 21Z" /></svg>);
const Wifi = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>);
const Fire = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 4-2 6-1.5 3 .5 5 .5 5S9 11 12 9c2 3 4 4 4 7a4 4 0 1 1-8 0c0-1 .3-1.8.7-2.5C6.5 15 5 17 5 19a7 7 0 1 0 14 0c0-5-4-7-7-17Z" /></svg>);
const Bolt = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>);
const Merge = ({ s = 20 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 21V9m0 0L4 12m3-3 3 3M7 9c0-2 1-4 5-4s5 2 5 4v12" /></svg>);
const XLogo = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2H21l-6.5 7.4L22 22h-6.8l-4.3-5.6L5.9 22H3l7-8L2.2 2H9l3.9 5.2L18.2 2Z" /></svg>);
const IgLogo = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></svg>);
const GhLogo = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.2-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.3 4.7-4.5 4.9.3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" /></svg>);
const InLogo = ({ s = 18 }: { s?: number }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.1c.5-.9 1.8-1.9 3.6-1.9 3.9 0 4.6 2.5 4.6 5.8V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21H9V9Z" /></svg>);

/* pothole photo-style thumbnail */
const PotholeThumb = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" className="rounded-lg">
    <rect width="40" height="40" fill="#6b7280" />
    <rect width="40" height="40" fill="#52555b" opacity="0.4" />
    <ellipse cx="20" cy="22" rx="12" ry="9" fill="#1f2328" />
    <ellipse cx="18" cy="20" rx="7" ry="5" fill="#0b0d10" />
    <path d="M8 14 L14 16M30 12 L26 17M32 28 L27 26" stroke="#3a3d42" strokeWidth="1.5" />
  </svg>
);

/* fading road vector */
function RoadScene() {
  return (
    <svg viewBox="0 0 440 180" className="w-full max-w-md" aria-hidden="true">
      <defs>
        <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--surface-2)" /><stop offset="1" stopColor="var(--surface-3)" /></linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0.6" stopColor="var(--bg)" stopOpacity="0" /><stop offset="1" stopColor="var(--bg)" /></linearGradient>
      </defs>
      <path d="M150 20 L290 20 L440 180 L0 180 Z" fill="url(#rd)" />
      {[30, 70, 120, 175].map((y, i) => (<rect key={i} x={218 - i * 4} y={y} width={4 + i * 2.5} height={9 + i * 4} fill="var(--text-faint)" opacity="0.45" />))}
      <g transform="translate(220 116)">
        <ellipse cx="0" cy="46" rx="52" ry="7" fill="var(--text)" opacity="0.08" />
        {/* mirrors */}
        <rect x="-49" y="-4" width="9" height="6" rx="2" fill="var(--surface-3)" />
        <rect x="40" y="-4" width="9" height="6" rx="2" fill="var(--surface-3)" />
        {/* body */}
        <path d="M-43 6 Q-43 0 -37 -3 L-31 -22 Q-29 -28 -21 -28 L21 -28 Q29 -28 31 -22 L37 -3 Q43 0 43 6 L43 32 Q43 39 35 39 L-35 39 Q-43 39 -43 32 Z" fill="var(--surface-3)" stroke="var(--border)" />
        {/* rear window */}
        <path d="M-27 -21 L-23 -4 L23 -4 L27 -21 Q24 -24 20 -24 L-20 -24 Q-24 -24 -27 -21 Z" fill="var(--surface)" opacity="0.92" />
        {/* bumper */}
        <rect x="-39" y="26" width="78" height="7" rx="3" fill="var(--surface-2)" />
        {/* taillights */}
        <rect x="-41" y="9" width="11" height="9" rx="3" fill="#ff5151" />
        <rect x="30" y="9" width="11" height="9" rx="3" fill="#ff5151" />
        {/* tyres */}
        <rect x="-41" y="35" width="15" height="9" rx="3" fill="var(--text)" />
        <rect x="26" y="35" width="15" height="9" rx="3" fill="var(--text)" />
      </g>
      <rect x="0" y="0" width="440" height="180" fill="url(#fade)" />
    </svg>
  );
}

/* mobile HUD device */
function Phone() {
  return (
    <div className="relative mx-auto w-[284px]">
      <div className="relative overflow-hidden rounded-[2.6rem] border-[8px]" style={{ borderColor: "#11151c", background: "#0d1117", boxShadow: "0 40px 90px -25px rgba(0,0,0,0.45)" }}>
        <div className="absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full" style={{ background: "#11151c" }} />
        <div className="relative h-[582px]" style={{ background: "#eaf0f6" }}>
          <div className="flex items-center justify-between px-5 pt-3 text-[0.65rem] font-semibold" style={{ color: "#0f1722" }}><span>9:41</span><span>RAAHI</span></div>
          <div className="flex items-center justify-between px-4 pt-2 text-[0.7rem]" style={{ color: "#5a6675" }}><span>☰</span><span className="font-bold">RAAHI</span><IconBell size={14} /></div>
          {/* alert banner */}
          <div className="mx-3 mt-2 flex items-center gap-2 rounded-xl border bg-white px-3 py-2" style={{ borderColor: "rgba(244,63,94,0.4)" }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#ffe4e6", color: "#e11d48" }}><IconVoice size={15} /></span>
            <div className="min-w-0"><div className="text-[0.7rem] font-bold" style={{ color: "#0f1722" }}>Pothole ahead · 120 m</div><div className="text-[0.55rem]" style={{ color: "#8b95a4" }}>Stay slightly left</div></div>
            <div className="ml-auto flex items-end gap-0.5">{[4, 8, 6, 11, 7, 9].map((h, i) => <span key={i} className="w-0.5 rounded-full" style={{ height: h, background: "#e11d48" }} />)}</div>
          </div>
          {/* map + pulsing proximity rings */}
          <div className="relative mx-3 mt-2 h-44 overflow-hidden rounded-xl" style={{ background: "#e7edf3" }}>
            <svg viewBox="0 0 250 180" className="absolute inset-0 h-full w-full">
              {/* parks */}
              <path d="M-5 -5 H70 V40 Q40 55 -5 45 Z" fill="#d7e7d2" />
              <circle cx="225" cy="150" r="45" fill="#d7e7d2" />
              {/* river */}
              <path d="M180 -10 C 165 50, 200 110, 175 200" stroke="#bcd8ea" strokeWidth="16" fill="none" />
              {/* road network */}
              <path d="M-10 55 C 80 38, 150 88, 270 66" stroke="#fff" strokeWidth="13" fill="none" />
              <path d="M-10 120 C 70 110, 160 130, 270 118" stroke="#fff" strokeWidth="9" fill="none" />
              <path d="M120 -10 C 110 60, 130 120, 120 200" stroke="#fff" strokeWidth="11" fill="none" />
              <path d="M60 -10 L70 200" stroke="#fff" strokeWidth="6" fill="none" />
              {/* route */}
              <path d="M120 175 C 118 120, 130 90, 125 60" stroke="#2f6bff" strokeWidth="5" fill="none" strokeLinecap="round" />
              {/* labels */}
              <text x="12" y="30" fontSize="7" fill="#7c8696" fontFamily="sans-serif">Bodakdev</text>
              <text x="150" y="20" fontSize="7" fill="#7c8696" fontFamily="sans-serif">Ambawadi</text>
              <text x="14" y="60" fontSize="7" fill="#9aa3b1" fontFamily="sans-serif">SG Highway</text>
              {/* hazard + rings */}
              <g transform="translate(125 62)">{[0, 0.6, 1.2].map((d, i) => <circle key={i} r="26" fill="none" stroke="#e11d48" strokeWidth="2" style={{ transformOrigin: "center", animation: `radar 2.4s ${d}s ease-out infinite` }} />)}<circle r="9" fill="#e11d48" /><path d="M0 -4 L4 3 L-4 3 Z" fill="#fff" /></g>
              <g transform="translate(122 150)"><circle r="10" fill="#2f6bff" opacity="0.25" /><circle r="6.5" fill="#2f6bff" /><circle r="2.5" fill="#fff" /></g>
            </svg>
            <div className="absolute bottom-2 left-2 flex flex-col items-center rounded-full bg-white px-2.5 py-1.5 shadow"><span className="font-display text-sm font-extrabold" style={{ color: "#0f1722" }}>42</span><span className="text-[0.5rem]" style={{ color: "#8b95a4" }}>km/h</span></div>
          </div>
          {/* bottom overlay card */}
          <div className="mx-3 mt-2 rounded-xl border bg-white p-2.5" style={{ borderColor: "#e2e8f1" }}>
            <div className="flex items-center gap-2">
              <PotholeThumb />
              <div className="flex-1"><div className="flex items-center gap-1.5"><span className="text-[0.75rem] font-bold" style={{ color: "#0f1722" }}>Pothole detected</span><span className="rounded-full px-1.5 py-0.5 text-[0.5rem] font-bold" style={{ color: "#e11d48", background: "#ffe4e6" }}>HIGH</span></div><div className="text-[0.55rem]" style={{ color: "#8b95a4" }}>120 m ahead · confirmed nearby</div><div className="text-[0.5rem]" style={{ color: "#a8b0bd" }}>Reported by 14 drivers · 2 hrs ago</div></div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-[0.65rem] font-bold" style={{ background: "#d1fae5", color: "#047857" }}><IconThumbUp size={12} /> Fixed</div>
              <div className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-[0.65rem] font-bold" style={{ background: "#ffe4e6", color: "#be123c" }}><IconThumbDown size={12} /> Still there</div>
            </div>
          </div>
          {/* tab bar */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t bg-white px-3 py-2" style={{ borderColor: "#e2e8f1", color: "#8b95a4" }}>
            <span className="flex flex-col items-center gap-0.5 text-[0.5rem]" style={{ color: "#10b981" }}><IconHome size={16} />Home</span>
            <span className="flex flex-col items-center gap-0.5 text-[0.5rem]"><IconNear size={16} />Nearby</span>
            <span className="flex h-9 w-9 -mt-4 items-center justify-center rounded-full" style={{ background: "#10b981", color: "#fff" }}><IconPlus size={18} /></span>
            <span className="flex flex-col items-center gap-0.5 text-[0.5rem]"><IconBell size={16} />Alerts</span>
            <span className="flex flex-col items-center gap-0.5 text-[0.5rem]"><IconUser size={16} />Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, color, soft, title, body }: { icon: React.ReactNode; color: string; soft: string; title: string; body: string }) {
  return (
    <div className="lift rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: soft, color }}>{icon}</span>
      <div className="mt-4 font-semibold">{title}</div>
      <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{body}</div>
    </div>
  );
}

function Metric({ icon, value, label, sub }: { icon: React.ReactNode; value: string; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>{icon}</span>
      <div className="min-w-0">
        <div className="font-display text-lg font-extrabold leading-none stat-pop">{value}</div>
        <div className="mt-0.5 text-[0.72rem] font-semibold">{label}</div>
        <div className="text-[0.65rem]" style={{ color: "var(--text-faint)" }}>{sub}</div>
      </div>
    </div>
  );
}

function SpatialBox({ icon, color, soft, title, code }: { icon: React.ReactNode; color: string; soft: string; title: string; code: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: soft, color }}>{icon}</span>
        <span className="font-semibold">{title}</span>
      </div>
      <p className="mt-2 font-mono text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{code}</p>
    </div>
  );
}

const BLUE = "#3b82f6", ORANGE = "#f59e0b", PURPLE = "#8b5cf6";
const tint = (c: string) => `${c}22`;

export default function Home() {
  const [m, setM] = useState<{ hazards?: number; active?: number; resolved?: number; contributors?: number }>({});
  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then((d) => { if (d?.stats) setM((p) => ({ ...p, hazards: d.stats.allTime, active: d.stats.total, resolved: d.stats.resolved })); }).catch(() => {});
    fetch("/api/leaderboard").then((r) => r.json()).then((d) => setM((p) => ({ ...p, contributors: (d.leaders ?? []).length }))).catch(() => {});
  }, []);

  return (
    <main className="relative overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <span className="page-glow" style={{ top: -160, right: -40 }} />

      {/* ── NAVBAR ── */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <ShieldMark size={34} />
          <div className="leading-tight">
            <div className="font-display text-lg font-extrabold">RAAHI</div>
            <div className="text-[0.65rem]" style={{ color: "var(--text-faint)" }}>Community-driven road safety</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: "var(--text-muted)" }}>
          <Link href="/app" className="hover:text-emerald-600">Map</Link>
          <Link href="/dashboard" className="hover:text-emerald-600">Dashboard</Link>
          <Link href="/leaderboard" className="hover:text-emerald-600">Leaderboard</Link>
          <Link href="#about" className="hover:text-emerald-600">About</Link>
        </nav>
        <div className="flex items-center gap-2"><ThemeToggle compact /><AuthStatus /></div>
      </header>

      {/* ── HERO ── */}
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-8 lg:grid-cols-[1fr_auto_1fr] lg:py-10">
        {/* col 1 */}
        <div>
          <span className="r-chip uppercase" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)", letterSpacing: "0.08em" }}>
            <IconUsers size={13} /> Safer roads, together
          </span>
          <h1 className="font-display mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight">
            See <span style={{ color: "var(--brand-strong)" }}>danger</span> before you reach it.
          </h1>
          <p className="mt-4 max-w-sm" style={{ color: "var(--text-muted)" }}>
            Real-time voice alerts for potholes, debris, construction and more — reported by drivers like you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="btn-press inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold text-white" style={{ background: "var(--brand)", boxShadow: "0 10px 24px -8px var(--brand)" }}>
              Open the app <IconArrowRight size={17} />
            </Link>
            <Link href="/app/report" className="btn-press inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface)" }}>
              <IconPin size={16} /> Report a hazard
            </Link>
          </div>
          <div className="mt-8 hidden lg:block"><RoadScene /></div>
        </div>

        {/* col 2 */}
        <Phone />

        {/* col 3 */}
        <div>
          <h2 className="font-display text-xl font-bold">Why drivers trust RAAHI</h2>
          <div className="mt-1.5 h-1 w-12 rounded-full grad-brand" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FeatureCard icon={<IconVoice size={20} />} color="var(--brand-strong)" soft="var(--brand-soft)" title="Live voice alerts" body="Hear it before you reach it." />
            <FeatureCard icon={<IconNav size={20} />} color={BLUE} soft={tint(BLUE)} title="Hazard-aware routing" body="Routes that warn you on the way." />
            <FeatureCard icon={<IconUsers size={20} />} color={ORANGE} soft={tint(ORANGE)} title="Community powered" body="Built from real driver reports." />
            <FeatureCard icon={<IconLayers size={20} />} color={PURPLE} soft={tint(PURPLE)} title="Live spatial data" body="Clustered and ranked in real-time." />
          </div>
        </div>
      </section>

      {/* ── METRIC TAPE ── */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-3 lg:grid-cols-[2.6fr_1fr]">
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border sm:grid-cols-3 lg:grid-cols-5" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
            {[
              { icon: <Road s={20} />, value: String(m.hazards ?? 21), label: "Hazards reported", sub: "Across Ahmedabad" },
              { icon: <IconUsers size={20} />, value: String(m.contributors ?? 12), label: "Contributors", sub: "Reporting hazards" },
              { icon: <ShieldMark size={20} />, value: String(m.active ?? 20), label: "Active now", sub: "Live on the map" },
              { icon: <IconCheck size={20} />, value: String(m.resolved ?? 1), label: "Resolved", sub: "Cleared from roads" },
              { icon: <Trophy s={20} />, value: "PostGIS", label: "Spatial engine", sub: "On Amazon Aurora" },
            ].map((cell, i) => (
              <div key={i} className="border-b sm:border-r last:border-r-0" style={{ borderColor: "var(--border)" }}>
                <Metric {...cell} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ background: "var(--brand-soft)", borderColor: "color-mix(in srgb, var(--brand) 30%, var(--border))" }}>
            <span className="shrink-0" style={{ color: "var(--brand-strong)" }}><Heart s={28} /></span>
            <div className="text-[0.8rem] font-semibold leading-snug">
              Together, we make our roads safer every day.{" "}
              <span style={{ color: "var(--brand-strong)" }}>Drive safe. Stay safe.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPATIAL ENGINE BANNER ── */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_2fr]">
            <h2 className="font-display text-2xl font-bold leading-tight">
              Built on a real <span style={{ color: "var(--brand-strong)" }}>spatial engine.</span>
            </h2>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              <SpatialBox icon={<Wifi s={20} />} color="var(--brand-strong)" soft="var(--brand-soft)" title="Proximity alerts" code="ST_DWithin finds hazards inside your warning radius as you move." />
              <SpatialBox icon={<Merge s={20} />} color={BLUE} soft={tint(BLUE)} title="Smart de-dup" code="Nearby reports of the same type merge into one confirmed point." />
              <SpatialBox icon={<Fire s={20} />} color={ORANGE} soft={tint(ORANGE)} title="Hotspot ranking" code="ST_ClusterDBSCAN ranks clusters by density & severity." />
              <SpatialBox icon={<Bolt s={20} />} color={PURPLE} soft={tint(PURPLE)} title="Indexed for scale" code="GiST-indexed points stay fast past 50,000 rows." />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-7 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <ShieldMark size={26} /><span className="font-display font-extrabold">RAAHI</span>
            <span className="text-sm" style={{ color: "var(--text-faint)" }}>Built for safer roads in Ahmedabad and beyond.</span>
          </div>
          <div className="flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
            <a href="#" aria-label="Twitter" className="hover:text-emerald-600"><XLogo /></a>
            <a href="#" aria-label="Instagram" className="hover:text-emerald-600"><IgLogo /></a>
            <a href="#" aria-label="GitHub" className="hover:text-emerald-600"><GhLogo /></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-emerald-600"><InLogo /></a>
          </div>
        </div>
      </footer>
    </main>
  );
}
