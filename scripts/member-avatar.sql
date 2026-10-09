-- Member profile photo (DP) on Me page.
alter table public.members
  add column if not exists avatar_url text not null default '';
