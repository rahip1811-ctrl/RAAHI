"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Forgot-password modal (cosmetic — looks real, sends nothing for now)
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
      router.push("/map");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Back
        </Link>

        <div className="mt-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-amber-400">
            Raahi
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {mode === "login"
              ? "Welcome back — log in to continue"
              : "Create an account to start reporting"}
          </p>
        </div>

        {/* Continue with Google */}
        <a
          href="/api/auth/google"
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-2.5 font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
          <div className="h-px flex-1 bg-zinc-800" />
          or
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
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
                className="text-xs text-amber-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            disabled={busy}
            className="w-full rounded-lg bg-amber-400 px-4 py-2.5 font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-400">
          {mode === "login" ? "New to Raahi? " : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="font-semibold text-amber-400 hover:underline"
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>

      {/* Forgot-password modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            {!forgotSent ? (
              <>
                <h2 className="text-lg font-semibold">Reset your password</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Email address"
                  className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setForgotSent(true)}
                    className="flex-1 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-amber-300"
                  >
                    Send reset link
                  </button>
                  <button
                    onClick={() => setShowForgot(false)}
                    className="rounded-lg px-4 py-2 font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-3xl">📧</div>
                <h2 className="mt-2 text-lg font-semibold">Check your inbox</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  If an account exists for{" "}
                  <span className="text-zinc-200">{forgotEmail}</span>, a
                  password reset link is on its way.
                </p>
                <button
                  onClick={() => setShowForgot(false)}
                  className="mt-5 w-full rounded-lg bg-zinc-800 px-4 py-2 font-semibold hover:bg-zinc-700"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
