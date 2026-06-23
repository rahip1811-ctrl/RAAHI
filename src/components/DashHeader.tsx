import ThemeToggle from "@/components/ThemeToggle";

export default function DashHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      <ThemeToggle />
    </header>
  );
}
