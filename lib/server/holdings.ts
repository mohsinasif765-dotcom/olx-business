import { payTeamEarnings } from "@/lib/server/earnings";
import {
  insertHolding,
  insertLedgerTx,
  insertShopHolding,
  readHoldings,
  readSettings,
  readShopHoldings,
  type HoldingRow,
} from "@/lib/server/db-tables";
import { zuvoAdmin } from "@/lib/zuvo";

export type CarHolding = HoldingRow;
export type CatalogKind = "car" | "shop";

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

export function parseInvestMin(range: string) {
  const match = String(range).replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function holdingImage(catalog: CatalogKind, planId: string, image: string) {
  if (catalog === "shop") return `/api/shop-photo/${encodeURIComponent(planId)}`;
  if (image.startsWith("data:image/")) return `/api/car-photo/${encodeURIComponent(planId)}`;
  return image || `/api/car-photo/${encodeURIComponent(planId)}`;
}

export async function listHoldings(account?: string) {
  const [cars, shop] = await Promise.all([readHoldings(account), readShopHoldings(account)]);
  return [...cars, ...shop].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
}

export async function buyPackage(input: { account: string; planId: string; catalog?: CatalogKind }) {
  const account = input.account.trim().toLowerCase();
  const catalog: CatalogKind = input.catalog === "shop" ? "shop" : "car";
  const table = catalog === "shop" ? "shop_packages" : "car_packages";
  const db = zuvoAdmin();
  const settings = await readSettings();
  if (settings && settings.packagesOn === false) {
    return { ok: false as const, error: "paused" as const };
  }

  const { data: plan, error: planError } = await db
    .from(table)
    .select("id,name,kind,invest,returns,term,image,enabled")
    .eq("id", input.planId)
    .maybeSingle();
  if (planError) throw planError;
  if (!plan || plan.enabled === false) return { ok: false as const, error: "missing" as const };

  const amount = parseInvestMin(String(plan.invest));
  if (amount <= 0) return { ok: false as const, error: "missing" as const };

  const { data: member, error: memberError } = await db
    .from("members")
    .select("id,account,invest,status,vip")
    .eq("account", account)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member) return { ok: false as const, error: "login" as const };
  if (member.status === "frozen" || member.status === "banned") {
    return { ok: false as const, error: "frozen" as const };
  }

  const invest = money(member.invest);
  if (invest < amount) return { ok: false as const, error: "insufficient" as const, need: amount, invest };

  const nextInvest = money(invest - amount);
  const { error: walletError } = await db
    .from("members")
    .update({ invest: nextInvest, vip: String(plan.name) })
    .eq("account", account);
  if (walletError) throw walletError;

  const holding: CarHolding = {
    id: `h${Date.now().toString(36)}`,
    account,
    planId: String(plan.id),
    name: String(plan.name),
    kind: String(plan.kind),
    invest: String(plan.invest),
    investAmount: amount,
    returns: String(plan.returns),
    term: String(plan.term),
    image: holdingImage(catalog, String(plan.id), String(plan.image || "")),
    status: "active",
    startedAt: new Date().toISOString(),
  };
  if (catalog === "shop") await insertShopHolding(holding);
  else await insertHolding(holding);
  await insertLedgerTx({
    id: `i${holding.id}`,
    account,
    kind: "invest",
    amount,
    wallet: "invest",
    status: "paid",
    note: `Package ${holding.name}`,
    at: holding.startedAt,
  });
  await payTeamEarnings(account, amount, `invest ${holding.name}`);
  return { ok: true as const, holding, invest: nextInvest };
}
