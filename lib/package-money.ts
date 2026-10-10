/**
 * Catalog packages are priced in USDT.
 * Display converts USDT → member currency via live/saved FX (never relabel the same number as Rs).
 */

import { moneyPrefix, normalizeCurrencyCode, parseInvestRange } from "@/lib/currencies";

export type UsdtFxTable = Record<string, number>;

const DEFAULT_FX: UsdtFxTable = {
  USDT: 1,
  USD: 1,
  PKR: 280,
};

export function defaultUsdtFx(pkrRate = 280): UsdtFxTable {
  const pkr = Number(pkrRate) > 0 ? Number(pkrRate) : 280;
  return { ...DEFAULT_FX, PKR: pkr };
}

/** 1 USDT → units of display currency. */
export function usdtPerUnit(code: string, fx: UsdtFxTable = DEFAULT_FX): number {
  const c = normalizeCurrencyCode(code) || "USDT";
  if (c === "USDT") return 1;
  const rate = Number(fx[c]);
  if (Number.isFinite(rate) && rate > 0) return rate;
  if (c === "USD") return 1;
  return 0;
}

/** Resolve which code to label with (unknown FX → keep USDT). */
export function effectiveDisplayCode(code: string, fx: UsdtFxTable = DEFAULT_FX): string {
  const c = normalizeCurrencyCode(code) || "USDT";
  if (c === "USDT" || c === "USD") return c;
  return usdtPerUnit(c, fx) > 0 ? c : "USDT";
}

export function convertUsdtAmount(amountUsdt: number, code: string, fx: UsdtFxTable = DEFAULT_FX): number {
  const n = Number(amountUsdt);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const unit = usdtPerUnit(code, fx);
  return unit > 0 ? n * unit : n;
}

function prettyAmount(n: number, code: string): string {
  const c = normalizeCurrencyCode(code) || "USDT";
  if (c === "USDT" || c === "USD") {
    if (n >= 100) return Math.round(n).toLocaleString("en-US");
    return Number(n.toFixed(2)).toLocaleString("en-US");
  }
  if (n >= 10) return Math.round(n).toLocaleString("en-US");
  return Number(n.toFixed(2)).toLocaleString("en-US");
}

function labelAmount(n: number, code: string): string {
  const unit = moneyPrefix(code);
  const pretty = prettyAmount(n, code);
  if (unit === "Rs" || unit === "$" || unit === "€" || unit === "£") return `${unit} ${pretty}`;
  return `${pretty} ${unit}`;
}

function isPercentText(raw: string) {
  return /%/.test(raw) && !/\$|USDT|USD|Rs|PKR|€|£/i.test(raw);
}

/**
 * Format a catalog money field (invest / returns) from USDT base into display currency.
 * "800_1600" / "$800 – $1600" / "800-1600" → "Rs 221,216 – Rs 442,432" (at ~276 PKR).
 */
export function formatPackageMoneyText(
  raw: unknown,
  displayCode: string,
  fx: UsdtFxTable = DEFAULT_FX,
): string {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  if (isPercentText(text)) return text;

  const range = parseInvestRange(text);
  if (range.min <= 0) return text;

  const code = effectiveDisplayCode(displayCode, fx);
  const minLabel = labelAmount(convertUsdtAmount(range.min, code, fx), code);
  if (range.max <= range.min) return minLabel;
  const maxLabel = labelAmount(convertUsdtAmount(range.max, code, fx), code);
  return `${minLabel} – ${maxLabel}`;
}

/** Single USDT amount → display label (fund hints, need messages). */
export function formatUsdtAsDisplay(amountUsdt: number, displayCode: string, fx: UsdtFxTable = DEFAULT_FX): string {
  const code = effectiveDisplayCode(displayCode, fx);
  return labelAmount(convertUsdtAmount(amountUsdt, code, fx), code);
}

/** Deposit min on a pay rail: plan need is USDT; convert when rail is not USDT. */
export function depositMinFromUsdtNeed(
  railMin: number,
  needUsdt: number,
  railCode: string,
  fx: UsdtFxTable = DEFAULT_FX,
): number {
  const rail = Number(railMin) || 0;
  const code = normalizeCurrencyCode(railCode) || "USDT";
  const planInRail = needUsdt > 0 ? convertUsdtAmount(needUsdt, code, fx) : 0;
  return Math.max(rail, planInRail > 0 ? Math.ceil(planInRail) : 0);
}
