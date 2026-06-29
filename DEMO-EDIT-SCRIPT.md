# RAAHI — Final Demo Video: Edit Order + Voiceover (~2:45)

**How to use:** record the voiceover reading the **SAY** lines, lay your clips
under them in the order below, add the captions. Target 2:45–3:00.

Your clips:
- **REAL** = `RAAHI.mp4` (woman on the Ahmedabad road, real hazard)
- **PHONE** = `final clip.mp4` (landing feature cards → signup → drive mode)
- **LAPTOP** = `Lclip.mp4` (dashboard Overview → Analytics → map)
- **AURORA** = `backend postgre.mp4` (before/after report lands in Aurora)
- **CLUSTER** = `Screen Recording …233449.mp4` (ST_ClusterDBSCAN hotspots)
- **LOGS** = your Vercel runtime-logs recording

---

## 0:00–0:05 · TITLE
**SCREEN:** Black card, RAAHI logo. Caption: *RAAHI — community road-hazard warnings · Ahmedabad*
**SAY:** "This is RAAHI."

## 0:05–0:30 · THE PROBLEM (clip: REAL)
**SCREEN:** The woman standing on the road beside the real hazard, traffic passing.
**SAY:** "India loses over one and a half lakh lives on its roads every year — and potholes alone killed nearly 2,400 people last year. The danger is rarely a secret. Someone always hits it first. They just had no way to warn the driver behind them."
**CAPTION:** ~1.7 lakh road deaths/yr · pothole deaths up 53% in 5 years (MoRTH)
> *Verify both figures against MoRTH before you publish.*

## 0:30–0:42 · THE REPORT (clip: REAL → cut to PHONE report form)
**SCREEN:** Her looking at the phone; cut to the report screen (type / severity / photo).
**SAY:** "RAAHI changes that. She reports the hazard in seconds — type, severity, a real photo, exact GPS."
**CAPTION:** One tap → a geo-point in Amazon Aurora

## 0:42–1:06 · THE PAYOFF — DRIVE MODE (clip: PHONE, the "Pothole ahead · 28 m" part)
**SCREEN:** Drive mode, 3D HUD, blue route, the orange hazard, voice icon. **Keep audio up** if the spoken warning is in the clip.
**SAY:** "And every driver after her gets warned — out loud — before they reach it. *Pothole ahead, twenty-eight metres.* Eyes on the road, not the screen. And if a safer route exists, RAAHI routes them around it."
**CAPTION:** Voice warnings · 3D nav · auto hazard-avoidance

## 1:06–1:12 · BRIDGE (clip: hold on PHONE or quick logo)
**SAY (slow):** "Every one of those warnings is a live query against Amazon Aurora. Here's the engine."

## 1:12–1:32 · THE ENGINE (clip: PHONE landing feature cards)
**SCREEN:** The feature cards — ST_DWithin / Smart de-dup / ST_ClusterDBSCAN / GiST-indexed. Let it linger so the text is readable.
**SAY:** "Every hazard is a PostGIS geography point in Amazon Aurora PostgreSQL. ST_DWithin finds what's near you, ST_ClusterDBSCAN finds the hotspots, and a GiST index keeps it fast past fifty thousand reports."
**CAPTION:** Amazon Aurora PostgreSQL 17 + PostGIS

## 1:32–1:52 · PROOF IT'S REAL (clip: AURORA, before/after)
**SCREEN:** pgAdmin. Highlight/zoom the **top row** at the moment it changes.
**SAY:** "Watch the top row. The pothole I just reported on the phone is now a row in Aurora — latitude, longitude, stored as PostGIS — instantly. No mock data anywhere in this demo."
**CAPTION:** Report on phone → live row in Aurora

## 1:52–2:08 · THE SPATIAL ENGINE + LIVE API (clips: CLUSTER, then LOGS)
**SCREEN:** The ST_ClusterDBSCAN result (3 hotspots, "568 msec"); cut to the Vercel logs scrolling.
**SAY:** "The database doesn't just store the points — it computes the danger zones itself, in milliseconds, while the live API serves every request."
**CAPTION:** ST_ClusterDBSCAN · GiST index · live on Vercel

## 2:08–2:30 · THE COMMAND CENTER (clip: LAPTOP — Overview heatmap → Analytics)
**SCREEN:** Dashboard Overview heatmap with the hazard photos, then the Analytics donuts + breakdown.
**SAY:** "It all surfaces in a civic Command Center — a live heatmap, ranked hotspots, analytics, and a community leaderboard. Every number is real data from Aurora."
**CAPTION:** Real-time civic intelligence · Ahmedabad

## 2:30–2:40 · COMMUNITY + STACK (clip: LAPTOP leaderboard/contributors)
**SCREEN:** The Contributors/Leaderboard (the 12 reporters).
**SAY:** "It's already a small community keeping Ahmedabad's roads safer — built on Vercel and Amazon Aurora PostgreSQL with PostGIS."
**CAPTION:** Vercel · Amazon Aurora PostgreSQL + PostGIS · Vercel Blob

## 2:40–2:45 · CLOSE (clip: REAL freeze or logo)
**SCREEN:** Back to the road / logo. Caption: *raahi-virid.vercel.app*
**SAY:** "One pothole, reported once, protects everyone behind you. That's RAAHI."

---

## ONE-TAKE VOICEOVER (read straight through, ~400 words)
> This is RAAHI. India loses over one and a half lakh lives on its roads every
> year — and potholes alone killed nearly 2,400 people last year. The danger is
> rarely a secret; someone always hits it first. They just had no way to warn
> the driver behind them. RAAHI changes that. She reports the hazard in seconds
> — type, severity, a real photo, exact GPS. And every driver after her gets
> warned, out loud, before they reach it: *pothole ahead, twenty-eight metres.*
> Eyes on the road, not the screen — and if a safer route exists, RAAHI routes
> them around it. Every one of those warnings is a live query against Amazon
> Aurora. Here's the engine. Every hazard is a PostGIS geography point in Amazon
> Aurora PostgreSQL. ST_DWithin finds what's near you, ST_ClusterDBSCAN finds the
> hotspots, and a GiST index keeps it fast past fifty thousand reports. Watch the
> top row — the pothole I just reported on the phone is now a row in Aurora,
> latitude, longitude, stored as PostGIS, instantly. No mock data anywhere in
> this demo. The database doesn't just store the points — it computes the danger
> zones itself, in milliseconds, while the live API serves every request. It all
> surfaces in a civic Command Center: a live heatmap, ranked hotspots, analytics,
> and a community leaderboard — every number real data from Aurora. It's already
> a small community keeping Ahmedabad's roads safer, built on Vercel and Amazon
> Aurora PostgreSQL with PostGIS. One pothole, reported once, protects everyone
> behind you. That's RAAHI.

---

## EDITING CHECKLIST
- 1080p, captions ON (judges often watch muted first), light music under VO.
- Record VO separately, then lay clips under it — don't narrate live.
- Trim each clip to the seconds noted; cut dead air hard to stay under 3:00.
- Name "Amazon Aurora PostgreSQL" fully (you do, twice) and say the function
  names out loud — that's what the database judges are listening for.
- Tools: CapCut / DaVinci Resolve / Clipchamp.
- Before publishing: verify the MoRTH stats; make sure the signup clip shows a
  realistic name (not "Testuser") and a successful sign-up.
