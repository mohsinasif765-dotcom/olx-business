create table if not exists public.deposit_slips (
  id text primary key,
  account text not null default '',
  image text not null,
  created_at timestamptz not null default now()
);

alter table public.recharges add column if not exists slip_url text not null default '';

alter table public.deposit_slips enable row level security;
grant all on public.deposit_slips to service_role;

notify pgrst, 'reload schema';
