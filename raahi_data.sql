--
-- PostgreSQL database dump
--

\restrict liUcol5EhY5LRrczPOVtnHe8bEkpjtuzYYQtKeI14Hb9jZJkDcR4XfIhydjam7V

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, name, email, password_hash, created_at, is_admin) VALUES ('84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'Rahi Patel', 'rahip1811@gmail.com', '$2b$10$YNML7cTiR1NRG8RwhRLp/eU3L.W3dJkKXhoKP0UFjRNXcs5Hb1YXW', '2026-06-22 19:03:36.343094+00', true);
INSERT INTO public.users (id, name, email, password_hash, created_at, is_admin) VALUES ('4d1c4fc4-ded5-4f26-80ab-dad960c6a42a', 'Diya sharma', 'diyasharma1234@gmail.com', '$2b$10$AHdmtYSbH6aDE49zlLys.O5zKxjaTw1sknpQ694u6p/SDeUqwboe6', '2026-06-24 14:37:32.820926+00', false);


--
-- Data for Name: hazards; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('38aa7472-5212-497e-b969-7665e9b4295d', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'construction', 'high', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-construction2-1782461337541.png', '0101000020E61000008D976E1283205240CFF753E3A50B3740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('39d8320d-637d-45a1-8f0b-913388458c75', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'high', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole3-1782461351730.webp', '0101000020E61000005839B4C876265240736891ED7CFF3640', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('63a009e1-fc67-41ac-b7a8-4f7df728d484', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'debris', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-debris2-1782461342806.png', '0101000020E61000000AD7A3703D2A524052B81E85EB113740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('39c5619a-0c7b-4841-a910-897b2242c775', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole4-1782461353747.avif', '0101000020E61000000AD7A3703D225240D7A3703D0A173740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('40c2d815-5e7d-4778-a301-27d6930ff708', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'construction', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-construction1-1782461334895.png', '0101000020E61000007D3F355EBA215240448B6CE7FB093740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('2bff725d-cc12-4ba8-a277-98dfd16e4aaa', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'high', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole1-1782461348733.avif', '0101000020E6100000C3F5285C8F2A524008AC1C5A64FB3640', 'resolved', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', '2026-06-24 09:59:08.530446+00');
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('d77c14e8-8f48-4ab0-8e4e-f33e7c9b3c83', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'construction', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-construction2-1782461337541.png', '0101000020E6100000261E4986B3225240FEE6475C80193740', 'active', '2026-06-24 10:02:08.593061+00', 1, '2026-06-24 10:02:08.593061+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('4e067294-6427-4c3a-8882-17773e2e15f3', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'high', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole2-1782461349917.jpg', '0101000020E6100000A9A44E40132152406B9A779CA2033740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('dfaa950c-a7f5-4077-a395-334419ea5445', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'high', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole3-1782461351730.webp', '0101000020E6100000295C8FC2F5205240A4703D0AD7033740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('bb8dfdad-c23e-4901-bc4a-f6064c9b9e36', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole4-1782461353747.avif', '0101000020E61000009BE61DA7E820524032772D211F043740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('4f5d8681-1333-46f1-adef-16d25e18e4fe', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'high', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole1-1782461348733.avif', '0101000020E61000000AD7A3703D2A52400000000000003740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('fe2a3c3e-dfee-4786-a15d-6743f6153a1a', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole2-1782461349917.jpg', '0101000020E6100000EE7C3F355E2A524055C1A8A44E003740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('a573fe1a-107b-4532-ad38-5b5b9a7ac179', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'debris', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-debris1-1782461340482.jpg', '0101000020E6100000B5A679C7292A5240006F8104C5FF3640', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('8278a21a-c0ed-469b-a79a-da7cd80ed591', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'high', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole3-1782461351730.webp', '0101000020E61000003D0AD7A3702552407B14AE47E11A3740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('6c51b2f2-27a4-4ccf-93aa-4c2e383e7ebf', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole4-1782461353747.avif', '0101000020E610000012A5BDC117265240ED9E3C2CD41A3740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('7f71b626-f856-460d-8c32-00476c4d634f', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'construction', 'high', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-construction1-1782461334895.png', '0101000020E6100000A857CA32C425524096218E75711B3740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('f73879f9-6528-4628-b45e-d8e574d2544d', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole1-1782461348733.avif', '0101000020E610000009F9A067B32A5240098A1F63EEFA3640', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('935e2d1b-ee71-4158-b3f6-4c28c515128d', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'medium', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole2-1782461349917.jpg', '0101000020E6100000569FABADD8235240F0A7C64B37093740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('2d74caa6-9631-4153-9ed3-1d17903dcf3c', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'high', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole1-1782461348733.avif', '0101000020E6100000AE47E17A141E524048E17A14AE073740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('d042c449-f78c-4504-bf7d-2ada4d06b366', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'debris', 'low', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-debris3-1782461345854.png', '0101000020E6100000A245B6F3FD2452403333333333133740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);
INSERT INTO public.hazards (id, reporter_id, type, severity, photo_url, location, status, created_at, report_count, last_reported_at, resolved_at) VALUES ('5d8293bd-2cc5-4864-8e5b-8e3466f5260e', '84d2f0e7-eee9-465d-8fe1-e028456a9b59', 'pothole', 'low', 'https://4wlfbrvhn6hrvv9x.public.blob.vercel-storage.com/hazards/seed-pothole2-1782461349917.jpg', '0101000020E61000005C8FC2F528245240C3F5285C8F023740', 'active', '2026-06-23 15:58:25.838439+00', 1, '2026-06-23 15:58:25.838439+00', NULL);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: confirmations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

\unrestrict liUcol5EhY5LRrczPOVtnHe8bEkpjtuzYYQtKeI14Hb9jZJkDcR4XfIhydjam7V

