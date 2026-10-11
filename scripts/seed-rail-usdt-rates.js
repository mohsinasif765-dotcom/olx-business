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

/** Approx 1 USDT = N units (temporary seed until admin edits). */
const SEED = {
  usdt: 1,
  usd: 1,
  eur: 0.92,
  gbp: 0.79,
  aed: 3.67,
  sar: 3.75,
  inr: 83.5,
  bdt: 110,
  cny: 7.2,
};

async function main() {
  loadEnv();
  const u = new URL(process.env.DATABASE_URL || "");
  const client = new Client({
    host: u.hostname,
    port: Number(u.port || 5432),
    database: "postgres",
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const pkrRow = await client.query(
    `select coalesce(nullif(usdt_to_pkr_rate, 0), 280) as pkr from public.site_settings where id = 1`,
  );
  const pkr = Number(pkrRow.rows[0]?.pkr) || 280;

  await client.query(
    `update public.pay_rails set usdt_rate = $1
     where (lower(id) = 'pkr' or lower(id) like 'pkr-%' or upper(name) like 'PKR%')
       and coalesce(usdt_rate, 0) = 0`,
    [pkr],
  );

  for (const [id, rate] of Object.entries(SEED)) {
    await client.query(
      `update public.pay_rails set usdt_rate = $1
       where lower(id) = $2 and coalesce(usdt_rate, 0) = 0`,
      [rate, id],
    );
  }

  // Force-fill zero rates for known seeds (even if previously 0 intentionally)
  for (const [id, rate] of Object.entries(SEED)) {
    await client.query(
      `update public.pay_rails set usdt_rate = $1
       where lower(id) = $2 and coalesce(usdt_rate, 0) <= 0`,
      [rate, id],
    );
  }
  await client.query(
    `update public.pay_rails set usdt_rate = $1
     where (lower(id) = 'pkr' or lower(id) like 'pkr-%') and coalesce(usdt_rate, 0) <= 0`,
    [pkr],
  );

  await client.query("select pg_notify('pgrst', 'reload schema')");
  const { rows } = await client.query(
    `select id, name, usdt_rate from public.pay_rails order by id`,
  );
  console.log(rows);
  await client.end();
  console.log("seed-rail-usdt-rates OK");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
