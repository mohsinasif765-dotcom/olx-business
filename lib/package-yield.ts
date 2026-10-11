/** Client-safe package yield helpers (daily returns → hourly accrual). */

export function parseDailyReturnUsdt(raw: unknown) {
  const match = String(raw ?? "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export function parseTermDays(raw: unknown) {
  const match = String(raw ?? "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function hourlyReturnUsdt(dailyUsdt: number) {
  if (!Number.isFinite(dailyUsdt) || dailyUsdt <= 0) return 0;
  return Number((dailyUsdt / 24).toFixed(4));
}

/**
 * Accrued yield in USDT: credited earnedTotal + pending full hours since last payout.
 * Caps at daily × term days.
 */
export function accruedProfitUsdt(input: {
  returns: unknown;
  term: unknown;
  earnedTotal?: number;
  lastPayoutAt?: string;
  startedAt?: string;
  now?: number;
}) {
  const daily = parseDailyReturnUsdt(input.returns);
  const hourly = hourlyReturnUsdt(daily);
  const termDays = parseTermDays(input.term) || 90;
  const maxEarn = Number((daily * termDays).toFixed(4));
  const earned = Number(input.earnedTotal) || 0;
  if (daily <= 0 || earned >= maxEarn) return Math.min(earned, maxEarn);

  const now = input.now ?? Date.now();
  const lastMs = Date.parse(input.lastPayoutAt || input.startedAt || "") || now;
  const hours = Math.max(0, Math.floor((now - lastMs) / (60 * 60 * 1000)));
  const pending = Number((hourly * hours).toFixed(4));
  return Math.min(Number((earned + pending).toFixed(4)), maxEarn);
}

/** Today's slice of accrual (from local midnight or plan start, whichever later). */
export function todayProfitUsdt(input: {
  returns: unknown;
  term: unknown;
  earnedTotal?: number;
  lastPayoutAt?: string;
  startedAt?: string;
  now?: number;
}) {
  const daily = parseDailyReturnUsdt(input.returns);
  if (daily <= 0) return 0;
  const now = input.now ?? Date.now();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const startedMs = Date.parse(input.startedAt || "") || start.getTime();
  const from = Math.max(start.getTime(), startedMs);
  const hours = Math.max(0, Math.floor((now - from) / (60 * 60 * 1000)));
  const today = Number((hourlyReturnUsdt(daily) * hours).toFixed(4));
  const total = accruedProfitUsdt({ ...input, now });
  return Math.min(today, daily, total);
}
