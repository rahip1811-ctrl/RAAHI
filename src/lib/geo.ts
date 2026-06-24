// Reverse-geocode a coordinate to a human area name (Ola Maps), with an
// in-memory cache so repeated lookups are instant and we don't hammer the API.
const cache = new Map<string, string | null>();

export async function areaName(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  const apiKey = process.env.OLA_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${apiKey}`,
      { headers: { "X-Request-Id": `raahi-${Date.now()}` }, signal: AbortSignal.timeout(2500) }
    );
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = await res.json();
    const r = data?.results?.[0];
    const comp = r?.address_components?.find(
      (c: { types?: string[]; short_name?: string; long_name?: string }) =>
        c.types?.some((t) => ["sublocality", "locality", "neighborhood"].includes(t))
    );
    const name =
      comp?.long_name ??
      comp?.short_name ??
      (r?.formatted_address ? String(r.formatted_address).split(",")[0] : null);
    cache.set(key, name);
    return name;
  } catch {
    return null;
  }
}
