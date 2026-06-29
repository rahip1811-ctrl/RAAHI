import { NextResponse } from "next/server";

// Same-origin map-tile proxy. The browser requests /api/maptile?z=&x=&y= from
// our own domain (which the user's network allows), and Vercel's servers fetch
// the actual tile from Carto. This sidesteps networks that block foreign tile
// CDNs (cartocdn.com / openstreetmap.org / olamaps.io) on the client side.
const SUBDOMAINS = ["a", "b", "c"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const z = searchParams.get("z");
  const x = searchParams.get("x");
  const y = searchParams.get("y");
  if (z === null || x === null || y === null || !/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return new NextResponse("bad tile request", { status: 400 });
  }

  const s = SUBDOMAINS[(Number(x) + Number(y)) % SUBDOMAINS.length];
  const upstream = `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;

  try {
    const r = await fetch(upstream, {
      headers: { "User-Agent": "RAAHI/1.0 (+https://raahi-virid.vercel.app)" },
    });
    if (!r.ok) return new NextResponse(null, { status: r.status });
    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "image/png",
        // Cache hard — tiles are immutable, this keeps the proxy cheap.
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
