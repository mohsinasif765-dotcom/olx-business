import { NextResponse } from "next/server";
import { getActivity } from "@/lib/activities";
import { readActivityState, upsertActivityState } from "@/lib/server/db-tables";
import { readSite } from "@/lib/server/site";
import { zuvoAdmin } from "@/lib/zuvo";

const CHECKIN = ["0.10", "0.12", "0.15", "0.18", "0.22", "0.28", "0.80"];
const PRIZES = ["0.10", "0.20", "0.50", "1.00", "2.00", "0.00"];

function key(account: string) {
  return account.trim().toLowerCase();
}

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function mapActivities(rows: { id: string; title: string; desc: string; time: string; status: string }[]) {
  if (!rows.length) return [];
  return rows.map((row) => {
    const local = getActivity(row.id);
    return {
      id: row.id,
      title: row.title,
      desc: row.desc,
      time: row.time,
      status: row.status === "ended" ? "ended" : "live",
      theme: local?.theme || "purple",
      badge: row.status === "ended" ? "ended" : local?.badge || "hot",
      rewards: local && "rewards" in local ? [...local.rewards] : row.id === "checkin" || row.id.includes("check") ? CHECKIN : undefined,
      prizes: local && "prizes" in local ? [...local.prizes] : row.id === "lucky" ? PRIZES : undefined,
      href: local && "href" in local ? local.href : undefined,
      cta: local && "cta" in local ? local.cta : undefined,
      rules: local?.rules ? [...local.rules] : [row.desc],
    };
  });
}

async function creditInvest(account: string, amount: number) {
  if (amount <= 0) return;
  const db = zuvoAdmin();
  const { data } = await db.from("members").select("invest").eq("account", account).maybeSingle();
  if (!data) return;
  await db.from("members").update({ invest: money(data.invest) + money(amount) }).eq("account", account);
}

export async function GET(request: Request) {
  const account = key(new URL(request.url).searchParams.get("account") || "");
  try {
    const site = await readSite();
    const list = mapActivities(site.activities);
    const state = account ? site.activityState[account] || {} : {};
    return NextResponse.json({ activities: list, checkin: state.checkin || null, lucky: state.lucky || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { account?: string; action?: "checkin" | "lucky" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }
  const account = key(String(body.account || ""));
  const action = body.action;
  if (!account || (action !== "checkin" && action !== "lucky")) {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }
  const today = todayKey();
  let prize = "0.00";
  let streak = 0;
  try {
    const all = await readActivityState();
    const mine = { ...(all[account] || {}) };
    if (action === "checkin") {
      if (mine.checkin?.date === today) {
        return NextResponse.json({ error: "used" }, { status: 400 });
      }
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().slice(0, 10);
      streak = mine.checkin?.date === yKey && (mine.checkin.streak || 0) < 7 ? mine.checkin.streak + 1 : 1;
      prize = CHECKIN[streak - 1] || "0.10";
      mine.checkin = { date: today, streak };
    } else {
      if (mine.lucky?.date === today) {
        return NextResponse.json({ error: "used" }, { status: 400 });
      }
      prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
      mine.lucky = { date: today, prize };
    }
    await upsertActivityState(account, mine);
  } catch (error) {
    throw error;
  }
  await creditInvest(account, Number(prize));
  return NextResponse.json({ ok: true, prize, streak });
}
