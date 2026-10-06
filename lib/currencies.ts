export type CurrencyRow = {
  id: string;
  name: string;
  network: string;
  min: string;
  address: string;
  enabled?: boolean;
};

export const DEFAULT_CURRENCIES: CurrencyRow[] = [
  { id: "usdt", name: "USDT", network: "Tether", min: "10", address: "OLX-USDT-WALLET", enabled: true },
  { id: "pkr", name: "PKR", network: "Pakistan", min: "1000", address: "OLX-PKR-BANK", enabled: true },
  { id: "usd", name: "USD", network: "United States", min: "10", address: "OLX-USD-BANK", enabled: true },
  { id: "eur", name: "EUR", network: "Europe", min: "10", address: "OLX-EUR-BANK", enabled: true },
  { id: "gbp", name: "GBP", network: "United Kingdom", min: "10", address: "OLX-GBP-BANK", enabled: true },
  { id: "aed", name: "AED", network: "UAE", min: "20", address: "OLX-AED-BANK", enabled: true },
  { id: "sar", name: "SAR", network: "Saudi Arabia", min: "20", address: "OLX-SAR-BANK", enabled: true },
  { id: "inr", name: "INR", network: "India", min: "500", address: "OLX-INR-BANK", enabled: true },
  { id: "cny", name: "CNY", network: "China", min: "50", address: "OLX-CNY-BANK", enabled: true },
];

const LEGACY_CRYPTO = new Set(["usdc", "btc", "eth", "bnb"]);

export function migrateCurrencies(rows: CurrencyRow[] | undefined | null): CurrencyRow[] {
  const list = Array.isArray(rows) ? rows : [];
  const ids = new Set(list.map((row) => String(row.id || "").toLowerCase()));
  const looksLegacy = ids.has("btc") && ids.has("eth") && ids.has("bnb");
  if (!list.length || looksLegacy) {
    const usdt = list.find((row) => String(row.id).toLowerCase() === "usdt" || String(row.name).toUpperCase() === "USDT");
    return DEFAULT_CURRENCIES.map((row) => {
      if (row.id === "usdt" && usdt) {
        return {
          ...row,
          address: usdt.address || row.address,
          min: usdt.min || row.min,
          enabled: usdt.enabled !== false,
        };
      }
      return { ...row };
    });
  }
  return list
    .filter((row) => !LEGACY_CRYPTO.has(String(row.id || "").toLowerCase()))
    .map((row) => ({
      id: String(row.id),
      name: String(row.name || "").toUpperCase(),
      network: String(row.network || "Bank"),
      min: String(row.min || "1"),
      address: String(row.address || ""),
      enabled: row.enabled !== false,
    }));
}
