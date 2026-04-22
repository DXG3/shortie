import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const password = process.env.PG_PASSWORD;
if (!password) { console.error("Set PG_PASSWORD"); process.exit(1); }

const client = new Client({
  host: "db.hbmffokwhewrzkbdouxk.supabase.co",
  port: 5432,
  user: "postgres",
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const sql = fs.readFileSync(path.join(process.cwd(), "supabase/migrations/0001_init.sql"), "utf8");

try {
  await client.connect();
  console.log("connected");
  await client.query(sql);
  console.log("migration applied");
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
