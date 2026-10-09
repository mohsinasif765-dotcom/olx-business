-- Run once on live Zuvo / Postgres so Admin Settings → Wallet mode can save.
alter table public.site_settings
  add column if not exists wallet_mode text not null default 'pkr';

alter table public.site_settings
  add column if not exists usdt_to_pkr_rate numeric not null default 280;

-- Optional: pin current ops to PKR-only until admin changes it.
update public.site_settings
set wallet_mode = coalesce(nullif(trim(wallet_mode), ''), 'pkr'),
    usdt_to_pkr_rate = coalesce(usdt_to_pkr_rate, 280)
where id = 1;
