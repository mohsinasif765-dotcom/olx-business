-- Hourly package yield: track earned profit per holding. Run once in Zuvo SQL.
alter table public.car_holdings
  add column if not exists earned_total numeric not null default 0;
alter table public.car_holdings
  add column if not exists last_payout_at timestamptz;

alter table public.shop_holdings
  add column if not exists earned_total numeric not null default 0;
alter table public.shop_holdings
  add column if not exists last_payout_at timestamptz;

update public.car_holdings
set last_payout_at = coalesce(last_payout_at, started_at)
where last_payout_at is null;

update public.shop_holdings
set last_payout_at = coalesce(last_payout_at, started_at)
where last_payout_at is null;
