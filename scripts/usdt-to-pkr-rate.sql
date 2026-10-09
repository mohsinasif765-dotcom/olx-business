-- Run once on live Zuvo / Postgres for Trade FX–style Bank PKR estimate.
alter table public.site_settings
  add column if not exists usdt_to_pkr_rate numeric not null default 280;

update public.site_settings
set usdt_to_pkr_rate = coalesce(usdt_to_pkr_rate, 280)
where id = 1;
