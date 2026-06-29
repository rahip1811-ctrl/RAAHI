"use client";

import { useRef, useState, type FormEvent } from "react";

/**
 * RAAHI Insight — a database-grounded decision assistant.
 * Tappable chips (and free text) call /api/insight, which answers ONLY from
 * live PostGIS queries on Amazon Aurora. Drop-in: every prop is optional, so it
 * works on the dashboard (no GPS) and in drive mode (GPS + route + map).
 */

type Highlight = { lat: number; lng: number; label: string };
type Msg = { q: string; a: string; action?: string | null; highlight?: Highlight | null; confidence?: string | null };

type Props = {
  variant?: "driver" | "dashboard";
  getLocation?: () => { lat: number; lng: number } | null;
  getRoute?: () => [number, number][] | null;
  onHighlight?: (h: Highlight) => void;
  onAction?: (action: string | null) => void;
};

type Chip = { label: string; intent: string };

const DRIVER_CHIPS: Chip[] = [
  { label: "Road ahead?", intent: "status_ahead" },
  { label: "Is my route clear?", intent: "route_clear" },
  { label: "Top danger zones", intent: "hotspots" },
  { label: "How to report?", intent: "report_help" },
];
const DASH_CHIPS: Chip[] = [
  { label: "Top danger zones", intent: "hotspots" },
  { label: "Last 48h hazards", intent: "recent" },
  { label: "How to report?", intent: "report_help" },
];

const ACTION_LABEL: Record<string, string> = {
  reroute: "Reroute around it",
  show_heatmap: "Show heatmap",
  open_feed: "Open live feed",
  open_report: "Open report form",
  open_drive: "Start navigation",
  enable_gps: "Enable GPS",
};

function intentFromText(t: string): string {
  const s = t.toLowerCase();
  if (/(report|how|submit|add)/.test(s)) return "report_help";
  if (/(route|clear|path|way)/.test(s)) return "route_clear";
  if (/(zone|hotspot|dangerous|worst|danger)/.test(s)) return "hotspots";
  if (/(recent|48|today|week|trend|common)/.test(s)) return "recent";
  return "status_ahead";
}

export default function RaahiInsight({ variant = "driver", getLocation, getRoute, onHighlight, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const chips = variant === "dashboard" ? DASH_CHIPS : DRIVER_CHIPS;

  async function ask(intent: string, label: string) {
    if (busy) return;
    setBusy(true);
    setMsgs((m) => [...m, { q: label, a: "…" }]);
    try {
      const loc = getLocation?.() ?? null;
      const route = getRoute?.() ?? null;
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent, lat: loc?.lat, lng: loc?.lng, route }),
      });
      const d = await res.json();
      const msg: Msg = res.ok
        ? { q: label, a: d.answer ?? "No answer.", action: d.action, highlight: d.highlight, confidence: d.confidence }
        : { q: label, a: d.error ?? "Insight is unavailable." };
      setMsgs((m) => [...m.slice(0, -1), msg]);
      if (res.ok && d.highlight && onHighlight) onHighlight(d.highlight);
    } catch {
      setMsgs((m) => [...m.slice(0, -1), { q: label, a: "Couldn't reach Insight. Try again." }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" }), 60);
    }
  }

  function submitText(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    ask(intentFromText(t), t);
  }

  return (
    <>
      {/* Floating launcher — labeled so it clearly reads as the AI assistant */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Ask RAAHI Insight"
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg transition active:scale-95"
        style={{ background: "var(--brand)", color: "var(--brand-ink, #fff)", boxShadow: "var(--shadow-lg)" }}
      >
        {open ? (
          <>
            <span className="text-base leading-none">✕</span>
            <span>Close</span>
          </>
        ) : (
          <>
            <span className="text-base leading-none">✦</span>
            <span>Ask RAAHI</span>
          </>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-[60] flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", color: "var(--text)" }}
        >
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-lg" style={{ color: "var(--brand)" }}>✦</span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">RAAHI Insight</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Answers from live Aurora data</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="max-h-[46vh] min-h-[80px] space-y-3 overflow-y-auto px-4 py-3">
            {msgs.length === 0 && (
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                Ask about the road around you, your route, or where the danger is. Every answer is grounded in real reports.
              </p>
            )}
            {msgs.map((m, i) => (
              <div key={i} className="space-y-1.5">
                <div className="ml-auto w-fit max-w-[85%] rounded-xl px-3 py-1.5 text-[13px]" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
                  {m.q}
                </div>
                <div className="w-fit max-w-[90%] rounded-xl px-3 py-2 text-[13px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  {m.a}
                  {m.confidence && <div className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>✓ {m.confidence}</div>}
                  {m.action && ACTION_LABEL[m.action] && (
                    <button
                      onClick={() => { onAction?.(m.action ?? null); if (m.highlight) onHighlight?.(m.highlight); }}
                      className="mt-2 block w-full rounded-lg px-2 py-1.5 text-[12px] font-semibold"
                      style={{ background: "var(--brand)", color: "var(--brand-ink, #fff)" }}
                    >
                      {ACTION_LABEL[m.action]}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {chips.map((c) => (
              <button
                key={c.intent}
                disabled={busy}
                onClick={() => ask(c.intent, c.label)}
                className="rounded-full px-3 py-1 text-[12px] font-medium transition active:scale-95 disabled:opacity-50"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Free text */}
          <form onSubmit={submitText} className="flex items-center gap-2 px-3 pb-3 pt-1">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask anything about the road…"
              className="flex-1 rounded-lg px-3 py-2 text-[13px] outline-none"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <button type="submit" disabled={busy} className="rounded-lg px-3 py-2 text-[13px] font-semibold disabled:opacity-50" style={{ background: "var(--brand)", color: "var(--brand-ink, #fff)" }}>
              Ask
            </button>
          </form>
        </div>
      )}
    </>
  );
}
