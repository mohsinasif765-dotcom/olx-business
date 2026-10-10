import { resolveMemberDisplayCurrency } from "@/lib/currencies";
import { zuvoAdmin } from "@/lib/zuvo";
import { readCoins, readRecharges, readSettings, readWithdraws } from "@/lib/server/db-tables";
import { resolveUsdtFxTable } from "@/lib/server/live-fx";

export type TeamMember = {
  account: string;
  invite: string;
  upline: string;
  invest: number;
  brokerage: number;
  vip: string;
  status: string;
  joined: string;
};

export type TeamLevelRow = {
  account: string;
  vip: string;
  invest: number;
  status: string;
  joined: string;
};

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function key(account: string) {
  return account.trim().toLowerCase();
}

function inDay(stamp: string, date: string) {
  if (!date) return true;
  if (!stamp) return false;
  if (stamp.startsWith(date)) return true;
  const t = Date.parse(stamp);
  const q = Date.parse(date);
  if (!Number.isFinite(t) || !Number.isFinite(q)) return stamp.includes(date);
  return t >= q && t < q + 86400000;
}

function joinedBy(stamp: string, date: string) {
  if (!date) return true;
  if (!stamp) return true;
  if (stamp.startsWith(date) || stamp <= date) return true;
  const t = Date.parse(stamp);
  const q = Date.parse(date);
  if (!Number.isFinite(t) || !Number.isFinite(q)) return true;
  return t <= q + 86400000 - 1;
}

export async function uniqueInvite(used: Set<string>) {
  for (let i = 0; i < 20; i += 1) {
    const code = String(100000 + Math.floor(Math.random() * 900000));
    if (!used.has(code)) return code;
  }
  return String(Date.now()).slice(-6);
}

function isValid(row: TeamMember) {
  return row.status === "active" && row.invest > 0;
}

function maskAccount(account: string) {
  const a = account.trim();
  if (a.includes("@")) {
    const [user, domain] = a.split("@");
    return `${user.slice(0, 2)}***@${domain}`;
  }
  if (a.length < 5) return `${a.slice(0, 2)}***`;
  return `${a.slice(0, 2)}***${a.slice(-2)}`;
}

export async function loadTeam(account: string, date = "", level?: string) {
  const db = zuvoAdmin();
  const [{ data: members, error: memberError }, settings, rechargeRows, withdrawRows, coins] =
    await Promise.all([
      db.from("members").select("account,invite,upline,invest,brokerage,vip,status,joined"),
      readSettings(),
      readRecharges(),
      readWithdraws(),
      readCoins(),
    ]);
  if (memberError) throw memberError;
  const myDeposits = rechargeRows.filter((row) => key(row.account) === key(account));
  const displayCurrency = resolveMemberDisplayCurrency({
    coins,
    walletMode: settings?.walletMode,
    deposits: myDeposits,
  });
  const usdtFx = await resolveUsdtFxTable(
    Number(settings?.usdtToPkrRate) || 280,
    settings?.usdtRateAuto !== false,
  );
  const usdtToPkrRate = Number(usdtFx.PKR) || 280;

  const rows: TeamMember[] = (members || []).map((row) => ({
    account: key(String(row.account)),
    invite: String(row.invite || ""),
    upline: String(row.upline || "—"),
    invest: money(row.invest),
    brokerage: money(row.brokerage),
    vip: String(row.vip || "—"),
    status: String(row.status || "active"),
    joined: String(row.joined || ""),
  }));

  const used = new Set(rows.map((r) => r.invite).filter(Boolean));
  const me = rows.find((r) => r.account === key(account));
  if (!me) {
    return { error: "login" as const };
  }

  if (!me.invite) {
    me.invite = await uniqueInvite(used);
    await db.from("members").update({ invite: me.invite }).eq("account", me.account);
  }

  const rates = {
    l1: Number(settings?.commissionL1) || 15,
    l2: Number(settings?.commissionL2) || 3,
    l3: Number(settings?.commissionL3) || 1,
  };

  const l1 = rows.filter((r) => r.upline === me.invite && r.account !== me.account && joinedBy(r.joined, date));
  const l1Codes = new Set(l1.map((r) => r.invite).filter(Boolean));
  const l2 = rows.filter((r) => l1Codes.has(r.upline) && r.account !== me.account && joinedBy(r.joined, date));
  const l2Codes = new Set(l2.map((r) => r.invite).filter(Boolean));
  const l3 = rows.filter((r) => l2Codes.has(r.upline) && r.account !== me.account && joinedBy(r.joined, date));

  const tree = { "1": l1, "2": l2, "3": l3 };
  const downlines = [...l1, ...l2, ...l3];
  const teamAccounts = new Set(downlines.map((r) => r.account));

  const recharges = rechargeRows.filter(
    (row) => teamAccounts.has(key(row.account)) && row.status !== "rejected" && inDay(row.at, date)
  );
  const withdraws = withdrawRows.filter(
    (row) => teamAccounts.has(key(row.account)) && row.status !== "rejected" && inDay(row.at, date)
  );

  const teamRecharge = date
    ? recharges.reduce((sum, row) => sum + money(row.amount), 0)
    : downlines.reduce((sum, row) => sum + row.invest, 0);
  const teamWithdraw = withdraws.reduce((sum, row) => sum + money(row.amount), 0);

  const levelId = level === "2" || level === "3" ? level : level === "1" ? "1" : "";
  const levelRows: TeamLevelRow[] = levelId
    ? tree[levelId].map((row) => ({
        account: maskAccount(row.account),
        vip: row.vip,
        invest: row.invest,
        status: row.status,
        joined: row.joined,
      }))
    : [];

  return {
    invite: me.invite,
    brokerage: me.brokerage,
    siteName: settings?.siteName || "OLX Business",
    displayCurrency,
    usdtToPkrRate,
    rates,
    totals: {
      team: downlines.length,
      commission: me.brokerage,
      recharge: teamRecharge,
      withdraw: teamWithdraw,
    },
    levels: {
      "1": { people: l1.length, valid: l1.filter(isValid).length, rate: rates.l1 },
      "2": { people: l2.length, valid: l2.filter(isValid).length, rate: rates.l2 },
      "3": { people: l3.length, valid: l3.filter(isValid).length, rate: rates.l3 },
    },
    members: levelRows,
  };
}
