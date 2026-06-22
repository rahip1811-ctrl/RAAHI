import { NextResponse } from "next/server";

type Suggestion = {
  description: string;
  mainText: string;
  secondaryText: string;
  lat: number | null;
  lng: number | null;
};

interface OlaPrediction {
  description?: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
  geometry?: { location?: { lat?: number; lng?: number } };
}

interface NominatimResult {
  display_name?: string;
  lat?: string;
  lon?: string;
}

// GET /api/places?input=...&lat=&lng=
// Apartment-level autocomplete via Ola Maps; falls back to free OpenStreetMap.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = (searchParams.get("input") ?? "").trim();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (input.length < 2) return NextResponse.json({ suggestions: [] });

  const key = process.env.OLA_MAPS_API_KEY;

  // 1) Ola Maps autocomplete (rich India POI / apartment data)
  if (key) {
    try {
      const url = new URL("https://api.olamaps.io/places/v1/autocomplete");
      url.searchParams.set("input", input);
      url.searchParams.set("api_key", key);
      if (lat && lng) url.searchParams.set("location", `${lat},${lng}`);

      const res = await fetch(url.toString(), {
        headers: { "X-Request-Id": `raahi-${Date.now()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const preds: OlaPrediction[] = Array.isArray(data?.predictions)
          ? data.predictions
          : [];
        const suggestions: Suggestion[] = preds.slice(0, 6).map((p) => ({
          description: p.description ?? "",
          mainText: p.structured_formatting?.main_text ?? p.description ?? "",
          secondaryText: p.structured_formatting?.secondary_text ?? "",
          lat: p.geometry?.location?.lat ?? null,
          lng: p.geometry?.location?.lng ?? null,
        }));
        if (suggestions.length > 0) {
          return NextResponse.json({ suggestions, source: "ola" });
        }
      } else {
        console.error("Ola autocomplete HTTP", res.status);
      }
    } catch (err) {
      console.error("Ola autocomplete failed:", err);
    }
  }

  // 2) Fallback: free OpenStreetMap (Nominatim)
  try {
    const q = /ahmedabad|gujarat/i.test(input) ? input : `${input}, Ahmedabad`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=in&q=${encodeURIComponent(
        q
      )}`,
      { headers: { "User-Agent": "Raahi/1.0 (road-hazard map)" } }
    );
    const arr: NominatimResult[] = res.ok ? await res.json() : [];
    const suggestions: Suggestion[] = (Array.isArray(arr) ? arr : []).map(
      (r) => {
        const name = r.display_name ?? "";
        const comma = name.indexOf(",");
        return {
          description: name,
          mainText: comma > 0 ? name.slice(0, comma) : name,
          secondaryText: comma > 0 ? name.slice(comma + 1).trim() : "",
          lat: r.lat ? parseFloat(r.lat) : null,
          lng: r.lon ? parseFloat(r.lon) : null,
        };
      }
    );
    return NextResponse.json({ suggestions, source: "osm" });
  } catch (err) {
    console.error("Nominatim failed:", err);
    return NextResponse.json({ suggestions: [] });
  }
}
