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

export async function signIn(input: {
  account: string;
  loginPassword: string;
  securityPassword?: string;
  isRegister: boolean;
  invite?: string;
  name?: string;
}): Promise<
  | { ok: true; account: string; invite: string }
  | { ok: false; error: "exists" | "badpass" | "required" | "paused" | "frozen" | "missing" }
> {
  const account = input.account.trim();
  if (!account || !input.loginPassword.trim()) {
    return { ok: false, error: "required" };
  }
  if (input.isRegister && !String(input.securityPassword || "").trim()) {
    return { ok: false, error: "required" };
  }

  const key = accountKey(account);
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account,
        loginPassword: input.loginPassword,
        securityPassword: input.securityPassword || "",
        isRegister: input.isRegister,
        action: input.isRegister ? "register" : "login",
        invite: input.invite || "",
        name: input.name || "",
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      account?: string;
      invite?: string;
    };
    if (res.status === 409 || data.error === "exists") return { ok: false, error: "exists" };
    if (data.error === "missing" || res.status === 404) return { ok: false, error: "missing" };
    if (data.error === "badpass" || res.status === 401) return { ok: false, error: "badpass" };
    if (data.error === "paused") return { ok: false, error: "paused" };
    if (data.error === "frozen") return { ok: false, error: "frozen" };
    if (data.error === "missing") return { ok: false, error: "missing" };
    if (!res.ok || data.error === "required") return { ok: false, error: "required" };
    const saved = data.account || account;
    const all = readAccounts();
    all[key] = {
      account: saved,
      loginPassword: input.loginPassword,
      securityPassword: input.securityPassword || input.loginPassword,
    };
    writeAccounts(all);
    setSessionAccount(saved);
    if (data.invite) window.localStorage.setItem("olx-invite-code", data.invite);
    return { ok: true, account: saved, invite: data.invite || "" };
  } catch {
    return { ok: false, error: "required" };
  }
}

export async function verifySecurityPassword(password: string) {
  const account = getSessionAccount();
  if (!account) return false;
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, action: "verify", securityPassword: password }),
    });
    return res.ok;
  } catch {
    return false;
  }
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
