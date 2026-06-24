// Representative stock photos per hazard type — used only as a visual fallback
// when a report has no real uploaded photo. Real photo_url always takes priority.
const IMAGES: Record<string, string> = {
  pothole: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
  construction: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=600&q=80",
  debris: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80",
};

export function hazardFallbackImage(type: string): string {
  return IMAGES[(type || "").toLowerCase()] ?? IMAGES.pothole;
}

// The image to show: the real uploaded photo if present, else a representative one.
export function hazardImage(photoUrl: string | null | undefined, type: string): string {
  return photoUrl || hazardFallbackImage(type);
}
