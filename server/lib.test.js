import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import {
  isCpf,
  isEmail,
  isBrazilianMobile,
  brazilianMobileDigits,
  luhn,
  quoteCart,
  installmentOptions,
  validatePayer,
  demoCardDecision,
  calcShipping,
  shippingRegion,
  demoPixPayload,
  isPhysicalProduct,
  paymentMode,
  isOriginAllowed,
  isBlockedStaticPath,
  hasForbiddenCardPayload,
  publicErrorCode,
  preferenceItems,
  webhookResource,
  isValidWebhookSignature,
  webhookManifest,
  notificationUrlFromOrigin,
  publicApiOrigin,
  fulfillmentSnapshot,
  publicOrderView,
  adminOrderView,
  formatAddress,
  normalizeTrackingCode,
  isPaymentApproved,
  unpaidPaymentError,
  paidFulfillmentOrders,
  sanitizeStoredOrder,
  formatOrderId,
  orderSequence,
  nextOrderSequence,
  ownerDashboardStats,
  deliveryProgress,
  DELIVERY_DAYS,
} from "./lib.js";

const require = createRequire(import.meta.url);
const { PRODUCTS } = require("../produtos.js");

const products = [
  { id: "neurocodigos", name: "NeuroCódigos", volume: "60ml", price: 120 },
  { id: "bioluz", name: "BioLuz", volume: "60ml", price: 120 },
  { id: "album", name: "Álbum", volume: "digital", price: 8, kind: "musica" },
];

test("aceita CPF válido e rejeita inválido", () => {
  assert.equal(isCpf("529.982.247-25"), true);
  assert.equal(isCpf("111.111.111-11"), false);
  assert.equal(isCpf("123"), false);
});

test("valida cartão com Luhn", () => {
  assert.equal(luhn("4111111111111111"), true);
  assert.equal(luhn("4111111111111112"), false);
});

test("calcula total pelo catálogo e ignora preço enviado pelo cliente", () => {
  const quote = quoteCart(products, [
    { id: "neurocodigos", qty: 2, price: 1 },
    { id: "bioluz", qty: 1, price: 1 },
  ]);
  assert.equal(quote.subtotal, 360);
  assert.equal(quote.shipping, 0);
  assert.equal(quote.total, 360);
  assert.equal(quote.lines[0].unitPrice, 120);
});

test("rejeita item inexistente e carrinho vazio", () => {
  assert.throws(() => quoteCart(products, []), { code: "empty_cart" });
  assert.throws(() => quoteCart(products, [{ id: "fake", qty: 1 }]), {
    code: "invalid_item",
  });
  assert.throws(() => quoteCart(products, [{ id: "bioluz", qty: 0 }]), {
    code: "invalid_qty",
  });
});

test("oferece até 3x sem juros quando a parcela não fica abaixo de R$ 20", () => {
  const options = installmentOptions(120, 3);
  assert.equal(options.length, 3);
  assert.equal(options[2].n, 3);
  assert.equal(options[2].value, 40);
});

test("valida dados de entrega e permite pedido sem endereço na retirada", () => {
  const payer = validatePayer({
    name: "Maria Silva",
    email: "maria@email.com",
    phone: "61999991111",
    cpf: "52998224725",
    cep: "70863540",
    street: "CLN 211",
    number: "211",
    neighborhood: "Asa Norte",
    city: "Brasília",
    state: "df",
  });
  assert.equal(payer.state, "DF");
  assert.equal(payer.cpf, undefined);
  const noCpf = validatePayer({
    name: "Maria Silva",
    email: "maria@email.com",
    phone: "61999991111",
    cep: "70863540",
    street: "CLN 211",
    number: "211",
    neighborhood: "Asa Norte",
    city: "Brasília",
    state: "DF",
  });
  assert.equal(noCpf.email, "maria@email.com");
  const pickup = validatePayer(
    {
      name: "Maria Silva",
      email: "maria@email.com",
      phone: "61999991111",
      cpf: "52998224725",
    },
    { requireAddress: false }
  );
  assert.equal(pickup.email, "maria@email.com");
  assert.throws(() => validatePayer({ name: "A", email: "x" }), {
    code: "invalid_payer",
  });
});

test("cartão de demonstração: aprovado, recusado e inválido", () => {
  assert.equal(demoCardDecision("4111111111111111"), "approved");
  assert.equal(demoCardDecision("4000000000000002"), "rejected");
  assert.equal(demoCardDecision("1234"), "invalid");
});

test("frete por CEP, retirada grátis e frete grátis acima do limite", () => {
  assert.equal(shippingRegion("70863540"), "df");
  assert.equal(shippingRegion("01310100"), "sudeste");
  assert.equal(calcShipping({ method: "pickup", hasPhysical: true, subtotal: 120, freeFrom: 360 }), 0);
  assert.equal(
    calcShipping({ method: "delivery", cep: "70863540", hasPhysical: true, subtotal: 120, freeFrom: 360 }),
    15
  );
  assert.equal(
    calcShipping({ method: "delivery", cep: "70863540", hasPhysical: true, subtotal: 360, freeFrom: 360 }),
    0
  );
  assert.equal(calcShipping({ method: "delivery", hasPhysical: false, subtotal: 8 }), 0);
});

test("álbum digital não entra no frete", () => {
  assert.equal(isPhysicalProduct({ kind: "musica" }), false);
  const quote = quoteCart(products, [{ id: "album", qty: 1 }], {
    shippingMethod: "delivery",
    cep: "01310100",
  });
  assert.equal(quote.hasPhysical, false);
  assert.equal(quote.shipping, 0);
  assert.equal(quote.total, 8);
});

test("pedido pago do álbum lista o download; pendente não", () => {
  const order = {
    orderId: "CEME-9",
    status: "approved",
    shippingMethod: "none",
    items: [{ id: "musicas-neuroconectivas", name: "Músicas NeuroConectivas", qty: 1 }],
    customer: { name: "Ana" },
  };
  const paid = publicOrderView(order);
  assert.equal(paid.downloads.length, 1);
  assert.equal(paid.downloads[0].id, "musicas-neuroconectivas");
  assert.equal(paid.downloads[0].filename, "declic-liberte-sua-expressao.zip");
  assert.equal(publicOrderView({ ...order, status: "pending" }).downloads.length, 0);
  assert.equal(
    publicOrderView({ ...order, items: [{ id: "bioluz", name: "BioLuz", qty: 1 }] }).downloads.length,
    0
  );
});

test("gera payload Pix de demonstração", () => {
  const code = demoPixPayload("CEME-ABC", 135);
  assert.match(code, /CEMEPIX/);
  assert.match(code, /BRL135.00/);
});

test("CORS: live exige lista; demo aceita vazio; whitelist fecha o resto", () => {
  assert.equal(isOriginAllowed("https://evil.example", { mode: "live", allowedOrigins: [] }), false);
  assert.equal(
    isOriginAllowed("https://exemplo.github.io", {
      mode: "live",
      allowedOrigins: ["https://exemplo.github.io"],
    }),
    true
  );
  assert.equal(
    isOriginAllowed("https://evil.example", {
      mode: "live",
      allowedOrigins: ["https://exemplo.github.io"],
    }),
    false
  );
  assert.equal(isOriginAllowed("https://evil.example", { mode: "demo", allowedOrigins: [] }), true);
  assert.equal(
    isOriginAllowed("https://evil.example", {
      mode: "sandbox",
      allowedOrigins: ["https://loja.example"],
    }),
    false
  );
  assert.equal(isOriginAllowed("http://127.0.0.1:3001", {
    mode: "live",
    allowedOrigins: [],
    serverOrigin: "http://127.0.0.1:3001",
  }), true);
  assert.equal(isOriginAllowed("https://evil.example", { mode: "demo", allowedOrigins: [] }), true);
  assert.equal(
    isOriginAllowed("https://evil.example", {
      mode: "demo",
      allowedOrigins: ["http://127.0.0.1:3001"],
    }),
    false
  );
  assert.equal(isOriginAllowed("http://127.0.0.1:3001", {
    mode: "demo",
    allowedOrigins: ["http://127.0.0.1:8080"],
    serverOrigin: "http://127.0.0.1:3001",
  }), true);
});

test("não publica .env, docs, yaml nem a pasta server", () => {
  assert.equal(isBlockedStaticPath("/server/.env"), true);
  assert.equal(isBlockedStaticPath("/server/.env.example"), true);
  assert.equal(isBlockedStaticPath("/render.yaml"), true);
  assert.equal(isBlockedStaticPath("/README.md"), true);
  assert.equal(isBlockedStaticPath("/docs/passar-para-o-dono.md"), true);
  assert.equal(isBlockedStaticPath("/.github/workflows/pages.yml"), true);
  assert.equal(isBlockedStaticPath("/.cursor/mcp.json"), true);
  assert.equal(isBlockedStaticPath("/abrir-local.sh"), true);
  assert.equal(isBlockedStaticPath("/index.html"), false);
  assert.equal(isBlockedStaticPath("/style.css"), false);
  assert.equal(isBlockedStaticPath("/envios.html"), false);
  assert.equal(isBlockedStaticPath("/assets/img/logo.png"), false);
});

test("rejeita payload com dados de cartão", () => {
  assert.equal(hasForbiddenCardPayload({ card: { number: "4111111111111111" } }), true);
  assert.equal(hasForbiddenCardPayload({ cvv: "123" }), true);
  assert.equal(hasForbiddenCardPayload({ token: "tok", payer: { cpf: "52998224725" } }), false);
});

test("itens da preferência do Checkout Pro usam preço do catálogo e somam o frete", () => {
  const quote = quoteCart(products, [{ id: "neurocodigos", qty: 1 }], {
    shippingMethod: "delivery",
    cep: "01310100",
    freeFrom: 360,
  });
  const items = preferenceItems(quote);
  assert.equal(items[0].unit_price, 120);
  assert.equal(items[0].currency_id, "BRL");
  assert.ok(items.some((item) => item.id === "frete"));
});

test("não devolve mensagem crua de erro interno", () => {
  assert.equal(publicErrorCode({ code: "invalid_payer" }), "invalid_payer");
  assert.equal(publicErrorCode({ code: "ENOENT", message: "/secret/.env" }), "pay_failed");
});

test("modo da API: demo sem token, sandbox com TEST- e live com token de produção", () => {
  assert.equal(paymentMode({ accessToken: "", demoPayments: "false" }), "demo");
  assert.equal(
    paymentMode({ accessToken: "TEST-abc", demoPayments: "true" }),
    "demo"
  );
  assert.equal(
    paymentMode({ accessToken: "TEST-abc", demoPayments: "false" }),
    "sandbox"
  );
  assert.equal(
    paymentMode({ accessToken: "APP_USR-abc", demoPayments: "false", testMode: "true" }),
    "sandbox"
  );
  assert.equal(
    paymentMode({ accessToken: "APP_USR-abc", demoPayments: "false" }),
    "live"
  );
});

test("catálogo oficial tem 15 sprays a R$ 120 e extras compráveis", () => {
  const sprays = PRODUCTS.filter((p) => !p.kind || p.kind === "spray");
  assert.equal(sprays.length, 15);
  assert.ok(sprays.every((p) => p.price === 120));
  const extras = Object.fromEntries(PRODUCTS.filter((p) => p.kind).map((p) => [p.id, p.price]));
  assert.equal(extras["campo-morfogenetico"], 149.99);
  assert.equal(extras["musicas-neuroconectivas"], 64);
  assert.equal(extras["musica-neuroconexao"], 222);
  const quote = quoteCart(
    PRODUCTS,
    sprays.map((product) => ({ id: product.id, qty: 1 }))
  );
  assert.equal(Number(quote.subtotal.toFixed(2)), 1800);
  assert.equal(quote.shipping, 0);
});

test("lê id do pagamento no webhook e no IPN", () => {
  assert.deepEqual(
    webhookResource({ type: "payment", data: { id: "999" } }, {}),
    { topic: "payment", id: "999" }
  );
  assert.deepEqual(webhookResource({}, { topic: "payment", id: "888" }), {
    topic: "payment",
    id: "888",
  });
  assert.equal(webhookResource({ type: "payment", data: { id: "7" } }, { id: "1" }).id, "7");
});

test("valida HMAC do webhook do Mercado Pago", () => {
  const secret = "ceme-webhook-secret";
  const dataId = "123456";
  const requestId = "req-1";
  const ts = String(Date.now());
  const v1 = createHmac("sha256", secret)
    .update(webhookManifest({ dataId, requestId, ts }))
    .digest("hex");
  assert.equal(
    isValidWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataId,
      secret,
      now: () => Number(ts),
    }),
    true
  );
  assert.equal(
    isValidWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataId,
      secret: "outra",
      now: () => Number(ts),
    }),
    false
  );
});

test("só gera notification_url em HTTPS da API", () => {
  assert.equal(notificationUrlFromOrigin("http://127.0.0.1:3001"), "");
  assert.equal(
    notificationUrlFromOrigin("https://ceme-checkout.onrender.com"),
    "https://ceme-checkout.onrender.com/api/webhooks/mercadopago"
  );
  assert.equal(
    publicApiOrigin({
      publicApiUrl: "https://api.exemplo.com/",
      requestOrigin: "http://127.0.0.1:3001",
    }),
    "https://api.exemplo.com"
  );
});

test("número do pedido é sequencial a partir de CEME-1", () => {
  assert.equal(formatOrderId(1), "CEME-1");
  assert.equal(formatOrderId(12), "CEME-12");
  assert.equal(formatOrderId(0), "");
  assert.equal(orderSequence("CEME-1"), 1);
  assert.equal(orderSequence("CEME-12"), 12);
  assert.equal(orderSequence("CEME-ABC"), 0);
  assert.equal(nextOrderSequence([]), 1);
  assert.equal(nextOrderSequence(["CEME-1", "CEME-3", "CEME-ABC"]), 4);
});

test("painel do dono soma vendas e separa pendentes de enviados", () => {
  const stats = ownerDashboardStats([
    { orderId: "CEME-1", total: 120, shipped: false },
    { orderId: "CEME-2", total: 240.5, shipped: true },
    { orderId: "CEME-3", total: 88, shipped: false },
  ]);
  assert.equal(stats.count, 3);
  assert.equal(stats.pending, 2);
  assert.equal(stats.shipped, 1);
  assert.equal(stats.revenue, 448.5);
  assert.equal(stats.ticket, 149.5);
  const empty = ownerDashboardStats([]);
  assert.equal(empty.count, 0);
  assert.equal(empty.pending, 0);
  assert.equal(empty.shipped, 0);
  assert.equal(empty.revenue, 0);
  assert.equal(empty.bestMonth, null);
  assert.equal(empty.topProducts.length, 0);
});

test("painel do dono aponta o mês que mais vendeu e monta a série do gráfico", () => {
  const now = Date.UTC(2026, 7, 26, 15, 0, 0);
  const july = Date.UTC(2026, 6, 10, 15, 0, 0);
  const aug1 = Date.UTC(2026, 7, 2, 15, 0, 0);
  const aug20 = Date.UTC(2026, 7, 20, 15, 0, 0);
  const stats = ownerDashboardStats(
    [
      {
        total: 120,
        shipped: true,
        createdAt: july,
        shippingMethod: "delivery",
        items: [{ name: "NeuroCódigos", qty: 1, unitPrice: 120 }],
      },
      {
        total: 240,
        shipped: true,
        createdAt: aug1,
        shippingMethod: "delivery",
        items: [{ name: "NeuroCódigos", qty: 2, unitPrice: 120 }],
      },
      {
        total: 88,
        shipped: false,
        createdAt: aug20,
        shippingMethod: "pickup",
        items: [{ name: "Garrafadas", qty: 1, unitPrice: 88 }],
      },
    ],
    now
  );
  assert.equal(stats.bestMonth.key, "2026-08");
  assert.equal(stats.bestMonth.label, "agosto de 2026");
  assert.equal(stats.bestMonth.revenue, 328);
  assert.equal(stats.thisMonth.revenue, 328);
  assert.equal(stats.lastMonth.revenue, 120);
  assert.equal(stats.monthDeltaPct, 173.3);
  assert.equal(stats.months.at(-1).key, "2026-08");
  assert.equal(stats.months.at(-1).count, 2);
  assert.equal(stats.topProducts[0].name, "NeuroCódigos");
  assert.equal(stats.topProducts[0].qty, 3);
  assert.equal(stats.shipping.delivery.count, 2);
  assert.equal(stats.shipping.pickup.count, 1);
  const day20 = stats.days.find((day) => day.key === "2026-08-20");
  assert.equal(day20.revenue, 88);
});

test("pedido só vai para envio e acompanhamento depois do Mercado Pago aprovar", () => {
  assert.equal(isPaymentApproved({ status: "pending" }), false);
  assert.equal(isPaymentApproved({ status: "in_process" }), false);
  assert.equal(isPaymentApproved({ status: "rejected" }), false);
  assert.equal(isPaymentApproved({ status: "approved" }), true);
  assert.equal(unpaidPaymentError("approved"), "");
  assert.equal(unpaidPaymentError("pending"), "payment_not_confirmed");
  assert.equal(unpaidPaymentError("rejected"), "payment_not_confirmed");
  assert.equal(unpaidPaymentError(""), "payment_not_confirmed");
  assert.deepEqual(
    paidFulfillmentOrders([
      { orderId: "CEME-A", status: "pending" },
      { orderId: "CEME-B", status: "approved" },
    ]).map((order) => order.orderId),
    ["CEME-B"]
  );
  assert.equal(publicErrorCode({ code: "payment_pending" }), "payment_pending");
  assert.equal(publicErrorCode({ code: "payment_not_confirmed" }), "payment_not_confirmed");
});

test("guarda nome, endereço e itens do pedido sem cadastro de membro", () => {
  const quote = quoteCart(products, [{ id: "neurocodigos", qty: 2 }], {
    shippingMethod: "delivery",
    cep: "70863540",
  });
  const payer = validatePayer({
    name: "Maria Silva",
    email: "maria@email.com",
    phone: "61999991111",
    cpf: "52998224725",
    cep: "70863540",
    street: "CLN 211",
    number: "211",
    neighborhood: "Asa Norte",
    city: "Brasília",
    state: "DF",
  });
  const snap = fulfillmentSnapshot({
    orderId: "CEME-TEST-1",
    quote,
    payer,
    status: "approved",
    now: () => 1,
  });
  assert.equal(snap.customer.name, "Maria Silva");
  assert.equal(snap.customer.cpf, undefined);
  assert.equal(snap.customer.email, "maria@email.com");
  assert.equal(snap.shipped, false);
  assert.equal(snap.items[0].qty, 2);
  assert.match(formatAddress(snap.address), /CLN 211/);
  const pub = publicOrderView(snap);
  assert.equal(pub.cpf, undefined);
  assert.equal(pub.email, undefined);
  assert.equal(pub.shipped, false);
  assert.equal(pub.customerName, "Maria Silva");
  const admin = adminOrderView(snap);
  assert.equal(admin.cpf, undefined);
  assert.equal(admin.email, "maria@email.com");
  assert.equal(admin.hasEmail, true);
  assert.equal(admin.phone, "61999991111");
  assert.equal(admin.paymentId, "");
  const adminPay = adminOrderView({ ...snap, paymentId: "1234567890" });
  assert.equal(adminPay.paymentId, "1234567890");
  assert.equal(sanitizeStoredOrder({ customer: { cpf: "52998224725", email: "a@b.c", name: "Ana" } }).customer.cpf, undefined);
  assert.equal(sanitizeStoredOrder({ customer: { cpf: "52998224725", email: "a@b.c", name: "Ana" } }).customer.email, "a@b.c");
  assert.equal(normalizeTrackingCode("ab 123456789 br"), "AB123456789BR");
  assert.equal(normalizeTrackingCode("x"), "");
});

test("valida e-mail e celular brasileiro, inclusive confirmação", () => {
  assert.equal(isEmail("maria@gmail.com"), true);
  assert.equal(isEmail("x"), false);
  assert.equal(isEmail("sem-arroba.com"), false);
  assert.equal(isBrazilianMobile("61999991111"), true);
  assert.equal(isBrazilianMobile("(61) 99999-1111"), true);
  assert.equal(isBrazilianMobile("+55 61 99999-1111"), true);
  assert.equal(brazilianMobileDigits("+55 61 99999-1111"), "61999991111");
  assert.equal(isBrazilianMobile("6133334444"), false);
  assert.equal(isBrazilianMobile("11111111111"), false);
  assert.equal(isBrazilianMobile("00999991111"), false);
  const base = {
    name: "Maria Silva",
    email: "maria@gmail.com",
    phone: "61999991111",
    cpf: "52998224725",
    cep: "70863540",
    street: "CLN 211",
    number: "211",
    neighborhood: "Asa Norte",
    city: "Brasília",
    state: "DF",
  };
  const ok = validatePayer({
    ...base,
    emailConfirm: "maria@gmail.com",
    phoneConfirm: "(61) 99999-1111",
  });
  assert.equal(ok.email, "maria@gmail.com");
  assert.equal(ok.phone, "61999991111");
  assert.throws(
    () => validatePayer({ ...base, emailConfirm: "outra@gmail.com" }),
    (err) => err.code === "invalid_payer" && err.fields.includes("emailConfirm")
  );
  assert.throws(
    () => validatePayer({ ...base, phoneConfirm: "61988887777" }),
    (err) => err.code === "invalid_payer" && err.fields.includes("phoneConfirm")
  );
  assert.throws(
    () => validatePayer({ ...base, phone: "6133334444" }),
    (err) => err.code === "invalid_payer" && err.fields.includes("phone")
  );
});

test("prazo de entrega de 3 dias em Brasília, com saiu hoje e chega amanhã", () => {
  const noon = (year, month, day) => Date.UTC(year, month - 1, day, 15, 0, 0);
  const order = { shippingMethod: "delivery", shipped: true, shippedAt: noon(2026, 8, 26) };
  const left = deliveryProgress(order, noon(2026, 8, 26));
  assert.equal(DELIVERY_DAYS, 3);
  assert.equal(left.phase, "left_today");
  assert.equal(left.etaLabel, "29/08/2026");
  assert.match(left.headline, /saiu hoje/i);
  assert.match(left.headline, /prazo de 3 dias/i);
  assert.equal(deliveryProgress(order, noon(2026, 8, 27)).phase, "in_transit");
  const tomorrow = deliveryProgress(order, noon(2026, 8, 28));
  assert.equal(tomorrow.phase, "arrives_tomorrow");
  assert.equal(tomorrow.headline, "Sua entrega chega amanhã.");
  assert.equal(deliveryProgress(order, noon(2026, 8, 29)).phase, "due_today");
  assert.equal(deliveryProgress(order, noon(2026, 8, 30)).phase, "overdue");
  const packing = deliveryProgress({ shippingMethod: "delivery", shipped: false }, noon(2026, 8, 26));
  assert.equal(packing.phase, "packing");
  assert.equal(
    deliveryProgress({ shippingMethod: "pickup", shipped: true }, noon(2026, 8, 26)).phase,
    "pickup_ready"
  );
  const view = publicOrderView(order);
  assert.equal(view.phase, deliveryProgress(order).phase);
  assert.ok(view.headline);
  assert.equal(view.etaLabel, "29/08/2026");
});
