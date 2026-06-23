import BottomTabBar from "@/components/BottomTabBar";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg)" }}>
      {children}
      <BottomTabBar />
    </div>
  );
}
