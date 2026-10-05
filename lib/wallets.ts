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

export function getWallets() {
  return {
    invest: readNumber(INVEST_KEY),
    brokerage: readNumber(BROKER_KEY),
  };
}

export function setWallet(kind: "invest" | "brokerage", value: number) {
  const key = kind === "invest" ? INVEST_KEY : BROKER_KEY;
  window.localStorage.setItem(key, String(Math.max(0, Number(value.toFixed(2)))));
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

export function moveFunds(from: "invest" | "brokerage", to: "invest" | "brokerage", amount: number) {
  const wallets = getWallets();
  if (from === to) return { ok: false as const, error: "same" };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false as const, error: "amount" };
  if (wallets[from] < amount) return { ok: false as const, error: "insufficient" };
  setWallet(from, wallets[from] - amount);
  setWallet(to, wallets[to] + amount);
  addTransfer({
    id: `${Date.now()}`,
    from,
    to,
    amount: amount.toFixed(2),
    at: new Date().toLocaleString(),
  });
  return { ok: true as const };
}
