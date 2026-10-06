const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "zuvo-schema.sql"), "utf8");
  const client = new Client({
    host: "pooler2.sin.baas.zuvodev.com",
    port: 5432,
    database: "postgres",
    user: "postgres.olx-business",
    password: process.env.ZUVO_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("Zuvo schema ready");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
