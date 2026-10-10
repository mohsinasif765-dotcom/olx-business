import { clampDisplayCurrency, normalizeCurrencyCode } from "@/lib/currencies";

const KEY = "olx-fund-currency";

/** Remember the currency the member last chose to fund / invest with (PKR | USDT). */
export function rememberFundCurrency(code: string) {
  const c = clampDisplayCurrency(normalizeCurrencyCode(code) || code, "dual");
  if (!c || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, c);
  } catch {
    /* ignore */
  }
}

export function readFundCurrency(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = String(window.localStorage.getItem(KEY) || "")
      .trim()
      .toUpperCase();
    if (!raw) return "";
    return clampDisplayCurrency(raw, "dual");
  } catch {
    return "";
  }
}
