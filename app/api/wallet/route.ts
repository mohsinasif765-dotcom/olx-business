import { NextResponse } from "next/server";
import { zuvoAdmin } from "@/lib/zuvo";

function key(account: string) {
  return account.trim().toLowerCase();
}

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

export async function GET(request: Request) {
  const account = key(new URL(request.url).searchParams.get("account") || "");
  if (!account) return NextResponse.json({ error: "required" }, { status: 400 });
  const { data, error } = await zuvoAdmin()
    .from("members")
    .select("invest,brokerage")
    .eq("account", account)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    invest: money(data?.invest),
    brokerage: money(data?.brokerage),
  });
}

export async function POST(request: Request) {
  let body: {
    account?: string;
    action?: "credit" | "debit" | "transfer";
    wallet?: "invest" | "brokerage";
    from?: "invest" | "brokerage";
    to?: "invest" | "brokerage";
    amount?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }
  const account = key(String(body.account || ""));
  const amount = money(body.amount);
  if (!account || amount <= 0) return NextResponse.json({ error: "required" }, { status: 400 });

  const db = zuvoAdmin();
  const { data: row, error } = await db
    .from("members")
    .select("id,invest,brokerage")
    .eq("account", account)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "missing" }, { status: 404 });

  let invest = money(row.invest);
  let brokerage = money(row.brokerage);
  const action = body.action || "credit";

  if (action === "transfer") {
    const from = body.from === "brokerage" ? "brokerage" : "invest";
    const to = body.to === "invest" ? "invest" : "brokerage";
    if (from === to) return NextResponse.json({ error: "same" }, { status: 400 });
    if (from === "invest") {
      if (invest < amount) return NextResponse.json({ error: "insufficient" }, { status: 400 });
      invest = money(invest - amount);
      brokerage = money(brokerage + amount);
    } else {
      if (brokerage < amount) return NextResponse.json({ error: "insufficient" }, { status: 400 });
      brokerage = money(brokerage - amount);
      invest = money(invest + amount);
    }
  } else {
    const wallet = body.wallet === "brokerage" ? "brokerage" : "invest";
    if (action === "debit") {
      if (wallet === "invest") {
        if (invest < amount) return NextResponse.json({ error: "insufficient" }, { status: 400 });
        invest = money(invest - amount);
      } else {
        if (brokerage < amount) return NextResponse.json({ error: "insufficient" }, { status: 400 });
        brokerage = money(brokerage - amount);
      }
    } else if (wallet === "invest") invest = money(invest + amount);
    else brokerage = money(brokerage + amount);
  }

  const { error: saveError } = await db
    .from("members")
    .update({ invest, brokerage })
    .eq("account", account);
  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });
  return NextResponse.json({ ok: true, invest, brokerage });
}
