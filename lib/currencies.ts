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

export function isBankCurrency(id: string, name?: string) {
  const key = String(id || name || "").toLowerCase();
  return key !== "usdt";
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
  { id: "bdt", name: "BDT", network: "Bangladesh", min: "500", address: "", enabled: true, ...rail({}, "bdt") },
  { id: "cny", name: "CNY", network: "China", min: "50", address: "", enabled: true, ...rail({}, "cny") },
];

const LEGACY_CRYPTO = new Set(["usdc", "btc", "eth", "bnb"]);
const ORDER = ["usdt", "pkr", "usd", "eur", "gbp", "aed", "sar", "inr", "bdt", "cny"];

function normalizeId(row: Partial<CurrencyRow>) {
  return String(row.id || row.name || "coin")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "coin";
}

/** Fix bad admin rows like name=USD + network=Pakistan → PKR */
function repairPakistanMislabel(row: CurrencyRow): CurrencyRow {
  const network = String(row.network || "").toLowerCase();
  const name = String(row.name || "").toUpperCase();
  const id = String(row.id || "").toLowerCase();
  if (network.includes("pakistan") && (name === "USD" || id === "usd" || id.includes("pakistan"))) {
    return {
      ...row,
      id: "pkr",
      name: "PKR",
      network: "Pakistan",
      payKind: "bank",
      min: row.min || "1000",
    };
  }
  if (name === "PKR" || id === "pkr") {
    return {
      ...row,
      id: "pkr",
      name: "PKR",
      network: row.network && !/bank/i.test(row.network) ? row.network : "Pakistan",
      payKind: "bank",
    };
  }
  return row;
}

function sortCurrencies(rows: CurrencyRow[]) {
  return [...rows].sort((a, b) => {
    const ai = ORDER.indexOf(String(a.id).toLowerCase());
    const bi = ORDER.indexOf(String(b.id).toLowerCase());
    const av = ai === -1 ? 100 : ai;
    const bv = bi === -1 ? 100 : bi;
    if (av !== bv) return av - bv;
    return String(a.name).localeCompare(String(b.name));
  });
}

/** Always keep PKR (and other defaults) available even if DB list omitted them. */
function ensureDefaults(rows: CurrencyRow[]) {
  const byId = new Map(rows.map((row) => [String(row.id).toLowerCase(), row]));
  for (const def of DEFAULT_CURRENCIES) {
    if (!byId.has(def.id)) {
      byId.set(def.id, { ...def });
    }
  }
  return sortCurrencies([...byId.values()]);
}

export function migrateCurrencies(rows: CurrencyRow[] | undefined | null): CurrencyRow[] {
  const list = Array.isArray(rows) ? rows : [];
  const ids = new Set(list.map((row) => String(row.id || "").toLowerCase()));
  const looksLegacy = ids.has("btc") && ids.has("eth") && ids.has("bnb");

  if (!list.length || looksLegacy) {
    return ensureDefaults(
      DEFAULT_CURRENCIES.map((row) => {
        const live = list.find((item) => String(item.id).toLowerCase() === row.id);
        if (!live) return { ...row };
        return repairPakistanMislabel({
          ...row,
          ...rail(live, row.id),
          address: live.address || live.accountNumber || row.address,
          min: live.min || row.min,
          enabled: live.enabled !== false,
          network: live.network || row.network,
          name: live.name || row.name,
        });
      })
    );
  }

  const migrated = list
    .filter((row) => !LEGACY_CRYPTO.has(String(row.id || "").toLowerCase()))
    .map((row) => {
      const id = normalizeId(row);
      return repairPakistanMislabel({
        id,
        name: String(row.name || "").toUpperCase() || id.toUpperCase(),
        network: String(row.network || "Bank"),
        min: String(row.min || "1"),
        address: String(row.address || row.accountNumber || ""),
        enabled: row.enabled !== false,
        ...rail(row, id),
      });
    });

  // Dedupe by id (keep first repaired row)
  const unique = new Map<string, CurrencyRow>();
  for (const row of migrated) {
    const key = String(row.id).toLowerCase();
    if (!unique.has(key)) unique.set(key, row);
  }

  return ensureDefaults([...unique.values()]);
}

export function payDestination(row: CurrencyRow) {
  const raw = String(row.accountNumber || row.iban || row.address || "").trim();
  if (!raw || /^OLX-/i.test(raw)) return "";
  return raw;
}

export type WalletMode = "pkr" | "usdt" | "dual";

export function normalizeWalletMode(value: unknown): WalletMode {
  const mode = String(value || "pkr").toLowerCase();
  if (mode === "usdt") return "usdt";
  if (mode === "dual") return "dual";
  return "pkr";
}

function isUsdtRow(row: Pick<CurrencyRow, "id" | "name" | "payKind">) {
  const id = String(row.id || "").toLowerCase();
  const name = String(row.name || "").toUpperCase();
  return id === "usdt" || name === "USDT" || row.payKind === "crypto";
}

function isPkrRow(row: Pick<CurrencyRow, "id" | "name">) {
  const id = String(row.id || "").toLowerCase();
  const name = String(row.name || "").toUpperCase();
  return id === "pkr" || name === "PKR";
}

/** Filter pay rails for the member app from admin walletMode. */
export function filterCoinsByWalletMode(
  rows: CurrencyRow[] | undefined | null,
  mode: unknown
): CurrencyRow[] {
  const list = migrateCurrencies(rows).filter((row) => row.enabled !== false);
  const walletMode = normalizeWalletMode(mode);
  if (walletMode === "pkr") {
    const pkr = list.filter(isPkrRow);
    return pkr.length ? pkr : list.filter((row) => !isUsdtRow(row));
  }
  if (walletMode === "usdt") {
    const usdt = list.filter(isUsdtRow);
    return usdt.length ? usdt : list.filter((row) => String(row.id).toLowerCase() === "usdt");
  }
  return list;
}

/** Wallet UI currency from admin mode (+ rails fallback for dual). */
export function pickDisplayCurrency(
  rows: CurrencyRow[] | undefined | null,
  mode?: unknown
): string {
  const walletMode = normalizeWalletMode(mode ?? "pkr");
  if (walletMode === "pkr") return "PKR";
  if (walletMode === "usdt") return "USDT";
  const list = filterCoinsByWalletMode(rows, "dual");
  const pkr = list.find(isPkrRow);
  if (pkr) return "PKR";
  const bank = list.find((row) => !isUsdtRow(row));
  if (bank) return String(bank.name || bank.id).toUpperCase();
  return "USDT";
}

const KNOWN_CODES = ["USDT", "PKR", "USD", "EUR", "GBP", "AED", "SAR", "INR", "BDT", "CNY"] as const;

/** Normalize recharge.network / withdraw.wallet labels → currency code. */
export function normalizeCurrencyCode(raw: unknown): string {
  const s = String(raw || "").trim().toUpperCase();
  if (!s) return "";
  if (/\bUSDT\b|TETHER/.test(s)) return "USDT";
  if (/\bPKR\b|PAKISTAN|\bRS\.?\b/.test(s)) return "PKR";
  const token = (s.split(/[\s·|/,_-]+/).filter(Boolean).pop() || s).replace(/[^A-Z0-9]/g, "");
  for (const code of KNOWN_CODES) {
    if (token === code || s === code) return code;
  }
  if (/^[A-Z]{3,5}$/.test(token)) return token;
  return token.slice(0, 8);
}

type DepositLike = { network?: string; status?: string };

/**
 * Currency for a member's home balance: latest approved deposit, else latest
 * non-rejected deposit, else fallback (admin wallet mode).
 */
export function currencyFromMemberDeposits(rows: DepositLike[] | undefined | null, fallback: string): string {
  const list = (rows || []).filter((row) => String(row.status || "").toLowerCase() !== "rejected");
  if (!list.length) return fallback;
  const approved = list.filter((row) =>
    /^(approved|done|success|credited|complete|paid)/i.test(String(row.status || "").trim())
  );
  const pool = approved.length ? approved : list;
  const code = normalizeCurrencyCode(pool[0]?.network);
  return code || fallback;
}

/** Single resolver: deposits when present, else admin walletMode. */
export function resolveMemberDisplayCurrency(opts: {
  coins?: CurrencyRow[] | null;
  walletMode?: unknown;
  deposits?: DepositLike[] | null;
}): string {
  const fallback = pickDisplayCurrency(opts.coins, opts.walletMode);
  return currencyFromMemberDeposits(opts.deposits, fallback);
}

/** Prefix shown before amounts on Home / Team. */
export function moneyPrefix(code: string): string {
  const c = String(code || "PKR").toUpperCase();
  if (c === "USD") return "$";
  if (c === "PKR") return "Rs";
  if (c === "USDT") return "USDT";
  return c;
}
