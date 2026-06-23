import HazardMap from "@/components/HazardMap";
import AuthStatus from "@/components/AuthStatus";
import ThemeToggle from "@/components/ThemeToggle";
import { ShieldMark } from "@/components/Brand";
import { SeverityDot } from "@/components/ui";

export default function HomeMapPage() {
  return (
    <div className="relative h-screen w-full">
      <HazardMap />

      {/* top overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
        <div
          className="pointer-events-auto flex items-center gap-2 rounded-full border px-3 py-1.5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow)",
          }}
        >
          <ShieldMark size={22} />
          <span className="font-display text-sm font-extrabold">RAAHI</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeToggle compact />
          <AuthStatus />
        </div>
      </div>

      {/* legend */}
      <div
        className="absolute bottom-28 left-3 z-10 rounded-xl border p-3 text-xs"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          className="mb-2 font-semibold uppercase tracking-wide"
          style={{ color: "var(--text-faint)" }}
        >
          Severity
        </div>
        <div className="flex items-center gap-2">
          <SeverityDot s="high" /> High
        </div>
        <div className="mt-1 flex items-center gap-2">
          <SeverityDot s="medium" /> Medium
        </div>
        <div className="mt-1 flex items-center gap-2">
          <SeverityDot s="low" /> Low
        </div>
      </div>
    </div>
  );
}
