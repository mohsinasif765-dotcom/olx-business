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

  // Admin pay_rails is source of truth — do not inject default USD/EUR/PKR extras
  // on top of live rows (that caused duplicate "PKR" + "PKR EASYPAISA" cards).
  return sortCurrencies([...unique.values()]);
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

/** Filter pay rails for the member app from admin walletMode. */
export function filterCoinsByWalletMode(
  rows: CurrencyRow[] | undefined | null,
  mode: unknown
): CurrencyRow[] {
  const list = migrateCurrencies(rows).filter((row) => row.enabled !== false);
  const walletMode = normalizeWalletMode(mode);
  if (walletMode === "pkr") {
    // All fiat / bank rails (JazzCash, EasyPaisa, PKR…) — hide crypto/USDT
    return list.filter((row) => !isUsdtRow(row));
  }
  if (walletMode === "usdt") {
    // Crypto / USDT rails only
    return list.filter(isUsdtRow);
  }
  // dual: every enabled rail
  return list;
}

/** Wallet UI currency from admin mode. Dual = USDT ledger + PKR shown beside it. */
export function pickDisplayCurrency(
  rows: CurrencyRow[] | undefined | null,
  mode?: unknown
): string {
  const walletMode = normalizeWalletMode(mode ?? "pkr");
  if (walletMode === "pkr") return "PKR";
  if (walletMode === "usdt") return "USDT";
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

type DepositLike = { id?: string; network?: string; status?: string; at?: string };

function depositRank(row: DepositLike) {
  const status = String(row.status || "").toLowerCase();
  if (/^(approved|done|success|credited|complete|paid)/.test(status)) return 3;
  if (status === "pending") return 2;
  if (status === "rejected") return 0;
  return 1;
}

function depositTime(row: DepositLike) {
  const t = Date.parse(String(row.at || ""));
  if (Number.isFinite(t)) return t;
  const id = String(row.id || "");
  const digits = id.replace(/\D/g, "");
  return digits ? Number(digits.slice(-12)) || 0 : 0;
}

/**
 * Currency for home balance: latest paid/approved fund, else latest pending fund,
 * else admin walletMode fallback.
 */
export function currencyFromMemberDeposits(rows: DepositLike[] | undefined | null, fallback: string): string {
  const list = (rows || [])
    .filter((row) => depositRank(row) > 0)
    .sort((a, b) => {
      const rank = depositRank(b) - depositRank(a);
      if (rank !== 0) return rank;
      return depositTime(b) - depositTime(a);
    });
  if (!list.length) return fallback;
  const code = normalizeCurrencyCode(list[0]?.network);
  return code || fallback;
}

/**
 * Clamp a code to what the admin wallet mode allows.
 * PKR-only / USDT-only stay locked; dual keeps the real rail code (USD, EUR, PKR…).
 */
export function clampDisplayCurrency(code: unknown, mode?: unknown): string {
  const walletMode = normalizeWalletMode(mode ?? "pkr");
  if (walletMode === "pkr") return "PKR";
  if (walletMode === "usdt") return "USDT";
  const c = normalizeCurrencyCode(code);
  if (!c) return "PKR";
  if (c === "USDT") return "USDT";
  if ((KNOWN_CODES as readonly string[]).includes(c)) return c;
  return "PKR";
}

/** Single resolver: admin walletMode locks PKR/USDT; dual stays USDT + PKR pair. */
export function resolveMemberDisplayCurrency(opts: {
  coins?: CurrencyRow[] | null;
  walletMode?: unknown;
  deposits?: DepositLike[] | null;
  prefer?: string | null;
}): string {
  const mode = normalizeWalletMode(opts.walletMode);
  if (mode === "pkr") return "PKR";
  if (mode === "usdt") return "USDT";
  return "USDT";
}

/** Digits-only amount from admin min fields like "$50", "Rs 1,000", "50 PKR". */
export function sanitizeMoneyAmount(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const match = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : "";
}

/** Parse plan invest text like "$300 – $500" / "Rs 300-500" → { min, max }. */
export function parseInvestRange(raw: unknown): { min: number; max: number } {
  const s = String(raw ?? "").replace(/,/g, " ");
  const nums = [...s.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1])).filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return { min: 0, max: 0 };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}

/**
 * When funding for a package, deposit min = max(rail min, plan invest min).
 * Without a plan, rail min only.
 */
export function effectiveDepositMin(railMin: unknown, planInvest?: unknown): number {
  const rail = Number(sanitizeMoneyAmount(railMin)) || 0;
  const plan = parseInvestRange(planInvest).min;
  return Math.max(rail, plan);
}

/** Prefix / unit for a currency code — each rail keeps its own unit. */
export function moneyPrefix(code: string): string {
  const c = normalizeCurrencyCode(code) || "PKR";
  if (c === "USDT") return "USDT";
  if (c === "USD") return "$";
  if (c === "PKR") return "Rs";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  return c;
}

/** One unit only — e.g. "Rs 50", "$ 10", "50 USDT", "₹" style via code. Never "$50 PKR". */
export function formatMoneyLabel(amount: unknown, code: string): string {
  const n = sanitizeMoneyAmount(amount);
  const unit = moneyPrefix(code);
  if (!n) return unit;
  if (unit === "Rs" || unit === "$" || unit === "€" || unit === "£") return `${unit} ${n}`;
  return `${n} ${unit}`;
}

/** Rewrite plan strings like "$100 – $199" to match member display currency. */
export function localizeMoneyText(text: string, code: string): string {
  const raw = String(text || "");
  if (!raw) return raw;
  const prefix = moneyPrefix(code);
  if (prefix === "$") return raw;
  return raw
    .replace(/\$\s*/g, prefix === "Rs" ? "Rs " : `${prefix} `)
    .replace(/\bUSD\b/gi, prefix === "Rs" ? "PKR" : prefix)
    .replace(/Rs\s+Rs\s+/g, "Rs ");
}

/** Currency code from a pay rail — uses rail id/name (USD, EUR, PKR…), not network country. */
export function currencyCodeFromRail(row: {
  id?: string;
  name?: string;
  network?: string;
  payKind?: string;
}): string {
  if (row.payKind === "crypto" || isUsdtRow(row as CurrencyRow) || isCryptoId(String(row.id || ""))) {
    return "USDT";
  }
  const fromId = normalizeCurrencyCode(row.id);
  if (fromId && (KNOWN_CODES as readonly string[]).includes(fromId)) return fromId;
  const fromName = normalizeCurrencyCode(row.name);
  if (fromName && (KNOWN_CODES as readonly string[]).includes(fromName)) return fromName;
  if (/\bpakistan\b/i.test(String(row.network || ""))) return "PKR";
  return fromName || fromId || "PKR";
}

/** Member-facing method title: bank name, or name without leading currency code. */
export function railDisplayTitle(row: {
  id?: string;
  name?: string;
  bankName?: string;
  payKind?: string;
  network?: string;
}): string {
  const bank = String(row.bankName || "").trim();
  if (bank) return bank;
  const raw = String(row.name || row.id || "").trim();
  if (!raw) return "Pay";
  const code = currencyCodeFromRail(row);
  const stripped = raw.replace(new RegExp(`^${code}\\s*[·\\-–:]?\\s*`, "i"), "").trim();
  if (stripped && stripped.toUpperCase() !== code) return stripped;
  return raw;
}
