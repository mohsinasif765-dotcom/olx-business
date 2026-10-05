export type AccountRecord = {
  account: string;
  loginPassword: string;
  securityPassword: string;
};

const ACCOUNTS_KEY = "olx-accounts";
const SESSION_KEY = "olx-session-account";

function readAccounts(): Record<string, AccountRecord> {
  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || "{}") as Record<
      string,
      AccountRecord
    >;
  } catch {
    return {};
  }
}

function writeAccounts(all: Record<string, AccountRecord>) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(all));
}

export function accountKey(account: string) {
  return account.trim().toLowerCase();
}

export function getSessionAccount(): string | null {
  return window.localStorage.getItem(SESSION_KEY);
}

export function getCurrentAccount(): AccountRecord | null {
  const account = getSessionAccount();
  if (!account) return null;
  return readAccounts()[accountKey(account)] ?? null;
}

export function setSessionAccount(account: string) {
  window.localStorage.setItem(SESSION_KEY, account);
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function signIn(input: {
  account: string;
  loginPassword: string;
  securityPassword?: string;
  isRegister: boolean;
}): { ok: true } | { ok: false; error: "exists" | "badpass" | "required" } {
  const account = input.account.trim();
  if (!account || !input.loginPassword.trim()) {
    return { ok: false, error: "required" };
  }

  const key = accountKey(account);
  const all = readAccounts();
  const existing = all[key];

  if (input.isRegister) {
    if (existing) return { ok: false, error: "exists" };
    all[key] = {
      account,
      loginPassword: input.loginPassword,
      securityPassword: input.securityPassword || "",
    };
    writeAccounts(all);
    setSessionAccount(account);
    return { ok: true };
  }

  if (existing) {
    if (existing.loginPassword !== input.loginPassword) {
      return { ok: false, error: "badpass" };
    }
    setSessionAccount(existing.account);
    return { ok: true };
  }

  all[key] = {
    account,
    loginPassword: input.loginPassword,
    securityPassword: input.securityPassword || input.loginPassword,
  };
  writeAccounts(all);
  setSessionAccount(account);
  return { ok: true };
}

export function updatePasswords(patch: Partial<Pick<AccountRecord, "loginPassword" | "securityPassword">>) {
  const current = getCurrentAccount();
  if (!current) return false;
  const all = readAccounts();
  all[accountKey(current.account)] = { ...current, ...patch };
  writeAccounts(all);
  return true;
}

export function maskAccount(account: string) {
  if (account.includes("@")) {
    const [user, domain] = account.split("@");
    const head = user.slice(0, 2);
    const tail = user.length > 6 ? user.slice(-4) : "";
    return `${head}****${tail}@${domain}`;
  }
  const digits = account.replace(/\s/g, "");
  if (digits.length < 7) return `${digits.slice(0, 2)}****`;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}
