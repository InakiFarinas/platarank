-- Per-user Row Level Security policies for the tables the browser writes directly with the
-- signed-in user's own Supabase session (never through Drizzle/the service roles). Already applied
-- to production; kept here so they're reviewable and reproducible instead of living only in the
-- Supabase dashboard. Mirrors the live policies exactly (checked against pg_policies on 2026-09-27).

alter table public.plans enable row level security;
alter table public.alerts enable row level security;
alter table public.user_settings enable row level security;

-- plans
create policy "plans_select_own" on public.plans for select to authenticated
  using (user_id = (select auth.uid()));
create policy "plans_insert_own" on public.plans for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "plans_delete_own" on public.plans for delete to authenticated
  using (user_id = (select auth.uid()));
-- Update (added 2026-09-27, supabase/plans-update-and-actuals.sql): "Actualizar" rewrites a plan in
-- place so its alert follows it, and the real result is stored on the plan.
create policy "plans_update_own" on public.plans for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- alerts: one per plan, so an insert must also own the plan it points at -- otherwise a leaked
-- plan id (a UUID, but still) would let an attacker alert on someone else's saved plan and get its
-- profit/cost data pushed to their own Discord webhook.
create policy "alerts_select_own" on public.alerts for select to authenticated
  using (user_id = (select auth.uid()));
create policy "alerts_insert_own" on public.alerts for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.plans p where p.id = alerts.plan_id and p.user_id = (select auth.uid()))
  );
create policy "alerts_update_own" on public.alerts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "alerts_delete_own" on public.alerts for delete to authenticated
  using (user_id = (select auth.uid()));

-- user_settings: one row per user, holds the Discord webhook URL. A DB-level CHECK constraint
-- enforces the same format the client and src/lib/ingest/alerts.ts re-validate, since this table
-- is written directly from the browser via the Supabase REST API (no server route in front of it).
alter table public.user_settings add constraint user_settings_discord_webhook_url_check
  check (discord_webhook_url is null or discord_webhook_url ~ '^https://(discord|discordapp)\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+$');

create policy "settings_select_own" on public.user_settings for select to authenticated
  using (user_id = (select auth.uid()));
create policy "settings_insert_own" on public.user_settings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "settings_update_own" on public.user_settings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "settings_delete_own" on public.user_settings for delete to authenticated
  using (user_id = (select auth.uid()));
