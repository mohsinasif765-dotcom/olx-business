import { NextResponse } from "next/server";
import { appendList } from "@/lib/server/ledger";
import { readSite } from "@/lib/server/site";

function key(account: string) {
  return account.trim().toLowerCase();
}

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

export async function POST(request: Request) {
  let body: {
    account?: string;
    kind?: "recharges" | "withdraws" | "transfers";
    amount?: number;
    network?: string;
    wallet?: string;
    address?: string;
    txHash?: string;
    from?: string;
    to?: string;
    status?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }
  const account = key(String(body.account || ""));
  const amount = money(body.amount);
  const kind = body.kind;
  if (!account || !kind || amount <= 0) return NextResponse.json({ error: "required" }, { status: 400 });
  const site = await readSite();
  if (kind === "recharges" && !site.flags.rechargeOn) return NextResponse.json({ error: "paused" }, { status: 400 });
  if (kind === "withdraws" && !site.flags.withdrawOn) return NextResponse.json({ error: "paused" }, { status: 400 });
  if (kind === "transfers" && !site.flags.transferOn) return NextResponse.json({ error: "paused" }, { status: 400 });
  const at = new Date().toLocaleString();
  const id = `${kind[0]}${Date.now().toString(36)}`;
  if (kind === "recharges") {
    await appendList("recharges", {
      id,
      account,
      amount,
      network: body.network || "USDT",
      txHash: body.txHash || "",
      status: body.status || "paid",
      at,
      note: "",
    });
  } else if (kind === "withdraws") {
    await appendList("withdraws", {
      id,
      account,
      amount,
      wallet: body.wallet || "USDT",
      address: body.address || "",
      status: body.status || "pending",
      at,
      note: "",
    });
  } else {
    await appendList("transfers", {
      id,
      account,
      from: body.from || "invest",
      to: body.to || "brokerage",
      amount,
      at,
    });
  }
  return NextResponse.json({ ok: true, id });
}
