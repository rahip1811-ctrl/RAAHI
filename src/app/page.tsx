import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white">
      <span className="mb-4 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 text-sm font-medium text-amber-300">
        🚧 Community road-hazard alerts
      </span>

      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
        <span className="text-amber-400">Raahi</span>
      </h1>
      <p className="mt-2 text-sm uppercase tracking-[0.3em] text-zinc-500">
        राही · the traveller&apos;s road companion
      </p>

      <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
        Get warned about potholes, open drains, and flooding on the road ahead —
        reported by people around you, in real time. No waiting on anyone to fix
        anything.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/map"
          className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
        >
          Open the map
        </Link>
        <Link
          href="/map"
          className="rounded-full border border-zinc-700 px-6 py-3 font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          Report a hazard
        </Link>
      </div>

      <Link
        href="/dashboard"
        className="mt-6 text-sm text-amber-400 hover:underline"
      >
        View the civic dashboard →
      </Link>

      <p className="mt-16 text-sm text-zinc-500">
        Built for safer roads in Ahmedabad and beyond.
      </p>
    </main>
  );
}
