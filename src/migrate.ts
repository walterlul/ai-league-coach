import { readFileSync } from "node:fs";
import { pool } from "./db";

async function main() {
  const sql = readFileSync("db/schema.sql", "utf8");
  await pool.query(sql);
  const res = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log("Tablas creadas:", res.rows.map((r) => r.table_name));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});