-- Per-rail: 1 USDT = usdt_rate units of this currency (e.g. PKR 280).
alter table public.pay_rails
  add column if not exists usdt_rate numeric not null default 0;

update public.pay_rails
set usdt_rate = 1
where lower(id) in ('usdt', 'usd') and coalesce(usdt_rate, 0) = 0;

update public.pay_rails
set usdt_rate = coalesce(
  (select nullif(usdt_to_pkr_rate, 0) from public.site_settings where id = 1),
  280
)
where (lower(id) = 'pkr' or lower(id) like 'pkr-%' or upper(name) like 'PKR%')
  and coalesce(usdt_rate, 0) = 0;

-- Temporary approx seeds for other rails (admin can edit anytime)
update public.pay_rails set usdt_rate = 0.92 where lower(id) = 'eur' and coalesce(usdt_rate, 0) = 0;
update public.pay_rails set usdt_rate = 0.79 where lower(id) = 'gbp' and coalesce(usdt_rate, 0) = 0;
update public.pay_rails set usdt_rate = 3.67 where lower(id) = 'aed' and coalesce(usdt_rate, 0) = 0;
update public.pay_rails set usdt_rate = 3.75 where lower(id) = 'sar' and coalesce(usdt_rate, 0) = 0;
update public.pay_rails set usdt_rate = 83.5 where lower(id) = 'inr' and coalesce(usdt_rate, 0) = 0;
update public.pay_rails set usdt_rate = 110 where lower(id) = 'bdt' and coalesce(usdt_rate, 0) = 0;
update public.pay_rails set usdt_rate = 7.2 where lower(id) = 'cny' and coalesce(usdt_rate, 0) = 0;
