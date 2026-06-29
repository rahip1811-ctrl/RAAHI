-- ============================================================
-- RAAHI community seed (run in pgAdmin → Query Tool → F5)
--
--   1. ~12 contributors total (you + 11)
--   2. Hazards spread UNEVENLY, like a real community:
--      one power user (4), a couple active (3), some casual (1–2).
--   3. A handful of natural, human comments (some short threads).
--
-- Safe to re-run: users use ON CONFLICT, the spread is deterministic,
-- and comments are guarded so they won't duplicate.
-- Login for all seeded accounts:  password = raahi123
-- ============================================================

-- 1) Contributors (Ahmedabad). password_hash = bcrypt('raahi123', 10)
insert into users (name, email, password_hash, created_at) values
  ('Priya Sharma',  'priya.sharma@raahi.app',  '$2b$10$PnUyEvTBG9WY6jePMOxMA.q3DtMXPcSdBFqO20XcdaFN34wWC4rQu', now() - interval '41 days'),
  ('Arjun Mehta',   'arjun.mehta@raahi.app',   '$2b$10$6hpGGzfCr25y.1BJP3TL0ud4ik3TycVaZEDsxCOh5ykhN2dy6Vd7.', now() - interval '36 days'),
  ('Kavya Patel',   'kavya.patel@raahi.app',   '$2b$10$l58MT2aGt0tc3LcbqRWjheOE2wGLT63UQSHmwTQiedymYhA1Ag4EO', now() - interval '29 days'),
  ('Vivek Desai',   'vivek.desai@raahi.app',   '$2b$10$9FEJjEskAxzgImKzrE/TheVHXwcXOa6KTZ38DLbNDMTPrb5ab6w..', now() - interval '23 days'),
  ('Sneha Iyer',    'sneha.iyer@raahi.app',    '$2b$10$niqhmzBy2aLd6s.Hrl.35uJnRtSMsnSCho9KWxB7Cg2Vvub3dzW52', now() - interval '19 days'),
  ('Rohan Shah',    'rohan.shah@raahi.app',    '$2b$10$sgxweQiiLnihXXN9cM2x8OjWWhKe2lrfyYsBtX1nertZsRksHLu1S', now() - interval '15 days'),
  ('Ananya Joshi',  'ananya.joshi@raahi.app',  '$2b$10$reGqIh3ArIWJxBEg5wj/Hex5KoRKpvznXtnyPz8xZonvXj7tUC/Ti', now() - interval '12 days'),
  ('Karan Trivedi', 'karan.trivedi@raahi.app', '$2b$10$27MsO2u.9JJkdMJWFcT5ietFH/x4qezRm9RN/B5X2OnUeLqufORU2', now() - interval '9 days'),
  ('Meera Nair',    'meera.nair@raahi.app',    '$2b$10$MqUjoqMMQnmMP8eO9xLZquUuDcFzAftJ9e9b7arnW/3husTyggCUC', now() - interval '6 days'),
  ('Aditya Rao',    'aditya.rao@raahi.app',    '$2b$10$widhezvVgPmlaIXvbipKLeNFI9IT2Q1CXcDU4DBxFwPqceNR6w3XO', now() - interval '4 days'),
  ('Pooja Bhatt',   'pooja.bhatt@raahi.app',   '$2b$10$xuZwnvSMGKCreDmPGm4rheGoHB5fY3GRnYv3v6ucqZPZ1QHtNYTQO', now() - interval '2 days')
on conflict (email) do nothing;

-- 2) Uneven spread across the 12 contributors (long-tail, looks organic).
with u as (
  select
    (select id from users where lower(email)='rahip1811@gmail.com' or name ilike 'rahi%' order by created_at limit 1) as u1,
    (select id from users where email='priya.sharma@raahi.app')  as u2,
    (select id from users where email='arjun.mehta@raahi.app')   as u3,
    (select id from users where email='kavya.patel@raahi.app')   as u4,
    (select id from users where email='vivek.desai@raahi.app')   as u5,
    (select id from users where email='sneha.iyer@raahi.app')    as u6,
    (select id from users where email='rohan.shah@raahi.app')    as u7,
    (select id from users where email='ananya.joshi@raahi.app')  as u8,
    (select id from users where email='karan.trivedi@raahi.app') as u9,
    (select id from users where email='meera.nair@raahi.app')    as u10,
    (select id from users where email='aditya.rao@raahi.app')    as u11,
    (select id from users where email='pooja.bhatt@raahi.app')   as u12
),
r as (select id, row_number() over (order by created_at, id) as rn from hazards)
update hazards h
set reporter_id = case
  when r.rn <= 4  then (select u1  from u)   -- 4
  when r.rn <= 7  then (select u2  from u)   -- 3
  when r.rn <= 10 then (select u3  from u)   -- 3
  when r.rn <= 12 then (select u4  from u)   -- 2
  when r.rn <= 14 then (select u5  from u)   -- 2
  when r.rn  = 15 then (select u6  from u)   -- 1
  when r.rn  = 16 then (select u7  from u)   -- 1
  when r.rn  = 17 then (select u8  from u)   -- 1
  when r.rn  = 18 then (select u9  from u)   -- 1
  when r.rn  = 19 then (select u10 from u)   -- 1
  when r.rn  = 20 then (select u11 from u)   -- 1
  else                 (select u12 from u)   -- 1 (rn 21+)
end
from r
where r.id = h.id;

-- 3) Natural comments (some hazards get a short thread), from varied people.
with hz as (select id, row_number() over (order by created_at) as rn from hazards),
c(rn, email, body) as (
  values
    (2,  'priya.sharma@raahi.app',  'Hit this on my way to work today, almost skidded. Please ride carefully here.'),
    (2,  'rohan.shah@raahi.app',    'Still here, nobody has fixed it yet. I raised it with AMC also.'),
    (5,  'arjun.mehta@raahi.app',   'This one is really deep, very risky at night when you cannot see it.'),
    (8,  'sneha.iyer@raahi.app',    'Confirmed, saw it yesterday evening right near the signal.'),
    (8,  'kavya.patel@raahi.app',   'Two-wheelers please slow down here, the edge is quite sharp.'),
    (12, 'vivek.desai@raahi.app',   'They put a barricade but it is still open on one side.'),
    (15, 'ananya.joshi@raahi.app',  'Avoid the left lane, that is where the crater is.'),
    (18, 'meera.nair@raahi.app',    'Thanks for flagging, took a different route because of this.')
)
insert into comments (hazard_id, user_id, body)
select hz.id, (select id from users where email = c.email), c.body
from c join hz on hz.rn = c.rn
where not exists (select 1 from comments x where x.hazard_id = hz.id and x.body = c.body);

-- 4) Check the result (uneven, organic-looking spread).
select coalesce(u.name, split_part(u.email,'@',1)) as contributor, count(h.id) as reports
from users u join hazards h on h.reporter_id = u.id
group by u.id, u.name, u.email
order by reports desc, contributor;
