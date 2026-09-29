-- Market data is read only by the app's own roles (applied to production as the
-- `market_data_private` migration, 2026-09-29).
--
-- recipes and market_aggregates used to carry a "public read" policy plus SELECT for anon and
-- authenticated, so anyone holding the public anon key (it ships in the browser bundle) could pull
-- the whole tables through the REST API -- ~7 MB of Supabase egress per request on a 5 GB/month
-- plan, repeatable by any bot. Nothing in the browser reads them: the web app reads through the
-- server as platarank_web, the ingester as platarank_ingest.
drop policy if exists "public read" on public.recipes;
drop policy if exists "public read" on public.market_aggregates;
revoke select on table public.recipes, public.market_aggregates from anon, authenticated;
create policy "app read recipes" on public.recipes for select to platarank_web, platarank_ingest using (true);
create policy "app read market_aggregates" on public.market_aggregates for select to platarank_web, platarank_ingest using (true);
