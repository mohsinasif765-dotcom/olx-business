import { getSessionAccount } from "@/lib/session";
import { loadWallets } from "@/lib/wallets";

export type CarHolding = {
  id: string;
  account: string;
  planId: string;
  name: string;
  kind: string;
  invest: string;
  investAmount: number;
  returns: string;
  term: string;
  image: string;
  status: "active" | "ended";
  startedAt: string;
};

export async function loadGarage() {
  const account = getSessionAccount();
  const wallets = await loadWallets();
  if (!account) return { account: null, holdings: [] as CarHolding[], wallets };
  try {
    const res = await fetch(`/api/invest?account=${encodeURIComponent(account)}`, { cache: "no-store" });
    const data = (await res.json()) as { holdings?: CarHolding[]; invest?: number; brokerage?: number };
    return {
      account,
      holdings: Array.isArray(data.holdings) ? data.holdings : [],
      wallets: {
        invest: Number(data.invest ?? wallets.invest) || 0,
        brokerage: Number(data.brokerage ?? wallets.brokerage) || 0,
      },
    };
  } catch {
    return { account, holdings: [] as CarHolding[], wallets };
  }
}

export async function buyCarPackage(planId: string) {
  return buyCatalogPackage(planId, "car");
}

export async function buyShopPackage(planId: string) {
  return buyCatalogPackage(planId, "shop");
}

async function buyCatalogPackage(planId: string, catalog: "car" | "shop") {
  const account = getSessionAccount();
  if (!account) return { ok: false as const, error: "login" as const };
  try {
    const res = await fetch("/api/invest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, planId, catalog }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; need?: number };
    if (!res.ok || !data.ok) {
      return { ok: false as const, error: (data.error || "required") as string, need: data.need };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "required" as const };
  }
}
