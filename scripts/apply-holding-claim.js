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

async function main() {
  loadEnv();
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
  const sql = fs.readFileSync(path.join(__dirname, "holding-claim.sql"), "utf8");
  await client.query(sql);
  await client.query("select pg_notify('pgrst', 'reload schema')");
  const { rows } = await client.query(`
    select
      (select count(*)::int from information_schema.columns
        where table_schema='public' and table_name='car_holdings' and column_name='paid_total') as car_paid,
      (select count(*)::int from information_schema.columns
        where table_schema='public' and table_name='shop_holdings' and column_name='paid_total') as shop_paid
  `);
  console.log(rows[0]);
  await client.end();
  console.log("holding-claim OK");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
