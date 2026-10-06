import { NextResponse } from "next/server";
import { readSite } from "@/lib/server/site";

function key(account: string) {
  return account.trim().toLowerCase();
}

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

export async function GET(request: Request) {
  const account = key(new URL(request.url).searchParams.get("account") || "");
  if (!account) return NextResponse.json({ error: "required", rows: [] }, { status: 400 });
  try {
    const site = await readSite();
    const rows = [
      ...site.recharges
        .filter((row) => key(row.account) === account)
        .map((row) => ({
          id: `r-${row.id}`,
          kind: "recharge" as const,
          title: row.network || "USDT",
          amount: `+${money(row.amount).toFixed(2)}`,
          status: row.status,
          at: row.at,
        })),
      ...site.withdraws
        .filter((row) => key(row.account) === account)
        .map((row) => ({
          id: `w-${row.id}`,
          kind: "withdraw" as const,
          title: row.wallet || "USDT",
          amount: `-${money(row.amount).toFixed(2)}`,
          status: row.status,
          at: row.at,
        })),
      ...site.transfers
        .filter((row) => key(row.account) === account)
        .map((row) => ({
          id: `t-${row.id}`,
          kind: "transfer" as const,
          title: `${row.from} → ${row.to}`,
          amount: money(row.amount).toFixed(2),
          status: "OK",
          at: row.at,
        })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1));
    return NextResponse.json({ rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return NextResponse.json({ error: message, rows: [] }, { status: 500 });
  }
}
