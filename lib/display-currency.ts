const KEY = "olx-fund-currency";

/** Remember the currency the member last chose to fund / invest with. */
export function rememberFundCurrency(code: string) {
  const c = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
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
    return String(window.localStorage.getItem(KEY) || "")
      .trim()
      .toUpperCase();
  } catch {
    return "";
  }
}
