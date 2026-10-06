import { clearSnapshotCache, readSnapshotPayload, rememberSnapshot } from "@/lib/server/snapshot";
import { zuvoAdmin } from "@/lib/zuvo";

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

type Snapshot = {
  holdings?: CarHolding[];
  settings?: { packagesOn?: boolean; maintenance?: string; siteName?: string };
};

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

export function parseInvestMin(range: string) {
  const match = String(range).replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export async function readSnapshot(): Promise<Snapshot> {
  return (await readSnapshotPayload()) as Snapshot;
}

async function writeSnapshot(payload: Record<string, unknown>) {
  const { error } = await zuvoAdmin().from("ops_snapshot").upsert({
    id: 1,
    payload,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    clearSnapshotCache();
    throw error;
  }
  rememberSnapshot(payload);
}

export async function listHoldings(account?: string) {
  const snap = await readSnapshot();
  const rows = Array.isArray(snap.holdings) ? snap.holdings : [];
  if (!account) return rows;
  return rows.filter((row) => row.account === account);
}

export async function buyPackage(input: { account: string; planId: string }) {
  const account = input.account.trim().toLowerCase();
  const db = zuvoAdmin();
  const snap = (await readSnapshotPayload(true)) as Snapshot;
  if (snap.settings && snap.settings.packagesOn === false) {
    return { ok: false as const, error: "paused" as const };
  }

  const { data: plan, error: planError } = await db
    .from("car_packages")
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
    image: String(plan.image),
    status: "active",
    startedAt: new Date().toISOString(),
  };

  const payload = { ...(snap as Record<string, unknown>), holdings: [holding, ...(Array.isArray(snap.holdings) ? snap.holdings : [])] };
  await writeSnapshot(payload);
  try {
    await db.from("car_holdings").upsert({
      id: holding.id,
      account: holding.account,
      plan_id: holding.planId,
      name: holding.name,
      kind: holding.kind,
      invest: holding.invest,
      invest_amount: holding.investAmount,
      returns: holding.returns,
      term: holding.term,
      image: holding.image,
      status: holding.status,
      started_at: holding.startedAt,
    });
  } catch {
    /* optional table */
  }

  return { ok: true as const, holding, invest: nextInvest };
}
