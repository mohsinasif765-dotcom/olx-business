import { getSessionAccount } from "@/lib/session";

export function postLedger(body: Record<string, unknown>) {
  const account = getSessionAccount();
  if (!account) return Promise.resolve();
  return fetch("/api/ledger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account, ...body }),
  }).catch(() => {});
}
