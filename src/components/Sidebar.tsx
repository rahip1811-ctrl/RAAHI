"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldMark } from "@/components/Brand";
import {
  IconHome, IconFeed, IconMap, IconChart, IconAlert, IconSettings,
  IconLayers, IconUsers, IconHelp, IconTrend,
} from "@/components/icons";

const items = [
  { href: "/dashboard", label: "Overview", Icon: IconHome },
  { href: "/dashboard/feed", label: "Live Feed", Icon: IconFeed },
  { href: "/dashboard/map", label: "Map", Icon: IconMap },
  { href: "/dashboard/analytics", label: "Analytics", Icon: IconChart },
  { href: "/dashboard/hotspots", label: "Hotspots", Icon: IconAlert },
  { href: "/dashboard/leaderboard", label: "Leadership Board", Icon: IconTrend },
  { href: "/dashboard/reports", label: "Reports", Icon: IconLayers },
  { href: "/dashboard/users", label: "Users", Icon: IconUsers },
  { href: "/dashboard/settings", label: "Settings", Icon: IconSettings },
];

export default function Sidebar() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r p-4 md:flex" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <Link href="/" className="mb-7 flex items-center gap-2.5 px-2">
        <ShieldMark size={30} />
        <div className="leading-tight">
          <div className="font-display text-base font-extrabold">RAAHI</div>
          <div className="text-[0.65rem]" style={{ color: "var(--text-faint)" }}>Command Center</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className="btn-press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
              style={{ background: active ? "var(--brand-soft)" : "transparent", color: active ? "var(--brand-strong)" : "var(--text-muted)" }}>
              <Icon size={19} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <Link href="/app" className="btn-press flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          <IconMap size={16} /> Open driver app
        </Link>
        <Link href="#" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ color: "var(--text-faint)" }}>
          <IconHelp size={15} /> Need help? View documentation
        </Link>
      </div>
    </aside>
  );
}
