export type CurrencyRow = {
  id: string;
  name: string;
  network: string;
  min: string;
  address: string;
  enabled?: boolean;
  payKind?: "crypto" | "bank";
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  branch?: string;
  instructions?: string;
};

export function isCryptoId(id: string) {
  return String(id).toLowerCase() === "usdt";
}

function rail(row: Partial<CurrencyRow>, id: string): Pick<
  CurrencyRow,
  "payKind" | "bankName" | "accountName" | "accountNumber" | "iban" | "swift" | "branch" | "instructions"
> {
  return {
    payKind: row.payKind || (isCryptoId(id) ? "crypto" : "bank"),
    bankName: String(row.bankName || ""),
    accountName: String(row.accountName || ""),
    accountNumber: String(row.accountNumber || ""),
    iban: String(row.iban || ""),
    swift: String(row.swift || ""),
    branch: String(row.branch || ""),
    instructions: String(row.instructions || ""),
  };
}

export const DEFAULT_CURRENCIES: CurrencyRow[] = [
  { id: "usdt", name: "USDT", network: "Tether", min: "10", address: "", enabled: true, ...rail({}, "usdt") },
  { id: "pkr", name: "PKR", network: "Pakistan", min: "1000", address: "", enabled: true, ...rail({}, "pkr") },
  { id: "usd", name: "USD", network: "United States", min: "10", address: "", enabled: true, ...rail({}, "usd") },
  { id: "eur", name: "EUR", network: "Europe", min: "10", address: "", enabled: true, ...rail({}, "eur") },
  { id: "gbp", name: "GBP", network: "United Kingdom", min: "10", address: "", enabled: true, ...rail({}, "gbp") },
  { id: "aed", name: "AED", network: "UAE", min: "20", address: "", enabled: true, ...rail({}, "aed") },
  { id: "sar", name: "SAR", network: "Saudi Arabia", min: "20", address: "", enabled: true, ...rail({}, "sar") },
  { id: "inr", name: "INR", network: "India", min: "500", address: "", enabled: true, ...rail({}, "inr") },
  { id: "cny", name: "CNY", network: "China", min: "50", address: "", enabled: true, ...rail({}, "cny") },
];

const LEGACY_CRYPTO = new Set(["usdc", "btc", "eth", "bnb"]);

export function migrateCurrencies(rows: CurrencyRow[] | undefined | null): CurrencyRow[] {
  const list = Array.isArray(rows) ? rows : [];
  const ids = new Set(list.map((row) => String(row.id || "").toLowerCase()));
  const looksLegacy = ids.has("btc") && ids.has("eth") && ids.has("bnb");
  if (!list.length || looksLegacy) {
    return DEFAULT_CURRENCIES.map((row) => {
      const live = list.find((item) => String(item.id).toLowerCase() === row.id);
      if (!live) return { ...row };
      return {
        ...row,
        ...rail(live, row.id),
        address: live.address || live.accountNumber || row.address,
        min: live.min || row.min,
        enabled: live.enabled !== false,
        network: live.network || row.network,
      };
    });
  }
  return list
    .filter((row) => !LEGACY_CRYPTO.has(String(row.id || "").toLowerCase()))
    .map((row) => {
      const id = String(row.id);
      return {
        id,
        name: String(row.name || "").toUpperCase(),
        network: String(row.network || "Bank"),
        min: String(row.min || "1"),
        address: String(row.address || row.accountNumber || ""),
        enabled: row.enabled !== false,
        ...rail(row, id),
      };
    });
}

export function payDestination(row: CurrencyRow) {
  const raw = String(row.accountNumber || row.iban || row.address || "").trim();
  if (!raw || /^OLX-/i.test(raw)) return "";
  return raw;
}
