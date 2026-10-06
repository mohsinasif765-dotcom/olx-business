import { NextResponse } from "next/server";
import { readSettings, readWithdraws } from "@/lib/server/db-tables";
import { fillWithdrawLogs } from "@/lib/withdraw-logs";
import { stripDemoRows } from "@/lib/server/strip-demo";
import { zuvoAdmin } from "@/lib/zuvo";

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function mask(account: string) {
  const a = account.trim();
  if (a.includes("@")) {
    const [user, domain] = a.split("@");
    return `${user.slice(0, 2)}***@${domain}`;
  }
  if (a.length < 5) return `${a.slice(0, 2)}***`;
  return `${a.slice(0, 2)}***${a.slice(-2)}`;
}

let statsHold: { at: number; users: number; revenue: number } | null = null;
const STATS_TTL = 10000;

async function memberStats() {
  if (statsHold && Date.now() - statsHold.at < STATS_TTL) return statsHold;
  const { data: members, error } = await zuvoAdmin().from("members").select("invest,brokerage");
  if (error) throw error;
  const rows = members || [];
  statsHold = {
    at: Date.now(),
    users: rows.length,
    revenue: rows.reduce((sum, row) => sum + money(row.invest) + money(row.brokerage), 0),
  };
  return statsHold;
}

export async function GET(request: Request) {
  const account = (new URL(request.url).searchParams.get("account") || "").trim().toLowerCase();
  const db = zuvoAdmin();

  try {
    const [stats, settings, withdraws, mine] = await Promise.all([
      memberStats(),
      readSettings(),
      readWithdraws(),
      account
        ? db.from("members").select("invest,brokerage,invite").eq("account", account).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (mine.error) return NextResponse.json({ error: mine.error.message }, { status: 500 });

    const logs = fillWithdrawLogs(
      stripDemoRows(withdraws)
        .filter((row) => row.status !== "rejected")
        .slice(0, 12)
        .map((row) => ({
          user: mask(row.account),
          amount: `${money(row.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${String(row.wallet || "USDT").toUpperCase()}`,
        }))
    );

    const wallets = mine.data
      ? {
          invest: money(mine.data.invest),
          brokerage: money(mine.data.brokerage),
          invite: String(mine.data.invite || ""),
        }
      : { invest: 0, brokerage: 0, invite: "" };

    return NextResponse.json({
      siteName: settings?.siteName || "OLX Business",
      users: stats.users,
      revenue: stats.revenue,
      logs,
      wallets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
