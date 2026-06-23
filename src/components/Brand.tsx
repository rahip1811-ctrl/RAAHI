import Link from "next/link";

export function ShieldMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="raahiG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brand-2)" />
          <stop offset="1" stopColor="var(--brand-strong)" />
        </linearGradient>
      </defs>
      <path
        d="M20 3 6 8v9c0 8.4 5.7 16.2 14 19 8.3-2.8 14-10.6 14-19V8L20 3Z"
        fill="url(#raahiG)"
      />
      <path
        d="M20 12a4.4 4.4 0 0 0-4.4 4.4c0 3.3 4.4 7.6 4.4 7.6s4.4-4.3 4.4-7.6A4.4 4.4 0 0 0 20 12Z"
        fill="#fff"
      />
      <circle cx="20" cy="16.4" r="1.7" fill="var(--brand-strong)" />
    </svg>
  );
}

export function Wordmark({
  className = "",
  withDeva = false,
}: {
  className?: string;
  withDeva?: boolean;
}) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-display text-xl font-extrabold tracking-tight">
        RAAHI
      </span>
      {withDeva && (
        <span className="font-deva text-sm" style={{ color: "var(--text-muted)" }}>
          राही
        </span>
      )}
    </span>
  );
}

export default function Brand({
  href = "/",
  size = 32,
  withDeva = false,
}: {
  href?: string;
  size?: number;
  withDeva?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <ShieldMark size={size} />
      <Wordmark withDeva={withDeva} />
    </Link>
  );
}
