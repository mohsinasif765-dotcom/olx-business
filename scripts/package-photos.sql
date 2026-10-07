-- Optional index table (photos themselves live in Storage bucket: package-photos).
-- App already uses the Storage bucket even if this table is missing.
create table if not exists public.package_photos (
  id text primary key,
  catalog text not null check (catalog in ('car', 'shop')),
  image text not null,
  updated_at timestamptz not null default now()
);

alter table public.package_photos enable row level security;
grant all on public.package_photos to service_role;

notify pgrst, 'reload schema';
