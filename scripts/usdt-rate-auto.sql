-- Auto USDT→PKR from live market (admin toggle). Run once in Zuvo SQL.
alter table if exists public.site_settings
  add column if not exists usdt_rate_auto boolean not null default true;

update public.site_settings
set usdt_rate_auto = coalesce(usdt_rate_auto, true)
where id = 1;
