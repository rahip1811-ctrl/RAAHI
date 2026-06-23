import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <Sidebar />
      <div className="thin-scroll min-w-0 flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
