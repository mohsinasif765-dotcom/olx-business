import { NextResponse } from "next/server";
import { resolveMemberDisplayCurrency } from "@/lib/currencies";
import { displayName } from "@/lib/member-name";
import { readCoins, readSettings } from "@/lib/server/db-tables";
import { readSite } from "@/lib/server/site";
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
  try {
    const site = await readSite();
    if (!account) {
      return NextResponse.json({
        account: "",
        name: "",
        vip: "—",
        invite: "",
        invest: 0,
        brokerage: 0,
        status: "guest",
        siteName: site.siteName,
        telegram: site.telegram,
        handle: site.handle,
        flags: site.flags,
        finance: site.finance,
        maintenance: site.maintenance,
        walletMode: site.walletMode,
        displayCurrency: site.displayCurrency,
        usdtToPkrRate: site.usdtToPkrRate,
      });
    }
    const [first, deposits, coins, settings] = await Promise.all([
      zuvoAdmin()
        .from("members")
        .select("account,vip,invite,invest,brokerage,status,name")
        .eq("account", account)
        .maybeSingle(),
      zuvoAdmin()
        .from("recharges")
        .select("network,status,at")
        .eq("account", account)
        .order("at", { ascending: false })
        .limit(30),
      readCoins(),
      readSettings(),
    ]);
    const row = first.error
      ? await zuvoAdmin()
          .from("members")
          .select("account,vip,invite,invest,brokerage,status")
          .eq("account", account)
          .maybeSingle()
      : first;
    if (row.error) return NextResponse.json({ error: row.error.message }, { status: 500 });
    const data = row.data as { account?: string; vip?: string; invite?: string; invest?: number; brokerage?: number; status?: string; name?: string } | null;
    const acc = data?.account || account;
    const displayCurrency = resolveMemberDisplayCurrency({
      coins,
      walletMode: settings?.walletMode ?? site.walletMode,
      deposits: (deposits.data || []) as { network?: string; status?: string }[],
    });
    return NextResponse.json({
      account: acc,
      name: displayName(data?.name, acc),
      vip: data?.vip || "—",
      invite: data?.invite || "",
      invest: money(data?.invest),
      brokerage: money(data?.brokerage),
      status: data?.status || "active",
      siteName: site.siteName,
      telegram: site.telegram,
      handle: site.handle,
      flags: site.flags,
      finance: site.finance,
      maintenance: site.maintenance,
      walletMode: site.walletMode,
      displayCurrency,
      usdtToPkrRate: site.usdtToPkrRate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: {
    account?: string;
    action?: string;
    kind?: "login" | "security";
    current?: string;
    next?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }
  const account = key(String(body.account || ""));
  const next = String(body.next || "");
  const current = String(body.current || "");
  if (!account || body.action !== "password" || next.length < 6) {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }
  const db = zuvoAdmin();
  const { data, error } = await db
    .from("members")
    .select("login_password,security_password")
    .eq("account", account)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "login" }, { status: 401 });
  const kind = body.kind === "security" ? "security" : "login";
  const expected = kind === "login" ? String(data.login_password || "") : String(data.security_password || "");
  if (expected && expected !== current) {
    return NextResponse.json({ error: "badpass" }, { status: 401 });
  }
  const patch =
    kind === "login" ? { login_password: next } : { security_password: next };
  const { error: saveError } = await db.from("members").update(patch).eq("account", account);
  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
