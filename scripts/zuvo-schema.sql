create table if not exists public.car_packages (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('new', 'used')),
  invest text not null,
  returns text not null,
  term text not null,
  image text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id text primary key,
  account text unique not null,
  vip text not null default '—',
  invite text not null default '',
  upline text not null default '—',
  invest numeric not null default 0,
  brokerage numeric not null default 0,
  status text not null default 'active',
  joined text not null default '',
  login_password text not null default '',
  security_password text not null default '',
  name text not null default ''
);

alter table public.members add column if not exists name text not null default '';

create table if not exists public.ops_snapshot (
  id int primary key default 1 check (id = 1),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.car_packages enable row level security;
alter table public.members enable row level security;
alter table public.ops_snapshot enable row level security;

drop policy if exists "public read live packages" on public.car_packages;
create policy "public read live packages"
on public.car_packages
for select
to anon, authenticated
using (enabled = true);

grant select on public.car_packages to anon, authenticated;
grant all on public.car_packages to service_role;
grant all on public.members to service_role;
create table if not exists public.car_holdings (
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

alter table public.car_holdings enable row level security;
grant all on public.car_holdings to service_role;
