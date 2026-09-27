-- Crafting sessions were folded into saved plans (2026-09-27): a plan now carries the real result
-- ("gasto real / venta real") that sessions existed for. Both tables were empty in production when
-- this was written. Run AFTER the code that stops reading them is deployed, or /sesiones on the
-- old deploy errors until then. session_items goes first (it references crafting_sessions).
drop table if exists public.session_items;
drop table if exists public.crafting_sessions;
