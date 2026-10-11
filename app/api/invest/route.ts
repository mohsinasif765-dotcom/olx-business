import { NextResponse } from "next/server";
import { buyPackage, listHoldings } from "@/lib/server/holdings";
import { claimHoldingProfit, settlePackageYield } from "@/lib/server/yield-cron";
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
  try {
    try {
      await settlePackageYield({ account });
    } catch {
      /* yield catch-up optional until SQL columns exist */
    }
    const [holdings, member] = await Promise.all([
      listHoldings(account),
      zuvoAdmin().from("members").select("invest,brokerage,vip,status").eq("account", account).maybeSingle(),
    ]);
    return NextResponse.json({
      holdings,
      vip: member.data?.vip || "—",
      status: member.data?.status || "active",
      invest: money(member.data?.invest),
      brokerage: money(member.data?.brokerage),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return NextResponse.json({ error: message, holdings: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: {
    account?: string;
    planId?: string;
    catalog?: string;
    action?: string;
    holdingId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }
  const account = key(String(body.account || ""));
  if (!account) return NextResponse.json({ error: "required" }, { status: 400 });

  if (String(body.action || "") === "claim") {
    const holdingId = String(body.holdingId || "").trim();
    if (!holdingId) return NextResponse.json({ error: "required" }, { status: 400 });
    try {
      const result = await claimHoldingProfit({ account, holdingId });
      if (!result.ok) {
        const status =
          result.error === "login"
            ? 401
            : result.error === "forbidden"
              ? 403
              : result.error === "early"
                ? 400
                : 400;
        return NextResponse.json(result, { status });
      }
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zuvo write failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const planId = String(body.planId || "").trim();
  const catalog = body.catalog === "shop" ? "shop" : "car";
  if (!planId) return NextResponse.json({ error: "required" }, { status: 400 });
  try {
    const result = await buyPackage({ account, planId, catalog });
    if (!result.ok) {
      const status = result.error === "login" ? 401 : result.error === "insufficient" ? 400 : 400;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
