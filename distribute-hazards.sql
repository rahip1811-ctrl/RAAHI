-- ============================================================
-- RAAHI demo seed: add 3 community contributors + spread the
-- existing hazard reports across them so the app looks like a
-- real crowd, not a one-person feed.
--
-- HOW TO RUN: open pgAdmin -> connect to the RAAHI database ->
-- Query Tool -> paste this whole file -> Execute (F5).
-- Safe to re-run: users use ON CONFLICT, distribution is deterministic.
--
-- Login for all three demo accounts:  password = raahi123
-- ============================================================

-- 1) Create three local-looking contributors (Ahmedabad).
--    password_hash below = bcrypt('raahi123', cost 10)
insert into users (name, email, password_hash, created_at) values
  ('Priya Sharma', 'priya.sharma@raahi.app',
   '$2b$10$PnUyEvTBG9WY6jePMOxMA.q3DtMXPcSdBFqO20XcdaFN34wWC4rQu',
   now() - interval '38 days')
on conflict (email) do nothing;

insert into users (name, email, password_hash, created_at) values
  ('Arjun Mehta', 'arjun.mehta@raahi.app',
   '$2b$10$6hpGGzfCr25y.1BJP3TL0ud4ik3TycVaZEDsxCOh5ykhN2dy6Vd7.',
   now() - interval '26 days')
on conflict (email) do nothing;

insert into users (name, email, password_hash, created_at) values
  ('Kavya Patel', 'kavya.patel@raahi.app',
   '$2b$10$l58MT2aGt0tc3LcbqRWjheOE2wGLT63UQSHmwTQiedymYhA1Ag4EO',
   now() - interval '14 days')
on conflict (email) do nothing;

-- 2) Spread the existing hazards across the 4 contributors.
--    Founder (current owner) keeps ~40%, the rest go to the new
--    three. Buckets are by created_at so it's stable on re-run.
with ranked as (
  select id, ntile(20) over (order by created_at, id) as b
  from hazards
)
update hazards h
set reporter_id = case
  when r.b between  9 and 13 then (select id from users where email = 'priya.sharma@raahi.app')
  when r.b between 14 and 17 then (select id from users where email = 'arjun.mehta@raahi.app')
  when r.b between 18 and 20 then (select id from users where email = 'kavya.patel@raahi.app')
  else h.reporter_id            -- buckets 1-8 stay with the founder (~40%)
end
from ranked r
where r.id = h.id;

-- 3) Check the result (this is what the Leaderboard reads).
select coalesce(u.name, split_part(u.email,'@',1)) as contributor,
       count(h.id) as reports,
       count(h.id) filter (where h.status = 'resolved') as resolved
from users u
join hazards h on h.reporter_id = u.id
group by u.id, u.name, u.email
order by reports desc;
