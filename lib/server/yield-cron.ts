import { insertLedgerTx, type HoldingRow } from "@/lib/server/db-tables";
import { parseDailyReturnUsdt, parseTermDays, termEndMs } from "@/lib/package-yield";
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
    paidTotal: money(row.paid_total),
    lastPayoutAt: String(row.last_payout_at || started || ""),
  };
}

async function loadOpen(table: "car_holdings" | "shop_holdings", account?: string) {
  let q = zuvoAdmin().from(table).select("*").neq("status", "ended");
  if (account) q = q.eq("account", account.trim().toLowerCase());
  const { data, error } = await q;
  if (error) {
    if (String(error.message || "").includes("earned_total") || String(error.message || "").includes("paid_total")) {
      return [] as HoldingRow[];
    }
    throw error;
  }
  return (data || []).map((row) => mapRow(row as Record<string, unknown>));
}

async function creditInvest(account: string, delta: number) {
  const pay = money(delta);
  if (pay <= 0) return null as number | null;
  const db = zuvoAdmin();
  const { data: member, error } = await db.from("members").select("invest").eq("account", account).maybeSingle();
  if (error || !member) return null;
  const next = money(Number(member.invest) + pay);
  const { error: saveError } = await db.from("members").update({ invest: next }).eq("account", account);
  if (saveError) return null;
  return next;
}

/**
 * Accrue hourly profit and credit it to invest wallet (withdrawable).
 * When the term ends, also return the package principal (invest amount) to wallet
 * and mark the holding ended.
 */
export async function settlePackageYield(opts?: { account?: string }) {
  const db = zuvoAdmin();
  const [cars, shop] = await Promise.all([
    loadOpen("car_holdings", opts?.account),
    loadOpen("shop_holdings", opts?.account),
  ]);
  const rows = [
    ...cars.map((h) => ({ h, table: "car_holdings" as const })),
    ...shop.map((h) => ({ h, table: "shop_holdings" as const })),
  ];

  const now = Date.now();
  let accrued = 0;
  let credited = 0;
  let principalReturned = 0;
  let holdingsTouched = 0;

  for (const { h, table } of rows) {
    if (h.status === "ended") continue;
    const account = h.account.trim().toLowerCase();
    const daily = parseDailyReturn(h.returns);
    const termDays = parseTermDays(h.term) || 90;
    const maxEarn = money(daily * termDays);
    let already = money(h.earnedTotal);
    let paid = money(h.paidTotal);
    const endMs = termEndMs(h.startedAt, h.term) || now + termDays * 86400000;
    const matured = now >= endMs;

    if (daily > 0) {
      const lastMs = Date.parse(h.lastPayoutAt || h.startedAt) || now;
      const accrueUntil = Math.min(now, endMs);
      const hours = Math.floor((accrueUntil - lastMs) / (60 * 60 * 1000));

      if (hours >= 1 && already < maxEarn) {
        const hourly = daily / 24;
        let pay = money(hourly * hours);
        const room = money(maxEarn - already);
        if (pay > room) pay = room;
        if (pay > 0) {
          const nextEarned = money(already + pay);
          const nextPayout = new Date(lastMs + hours * 60 * 60 * 1000).toISOString();
          const { error: holdErr } = await db
            .from(table)
            .update({
              earned_total: nextEarned,
              last_payout_at: nextPayout,
              status: "active",
            })
            .eq("id", h.id);
          if (!holdErr) {
            accrued = money(accrued + pay);
            holdingsTouched += 1;
            already = nextEarned;
            h.earnedTotal = nextEarned;
            h.lastPayoutAt = nextPayout;
          }
        }
      }
    }

    // Credit unpaid profit into invest wallet (member can withdraw).
    const unpaidProfit = money(Math.max(0, already - paid));
    if (unpaidProfit > 0) {
      const nextInvest = await creditInvest(account, unpaidProfit);
      if (nextInvest != null) {
        const { error: paidErr } = await db
          .from(table)
          .update({ paid_total: already, last_payout_at: new Date().toISOString() })
          .eq("id", h.id);
        if (!paidErr) {
          paid = already;
          h.paidTotal = already;
          credited = money(credited + unpaidProfit);
          try {
            await insertLedgerTx({
              id: `y${h.id}${Date.now().toString(36)}`,
              account,
              kind: "yield",
              amount: unpaidProfit,
              wallet: "invest",
              status: "paid",
              note: `Package profit ${h.name}`,
              at: new Date().toISOString(),
            });
          } catch {
            /* optional */
          }
        } else {
          await creditInvest(account, -unpaidProfit);
        }
      }
    }

    // Package buy price returns only after term ends.
    if (matured) {
      const principal = money(h.investAmount);
      let investAfter: number | null = null;
      if (principal > 0) {
        investAfter = await creditInvest(account, principal);
        if (investAfter == null) continue;
        principalReturned = money(principalReturned + principal);
        try {
          await insertLedgerTx({
            id: `p${h.id}${Date.now().toString(36)}`,
            account,
            kind: "principal",
            amount: principal,
            wallet: "invest",
            status: "paid",
            note: `Package principal returned ${h.name}`,
            at: new Date().toISOString(),
          });
        } catch {
          /* optional */
        }
      }

      const { error: endErr } = await db
        .from(table)
        .update({
          status: "ended",
          paid_total: already,
          last_payout_at: new Date().toISOString(),
        })
        .eq("id", h.id);
      if (endErr && principal > 0) {
        await creditInvest(account, -principal);
      } else {
        h.status = "ended";
        holdingsTouched += 1;
      }
    }
  }

  return {
    ok: true as const,
    holdingsTouched,
    credited,
    accrued,
    principalReturned,
  };
}

/**
 * After term ends: credit any leftover unpaid profit + return package principal.
 * (Also runs settle first so hourly catch-up happens.)
 */
export async function claimHoldingProfit(input: { account: string; holdingId: string }) {
  const account = input.account.trim().toLowerCase();
  const holdingId = String(input.holdingId || "").trim();
  if (!account || !holdingId) return { ok: false as const, error: "required" as const };

  const db = zuvoAdmin();
  let table: "car_holdings" | "shop_holdings" = "car_holdings";
  let { data: row, error } = await db.from("car_holdings").select("*").eq("id", holdingId).maybeSingle();
  if (error) throw error;
  if (!row) {
    const shop = await db.from("shop_holdings").select("*").eq("id", holdingId).maybeSingle();
    if (shop.error) throw shop.error;
    row = shop.data;
    table = "shop_holdings";
  }
  if (!row) return { ok: false as const, error: "missing" as const };

  const h = mapRow(row as Record<string, unknown>);
  if (h.account !== account) return { ok: false as const, error: "forbidden" as const };
  if (h.status === "ended") return { ok: false as const, error: "claimed" as const };

  await settlePackageYield({ account });

  const refreshed = await db.from(table).select("*").eq("id", holdingId).maybeSingle();
  if (refreshed.error) throw refreshed.error;
  if (!refreshed.data) return { ok: true as const, amount: 0, invest: undefined as number | undefined };

  const hold = mapRow(refreshed.data as Record<string, unknown>);
  if (hold.status === "ended") {
    const { data: member } = await db.from("members").select("invest").eq("account", account).maybeSingle();
    return { ok: true as const, amount: 0, invest: money(member?.invest) };
  }

  const now = Date.now();
  const matured = now >= (termEndMs(hold.startedAt, hold.term) || 0);
  if (!matured) return { ok: false as const, error: "early" as const };

  // settle should have ended it; force principal + leftover if still open
  const unpaid = money(Math.max(0, money(hold.earnedTotal) - money(hold.paidTotal)));
  const principal = money(hold.investAmount);
  const pay = money(unpaid + principal);

  const { data: member, error: memErr } = await db
    .from("members")
    .select("invest")
    .eq("account", account)
    .maybeSingle();
  if (memErr || !member) return { ok: false as const, error: "login" as const };

  const nextInvest = money(Number(member.invest) + pay);
  if (pay > 0) {
    const { error: walletErr } = await db.from("members").update({ invest: nextInvest }).eq("account", account);
    if (walletErr) return { ok: false as const, error: "wallet" as const };
  }

  const { error: holdErr } = await db
    .from(table)
    .update({
      paid_total: money(hold.earnedTotal),
      status: "ended",
      last_payout_at: new Date().toISOString(),
    })
    .eq("id", holdingId);
  if (holdErr) {
    if (pay > 0) await db.from("members").update({ invest: money(member.invest) }).eq("account", account);
    return { ok: false as const, error: "holding" as const };
  }

  try {
    if (unpaid > 0) {
      await insertLedgerTx({
        id: `c${holdingId}${Date.now().toString(36)}`,
        account,
        kind: "yield",
        amount: unpaid,
        wallet: "invest",
        status: "paid",
        note: `Claim profit ${hold.name}`,
        at: new Date().toISOString(),
      });
    }
    if (principal > 0) {
      await insertLedgerTx({
        id: `p${holdingId}${Date.now().toString(36)}`,
        account,
        kind: "principal",
        amount: principal,
        wallet: "invest",
        status: "paid",
        note: `Package principal returned ${hold.name}`,
        at: new Date().toISOString(),
      });
    }
  } catch {
    /* optional */
  }

  return { ok: true as const, amount: pay, invest: pay > 0 ? nextInvest : money(member.invest) };
}
