const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const file = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    process.env[key] = value;
  }
}

function on(v) {
  return v !== false;
}

function dbConfig() {
  const raw = process.env.DATABASE_URL || "";
  const u = new URL(raw);
  return {
    host: u.hostname,
    port: Number(u.port || 5432),
    database: (u.pathname.replace(/^\//, "") || "postgres").split("?")[0],
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false },
  };
}

async function main() {
  loadEnv();
  const client = new Client(dbConfig());
  await client.connect();
  const snap = await client.query("select payload from public.ops_snapshot where id = 1");
  const payload = (snap.rows[0] && snap.rows[0].payload) || {};
  const s = payload.settings || {};
  const auth = payload.adminAuth || { user: "admin", pass: "olx2026" };

  await client.query(
    `insert into public.site_settings (
      id, site_name, telegram, default_lang, register_on, login_on, recharge_on, withdraw_on, transfer_on, packages_on,
      min_withdraw, payout_fee, daily_cap, maintenance, commission_l1, commission_l2, commission_l3, updated_at
    ) values (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now())
    on conflict (id) do update set
      site_name=excluded.site_name, telegram=excluded.telegram, default_lang=excluded.default_lang,
      register_on=excluded.register_on, login_on=excluded.login_on, recharge_on=excluded.recharge_on,
      withdraw_on=excluded.withdraw_on, transfer_on=excluded.transfer_on, packages_on=excluded.packages_on,
      min_withdraw=excluded.min_withdraw, payout_fee=excluded.payout_fee, daily_cap=excluded.daily_cap,
      maintenance=excluded.maintenance, commission_l1=excluded.commission_l1, commission_l2=excluded.commission_l2,
      commission_l3=excluded.commission_l3, updated_at=now()`,
    [
      s.siteName || "OLX Business",
      s.telegram || "https://t.me/olxbusiness_help",
      s.defaultLang || "en",
      on(s.registerOn),
      on(s.loginOn),
      on(s.rechargeOn),
      on(s.withdrawOn),
      on(s.transferOn),
      on(s.packagesOn),
      Number(s.minWithdraw) || 1,
      Number(s.payoutFee) || 1,
      Number(s.dailyCap) || 5000,
      s.maintenance || "",
      Number(s.commissionL1) || 15,
      Number(s.commissionL2) || 3,
      Number(s.commissionL3) || 1,
    ]
  );

  await client.query(
    `insert into public.admin_auth (id, username, password) values (1,$1,$2)
     on conflict (id) do update set username=excluded.username, password=excluded.password`,
    [auth.user || "admin", auth.pass || "olx2026"]
  );

  async function upsertList(table, rows, sql, valuesFn) {
    for (const row of rows || []) {
      await client.query(sql, valuesFn(row));
    }
    console.log(table, (rows || []).length);
  }

  await upsertList(
    "pay_rails",
    payload.coins,
    `insert into public.pay_rails (id,name,network,min,address,enabled,pay_kind,bank_name,account_name,account_number,iban,swift,branch,instructions)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     on conflict (id) do update set name=excluded.name, network=excluded.network, min=excluded.min, address=excluded.address,
     enabled=excluded.enabled, pay_kind=excluded.pay_kind, bank_name=excluded.bank_name, account_name=excluded.account_name,
     account_number=excluded.account_number, iban=excluded.iban, swift=excluded.swift, branch=excluded.branch, instructions=excluded.instructions`,
    (c) => [
      String(c.id),
      String(c.name || ""),
      String(c.network || ""),
      String(c.min || "10"),
      String(c.address || c.accountNumber || ""),
      on(c.enabled),
      c.payKind === "crypto" ? "crypto" : "bank",
      String(c.bankName || ""),
      String(c.accountName || ""),
      String(c.accountNumber || ""),
      String(c.iban || ""),
      String(c.swift || ""),
      String(c.branch || ""),
      String(c.instructions || ""),
    ]
  );

  await upsertList(
    "cms_pages",
    payload.cms,
    `insert into public.cms_pages (slug,title,body) values ($1,$2,$3)
     on conflict (slug) do update set title=excluded.title, body=excluded.body`,
    (r) => [String(r.slug), String(r.title || ""), String(r.body || "")]
  );

  await upsertList(
    "notices",
    payload.notices,
    `insert into public.notices (id,title,body,enabled) values ($1,$2,$3,$4)
     on conflict (id) do update set title=excluded.title, body=excluded.body, enabled=excluded.enabled`,
    (r) => [String(r.id), String(r.title || ""), String(r.body || ""), on(r.enabled)]
  );

  await upsertList(
    "faqs",
    payload.faqs,
    `insert into public.faqs (id,tab,title,body,enabled) values ($1,$2,$3,$4,$5)
     on conflict (id) do update set tab=excluded.tab, title=excluded.title, body=excluded.body, enabled=excluded.enabled`,
    (r) => [String(r.id), String(r.tab || "about"), String(r.title || ""), String(r.body || ""), on(r.enabled)]
  );

  await upsertList(
    "activities",
    payload.activities,
    `insert into public.activities (id,title,description,time_label,status,enabled) values ($1,$2,$3,$4,$5,$6)
     on conflict (id) do update set title=excluded.title, description=excluded.description, time_label=excluded.time_label, status=excluded.status, enabled=excluded.enabled`,
    (r) => [String(r.id), String(r.title || ""), String(r.desc || ""), String(r.time || ""), String(r.status || "live"), on(r.enabled)]
  );

  await upsertList(
    "recharges",
    payload.recharges,
    `insert into public.recharges (id,account,amount,network,tx_hash,status,at,note) values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (id) do update set account=excluded.account, amount=excluded.amount, network=excluded.network, tx_hash=excluded.tx_hash, status=excluded.status, at=excluded.at, note=excluded.note`,
    (r) => [String(r.id), String(r.account || ""), Number(r.amount) || 0, String(r.network || ""), String(r.txHash || ""), String(r.status || "pending"), String(r.at || ""), String(r.note || "")]
  );

  await upsertList(
    "withdraws",
    payload.withdraws,
    `insert into public.withdraws (id,account,amount,wallet,address,status,at,note) values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (id) do update set account=excluded.account, amount=excluded.amount, wallet=excluded.wallet, address=excluded.address, status=excluded.status, at=excluded.at, note=excluded.note`,
    (r) => [String(r.id), String(r.account || ""), Number(r.amount) || 0, String(r.wallet || ""), String(r.address || ""), String(r.status || "pending"), String(r.at || ""), String(r.note || "")]
  );

  await upsertList(
    "transfers",
    payload.transfers,
    `insert into public.transfers (id,account,from_wallet,to_wallet,amount,at) values ($1,$2,$3,$4,$5,$6)
     on conflict (id) do update set account=excluded.account, from_wallet=excluded.from_wallet, to_wallet=excluded.to_wallet, amount=excluded.amount, at=excluded.at`,
    (r) => [String(r.id), String(r.account || ""), String(r.from || "invest"), String(r.to || "brokerage"), Number(r.amount) || 0, String(r.at || "")]
  );

  await upsertList(
    "car_holdings",
    payload.holdings,
    `insert into public.car_holdings (id,account,plan_id,name,kind,invest,invest_amount,returns,term,image,status,started_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     on conflict (id) do update set account=excluded.account, plan_id=excluded.plan_id, name=excluded.name, kind=excluded.kind, invest=excluded.invest, invest_amount=excluded.invest_amount, returns=excluded.returns, term=excluded.term, image=excluded.image, status=excluded.status, started_at=excluded.started_at`,
    (r) => [
      String(r.id),
      String(r.account || ""),
      String(r.planId || ""),
      String(r.name || ""),
      String(r.kind || "new"),
      String(r.invest || ""),
      Number(r.investAmount) || 0,
      String(r.returns || ""),
      String(r.term || ""),
      String(r.image || ""),
      r.status === "ended" ? "ended" : "active",
      r.startedAt || new Date().toISOString(),
    ]
  );

  await upsertList(
    "audit_log",
    payload.audit,
    `insert into public.audit_log (id,at,actor,action,target,amount) values ($1,$2,$3,$4,$5,$6)
     on conflict (id) do update set at=excluded.at, actor=excluded.actor, action=excluded.action, target=excluded.target, amount=excluded.amount`,
    (r) => [String(r.id), String(r.at || ""), String(r.actor || "admin"), String(r.action || ""), String(r.target || ""), String(r.amount || "")]
  );

  const state = payload.activityState || {};
  for (const [account, mine] of Object.entries(state)) {
    await client.query(
      `insert into public.activity_state (account,checkin_date,checkin_streak,lucky_date,lucky_prize)
       values ($1,$2,$3,$4,$5)
       on conflict (account) do update set checkin_date=excluded.checkin_date, checkin_streak=excluded.checkin_streak, lucky_date=excluded.lucky_date, lucky_prize=excluded.lucky_prize`,
      [account, mine.checkin?.date || "", mine.checkin?.streak || 0, mine.lucky?.date || "", mine.lucky?.prize || ""]
    );
  }
  console.log("activity_state", Object.keys(state).length);

  const tables = await client.query(
    `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name`
  );
  console.log("tables:", tables.rows.map((r) => r.table_name).join(", "));
  await client.end();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
