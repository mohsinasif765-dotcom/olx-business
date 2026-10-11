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
    process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
}

const SQL = fs.readFileSync(path.join(__dirname, "holding-yield.sql"), "utf8");

const VERIFY = `
select
  (select count(*)::int from information_schema.columns
    where table_schema='public' and table_name='car_holdings' and column_name='earned_total') as car_earned,
  (select count(*)::int from information_schema.columns
    where table_schema='public' and table_name='car_holdings' and column_name='last_payout_at') as car_payout,
  (select count(*)::int from information_schema.columns
    where table_schema='public' and table_name='shop_holdings' and column_name='earned_total') as shop_earned,
  (select count(*)::int from information_schema.columns
    where table_schema='public' and table_name='shop_holdings' and column_name='last_payout_at') as shop_payout
`;

async function applyPg() {
  const raw = process.env.DATABASE_URL || "";
  if (!raw) throw new Error("DATABASE_URL missing");
  const u = new URL(raw);
  const client = new Client({
    host: u.hostname,
    port: Number(u.port || 5432),
    database: (u.pathname.replace(/^\//, "") || "postgres").split("?")[0],
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("connected", decodeURIComponent(u.username), u.hostname);
  await client.query(SQL);
  await client.query("select pg_notify('pgrst', 'reload schema')");
  const { rows } = await client.query(VERIFY);
  await client.end();
  console.log("columns", rows[0]);
  return true;
}

async function applyRest() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || "";
  const endpoints = [
    `${url}/sql`,
    `${url}/query`,
    `${url}/pg/query`,
    `${url}/rest/v1/rpc/exec_sql`,
    "https://api.zuvodev.com/v1/projects/olx-business/database/query",
    "https://api.zuvodev.com/v1/projects/olx-business/database/migrations",
  ];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: SQL, sql: SQL, name: "holding-yield" }),
      });
      console.log("rest", endpoint, res.status);
      if (res.ok) return true;
    } catch (err) {
      console.log("rest fail", endpoint, String(err.message || err).slice(0, 80));
    }
  }
  return false;
}

/** Probe columns via PostgREST select (works once columns exist). */
async function probeColumns() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || "";
  const res = await fetch(`${url}/rest/v1/car_holdings?select=id,earned_total,last_payout_at&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  console.log("probe car_holdings", res.status, text.slice(0, 200));
  return res.ok;
}

async function main() {
  loadEnv();
  try {
    await applyPg();
    console.log("holding-yield migration OK (pg)");
    return;
  } catch (err) {
    console.log("pg path failed:", String(err.message || err).slice(0, 160));
  }
  if (await applyRest()) {
    console.log("holding-yield migration OK (rest)");
    return;
  }
  if (await probeColumns()) {
    console.log("holding-yield columns already present");
    return;
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
