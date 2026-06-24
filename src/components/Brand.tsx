import Link from "next/link";

export function ShieldMark({ size = 32 }: { size?: number }) {
  const id = "raahiG";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="var(--brand-2)" />
          <stop offset="1" stopColor="var(--brand-strong)" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* shield */}
      <path d="M20 2.5 5.5 7.5v9.2c0 8.9 6 17.1 14.5 19.8 8.5-2.7 14.5-10.9 14.5-19.8V7.5L20 2.5Z" fill={`url(#${id})`} />
      {/* gloss highlight */}
      <path d="M20 2.5 5.5 7.5v9.2c0 3 .7 5.9 1.9 8.5C9.5 15.8 14.2 10 20 10s10.5 5.8 12.6 15.2c1.2-2.6 1.9-5.5 1.9-8.5V7.5L20 2.5Z" fill={`url(#${id}-gloss)`} />
      {/* location pin */}
      <path d="M20 11.4a4.7 4.7 0 0 0-4.7 4.7c0 3.5 4.7 8.1 4.7 8.1s4.7-4.6 4.7-8.1A4.7 4.7 0 0 0 20 11.4Z" fill="#fff" />
      <circle cx="20" cy="16.1" r="1.9" fill="var(--brand-strong)" />
      {/* sparkle accent */}
      <path d="M30 9.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-extrabold tracking-tight ${className}`}>
      RAAHI
    </span>
  );
}

export default function Brand({
  href = "/",
  size = 32,
}: {
  href?: string;
  size?: number;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <ShieldMark size={size} />
      <Wordmark />
    </Link>
  );
}
