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
  await client.query(fs.readFileSync(path.join(__dirname, "pay-rail-usdt-rate.sql"), "utf8"));
  await client.query("select pg_notify('pgrst', 'reload schema')");
  const { rows } = await client.query(
    `select id, name, usdt_rate from public.pay_rails order by id`,
  );
  console.log(rows);
  await client.end();
  console.log("pay-rail-usdt-rate OK");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
