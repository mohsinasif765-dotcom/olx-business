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
  const cfg = dbConfig();
  console.log("db user", cfg.user, "host", cfg.host);
  const sql = fs.readFileSync(path.join(__dirname, "zuvo-schema.sql"), "utf8");
  const client = new Client(cfg);
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("Zuvo schema ready");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
