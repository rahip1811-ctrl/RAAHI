import DashHeader from "@/components/DashHeader";
import DashboardMap from "@/components/DashboardMap";

export default function DashMapPage() {
  return (
    <main className="flex h-screen flex-col px-6 py-7 lg:px-8">
      <DashHeader title="City hazard map" subtitle="Live density heatmap across Ahmedabad." />
      <div className="flex-1 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
        <DashboardMap />
      </div>
    </main>
  );
}
