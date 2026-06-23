import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import ThemeToggle from "@/components/ThemeToggle";
import { ShieldMark, Wordmark } from "@/components/Brand";
import {
  IconVoice,
  IconNav,
  IconUsers,
  IconPin,
  IconLayers,
  IconArrowRight,
} from "@/components/icons";

function MapPreview() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div className="map-grid relative h-[420px] w-full" style={{ background: "var(--bg-2)" }}>
        <svg viewBox="0 0 400 420" className="absolute inset-0 h-full w-full">
          <path d="M-20 130 C 120 100, 240 210, 440 160" stroke="var(--surface-3)" strokeWidth="22" fill="none" />
          <path d="M70 -20 C 110 150, 60 280, 130 460" stroke="var(--surface-3)" strokeWidth="18" fill="none" />
          <path d="M-20 320 C 140 300, 260 340, 440 300" stroke="var(--surface-3)" strokeWidth="16" fill="none" />
          <path d="M-20 130 C 120 100, 240 210, 440 160" stroke="var(--text-faint)" strokeWidth="2" strokeDasharray="2 14" fill="none" />
        </svg>

        <Dot x="22%" y="32%" c="var(--danger)" />
        <Dot x="58%" y="44%" c="var(--caution)" />
        <Dot x="33%" y="70%" c="var(--clear)" />
        <Dot x="72%" y="70%" c="var(--danger)" />
        <Dot x="46%" y="24%" c="var(--caution)" />

        <div
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{ left: "40%", top: "55%", background: "var(--route)", borderColor: "#fff" }}
        />

        <div
          className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl border px-4 py-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
            <IconVoice size={20} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Pothole ahead · 80 m</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>High severity · reported 4× this week</div>
          </div>
        </div>

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <span className="live-dot" />
          <span className="text-xs font-semibold">Live · Ahmedabad</span>
        </div>
      </div>
    </div>
  );
}
function Dot({ x, y, c }: { x: string; y: string; c: string }) {
  return (
    <span
      className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ left: x, top: y, background: c, border: "1.5px solid var(--surface)", boxShadow: `0 0 0 4px ${c}22` }}
    />
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
        {icon}
      </span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>{body}</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <ShieldMark size={32} />
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex" style={{ color: "var(--text-muted)" }}>
          <Link href="/app">Map</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/leaderboard">Leaderboard</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <AuthStatus />
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          <span className="r-chip" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
            <span className="live-dot" /> Community-driven road safety
          </span>

          <h1 className="font-display mt-5 text-5xl font-extrabold leading-[1.04] sm:text-6xl">
            See <span style={{ color: "var(--danger)" }}>danger</span>
            <br />
            before you reach it.
          </h1>

          <p className="mt-5 max-w-md text-lg" style={{ color: "var(--text-muted)" }}>
            RAAHI maps potholes, debris and construction on Indian roads —
            reported by drivers around you — and warns you out loud before you
            reach them.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/app" className="btn-press inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
              Open the app <IconArrowRight size={18} />
            </Link>
            <Link href="/app/report" className="btn-press inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 font-semibold" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
              <IconPin size={18} /> Report a hazard
            </Link>
          </div>

          <div className="mt-10 grid max-w-md gap-4 sm:grid-cols-2">
            <Feature icon={<IconVoice size={20} />} title="Live voice alerts" body="Hear the hazard before you see it." />
            <Feature icon={<IconNav size={20} />} title="Hazard-aware routing" body="Routes that warn you on the way." />
            <Feature icon={<IconUsers size={20} />} title="Community powered" body="Built from real driver reports." />
            <Feature icon={<IconLayers size={20} />} title="Live spatial data" body="Clustered & ranked in real time." />
          </div>
        </div>

        <MapPreview />
      </section>

      {/* spatial credibility */}
      <section className="border-t" style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>
            Under the hood
          </span>
          <h2 className="font-display mt-3 max-w-xl text-3xl font-bold sm:text-4xl">
            A real spatial engine — not a list of pins.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4" style={{ background: "var(--border)", borderColor: "var(--border)" }}>
            {[
              ["Proximity alerts", "ST_DWithin finds hazards inside your warning radius as you move."],
              ["Smart de-dup", "Nearby reports of the same type merge into one confirmed point."],
              ["Hotspot ranking", "ST_ClusterDBSCAN ranks clusters by density × severity."],
              ["Indexed for scale", "GiST-indexed points keep queries fast past 50,000 rows."],
            ].map(([t, b]) => (
              <div key={t} className="p-6" style={{ background: "var(--surface)" }}>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand)" }} />
                  <h3 className="text-sm font-semibold">{t}</h3>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <ShieldMark size={28} />
            <span>
              <span className="font-display font-extrabold">RAAHI</span>
              <span className="font-deva ml-2" style={{ color: "var(--text-muted)" }}>राही</span>
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            Built for safer roads in Ahmedabad and beyond.
          </p>
        </div>
      </footer>
    </main>
  );
}
