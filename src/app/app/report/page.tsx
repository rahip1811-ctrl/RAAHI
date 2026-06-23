"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, SeverityDot, sevVar, sevSoft } from "@/components/ui";
import { IconCamera, IconCheck, IconCrosshair, IconX, IconArrowRight } from "@/components/icons";

type HazardType = "pothole" | "debris" | "construction";

const TYPES: { id: HazardType; label: string; desc: string }[] = [
  { id: "pothole", label: "Pothole", desc: "A hole or broken patch in the road" },
  { id: "debris", label: "Debris", desc: "Rocks, rubble or objects on the road" },
  { id: "construction", label: "Construction", desc: "Roadworks, digging or barriers" },
];

const SEVERITIES: { id: "low" | "medium" | "high"; label: string; desc: string }[] = [
  { id: "low", label: "Low", desc: "Minor — easy to avoid" },
  { id: "medium", label: "Medium", desc: "Noticeable — slow down" },
  { id: "high", label: "High", desc: "Dangerous — could damage a vehicle" },
];

async function shrink(file: File): Promise<Blob> {
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const max = 1280;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return await new Promise((res) =>
    canvas.toBlob((b) => res(b!), "image/jpeg", 0.82)
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<HazardType | null>(null);
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "ok" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function locate() {
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoState("ok");
      },
      () => setGeoState("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    if (step === 3 && !coords && geoState === "idle") locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const blob = await shrink(file);
      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPhoto(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!type || !severity || !coords) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/hazards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, severity, lat: coords.lat, lng: coords.lng, photo_url: photo }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>
          <IconCheck size={42} strokeWidth={2.4} />
        </div>
        <h1 className="font-display mt-5 text-2xl font-extrabold">Hazard reported</h1>
        <p className="mt-2 max-w-xs text-sm" style={{ color: "var(--text-muted)" }}>
          Thank you — you just made the road safer for every driver behind you.
        </p>
        <div className="mt-7 flex gap-3">
          <Button onClick={() => router.push("/app")}>Back to map</Button>
          <Button
            variant="outline"
            onClick={() => {
              setStep(1); setType(null); setSeverity(null); setPhoto(null); setDone(false);
            }}
          >
            Report another
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-28 pt-5" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="flex items-center justify-between">
        <Link href="/app" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          ← Cancel
        </Link>
        <span className="text-sm font-semibold" style={{ color: "var(--text-faint)" }}>
          Step {step} of 4
        </span>
      </header>

      {/* progress */}
      <div className="mt-3 flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-1.5 flex-1 rounded-full" style={{ background: n <= step ? "var(--brand)" : "var(--surface-3)" }} />
        ))}
      </div>

      {step === 1 && (
        <Step title="What did you spot?" subtitle="Pick the kind of hazard.">
          {TYPES.map((t) => (
            <SelectRow key={t.id} active={type === t.id} onClick={() => setType(t.id)} title={t.label} desc={t.desc} />
          ))}
        </Step>
      )}

      {step === 2 && (
        <Step title="How serious is it?" subtitle="This sets the warning urgency.">
          {SEVERITIES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSeverity(s.id)}
              className="btn-press flex w-full items-center gap-3 rounded-2xl border p-4 text-left"
              style={{
                borderColor: severity === s.id ? sevVar(s.id) : "var(--border)",
                background: severity === s.id ? sevSoft(s.id) : "var(--surface)",
              }}
            >
              <SeverityDot s={s.id} size={16} />
              <div>
                <div className="font-semibold">{s.label}</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>{s.desc}</div>
              </div>
            </button>
          ))}
        </Step>
      )}

      {step === 3 && (
        <Step title="Add a photo & confirm spot" subtitle="A photo helps others trust the report.">
          <label className="btn-press flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed p-5 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
            {uploading ? "Uploading…" : photo ? "Change photo" : (<><IconCamera size={18} /> Take or upload photo</>)}
          </label>
          {photo && (
            <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="hazard" className="h-44 w-full object-cover" />
              <button onClick={() => setPhoto(null)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white">
                <IconX size={16} />
              </button>
            </div>
          )}
          <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <IconCrosshair size={18} />
              Location
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {geoState === "locating" && "Finding your location…"}
              {geoState === "ok" && coords && `Locked: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
              {geoState === "error" && "Couldn't get GPS. Tap to retry."}
              {geoState === "idle" && "Tap to use your current location."}
            </p>
            {geoState !== "ok" && (
              <Button variant="outline" size="sm" className="mt-3" onClick={locate}>
                Use my location
              </Button>
            )}
          </div>
        </Step>
      )}

      {step === 4 && (
        <Step title="Review & submit" subtitle="Quick check before it goes live.">
          <ReviewRow label="Type" value={type ? TYPES.find((t) => t.id === type)!.label : "—"} />
          <ReviewRow label="Severity" value={severity ? severity[0].toUpperCase() + severity.slice(1) : "—"} />
          <ReviewRow label="Photo" value={photo ? "Added" : "None"} />
          <ReviewRow label="Location" value={coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Not set"} />
        </Step>
      )}

      {error && <p className="mt-4 text-sm font-medium" style={{ color: "var(--danger)" }}>{error}</p>}

      {/* footer nav */}
      <div className="mt-7 flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
        )}
        {step < 4 ? (
          <Button
            full
            disabled={(step === 1 && !type) || (step === 2 && !severity) || (step === 3 && !coords)}
            onClick={() => setStep(step + 1)}
          >
            Continue <IconArrowRight size={18} />
          </Button>
        ) : (
          <Button full disabled={busy || !coords} onClick={submit}>
            {busy ? "Submitting…" : "Submit report"}
          </Button>
        )}
      </div>
    </main>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h1 className="font-display text-2xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function SelectRow({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className="btn-press flex w-full items-center justify-between rounded-2xl border p-4 text-left"
      style={{
        borderColor: active ? "var(--brand)" : "var(--border)",
        background: active ? "var(--brand-soft)" : "var(--surface)",
      }}
    >
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>{desc}</div>
      </div>
      {active && <IconCheck size={20} />}
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
