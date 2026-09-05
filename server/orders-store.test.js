import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ceme-orders-"));
process.env.DATABASE_URL = "";
process.env.ORDERS_FILE = path.join(dir, "orders.json");

const store = await import("./orders-store.js");

test("arquivo local numera CEME-1, CEME-2 e guarda o pedido", async () => {
  const started = await store.initStore();
  assert.equal(started.backend, "file");
  assert.equal(started.durable, false);
  assert.equal(store.ordersBackend(), "file");
  assert.equal(store.ordersDurable(), false);
  const first = await store.allocateOrderId();
  const second = await store.allocateOrderId();
  assert.equal(first, "CEME-1");
  assert.equal(second, "CEME-2");
  const saved = await store.upsertOrder({
    orderId: first,
    status: "approved",
    customer: { name: "Ana", email: "ana@email.com", cpf: "52998224725" },
  });
  assert.equal(saved.customer.cpf, undefined);
  assert.equal(saved.customer.email, "ana@email.com");
  const found = await store.findOrder("CEME-1");
  assert.equal(found.status, "approved");
  const list = await store.readOrders();
  assert.equal(list[0].orderId, "CEME-2");
});

test("a sequência continua de onde parou", async () => {
  fs.writeFileSync(
    process.env.ORDERS_FILE,
    `${JSON.stringify([{ orderId: "CEME-7", status: "approved" }], null, 2)}\n`
  );
  const next = await store.allocateOrderId();
  assert.equal(next, "CEME-8");
});

test("disco permanente conta o histórico como durável", () => {
  const disk = fs.mkdtempSync(path.join(os.tmpdir(), "ceme-disk-"));
  process.env.ORDERS_DISK = disk;
  assert.equal(store.hasPersistentDisk(), true);
  assert.equal(store.ordersDurable(), true);
  delete process.env.ORDERS_DISK;
  assert.equal(store.hasPersistentDisk(), false);
  assert.equal(store.ordersDurable(), false);
});

test("recusa de conexão do Postgres conta como erro temporário", () => {
  assert.equal(store.isTransientPgError({ code: "ECONNREFUSED" }), true);
  assert.equal(store.isTransientPgError({ code: "28P01" }), false);
});

test("retryUntil espera erros temporários e segue", async () => {
  let hits = 0;
  const value = await store.retryUntil(
    async () => {
      hits += 1;
      if (hits < 3) {
        const err = new Error("connect ECONNREFUSED");
        err.code = "ECONNREFUSED";
        throw err;
      }
      return "ok";
    },
    { attempts: 5, delayMs: 1 }
  );
  assert.equal(value, "ok");
  assert.equal(hits, 3);
});
