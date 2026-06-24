import HazardMap from "@/components/HazardMap";
import AuthStatus from "@/components/AuthStatus";
import ThemeToggle from "@/components/ThemeToggle";
import { ShieldMark } from "@/components/Brand";
import DriverPanels from "@/components/DriverPanels";

export default function HomeMapPage() {
  return (
    <div className="relative h-screen w-full">
      <HazardMap />

      {/* top overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}>
          <ShieldMark size={22} />
          <span className="font-display text-sm font-extrabold">RAAHI</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <ThemeToggle compact />
          <AuthStatus />
        </div>
      </div>

      <DriverPanels />
    </div>
  );
}
