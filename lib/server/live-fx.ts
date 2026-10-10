/** Live USDT→PKR from public market feeds (no API key). USDT ≈ USD when needed. */

export type LiveUsdtPkr = {
  rate: number;
  source: string;
  at: string;
};

type CacheEntry = { rate: number; source: string; fetchedAt: number };

let cache: CacheEntry | null = null;
const TTL_MS = 10 * 60 * 1000;

function roundRate(n: number) {
  return Number(n.toFixed(2));
}

function validRate(n: unknown): number | null {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 50 || v > 1000) return null;
  return roundRate(v);
}

async function fromUsdtCdn(): Promise<LiveUsdtPkr | null> {
  const res = await fetch(
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usdt.min.json",
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { usdt?: { pkr?: number }; date?: string };
  const rate = validRate(data?.usdt?.pkr);
  if (!rate) return null;
  return { rate, source: "market USDT/PKR", at: data?.date || new Date().toISOString() };
}

async function fromUsdOpenEr(): Promise<LiveUsdtPkr | null> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { rates?: { PKR?: number }; time_last_update_utc?: string };
  const rate = validRate(data?.rates?.PKR);
  if (!rate) return null;
  return {
    rate,
    source: "market USD/PKR (USDT≈USD)",
    at: data?.time_last_update_utc || new Date().toISOString(),
  };
}

async function fromCloudflarePages(): Promise<LiveUsdtPkr | null> {
  const res = await fetch("https://latest.currency-api.pages.dev/v1/currencies/usdt.min.json", {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { usdt?: { pkr?: number }; date?: string };
  const rate = validRate(data?.usdt?.pkr);
  if (!rate) return null;
  return { rate, source: "market USDT/PKR", at: data?.date || new Date().toISOString() };
}

/** Fetch live USDT→PKR with short in-memory cache. */
export async function fetchLiveUsdtPkrRate(force = false): Promise<LiveUsdtPkr | null> {
  if (!force && cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return {
      rate: cache.rate,
      source: cache.source,
      at: new Date(cache.fetchedAt).toISOString(),
    };
  }
  const loaders = [fromUsdtCdn, fromCloudflarePages, fromUsdOpenEr];
  for (const load of loaders) {
    try {
      const hit = await load();
      if (hit) {
        cache = { rate: hit.rate, source: hit.source, fetchedAt: Date.now() };
        return hit;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Prefer live market when auto; otherwise saved fallback. */
export async function resolveUsdtToPkrRate(fallback: number, auto = true): Promise<number> {
  const safe = Number(fallback) > 0 ? Number(fallback) : 280;
  if (!auto) return safe;
  const live = await fetchLiveUsdtPkrRate();
  return live?.rate || safe;
}

const FX_CODES = ["pkr", "usd", "eur", "gbp", "aed", "sar", "inr", "bdt", "cny"] as const;

type UsdtBasketCache = { rates: Record<string, number>; fetchedAt: number };
let basketCache: UsdtBasketCache | null = null;

/**
 * 1 USDT → N units for common display currencies (from market USDT basket).
 * Always includes USDT:1 and PKR from dedicated resolver when needed.
 */
export async function resolveUsdtFxTable(fallbackPkr: number, auto = true): Promise<Record<string, number>> {
  const pkr = await resolveUsdtToPkrRate(fallbackPkr, auto);
  const base: Record<string, number> = { USDT: 1, USD: 1, PKR: pkr };

  if (basketCache && Date.now() - basketCache.fetchedAt < TTL_MS) {
    return { ...base, ...basketCache.rates, PKR: pkr };
  }

  const urls = [
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usdt.min.json",
    "https://latest.currency-api.pages.dev/v1/currencies/usdt.min.json",
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data = (await res.json()) as { usdt?: Record<string, number> };
      const usdt = data?.usdt;
      if (!usdt) continue;
      const rates: Record<string, number> = {};
      for (const key of FX_CODES) {
        const v = Number(usdt[key]);
        if (Number.isFinite(v) && v > 0) rates[key.toUpperCase()] = Number(v.toFixed(6));
      }
      if (rates.USD && rates.USD > 0.9 && rates.USD < 1.1) {
        /* keep ≈1 */
      } else {
        rates.USD = 1;
      }
      basketCache = { rates, fetchedAt: Date.now() };
      return { ...base, ...rates, PKR: Number(rates.PKR) > 0 ? Number(rates.PKR.toFixed(2)) : pkr };
    } catch {
      /* next */
    }
  }
  return base;
}
