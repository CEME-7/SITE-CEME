import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { formatOrderId, nextOrderSequence, sanitizeStoredOrder } from "./lib.js";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(SERVER_DIR, ".env") });

const DEFAULT_DIR = path.join(SERVER_DIR, "data");
const DEFAULT_FILE = path.join(DEFAULT_DIR, "orders.json");
const DISK_DIR = "/data";

let pool;

function databaseUrl() {
  return String(process.env.DATABASE_URL || "").trim();
}

export function requirePostgres() {
  return String(process.env.REQUIRE_POSTGRES || "").toLowerCase() === "true";
}

export function hasPersistentDisk() {
  const dir = String(process.env.ORDERS_DISK || DISK_DIR).trim();
  try {
    return Boolean(dir) && fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function ordersFile() {
  const custom = String(process.env.ORDERS_FILE || "").trim();
  if (custom) return custom;
  if (hasPersistentDisk()) {
    return path.join(String(process.env.ORDERS_DISK || DISK_DIR).trim(), "orders.json");
  }
  return DEFAULT_FILE;
}

function usePostgres() {
  return Boolean(databaseUrl());
}

export function ordersBackend() {
  return usePostgres() ? "postgres" : "file";
}

export function ordersDurable() {
  return usePostgres() || hasPersistentDisk();
}

function sslFor(url) {
  if (/localhost|127\.0\.0\.1/i.test(url)) return false;
  return { rejectUnauthorized: false };
}

function ensureFile() {
  const file = ordersFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "[]\n", "utf8");
  }
}

function readFileOrders() {
  ensureFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(ordersFile(), "utf8"));
    return Array.isArray(parsed) ? parsed.map(sanitizeStoredOrder) : [];
  } catch {
    return [];
  }
}

function writeFileOrders(all) {
  ensureFile();
  fs.writeFileSync(ordersFile(), `${JSON.stringify(all, null, 2)}\n`, "utf8");
}

async function withPg(fn) {
  const url = databaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL ausente");
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString: url,
      ssl: sslFor(url),
      max: 4,
    });
  }
  return fn(pool);
}

export async function pingStore() {
  if (!usePostgres()) {
    if (requirePostgres()) {
      const err = new Error("DATABASE_URL ausente");
      err.code = "database_unavailable";
      throw err;
    }
    return { backend: "file", ok: true };
  }
  await withPg((db) => db.query("SELECT 1 AS ok"));
  return { backend: "postgres", ok: true };
}

export async function initStore() {
  if (requirePostgres() && !usePostgres()) {
    const err = new Error(
      "DATABASE_URL obrigatório no Render. Aplique o Blueprint para criar o Postgres ceme-orders."
    );
    err.code = "database_required";
    throw err;
  }
  if (!usePostgres()) {
    const all = readFileOrders();
    writeFileOrders(all);
    return { backend: "file", durable: ordersDurable() };
  }
  await withPg((db) =>
    db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        seq INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        order_id TEXT UNIQUE NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  );
  const leftover = readFileOrders();
  for (const order of leftover) {
    if (order?.orderId) {
      await upsertOrder(order);
    }
  }
  return { backend: "postgres", durable: true };
}

export async function allocateOrderId() {
  if (!usePostgres()) {
    const all = readFileOrders();
    const orderId = formatOrderId(nextOrderSequence(all.map((order) => order.orderId)));
    all.unshift({ orderId, status: "reserved", createdAt: Date.now() });
    writeFileOrders(all);
    return orderId;
  }
  return withPg(async (db) => {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `INSERT INTO orders (order_id, payload) VALUES ($1, '{}'::jsonb) RETURNING seq`,
        [`tmp-${randomUUID()}`]
      );
      const seq = Number(inserted.rows[0].seq);
      const orderId = formatOrderId(seq);
      await client.query(`UPDATE orders SET order_id = $1 WHERE seq = $2`, [orderId, seq]);
      await client.query("COMMIT");
      return orderId;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}

export async function readOrders() {
  if (!usePostgres()) return readFileOrders();
  const result = await withPg((db) =>
    db.query(`SELECT payload FROM orders WHERE order_id LIKE 'CEME-%' ORDER BY seq DESC`)
  );
  return result.rows.map((row) => sanitizeStoredOrder(row.payload));
}

export async function findOrder(orderId) {
  const id = String(orderId || "");
  if (!usePostgres()) {
    return readFileOrders().find((order) => order.orderId === id) || null;
  }
  const result = await withPg((db) =>
    db.query(`SELECT payload FROM orders WHERE order_id = $1 LIMIT 1`, [id])
  );
  return result.rows[0] ? sanitizeStoredOrder(result.rows[0].payload) : null;
}

function mergeIntoFile(next) {
  const all = readFileOrders();
  const index = all.findIndex((order) => order.orderId === next.orderId);
  if (index >= 0) {
    all[index] = sanitizeStoredOrder({ ...all[index], ...next, orderId: next.orderId });
  } else {
    all.unshift(next);
  }
  writeFileOrders(all);
  return index >= 0 ? all[index] : next;
}

function backupOrderToDisk(next) {
  if (!usePostgres() || !hasPersistentDisk()) return;
  try {
    mergeIntoFile(next);
  } catch (err) {
    console.error("orders_backup_failed");
  }
}

export async function upsertOrder(record) {
  if (!record?.orderId) return record;
  const next = sanitizeStoredOrder(record);
  if (!usePostgres()) {
    return mergeIntoFile(next);
  }
  await withPg((db) =>
    db.query(
      `INSERT INTO orders (order_id, payload)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (order_id)
       DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [next.orderId, JSON.stringify(next)]
    )
  );
  backupOrderToDisk(next);
  return next;
}

export async function closeStore() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export async function scrubOrderFile() {
  return initStore();
}
