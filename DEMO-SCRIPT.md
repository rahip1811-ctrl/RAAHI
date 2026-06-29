# RAAHI — Full Demo Video Script (shot-by-shot)
**Runtime target: 2:45–3:00.** Judges are AWS database engineers → the
**Amazon Aurora PostgreSQL + PostGIS engine is the hero**; the driver app is
the hook that makes it matter. Record clips silently, add voiceover after.

Legend: **[SCREEN]** = what's visible · **[DO]** = action · **[SAY]** =
voiceover (read it) · **[CAPTION]** = text overlay on screen.

---

## TITLE CARD (0:00–0:04)
**[SCREEN]** Black card, logo: **RAAHI** — "Community-sourced road safety."
**[CAPTION]** RAAHI · राही — the traveller's early-warning system

---

## SCENE 1 — THE HOOK (0:04–0:22)  ·  PHONE
**[SCREEN]** Driver app map, hazards glowing on the roads of Ahmedabad.
**[SAY]** "India loses over a lakh lives on its roads every year, and potholes
are a silent part of that. The danger is rarely a secret — someone always hit
that pothole first. The problem is they had no way to warn the driver behind
them. RAAHI is that warning."
**[CAPTION]** The road already knows where the danger is. Now drivers do too.
*(Verify the road-death figure against MoRTH before recording.)*

---

## SCENE 2 — REPORT A HAZARD (0:22–0:45)  ·  PHONE
**[DO]** Tap "Report a hazard" → drop pin → pick **Pothole** → severity
**High** → **take/upload a real photo** → Submit. Show the success toast.
**[SAY]** "Anyone can report a hazard in seconds — with a real photo, exact
GPS, and severity. The moment you submit, it's a geographic point in our
database, live for every driver around you."
**[CAPTION]** One tap = one geo-point in Amazon Aurora

---

## SCENE 3 — DRIVE MODE (0:45–1:20)  ·  PHONE  ·  *the emotional payoff*
**[DO]** Search a destination → **Start**. Show the 3D HUD tilt, blue route,
hazard markers ahead. Keep phone audio ON.
**[SAY]** "Now you're driving. RAAHI runs a live 3D heads-up display..."
**[DO]** Let the **voice warning** fire.
**[SAY (let the app's voice speak, then continue)]** "...and it speaks up
before each hazard — pothole ahead, two hundred metres. No looking at the
screen. And when the road ahead is clean..."
**[DO]** Show the **"SAFE CORRIDOR VERIFIED"** badge.
**[SAY]** "...it tells you you're clear. If a safer route exists, RAAHI has
already routed you around the danger."
**[CAPTION]** Voice warnings · 3D nav · auto hazard-avoidance

> **Bridge line (say slowly, this hands off to the tech):**
> "Every one of those warnings is a live spatial query against Amazon Aurora.
> Here's the engine."

---

## SCENE 4 — PROOF IT'S AURORA + POSTGIS (1:20–1:38)  ·  LAPTOP (pgAdmin)
**[SCREEN]** pgAdmin, query #2 typed out, then its result row.
```sql
select version() as postgres_engine, postgis_full_version() as postgis_engine;
```
**[DO]** Run it; let the result show **PostgreSQL 17.7** and **POSTGIS 3.5.1**.
**[SAY]** "This is the real database — Amazon Aurora PostgreSQL 17, with the
PostGIS spatial extension. No mock data anywhere in this demo."
**[DO]** Quick 2-second cut to the **AWS console**: the `raahi-db` Aurora
cluster, region us-east-1.
**[CAPTION]** Amazon Aurora PostgreSQL 17.7 · PostGIS 3.5.1

---

## SCENE 5 — THE HERO QUERY: HOTSPOT CLUSTERING (1:38–2:05)  ·  LAPTOP
**[SCREEN]** pgAdmin, query #1 (the `ST_ClusterDBSCAN` query) visible.
**[DO]** Run it; show the result grid (the hotspot rows with hazard counts +
centre lat/lng).
**[SAY]** "These danger zones aren't drawn by hand. PostGIS `ST_ClusterDBSCAN`
scans every active hazard and groups the ones that cluster together into
hotspots — right inside Aurora, in under half a second."
**[DO]** Cut to the **dashboard Hotspots panel** showing the same zones on the
map/heatmap.
**[SAY]** "The dashboard just renders what the database already figured out.
The database finds the danger zones — the app only draws them."
**[CAPTION]** ST_ClusterDBSCAN → live hotspots, computed in-database

---

## SCENE 6 — THE WARNING ENGINE: PROXIMITY (2:05–2:25)  ·  LAPTOP
**[SCREEN]** pgAdmin, query #3 (the `ST_DWithin` + `ST_Distance` query) and its
result (type / severity / metres_away).
**[SAY]** "And this is exactly what powers the voice warnings. `ST_DWithin`
finds every hazard near you; `ST_Distance` measures it to the metre — pothole,
1,707 metres; debris, 3,686. That's the same query firing as you drive,
backed by a GiST spatial index so it stays instant as the data grows."
**[CAPTION]** ST_DWithin + ST_Distance + GiST index = the warnings you heard

---

## SCENE 7 — HAZARD-AWARE ROUTING (2:25–2:38)  ·  LAPTOP
**[SCREEN]** The drive/route screen, or a slide of the routing logic.
**[SAY]** "Routing is the same trick at a bigger scale. We take every
alternative route, turn each one into a PostGIS LINESTRING, and run `ST_DWithin`
to count the hazards on it — then hand you the safest road. The database is
literally choosing your route."
**[CAPTION]** Each route = a PostGIS LINESTRING; the DB picks the safest

---

## SCENE 8 — COMMUNITY + ARCHITECTURE (2:38–2:55)  ·  LAPTOP
**[DO]** Pan the **Command Center** + the **Leaderboard** (now showing Rahi,
Priya, Arjun, Kavya).
**[SAY]** "It's already a small community — multiple contributors and a live
leaderboard that rewards the people keeping the roads safe. The whole thing is
a zero-ops stack: Next.js on Vercel, Amazon Aurora PostgreSQL with PostGIS as
the spatial brain, Vercel Blob for the photos."
**[CAPTION]** Vercel (Next.js) · Amazon Aurora PostgreSQL + PostGIS · Vercel Blob

---

## CLOSE (2:55–3:00)
**[SCREEN]** Back to the phone map, hazards glowing, then logo.
**[SAY]** "One pothole, reported once, protects every driver after you.
That's RAAHI."
**[CAPTION]** RAAHI — report once, protect everyone. raahi-virid.vercel.app

---

## RECORDING ORDER (do tomorrow, in this order)
1. PHONE: report a hazard (with photo).
2. PHONE: drive mode — route, voice warning (audio on), Safe Corridor badge.
3. LAPTOP: pgAdmin — run query #2 (version), #1 (clustering), #3 (proximity);
   screen-record each result grid.
4. LAPTOP: dashboard — overview, hotspots, leaderboard pan.
5. LAPTOP: 2-sec AWS console shot of the Aurora cluster.
6. Record the voiceover last, reading the [SAY] lines; lay it over the clips.

## EDITING
- 1080p, clean browser (no personal tabs/bookmarks), captions on (judges often
  watch muted first), low background music under the voiceover.
- Trim hard — stay under 3:00. Tools: CapCut / DaVinci Resolve / Clipchamp.

## MUST-HIT LINES (don't skip these)
- "Amazon Aurora PostgreSQL" — full name, at least twice.
- Name the functions out loud: `ST_ClusterDBSCAN`, `ST_DWithin`, `ST_Distance`,
  GiST index, route LINESTRING.
- "Real data, no mock numbers."
- Close on impact, not tech.

## PRE-FLIGHT CHECKLIST
- [x] distribute-hazards.sql run → 4 contributors live.
- [ ] Verify road-death stat (MoRTH).
- [ ] AWS console tab open + logged in for the proof shot.
- [ ] Phone audio works for the voice warning.
- [ ] (After submission) rotate exposed secrets: Aurora password, Ola key,
      AUTH_SECRET, Blob token, Google client secret.
