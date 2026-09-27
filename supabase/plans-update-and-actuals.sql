-- Plans become the only saved entity (crafting sessions were removed, 2026-09-27):
-- 1. A plan can be updated in place, so re-saving an opened plan keeps its id -- and its alert --
--    instead of piling up duplicates.
-- 2. A plan can carry the real result of the craft (what the player actually spent and sold for),
--    which is what sessions' "gasto real / venta real" existed for.
-- Additive and backwards compatible; applied to production 2026-09-27.

alter table public.plans
  add column if not exists actual_cost numeric check (actual_cost is null or actual_cost >= 0),
  add column if not exists actual_revenue numeric check (actual_revenue is null or actual_revenue >= 0),
  add column if not exists updated_at timestamptz not null default now();

create policy "plans_update_own" on public.plans for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
