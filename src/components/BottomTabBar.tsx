"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconNear, IconBell, IconUser, IconPlus } from "@/components/icons";

const tabs = [
  { href: "/app", label: "Home", Icon: IconHome },
  { href: "/app/nearby", label: "Nearby", Icon: IconNear },
  { href: "/app/alerts", label: "Alerts", Icon: IconBell },
  { href: "/app/profile", label: "Profile", Icon: IconUser },
];

export default function BottomTabBar() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? path === "/app" : path.startsWith(href);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t px-2 pb-[env(safe-area-inset-bottom)] pt-2"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {tabs.slice(0, 2).map((t) => (
        <Tab key={t.href} {...t} active={isActive(t.href)} />
      ))}

      {/* center Report button */}
      <Link
        href="/app/report"
        className="btn-press -mt-7 flex h-14 w-14 flex-col items-center justify-center rounded-full"
        style={{
          background: "var(--brand)",
          color: "var(--brand-ink)",
          boxShadow: "0 8px 22px rgba(16,185,129,0.45)",
        }}
        aria-label="Report a hazard"
      >
        <IconPlus size={26} strokeWidth={2.4} />
      </Link>

      {tabs.slice(2).map((t) => (
        <Tab key={t.href} {...t} active={isActive(t.href)} />
      ))}
    </nav>
  );
}

function Tab({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex w-16 flex-col items-center gap-1 py-1 text-[0.65rem] font-semibold"
      style={{ color: active ? "var(--brand)" : "var(--text-faint)" }}
    >
      <Icon size={22} />
      {label}
    </Link>
  );
}
