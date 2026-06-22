import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

// POST /api/upload  -> stores an image in Vercel Blob, returns its public URL.
// The image arrives as form-data (already shrunk in the browser).
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 });
    }
    if (file.size > 5_000_000) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 });
    }

    const filename = `hazards/${crypto.randomUUID()}.jpg`;
    const blob = await put(filename, file, { access: "public" });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("POST /api/upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
