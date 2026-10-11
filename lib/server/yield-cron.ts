import { insertLedgerTx, type HoldingRow } from "@/lib/server/db-tables";
import { parseDailyReturnUsdt, parseTermDays } from "@/lib/package-yield";
import { zuvoAdmin } from "@/lib/zuvo";

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(4)) : 0;
}

export const parseDailyReturn = parseDailyReturnUsdt;

function mapRow(row: Record<string, unknown>): HoldingRow {
  const started = String(row.started_at || "");
  return {
    id: String(row.id),
    account: String(row.account),
    planId: String(row.plan_id || ""),
    name: String(row.name || ""),
    kind: String(row.kind || ""),
    invest: String(row.invest || ""),
    investAmount: money(row.invest_amount),
    returns: String(row.returns || ""),
    term: String(row.term || ""),
    image: String(row.image || ""),
    status: row.status === "ended" ? "ended" : "active",
    startedAt: started,
    earnedTotal: money(row.earned_total),
    lastPayoutAt: String(row.last_payout_at || started || ""),
  };
}

async function loadActive(table: "car_holdings" | "shop_holdings", account?: string) {
  let q = zuvoAdmin().from(table).select("*").eq("status", "active");
  if (account) q = q.eq("account", account.trim().toLowerCase());
  const { data, error } = await q;
  if (error) {
    if (String(error.message || "").includes("earned_total")) return [] as HoldingRow[];
    throw error;
  }
  return (data || []).map((row) => mapRow(row as Record<string, unknown>));
}

/**
 * Credit hourly slice of daily return to invest wallet.
 * dailyReturn / 24 per full hour since last_payout_at; capped by daily × term days.
 */
export async function settlePackageYield(opts?: { account?: string }) {
  const db = zuvoAdmin();
  const [cars, shop] = await Promise.all([
    loadActive("car_holdings", opts?.account),
    loadActive("shop_holdings", opts?.account),
  ]);
  const rows = [
    ...cars.map((h) => ({ h, table: "car_holdings" as const })),
    ...shop.map((h) => ({ h, table: "shop_holdings" as const })),
  ];

  const now = Date.now();
  let credited = 0;
  let holdingsTouched = 0;

  for (const { h, table } of rows) {
    const daily = parseDailyReturn(h.returns);
    if (daily <= 0) continue;
    const termDays = parseTermDays(h.term) || 90;
    const maxEarn = money(daily * termDays);
    const already = money(h.earnedTotal);
    if (already >= maxEarn) {
      await db.from(table).update({ status: "ended" }).eq("id", h.id);
      continue;
    }

    const lastMs = Date.parse(h.lastPayoutAt || h.startedAt) || now;
    const hours = Math.floor((now - lastMs) / (60 * 60 * 1000));
    if (hours < 1) continue;

    const hourly = daily / 24;
    let pay = money(hourly * hours);
    const room = money(maxEarn - already);
    if (pay > room) pay = room;
    if (pay <= 0) continue;

    const account = h.account.trim().toLowerCase();
    const { data: member, error: memErr } = await db
      .from("members")
      .select("invest")
      .eq("account", account)
      .maybeSingle();
    if (memErr || !member) continue;

    const nextInvest = money(Number(member.invest) + pay);
    const nextEarned = money(already + pay);
    const nextPayout = new Date(lastMs + hours * 60 * 60 * 1000).toISOString();
    const ended = nextEarned >= maxEarn;

    const { error: walletErr } = await db.from("members").update({ invest: nextInvest }).eq("account", account);
    if (walletErr) continue;

    const { error: holdErr } = await db
      .from(table)
      .update({
        earned_total: nextEarned,
        last_payout_at: nextPayout,
        status: ended ? "ended" : "active",
      })
      .eq("id", h.id);
    if (holdErr) {
      // rollback wallet best-effort
      await db.from("members").update({ invest: money(member.invest) }).eq("account", account);
      continue;
    }

    try {
      await insertLedgerTx({
        id: `y${h.id}${Date.now().toString(36)}`,
        account,
        kind: "yield",
        amount: pay,
        wallet: "invest",
        status: "paid",
        note: `Hourly yield ${h.name} (${hours}h)`,
        at: new Date().toISOString(),
      });
    } catch {
      /* ledger optional */
    }

    credited = money(credited + pay);
    holdingsTouched += 1;
  }

  return { ok: true as const, holdingsTouched, credited };
}
