import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { areaName } from "@/lib/geo";

/**
 * RAAHI Insight — a database-grounded decision assistant.
 *
 * Every answer is built from REAL PostGIS queries against Amazon Aurora.
 * The optional LLM step only *rephrases* the facts we already pulled — it is
 * never the source of truth, so it cannot invent a hazard that isn't there.
 * If no LLM key is configured, a deterministic template is used instead.
 */

type Intent = "status_ahead" | "route_clear" | "recent" | "hotspots" | "report_help";

const SEV_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function nearestLabel(type: string, sev: string, metres: number) {
  const t = type === "construction" ? "construction zone" : type;
  return `${sev} ${t} ${Math.round(metres)}m away`;
}

// Rephrase facts with an LLM (Haiku/OpenAI) under strict grounding. Returns
// null on any failure so the caller falls back to the template.
async function phrase(facts: string): Promise<string | null> {
  const sys =
    "You are RAAHI Insight, a road-safety data assistant for drivers in India. " +
    "Rewrite the FACTS into ONE or TWO terse, calm sentences (max ~30 words total), " +
    "ending with a clear next action. Use ONLY the facts given — never invent hazards, " +
    "numbers, places, or reassurance. No greetings, no markdown, no emojis.";
  const anth = process.env.ANTHROPIC_API_KEY;
  const oai = process.env.OPENAI_API_KEY;
  try {
    if (anth) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anth,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 120,
          system: sys,
          messages: [{ role: "user", content: `FACTS:\n${facts}` }],
        }),
        signal: AbortSignal.timeout(4500),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d?.content?.[0]?.text;
        if (t) return String(t).trim();
      }
    } else if (oai) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${oai}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 120,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: `FACTS:\n${facts}` },
          ],
        }),
        signal: AbortSignal.timeout(4500),
      });
      if (r.ok) {
        const d = await r.json();
        const t = d?.choices?.[0]?.message?.content;
        if (t) return String(t).trim();
      }
    }
  } catch {
    /* fall through to template */
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const intent: Intent = body?.intent ?? "status_ahead";
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);
    const radius = Number.isFinite(body?.radius) ? Number(body.radius) : 1000;
    const hasGps = Number.isFinite(lat) && Number.isFinite(lng);

    let facts = "";
    let template = "";
    let highlight: { lat: number; lng: number; label: string } | null = null;
    let confidence: string | null = null;

    if (intent === "report_help") {
      // Instructional — no DB needed.
      template =
        "To report a hazard: tap the + Report button, drop the pin on the spot, " +
        "pick the type and severity, add a photo, and submit. It appears for nearby drivers instantly.";
      facts = "User asked how to report a hazard. Steps: tap + Report, drop pin, pick type and severity, add a photo, submit; it goes live for nearby drivers immediately.";
      const answer = (await phrase(facts)) ?? template;
      return NextResponse.json({ intent, answer, highlight: null, action: "open_report", facts: { kind: "help" } });
    }

    if (intent === "hotspots") {
      const { rows } = await db.query(
        `with c as (
           select severity, location,
             ST_ClusterDBSCAN(location::geometry, eps := 0.003, minpoints := 2) over () as cid
           from hazards where status='active'
         )
         select count(*)::int as count,
                ST_Y(ST_Centroid(ST_Collect(location::geometry))) as lat,
                ST_X(ST_Centroid(ST_Collect(location::geometry))) as lng,
                sum(case severity when 'high' then 3 when 'medium' then 2 else 1 end)::int as score
         from c where cid is not null
         group by cid order by score desc limit 3`
      );
      if (rows.length === 0) {
        template = "No active hazard clusters right now. The map is clear across Ahmedabad.";
        facts = "No active hazard hotspots detected.";
      } else {
        const named = await Promise.all(
          rows.map(async (h) => ({ ...h, name: (await areaName(h.lat, h.lng)) ?? "an unnamed zone" }))
        );
        highlight = { lat: named[0].lat, lng: named[0].lng, label: named[0].name };
        const list = named.map((h, i) => `${i + 1}. ${h.name} (${h.count} hazards)`).join("; ");
        facts = `Top hazard hotspots right now: ${list}. Most dangerous: ${named[0].name}.`;
        template = `Top danger zones now: ${list}. Want the heatmap for ${named[0].name}?`;
      }
      const answer = (await phrase(facts)) ?? template;
      return NextResponse.json({ intent, answer, highlight, action: "show_heatmap", facts: { hotspots: rows.length } });
    }

    if (intent === "recent") {
      const [byType, total] = await Promise.all([
        db.query(
          `select type, count(*)::int as c from hazards
           where status='active' and created_at >= now() - interval '48 hours'
           group by type order by c desc`
        ),
        db.query(
          `select count(*)::int as c from hazards
           where status='active' and created_at >= now() - interval '48 hours'`
        ),
      ]);
      const n = total.rows[0]?.c ?? 0;
      if (n === 0) {
        template = "No new hazards reported in the last 48 hours.";
        facts = "Zero hazards reported in the last 48 hours.";
      } else {
        const top = byType.rows[0];
        const list = byType.rows.map((r) => `${r.c} ${r.type}`).join(", ");
        facts = `In the last 48 hours: ${n} new hazards (${list}). Most common: ${top.type}.`;
        template = `Last 48h: ${n} new hazards — ${list}. Open the live feed?`;
      }
      const answer = (await phrase(facts)) ?? template;
      return NextResponse.json({ intent, answer, highlight: null, action: "open_feed", facts: { count: n } });
    }

    if (intent === "route_clear") {
      const route: [number, number][] = Array.isArray(body?.route) ? body.route : [];
      if (route.length < 2) {
        return NextResponse.json({
          intent,
          answer: "Start navigation to a destination and I'll check your route for hazards.",
          highlight: null,
          action: "open_drive",
          facts: { kind: "no_route" },
        });
      }
      const wkt = `LINESTRING(${route.map(([lo, la]) => `${lo} ${la}`).join(", ")})`;
      const { rows } = await db.query(
        `select type, severity,
                ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
         from hazards
         where status='active' and ST_DWithin(location, ST_GeogFromText($1), 80)
         order by case severity when 'high' then 3 when 'medium' then 2 else 1 end desc`,
        [wkt]
      );
      if (rows.length === 0) {
        facts = "The selected route is clear — zero hazards within 80 metres of the path.";
        template = "Your route is clear — no hazards on the path. Safe to drive.";
      } else {
        const worst = rows[0];
        highlight = { lat: worst.lat, lng: worst.lng, label: `${worst.severity} ${worst.type}` };
        facts = `Route has ${rows.length} hazard(s) on it; worst is a ${worst.severity} ${worst.type}.`;
        template = `${rows.length} hazard(s) on your route — worst is a ${worst.severity} ${worst.type}. Want a safer route?`;
      }
      const answer = (await phrase(facts)) ?? template;
      return NextResponse.json({ intent, answer, highlight, action: rows.length ? "reroute" : null, facts: { onRoute: rows.length } });
    }

    // default: status_ahead (proximity)
    if (!hasGps) {
      return NextResponse.json({
        intent: "status_ahead",
        answer: "I need your location to check the road around you — enable GPS and ask again.",
        highlight: null,
        action: "enable_gps",
        facts: { kind: "no_gps" },
      });
    }
    const { rows } = await db.query(
      `select type, severity, coalesce(report_count,1)::int as report_count,
              ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng,
              ST_Distance(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) as dist
       from hazards
       where status='active'
         and ST_DWithin(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)
       order by dist limit 10`,
      [lng, lat, radius]
    );
    if (rows.length === 0) {
      facts = `No active hazards within ${radius} metres of the driver.`;
      template = `Clear — no hazards within ${radius} m of you. Drive safe.`;
    } else {
      const nearest = rows[0];
      const high = rows.filter((r) => r.severity === "high").length;
      highlight = { lat: nearest.lat, lng: nearest.lng, label: nearestLabel(nearest.type, nearest.severity, nearest.dist) };
      confidence = nearest.report_count > 1 ? `confirmed by ${nearest.report_count} reports` : "1 report";
      facts =
        `${rows.length} hazard(s) within ${radius} m of the driver` +
        (high ? `, ${high} high-severity` : "") +
        `. Nearest: a ${nearest.severity} ${nearest.type} ${Math.round(nearest.dist)} m ahead, ${confidence}.`;
      template =
        `${rows.length} hazard(s) within ${radius} m — nearest is a ${nearest.severity} ${nearest.type} ` +
        `${Math.round(nearest.dist)} m ahead (${confidence}). Reroute around it?`;
    }
    const answer = (await phrase(facts)) ?? template;
    return NextResponse.json({
      intent: "status_ahead",
      answer,
      highlight,
      action: rows.length ? "reroute" : null,
      confidence,
      facts: { count: rows.length },
    });
  } catch (err) {
    console.error("insight failed:", err);
    return NextResponse.json({ error: "Insight is unavailable right now." }, { status: 500 });
  }
}
