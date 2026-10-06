create table if not exists public.shop_packages (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('jewelry', 'electronics')),
  invest text not null,
  returns text not null,
  term text not null,
  image text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_holdings (
  id text primary key,
  account text not null,
  plan_id text not null,
  name text not null,
  kind text not null,
  invest text not null,
  invest_amount numeric not null default 0,
  returns text not null,
  term text not null,
  image text not null,
  status text not null default 'active',
  started_at timestamptz not null default now()
);

alter table public.shop_packages enable row level security;
alter table public.shop_holdings enable row level security;
drop policy if exists "public read live shop packages" on public.shop_packages;
create policy "public read live shop packages"
on public.shop_packages for select to anon, authenticated using (enabled = true);
grant select on public.shop_packages to anon, authenticated;
grant all on public.shop_packages to service_role;
grant all on public.shop_holdings to service_role;

notify pgrst, 'reload schema';
notify pgrst, 'reload config';
