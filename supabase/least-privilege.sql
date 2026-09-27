-- Least-privilege database roles for PlataRank (already applied to production as the
-- `least_privilege_app_roles` and `harden_table_privileges` migrations). Kept here so the setup is
-- reproducible. The roles are created WITHOUT a password; scripts/rotate-db-credentials.ts sets
-- random ones and wires them into Vercel and GitHub.

-- 1. Internal tables are not reachable through the public API.
alter table public.ingest_state enable row level security;
revoke all on table public.ingest_state from anon, authenticated;
revoke insert, update, delete, truncate, trigger, references on table public.recipes, public.market_aggregates from anon, authenticated;
revoke all on table public.plans, public.alerts, public.user_settings from anon;
revoke truncate, trigger, references on table public.plans, public.alerts, public.user_settings from authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon;

-- 2. Roles.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'platarank_web') then
    create role platarank_web login nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'platarank_ingest') then
    create role platarank_ingest login nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
end $$;

grant usage on schema public to platarank_web, platarank_ingest;

-- Web app and the Discord digest: read-only market data (existing "public read" policies apply).
grant select on public.recipes, public.market_aggregates to platarank_web;

-- Ingester + alert checker.
grant select, insert, update on public.recipes, public.market_aggregates, public.ingest_state to platarank_ingest;
-- The ingester prunes empty market_aggregates rows (no price, no volume) instead of storing them.
grant delete on public.market_aggregates to platarank_ingest;
grant select on public.plans, public.user_settings to platarank_ingest;
grant select, update on public.alerts to platarank_ingest;

-- RLS stays on everywhere, so the ingest role needs explicit policies (no BYPASSRLS).
-- Explicit write policies (not FOR ALL): "public read" already covers SELECT, and a FOR ALL policy
-- would overlap it (Supabase performance advisor: multiple_permissive_policies).
create policy "ingest insert recipes" on public.recipes for insert to platarank_ingest with check (true);
create policy "ingest update recipes" on public.recipes for update to platarank_ingest using (true) with check (true);
create policy "ingest delete recipes" on public.recipes for delete to platarank_ingest using (true);
create policy "ingest insert market_aggregates" on public.market_aggregates for insert to platarank_ingest with check (true);
create policy "ingest update market_aggregates" on public.market_aggregates for update to platarank_ingest using (true) with check (true);
create policy "ingest delete market_aggregates" on public.market_aggregates for delete to platarank_ingest using (true);
create policy "ingest all ingest_state" on public.ingest_state for all to platarank_ingest using (true) with check (true);
create policy "ingest read plans" on public.plans for select to platarank_ingest using (true);
create policy "ingest read user_settings" on public.user_settings for select to platarank_ingest using (true);
create policy "ingest read alerts" on public.alerts for select to platarank_ingest using (true);
create policy "ingest update alerts" on public.alerts for update to platarank_ingest using (true) with check (true);
