import * as React from "react";

/* ── severity helpers ────────────────────────────────────────── */
export type Severity = "high" | "medium" | "low";

export const sevVar = (s: string) =>
  s === "high"
    ? "var(--danger)"
    : s === "medium"
    ? "var(--caution)"
    : "var(--clear)";

export const sevSoft = (s: string) =>
  s === "high"
    ? "var(--danger-soft)"
    : s === "medium"
    ? "var(--caution-soft)"
    : "var(--clear-soft)";

export const sevLabel = (s: string) =>
  s === "high" ? "High" : s === "medium" ? "Medium" : "Low";

/* ── SeverityDot ─────────────────────────────────────────────── */
export function SeverityDot({ s, size = 10 }: { s: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: sevVar(s),
        display: "inline-block",
        flex: "none",
      }}
    />
  );
}

/* ── Chip ────────────────────────────────────────────────────── */
export function Chip({
  children,
  color = "var(--text-muted)",
  bg = "var(--surface-2)",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  className?: string;
}) {
  return (
    <span className={`r-chip ${className}`} style={{ color, background: bg }}>
      {children}
    </span>
  );
}

export function SeverityChip({ s }: { s: string }) {
  return (
    <span
      className="r-chip"
      style={{ color: sevVar(s), background: sevSoft(s) }}
    >
      <SeverityDot s={s} size={7} />
      {sevLabel(s)}
    </span>
  );
}

/* ── SectionLabel (uppercase tracking) ───────────────────────── */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[0.7rem] font-bold uppercase tracking-[0.14em]"
      style={{ color: "var(--text-faint)" }}
    >
      {children}
    </span>
  );
}

/* ── Card ────────────────────────────────────────────────────── */
export function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`r-card ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────────── */
type BtnVariant = "primary" | "outline" | "ghost" | "danger";
type BtnProps = {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  full?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const btnStyle = (v: BtnVariant): React.CSSProperties => {
  switch (v) {
    case "primary":
      return { background: "var(--brand)", color: "var(--brand-ink)" };
    case "danger":
      return { background: "var(--danger)", color: "#fff" };
    case "outline":
      return {
        background: "transparent",
        color: "var(--text)",
        border: "1px solid var(--border)",
      };
    default:
      return { background: "transparent", color: "var(--text-muted)" };
  }
};

export function Button({
  variant = "primary",
  size = "md",
  full = false,
  className = "",
  children,
  ...rest
}: BtnProps) {
  const pad =
    size === "lg"
      ? "px-6 py-3.5 text-base"
      : size === "sm"
      ? "px-3 py-1.5 text-sm"
      : "px-5 py-2.5 text-sm";
  return (
    <button
      {...rest}
      className={`btn-press inline-flex items-center justify-center gap-2 rounded-xl font-semibold disabled:opacity-60 ${pad} ${
        full ? "w-full" : ""
      } ${className}`}
      style={{ ...btnStyle(variant), ...(rest.style || {}) }}
    >
      {children}
    </button>
  );
}

/* ── StatCard ────────────────────────────────────────────────── */
export function StatCard({
  label,
  value,
  delta,
  deltaUp,
  accent = "var(--text)",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaUp?: boolean;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        {icon && <span style={{ color: accent }}>{icon}</span>}
      </div>
      <div
        className="font-display mt-1.5 text-3xl font-extrabold"
        style={{ color: accent }}
      >
        {value}
      </div>
      {delta && (
        <div
          className="mt-1 text-xs font-semibold"
          style={{ color: deltaUp ? "var(--clear)" : "var(--caution)" }}
        >
          {deltaUp ? "↑" : "↓"} {delta}
        </div>
      )}
    </Card>
  );
}
