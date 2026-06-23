"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldMark } from "@/components/Brand";
import { Button } from "@/components/ui";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition";
const inputStyle = {
  borderColor: "var(--border)",
  background: "var(--surface-2)",
  color: "var(--text)",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login" ? { email, password } : { name, email, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="map-grid pointer-events-none absolute inset-0 opacity-40" />

      <div
        className="relative w-full max-w-sm rounded-3xl border p-7"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <Link
          href="/"
          className="text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back
        </Link>

        <div className="mt-5 flex flex-col items-center text-center">
          <ShieldMark size={46} />
          <h1 className="font-display mt-3 text-2xl font-extrabold">
            {mode === "login" ? "Welcome back" : "Join RAAHI"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {mode === "login"
              ? "Log in to see the road ahead"
              : "Create an account to start reporting"}
          </p>
        </div>

        <a
          href="/api/auth/google"
          className="btn-press mt-6 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--surface-3)", color: "var(--text)" }}
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <div
          className="my-5 flex items-center gap-3 text-xs"
          style={{ color: "var(--text-faint)" }}
        >
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          or
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className={inputClass}
              style={inputStyle}
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className={inputClass}
            style={inputStyle}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={inputClass}
            style={inputStyle}
          />

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSent(false);
                  setShowForgot(true);
                }}
                className="text-xs font-semibold"
                style={{ color: "var(--brand-strong)" }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <Button type="submit" full size="lg" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {mode === "login" ? "New to RAAHI? " : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="font-semibold"
            style={{ color: "var(--brand-strong)" }}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div
            className="w-full max-w-sm rounded-2xl border p-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {!forgotSent ? (
              <>
                <h2 className="font-display text-lg font-bold">Reset your password</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  Enter your email and we’ll send you a reset link.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email address"
                  className={`mt-4 ${inputClass}`}
                  style={inputStyle}
                />
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => setForgotSent(true)} full>
                    Send reset link
                  </Button>
                  <Button variant="ghost" onClick={() => setShowForgot(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </div>
                <h2 className="font-display mt-3 text-lg font-bold">Check your inbox</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  If an account exists for{" "}
                  <span style={{ color: "var(--text)" }}>{forgotEmail}</span>, a reset
                  link is on its way.
                </p>
                <Button variant="outline" full className="mt-5" onClick={() => setShowForgot(false)}>
                  Got it
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
