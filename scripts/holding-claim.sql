-- Claim-at-maturity: track how much profit was already paid to wallet.
alter table public.car_holdings
  add column if not exists paid_total numeric not null default 0;
alter table public.shop_holdings
  add column if not exists paid_total numeric not null default 0;

-- Old hourly cron already credited earned_total into wallets — mark as paid so Claim won't double-pay.
update public.car_holdings
set paid_total = coalesce(earned_total, 0)
where coalesce(paid_total, 0) = 0 and coalesce(earned_total, 0) > 0;

update public.shop_holdings
set paid_total = coalesce(earned_total, 0)
where coalesce(paid_total, 0) = 0 and coalesce(earned_total, 0) > 0;
