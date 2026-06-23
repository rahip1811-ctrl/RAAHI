import Link from "next/link";
import HazardMap from "@/components/HazardMap";
import AuthStatus from "@/components/AuthStatus";

export default function MapPage() {
  return (
    <div className="relative h-screen w-full">
      <HazardMap />

      {/* Top bar */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
        <Link
          href="/"
          className="pointer-events-auto rounded-full bg-zinc-900/90 px-4 py-2 text-sm font-semibold text-white shadow"
        >
          ← Raahi
        </Link>
        <AuthStatus />
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-10 rounded-lg bg-zinc-900/90 p-3 text-xs text-white shadow">
        <div className="mb-1 font-semibold">Severity</div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" /> High
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-500" /> Medium
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" /> Low
        </div>
      </div>
    </div>
  );
}
