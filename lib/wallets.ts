import { getSessionAccount } from "@/lib/session";

export type TransferRecord = {
  id: string;
  from: "invest" | "brokerage";
  to: "invest" | "brokerage";
  amount: string;
  at: string;
};

const INVEST_KEY = "olx-usdt-balance";
const BROKER_KEY = "olx-brokerage-balance";
const TRANSFER_KEY = "olx-transfer-history";

function readNumber(key: string) {
  const value = Number(window.localStorage.getItem(key) || "0");
  return Number.isFinite(value) ? value : 0;
}

function writeLocal(invest: number, brokerage: number) {
  window.localStorage.setItem(INVEST_KEY, String(Math.max(0, Number(invest.toFixed(2)))));
  window.localStorage.setItem(BROKER_KEY, String(Math.max(0, Number(brokerage.toFixed(2)))));
}

export function getWallets() {
  return {
    invest: readNumber(INVEST_KEY),
    brokerage: readNumber(BROKER_KEY),
  };
}

export function setWallet(kind: "invest" | "brokerage", value: number) {
  const next = Math.max(0, Number(value.toFixed(2)));
  window.localStorage.setItem(kind === "invest" ? INVEST_KEY : BROKER_KEY, String(next));
}

export async function loadWallets() {
  const account = getSessionAccount();
  if (!account) return getWallets();
  try {
    const res = await fetch(`/api/wallet?account=${encodeURIComponent(account)}`);
    const data = (await res.json()) as { invest?: number; brokerage?: number };
    if (!res.ok) return getWallets();
    const invest = Number(data.invest) || 0;
    const brokerage = Number(data.brokerage) || 0;
    writeLocal(invest, brokerage);
    return { invest, brokerage };
  } catch {
    return getWallets();
  }
}

async function postWallet(body: Record<string, unknown>) {
  const account = getSessionAccount();
  if (!account) return { ok: false as const, error: "required" as const, wallets: getWallets() };
  try {
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, ...body }),
    });
    const data = (await res.json()) as { invest?: number; brokerage?: number; error?: string };
    if (!res.ok) {
      return { ok: false as const, error: (data.error || "required") as "required" | "insufficient" | "same", wallets: getWallets() };
    }
    const wallets = { invest: Number(data.invest) || 0, brokerage: Number(data.brokerage) || 0 };
    writeLocal(wallets.invest, wallets.brokerage);
    return { ok: true as const, wallets };
  } catch {
    return { ok: false as const, error: "required" as const, wallets: getWallets() };
  }
}

export async function creditWallet(kind: "invest" | "brokerage", amount: number) {
  return postWallet({ action: "credit", wallet: kind, amount });
}

export async function debitWallet(kind: "invest" | "brokerage", amount: number) {
  return postWallet({ action: "debit", wallet: kind, amount });
}

export function getTransferHistory(): TransferRecord[] {
  try {
    return JSON.parse(window.localStorage.getItem(TRANSFER_KEY) || "[]") as TransferRecord[];
  } catch {
    return [];
  }
}

export function addTransfer(record: TransferRecord) {
  const next = [record, ...getTransferHistory()];
  window.localStorage.setItem(TRANSFER_KEY, JSON.stringify(next));
}

export async function moveFunds(from: "invest" | "brokerage", to: "invest" | "brokerage", amount: number) {
  if (from === to) return { ok: false as const, error: "same" };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false as const, error: "amount" };
  const result = await postWallet({ action: "transfer", from, to, amount });
  if (!result.ok) return { ok: false as const, error: result.error === "insufficient" ? "insufficient" : "amount" };
  addTransfer({
    id: `${Date.now()}`,
    from,
    to,
    amount: amount.toFixed(2),
    at: new Date().toLocaleString(),
  });
  return { ok: true as const };
}
