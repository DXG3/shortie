import { Client } from "pg";
const c = new Client({
  host: "db.hbmffokwhewrzkbdouxk.supabase.co", port: 5432,
  user: "postgres", password: process.env.PG_PASSWORD,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await c.connect();
const t = await c.query("select table_name from information_schema.tables where table_schema='public' order by table_name");
console.log(t.rows.map(r => r.table_name).join(", "));
const i = await c.query("select email, role, used_at from public.invites");
console.log("invites:", i.rows);
await c.end();
