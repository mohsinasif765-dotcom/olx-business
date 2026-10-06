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

const SQL = `
create table if not exists public.shop_packages (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('jewelry', 'electronics')),
  invest text not null,
  returns text not null,
  term text not null,
  image text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.shop_holdings (
  id text primary key,
  account text not null,
  plan_id text not null,
  name text not null,
  kind text not null,
  invest text not null,
  invest_amount numeric not null default 0,
  returns text not null,
  term text not null,
  image text not null,
  status text not null default 'active',
  started_at timestamptz not null default now()
);
alter table public.shop_packages enable row level security;
alter table public.shop_holdings enable row level security;
drop policy if exists "public read live shop packages" on public.shop_packages;
create policy "public read live shop packages"
on public.shop_packages for select to anon, authenticated using (enabled = true);
grant select on public.shop_packages to anon, authenticated;
grant all on public.shop_packages to service_role;
grant all on public.shop_holdings to service_role;
`;

async function applyPg() {
  const raw = process.env.DATABASE_URL || "";
  const u = new URL(raw);
  const base = {
    host: u.hostname,
    port: Number(u.port || 5432),
    database: (u.pathname.replace(/^\//, "") || "postgres").split("?")[0],
    password: decodeURIComponent(u.password),
    ssl: { rejectUnauthorized: false },
  };
  const apiHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "";
  const hosts = [...new Set([base.host, apiHost].filter(Boolean))];
  const users = [decodeURIComponent(u.username), "postgres.olx-business", "postgres"];
  let last = null;
  for (const host of hosts) {
    for (const user of users) {
      if (!user) continue;
      const client = new Client({
        ...base,
        host,
        user,
        ssl: {
          rejectUnauthorized: false,
          servername: apiHost || host,
        },
      });
      try {
        await client.connect();
        await client.query(SQL);
        await client.end();
        return;
      } catch (err) {
        last = err;
        try {
          await client.end();
        } catch {
          /* ignore */
        }
      }
    }
  }
  throw last || new Error("pg failed");
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
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: SQL, sql: SQL, name: "shop_packages" }),
    });
    if (res.ok) return true;
  }
  const probe = await fetch(`${url}/rest/v1/shop_packages?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return probe.ok;
}

async function main() {
  loadEnv();
  try {
    await applyPg();
    console.log("shop tables ready (pg)");
    return;
  } catch (err) {
    console.log("pg skipped:", err instanceof Error ? err.message : err);
  }
  const ok = await applyRest();
  if (!ok) {
    console.error("Could not create shop_packages / shop_holdings. Apply scripts/zuvo-schema.sql in Zuvo SQL.");
    process.exit(1);
  }
  console.log("shop tables reachable (rest)");
}

main();
