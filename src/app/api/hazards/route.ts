import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

const ALLOWED_TYPES = ["pothole", "debris", "construction"];
const ALLOWED_SEVERITY = ["low", "medium", "high"];

// GET /api/hazards
//   ?lat=&lng=&radius=  -> active hazards within `radius` meters of that point
//   (no params)         -> the 200 most recent hazards
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const radiusParam = searchParams.get("radius");

  const lat = Number(latParam);
  const lng = Number(lngParam);
  const radius = Number(radiusParam);

  // Only treat it as an "area" query if all three params are actually present
  // (Number(null) is 0, which would otherwise fake a valid 0,0 / 0m query).
  const hasArea =
    latParam !== null &&
    lngParam !== null &&
    radiusParam !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Number.isFinite(radius);

  try {
    const result = hasArea
      ? await db.query(
          `select id, type, severity, status, photo_url, report_count, last_reported_at, created_at,
                  ST_Y(location::geometry) as lat,
                  ST_X(location::geometry) as lng,
                  ST_Distance(
                    location,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                  ) as distance_m
           from hazards
           where status = 'active'
             and ST_DWithin(
                   location,
                   ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                   $3
                 )
           order by distance_m
           limit 2000`,
          [lng, lat, Math.min(radius, 30000)]
        )
      : await db.query(
          `select id, type, severity, status, photo_url, report_count, last_reported_at, created_at,
                  ST_Y(location::geometry) as lat,
                  ST_X(location::geometry) as lng
           from hazards
           where status = 'active'
           order by created_at desc
           limit 5000`
        );

    return NextResponse.json({ count: result.rowCount, hazards: result.rows });
  } catch (err) {
    console.error("GET /api/hazards failed:", err);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}

// POST /api/hazards  -> create a new hazard report
// Body: { type, severity, lat, lng }
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: "Please log in to report a hazard" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, severity, lat, lng, photo_url } = body ?? {};

    // Validate everything before it touches the database.
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!ALLOWED_SEVERITY.includes(severity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    const photo = typeof photo_url === "string" ? photo_url : null;

    // De-duplicate: if an active hazard of the SAME type is already within ~15m,
    // count this as another confirmation instead of creating a duplicate dot.
    const dup = await db.query(
      `select id from hazards
       where type = $1 and status = 'active'
         and created_at >= now() - interval '7 days'
         and ST_DWithin(
               location,
               ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
               15
             )
       order by ST_Distance(
                  location,
                  ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
                )
       limit 1`,
      [type, lng, lat]
    );

    if (dup.rows.length > 0) {
      const bumped = await db.query(
        `update hazards set report_count = report_count + 1,
                            last_reported_at = now()
         where id = $1
         returning id, type, severity, status, photo_url, report_count, last_reported_at, created_at,
                   ST_Y(location::geometry) as lat,
                   ST_X(location::geometry) as lng`,
        [dup.rows[0].id]
      );
      return NextResponse.json(
        { duplicate: true, hazard: bumped.rows[0] },
        { status: 200 }
      );
    }

    const result = await db.query(
      `insert into hazards (type, severity, photo_url, location, reporter_id)
       values ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6)
       returning id, type, severity, status, photo_url, report_count, last_reported_at, created_at,
                 ST_Y(location::geometry) as lat,
                 ST_X(location::geometry) as lng`,
      [type, severity, photo, lng, lat, session.uid]
    );

    return NextResponse.json(
      { duplicate: false, hazard: result.rows[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/hazards failed:", err);
    return NextResponse.json(
      { error: "Failed to create hazard" },
      { status: 500 }
    );
  }
}
