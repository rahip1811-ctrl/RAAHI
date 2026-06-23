"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconX,
  IconVoice,
  IconCrosshair,
  IconLayers,
  IconThumbUp,
  IconThumbDown,
  IconNav,
} from "@/components/icons";

export default function DrivePage() {
  const router = useRouter();
  const [voice, setVoice] = useState(true);

  return (
    <main className="relative h-screen w-full overflow-hidden" style={{ background: "#070b12", color: "#f2f6fc" }}>
      {/* ── 3D road scene ── */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 400 720" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0c1424" />
              <stop offset="1" stopColor="#070b12" />
            </linearGradient>
            <linearGradient id="route" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#4d82ff" />
              <stop offset="1" stopColor="#7aa6ff" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="400" height="720" fill="url(#sky)" />
          {/* ground grid (perspective) */}
          {[...Array(9)].map((_, i) => {
            const y = 300 + i * (i * 5 + 18);
            return <line key={i} x1="0" x2="400" y1={y} y2={y} stroke="#16233a" strokeWidth="1" />;
          })}
          {/* road trapezoid */}
          <path d="M170 300 L230 300 L360 720 L40 720 Z" fill="#10182a" />
          {/* route line */}
          <path d="M200 300 L200 720" stroke="url(#route)" strokeWidth="30" strokeLinecap="round" opacity="0.5" />
          <path d="M200 300 L200 720" stroke="#9bbcff" strokeWidth="6" strokeDasharray="2 16" opacity="0.8" />

          {/* hazard ahead with proximity rings */}
          <g transform="translate(200 360)">
            {[0, 0.6, 1.2].map((d, i) => (
              <circle key={i} r="60" fill="none" stroke="#ff5151" strokeWidth="2" style={{ transformOrigin: "center", animation: `radar 2.4s ${d}s ease-out infinite` }} />
            ))}
            <circle r="16" fill="#ff5151" />
            <path d="M0 -7 L6 5 L-6 5 Z" fill="#fff" />
          </g>

          {/* your position arrow */}
          <g transform="translate(200 600)">
            <circle r="22" fill="#4d82ff" opacity="0.25" />
            <circle r="13" fill="#fff" />
            <path d="M0 -8 L7 7 L0 3 L-7 7 Z" fill="#2f6bff" />
          </g>
        </svg>
      </div>

      {/* ── top: exit + alert banner ── */}
      <div className="absolute inset-x-0 top-0 p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/app")}
            className="btn-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(18,24,38,0.9)", color: "#f2f6fc", backdropFilter: "blur(8px)" }}
            aria-label="Exit drive mode"
          >
            <IconX size={20} />
          </button>

          <div
            className="flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3"
            style={{ background: "rgba(20,12,12,0.92)", borderColor: "rgba(255,81,81,0.4)", backdropFilter: "blur(8px)" }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(255,81,81,0.16)", color: "#ff5151" }}>
              <IconVoice size={22} />
            </span>
            <div className="min-w-0">
              <div className="font-semibold">Pothole ahead · 120 m</div>
              <div className="text-xs" style={{ color: "#98a2b4" }}>High severity · stay slightly left</div>
            </div>
            {/* waveform */}
            <div className="ml-auto flex items-end gap-0.5">
              {[6, 12, 8, 16, 10, 14, 7].map((h, i) => (
                <span key={i} className="w-0.5 rounded-full" style={{ height: h, background: "#ff5151", opacity: 0.8 }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── right controls + speed ── */}
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2.5">
        {[
          { icon: <IconNav size={20} />, label: "Recenter" },
          { icon: voice ? <IconVoice size={20} /> : <IconVoice size={20} />, label: "Voice" },
          { icon: <IconLayers size={20} />, label: "Layers" },
          { icon: <IconCrosshair size={20} />, label: "Locate" },
        ].map((c, i) => (
          <button
            key={i}
            onClick={() => i === 1 && setVoice((v) => !v)}
            className="btn-press flex h-11 w-11 items-center justify-center rounded-full"
            style={{
              background: "rgba(18,24,38,0.9)",
              color: i === 1 && voice ? "#18d28c" : "#f2f6fc",
              backdropFilter: "blur(8px)",
            }}
            aria-label={c.label}
          >
            {c.icon}
          </button>
        ))}
      </div>

      <div className="absolute bottom-44 left-4 flex flex-col items-center rounded-full px-4 py-2.5" style={{ background: "rgba(18,24,38,0.9)", backdropFilter: "blur(8px)" }}>
        <span className="font-display text-2xl font-extrabold leading-none">42</span>
        <span className="text-[0.6rem]" style={{ color: "#98a2b4" }}>km/h</span>
      </div>

      {/* ── bottom hazard sheet ── */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t p-5"
        style={{ background: "rgba(18,24,38,0.96)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-extrabold" style={{ background: "rgba(255,81,81,0.16)", color: "#ff5151" }}>
            P
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Pothole detected</span>
              <span className="r-chip" style={{ color: "#ff5151", background: "rgba(255,81,81,0.16)" }}>High risk</span>
            </div>
            <div className="text-xs" style={{ color: "#98a2b4" }}>120 m ahead · confirmed by drivers nearby</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-press flex items-center justify-center gap-2 rounded-xl py-3 font-semibold" style={{ background: "#18d28c", color: "#04130d" }}>
            <IconThumbUp size={18} /> Fixed
          </button>
          <button className="btn-press flex items-center justify-center gap-2 rounded-xl py-3 font-semibold" style={{ background: "rgba(255,81,81,0.16)", color: "#ff5151" }}>
            <IconThumbDown size={18} /> Still there
          </button>
        </div>
      </div>
    </main>
  );
}
