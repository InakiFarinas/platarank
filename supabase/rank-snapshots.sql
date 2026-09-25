-- Precomputed default ranking for the stations too big to compute on every page render (gear).
-- Written by scripts/ingest.ts a few times a day; read by RecipePage instead of loading ~85k
-- market_aggregates rows (egress on Supabase's free plan is 5 GB/month).
create table if not exists public.rank_snapshots (
  station_type text primary key,
  rows jsonb not null,
  total integer not null,
  updated_at timestamptz not null default now()
);

alter table public.rank_snapshots enable row level security;
revoke all on public.rank_snapshots from anon, authenticated;

grant select on public.rank_snapshots to platarank_web;
grant select, insert, update on public.rank_snapshots to platarank_ingest;

create policy "web read rank_snapshots" on public.rank_snapshots for select to platarank_web using (true);
create policy "ingest write rank_snapshots" on public.rank_snapshots for all to platarank_ingest using (true) with check (true);
