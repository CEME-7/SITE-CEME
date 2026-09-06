import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MercadoPagoConfig, MerchantOrder, Payment, Preference } from "mercadopago";
import {
  FREE_SHIPPING_FROM,
  hasForbiddenCardPayload,
  isHttpsUrl,
  isOriginAllowed,
  isBlockedStaticPath,
  isValidWebhookSignature,
  isIpnNotification,
  notificationUrlFromOrigin,
  paymentMode,
  preferenceItems,
  publicApiOrigin,
  publicErrorCode,
  quoteCart,
  validatePayer,
  webhookResource,
  fulfillmentSnapshot,
  publicOrderView,
  adminOrderView,
  createPublicKey,
  orderPublicKey,
  canAccessPublicOrder,
  withAccessQuery,
  trackingPageUrl,
  timingSafeEqualText,
  correiosTrackingUrl,
  isPaymentApproved,
  paidFulfillmentOrders,
  paymentPatchFromMp,
  normalizeTrackingCode,
  unpaidPaymentError,
  deliveryProgress,
  DELIVERY_DAYS,
  ownerDashboardStats,
} from "./lib.js";
import { notifyArrival, notifyPaid, notifyShipped, shippedMessage, whatsappSendUrl } from "./notify.js";
import { buildDigitalZip, canDownloadDigital, digitalDownloadsForOrder } from "./digital.js";
import { buildCupomPdf, cupomFilename } from "./cupom.js";
import { allocateOrderId, findOrder, initStore, ordersBackend, ordersDurable, readOrders, upsertOrder } from "./orders-store.js";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

const require = createRequire(import.meta.url);
const { PRODUCTS } = require("../produtos.js");
const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PORT = Number(process.env.PORT) || 3001;
const MAX_INSTALLMENTS = Number(process.env.MAX_INSTALLMENTS || 3);
const FREE_FROM = Number(process.env.FREE_SHIPPING_FROM || FREE_SHIPPING_FROM);
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY || "";
const MODE = paymentMode({
  accessToken: MP_ACCESS_TOKEN,
  demoPayments: process.env.DEMO_PAYMENTS,
  testMode: process.env.MP_TEST_MODE,
});
const DEMO_PAYMENTS = MODE === "demo";
const SANDBOX = MODE === "sandbox";
const MP_WEBHOOK_SECRET = String(process.env.MP_WEBHOOK_SECRET || "").trim();
const ADMIN_KEY = String(process.env.ADMIN_KEY || "").trim();

const allowedOrigins = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; img-src 'self' data: https:; media-src 'self'; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; connect-src 'self' https://viacep.com.br; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.mercadopago.com https://www.mercadopago.com.br https://http2.mlstatic.com"
  );
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  if (req.path.startsWith("/api/webhooks/")) return next();
  const proto = String(req.get("x-forwarded-proto") || req.protocol || "http").split(",")[0];
  const serverOrigin = `${proto}://${req.get("host")}`;
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin, { allowedOrigins, mode: MODE, serverOrigin })) {
        return callback(null, true);
      }
      return callback(new Error("origin_not_allowed"));
    },
  })(req, res, next);
});
if (MODE === "live" && !allowedOrigins.length) {
  console.warn("ALLOWED_ORIGINS vazio em modo live: o navegador não poderá chamar a API.");
}

const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || "local";
  const now = Date.now();
  const windowMs = 60_000;
  const admin = req.path.startsWith("/api/orders");
  const orderStatus =
    req.method === "GET" && /^\/api\/order\/[^/]+\/?$/.test(req.path);
  const buy = req.path.startsWith("/api/checkout") || req.path.startsWith("/api/order");
  // Polling do Pix no retorno precisa de margem; GET de status não pode ser 12/min.
  const max = admin ? 8 : orderStatus ? 90 : buy ? 20 : 30;
  const bucket = `${ip}:${admin ? "admin" : orderStatus ? "order-status" : buy ? "buy" : "api"}`;
  const current = hits.get(bucket) || [];
  const recent = current.filter((time) => now - time < windowMs);
  recent.push(now);
  hits.set(bucket, recent);
  if (recent.length > max) {
    return res.status(429).json({ error: "rate_limited" });
  }
  return next();
}

function requestPublicKey(req) {
  return String(req.query.k || req.query.t || req.get("x-order-key") || "").trim();
}

function hasPublicOrderAccess(order, req, { paymentMatched = false } = {}) {
  return canAccessPublicOrder(order, {
    publicKey: requestPublicKey(req),
    paymentMatched,
  });
}

function quoteFromBody(body) {
  return quoteCart(PRODUCTS, body?.items || [], {
    shippingMethod: body?.shippingMethod,
    cep: body?.payer?.cep || body?.cep,
    freeFrom: FREE_FROM,
  });
}

function requestOrigin(req) {
  const proto = String(req.get("x-forwarded-proto") || req.protocol || "http").split(",")[0];
  const host = req.get("host") || `127.0.0.1:${PORT}`;
  return `${proto}://${host}`;
}

function siteUrl(req) {
  const fromEnv = String(process.env.PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return requestOrigin(req);
}

function webhookNotifyUrl(req) {
  const fromEnv = String(process.env.NOTIFICATION_URL || "").trim();
  if (fromEnv.startsWith("https://")) return fromEnv;
  return notificationUrlFromOrigin(
    publicApiOrigin({
      publicApiUrl: process.env.PUBLIC_API_URL,
      renderExternalUrl: process.env.RENDER_EXTERNAL_URL,
      requestOrigin: requestOrigin(req),
    })
  );
}

async function rememberOrder(orderId, patch) {
  const id = String(orderId || "").slice(0, 80);
  if (!/^CEME-[A-Z0-9-]+$/i.test(id)) return null;
  const prev = (await findOrder(id)) || { orderId: id };
  const publicKey = orderPublicKey({ ...prev, ...patch }) || createPublicKey();
  const saved = await upsertOrder({
    ...prev,
    ...patch,
    orderId: id,
    publicKey,
    updatedAt: Date.now(),
  });
  if (isPaymentApproved(saved) && !isPaymentApproved(prev) && !(prev.notifyPaid?.email || prev.notifyPaid?.whatsapp || prev.notifyPaid?.delivered)) {
    const shop = String(
      process.env.PUBLIC_SITE_URL ||
        process.env.PUBLIC_API_URL ||
        process.env.RENDER_EXTERNAL_URL ||
        ""
    ).replace(/\/$/, "");
    const trackingUrl = trackingPageUrl(shop, id, saved.publicKey);
    try {
      const downloads = digitalDownloadsForOrder(saved);
      const apiOrigin = publicApiOrigin({
        publicApiUrl: process.env.PUBLIC_API_URL,
        renderExternalUrl: process.env.RENDER_EXTERNAL_URL,
        requestOrigin: shop,
      }) || shop;
      const downloadUrl =
        downloads.length && apiOrigin
          ? withAccessQuery(
              `${apiOrigin}/api/order/${encodeURIComponent(id)}/download/${encodeURIComponent(downloads[0].id)}`,
              saved.publicKey
            )
          : "";
      const notify = await notifyPaid(saved, { trackingUrl, downloadUrl });
      return upsertOrder({
        ...saved,
        notifyPaid: {
          email: !!notify.email?.sent,
          whatsapp: !!notify.whatsapp?.sent,
          store: !!notify.store?.sent,
          delivered: !!(notify.email?.sent || notify.whatsapp?.sent),
          attemptedAt: Date.now(),
        },
      });
    } catch (err) {
      console.error("notify_paid_failed", publicErrorCode(err));
    }
  }
  return saved;
}

async function maybeNotifyArrival(order) {
  if (!order || order.notifyArrival || deliveryProgress(order).phase !== "arrives_tomorrow") {
    return order;
  }
  try {
    const notify = await notifyArrival(order);
    const saved = await rememberOrder(order.orderId, {
      notifyArrival: {
        email: !!notify.email?.sent,
        whatsapp: !!notify.whatsapp?.sent,
        attemptedAt: Date.now(),
      },
    });
    return saved || order;
  } catch (err) {
    console.error("notify_arrival_failed", publicErrorCode(err));
    return order;
  }
}

let lastArrivalTickAt = 0;
async function tickArrivalNotices() {
  const now = Date.now();
  if (now - lastArrivalTickAt < 30 * 60 * 1000) return;
  lastArrivalTickAt = now;
  try {
    const list = paidFulfillmentOrders(await readOrders());
    for (const order of list) {
      if (order?.shipped && !order.notifyArrival) {
        await maybeNotifyArrival(order);
      }
    }
  } catch (err) {
    console.error("arrival_tick_failed", publicErrorCode(err));
  }
}

function requireAdmin(req, res) {
  if (!ADMIN_KEY) {
    res.status(503).json({ error: "admin_not_configured" });
    return false;
  }
  const got = String(req.get("x-admin-key") || "").trim();
  if (!timingSafeEqualText(got, ADMIN_KEY)) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}

function mpClient() {
  return new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    demo: DEMO_PAYMENTS,
    sandbox: SANDBOX,
    mode: MODE,
    storage: ordersBackend(),
    durable: ordersDurable(),
  });
  void tickArrivalNotices();
});

app.get("/api/config", (_req, res) => {
  res.json({
    demo: DEMO_PAYMENTS,
    sandbox: SANDBOX,
    mode: MODE,
    mpPublicKey: "",
    checkout: "pro",
    maxInstallments: MAX_INSTALLMENTS,
    freeShippingFrom: FREE_FROM,
  });
});

app.post("/api/quote", rateLimit, (req, res) => {
  try {
    const quote = quoteFromBody(req.body || {});
    return res.json(quote);
  } catch (err) {
    return res.status(400).json({ error: err.code || "quote_failed" });
  }
});

app.post("/api/checkout", rateLimit, async (req, res) => {
  try {
    if (hasForbiddenCardPayload(req.body)) {
      return res.status(400).json({ error: "card_data_not_allowed" });
    }
    const quote = quoteFromBody(req.body || {});
    const requireAddress = quote.hasPhysical && quote.shippingMethod === "delivery";
    const requireBirthDate = (quote.lines || []).some(
      (line) => line.id === "musica-neuroconexao" || line.kind === "neuro"
    );
    const payer = validatePayer(req.body?.payer || {}, { requireAddress, requireBirthDate });
    const orderId = await allocateOrderId();
    const shop = siteUrl(req);
    const snapshot = fulfillmentSnapshot({ orderId, quote, payer, status: DEMO_PAYMENTS ? "approved" : "pending" });
    const saved = await rememberOrder(orderId, snapshot);
    const publicKey = orderPublicKey(saved) || snapshot.publicKey;
    const back = withAccessQuery(`${shop}/index.html`, publicKey);
    const items = preferenceItems(quote);

    if (DEMO_PAYMENTS) {
      await rememberOrder(orderId, { demo: true });
      return res.json({
        demo: true,
        orderId,
        publicKey,
        trackingId: orderId,
        total: quote.total,
        shipping: quote.shipping,
        checkoutUrl: `${back}${back.includes("?") ? "&" : "?"}mp=demo&external_reference=${encodeURIComponent(orderId)}`,
      });
    }

    const names = payer.name.split(" ");
    const preference = new Preference(mpClient());
    const body = {
      items,
      payer: {
        name: names[0],
        surname: names.slice(1).join(" ") || names[0],
        email: payer.email,
        phone: { area_code: payer.phone.slice(0, 2), number: payer.phone.slice(2) },
        address: requireAddress
          ? {
              zip_code: payer.cep,
              street_name: payer.street,
              street_number: payer.number,
            }
          : undefined,
      },
      back_urls: {
        success: back,
        failure: back,
        pending: back,
      },
      ...(isHttpsUrl(back) ? { auto_return: "approved" } : {}),
      external_reference: orderId,
      statement_descriptor: "FAMILIA CEME",
      binary_mode: false,
      payment_methods: {
        installments: MAX_INSTALLMENTS,
        default_installments: 1,
      },
      metadata: {
        order_id: orderId,
        shipping_method: quote.shippingMethod,
      },
    };
    const notify = webhookNotifyUrl(req);
    if (notify) {
      body.notification_url = notify;
    }

    const result = await preference.create({
      body,
      requestOptions: {
        idempotencyKey: req.body?.idempotencyKey || randomUUID(),
      },
    });

    const checkoutUrl = SANDBOX
      ? result.sandbox_init_point || result.init_point
      : result.init_point || result.sandbox_init_point;
    if (!checkoutUrl) {
      return res.status(502).json({ error: "checkout_failed" });
    }

    await rememberOrder(orderId, { preferenceId: result.id });
    return res.json({
      orderId,
      publicKey,
      trackingId: orderId,
      total: quote.total,
      shipping: quote.shipping,
      preferenceId: result.id,
      checkoutUrl,
    });
  } catch (err) {
    const code = publicErrorCode(err);
    const status =
      code === "invalid_payer" ||
      code === "empty_cart" ||
      code === "invalid_item" ||
      code === "invalid_qty" ||
      code === "card_data_not_allowed"
        ? 400
        : 500;
    if (status === 500) {
      console.error("checkout_failed", code);
    }
    return res.status(status).json({
      error: code === "pay_failed" ? "checkout_failed" : code,
      fields: err.fields || undefined,
    });
  }
});

app.get("/robots.txt", (_req, res) => {
  res
    .type("text/plain")
    .send("User-agent: *\nAllow: /\nDisallow: /envios.html\nDisallow: /envios.js\nDisallow: /api/\n");
});

app.get("/api/order/:orderId/download/:productId", rateLimit, async (req, res) => {
  const orderId = String(req.params.orderId || "").slice(0, 80);
  const productId = String(req.params.productId || "").slice(0, 80);
  if (!/^CEME-[A-Z0-9-]+$/i.test(orderId) || !/^[a-z0-9-]+$/i.test(productId)) {
    return res.status(400).json({ error: "invalid_payment" });
  }
  const stored = await findOrder(orderId);
  if (!stored || !hasPublicOrderAccess(stored, req) || !isPaymentApproved(stored)) {
    return res.status(404).json({ error: "not_found" });
  }
  if (!canDownloadDigital(stored, productId)) {
    return res.status(404).json({ error: "not_found" });
  }
  try {
    const pack = buildDigitalZip(productId);
    if (!pack) return res.status(404).json({ error: "not_found" });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${pack.zipName}"`);
    res.setHeader("Cache-Control", "no-store");
    return res.send(pack.buffer);
  } catch (err) {
    console.error("digital_zip_failed", publicErrorCode(err));
    return res.status(502).json({ error: "pay_failed" });
  }
});

app.get("/api/order/:orderId/cupom.pdf", rateLimit, async (req, res) => {
  const orderId = String(req.params.orderId || "").slice(0, 80);
  if (!/^CEME-[A-Z0-9-]+$/i.test(orderId)) {
    return res.status(400).json({ error: "invalid_payment" });
  }
  const stored = await findOrder(orderId);
  if (!stored || !hasPublicOrderAccess(stored, req) || !isPaymentApproved(stored)) {
    return res.status(404).json({ error: "not_found" });
  }
  try {
    const pdf = await buildCupomPdf(publicOrderView(stored), {
      logoPath: path.join(SITE_ROOT, "assets/img/logo.png"),
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${cupomFilename(orderId)}"`);
    return res.send(pdf);
  } catch (err) {
    console.error("cupom_pdf_failed", publicErrorCode(err));
    return res.status(502).json({ error: "pay_failed" });
  }
});

app.get("/api/order/:orderId", rateLimit, async (req, res) => {
  const orderId = String(req.params.orderId || "").slice(0, 80);
  if (!/^CEME-[A-Z0-9-]+$/i.test(orderId)) {
    return res.status(400).json({ error: "invalid_payment" });
  }
  const stored = await findOrder(orderId);
  const paymentId = String(req.query.payment_id || "").replace(/\D/g, "");
  if (DEMO_PAYMENTS) {
    if (!stored || !hasPublicOrderAccess(stored, req)) {
      return res.status(404).json({ error: "not_found" });
    }
    if (!isPaymentApproved(stored)) {
      return res.status(404).json({ error: unpaidPaymentError(stored.status) });
    }
    const latest = await maybeNotifyArrival({ ...stored, status: stored.status || "approved", demo: true });
    return res.json(publicOrderView(latest));
  }
  try {
    const payment = new Payment(mpClient());
    let latest = stored;
    let paymentMatched = false;
    if (paymentId) {
      const result = await payment.get({ id: paymentId });
      if (result.external_reference && result.external_reference !== orderId) {
        return res.status(404).json({ error: "not_found" });
      }
      paymentMatched = String(result.external_reference || "") === orderId;
      latest = (await rememberOrder(orderId, paymentPatchFromMp(result))) || latest;
    } else if (!isPaymentApproved(stored) && canAccessPublicOrder(stored, { publicKey: requestPublicKey(req) })) {
      const found = await payment.search({
        options: {
          external_reference: orderId,
          sort: "date_created",
          criteria: "desc",
        },
      });
      const results = found.results || [];
      const approved = results.find((item) => item.status === "approved");
      const current = approved || results[0];
      if (current) {
        latest = (await rememberOrder(orderId, paymentPatchFromMp(current))) || latest;
      }
    }
    if (!hasPublicOrderAccess(latest, req, { paymentMatched })) {
      return res.status(404).json({ error: "not_found" });
    }
    if (!isPaymentApproved(latest)) {
      // Cliente no retorno do Pix precisa conseguir consultar status pending e tentar de novo.
      return res.status(200).json({
        orderId: latest?.orderId || orderId,
        status: latest?.status || "pending",
        publicKey: orderPublicKey(latest) || "",
        paymentType: latest?.paymentType || "",
        paymentMethod: latest?.paymentMethod || "",
        isPix: !!latest && (latest.paymentMethod === "pix" || latest.paymentType === "bank_transfer"),
        error: unpaidPaymentError(latest?.status),
      });
    }
    latest = await maybeNotifyArrival(latest);
    return res.json(publicOrderView(latest));
  } catch {
    if (!hasPublicOrderAccess(stored, req, { paymentMatched: false })) {
      return res.status(404).json({ error: "not_found" });
    }
    if (isPaymentApproved(stored)) {
      const latest = await maybeNotifyArrival(stored);
      return res.json(publicOrderView(latest));
    }
    return res.status(404).json({ error: stored ? unpaidPaymentError(stored.status) : "not_found" });
  }
});

/** Reconsulta o MP para pedidos ainda não aprovados (ex.: webhook IPN rejeitado). */
async function syncPendingOrdersFromMp(orders = []) {
  if (DEMO_PAYMENTS || !MP_ACCESS_TOKEN) return orders;
  const pending = orders
    .filter((order) => order?.orderId && !isPaymentApproved(order))
    .slice(-25);
  if (!pending.length) return orders;

  const payment = new Payment(mpClient());
  const byId = new Map(orders.map((order) => [order.orderId, order]));
  for (const order of pending) {
    try {
      const found = await payment.search({
        options: {
          external_reference: order.orderId,
          sort: "date_created",
          criteria: "desc",
        },
      });
      const results = found.results || [];
      const current = results.find((item) => item.status === "approved") || results[0];
      if (!current) continue;
      const saved = await rememberOrder(order.orderId, paymentPatchFromMp(current));
      if (saved) byId.set(order.orderId, saved);
    } catch (err) {
      console.error("admin_sync_payment_failed", order.orderId, publicErrorCode(err));
    }
  }
  return orders.map((order) => byId.get(order.orderId) || order);
}

app.get("/api/orders", rateLimit, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const refreshed = await syncPendingOrdersFromMp(await readOrders());
  const listed = paidFulfillmentOrders(refreshed);
  const orders = [];
  for (const order of listed) {
    orders.push(adminOrderView(await maybeNotifyArrival(order)));
  }
  const views = orders.filter(Boolean);
  return res.json({
    orders: views,
    stats: ownerDashboardStats(views),
    storage: ordersBackend(),
    durable: ordersDurable(),
  });
});

app.post("/api/orders/:orderId/tracking", rateLimit, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const orderId = String(req.params.orderId || "").slice(0, 80);
  if (!/^CEME-[A-Z0-9-]+$/i.test(orderId)) {
    return res.status(400).json({ error: "invalid_payment" });
  }
  const stored = await findOrder(orderId);
  if (!isPaymentApproved(stored)) {
    return res.status(404).json({ error: stored ? unpaidPaymentError(stored.status) : "not_found" });
  }
  const trackingCode = normalizeTrackingCode(req.body?.trackingCode);
  if (!trackingCode) {
    return res.status(400).json({ error: "invalid_tracking" });
  }
  const saved = await rememberOrder(orderId, { trackingCode, status: stored.status || "approved" });
  return res.json(adminOrderView(saved));
});

app.post("/api/orders/:orderId/shipped", rateLimit, async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const orderId = String(req.params.orderId || "").slice(0, 80);
  if (!/^CEME-[A-Z0-9-]+$/i.test(orderId)) {
    return res.status(400).json({ error: "invalid_payment" });
  }
  const stored = await findOrder(orderId);
  if (!isPaymentApproved(stored)) {
    return res.status(404).json({ error: stored ? unpaidPaymentError(stored.status) : "not_found" });
  }

  const trackingCode =
    normalizeTrackingCode(req.body?.trackingCode) || stored.trackingCode || "";
  const trackingUrl = correiosTrackingUrl(trackingCode);
  const shippedAt = stored.shippedAt || Date.now();
  const progress = deliveryProgress({
    ...stored,
    shipped: true,
    shippedAt,
    trackingCode,
  });
  const text = shippedMessage({
    name: stored.customer?.name,
    orderId: stored.orderId,
    trackingCode,
    trackingUrl,
    etaLabel: progress.etaLabel,
    days: DELIVERY_DAYS,
    shippingMethod: stored.shippingMethod || "delivery",
  });
  const whatsappUrl = whatsappSendUrl(stored.customer?.phone, text);

  if (stored.shipped) {
    return res.json({
      ...adminOrderView(stored),
      alreadyShipped: true,
      whatsappUrl,
    });
  }

  const notify = await notifyShipped(
    { ...stored, trackingCode, shippingMethod: stored.shippingMethod || "delivery" },
    { trackingCode, trackingUrl, progress, days: DELIVERY_DAYS }
  );
  const saved = await rememberOrder(orderId, {
    trackingCode,
    shipped: true,
    shippedAt,
    etaAt: progress.etaAt,
    notify: {
      email: !!notify.email?.sent,
      whatsapp: !!notify.whatsapp?.sent,
      emailReason: notify.email?.reason || "",
      whatsappReason: notify.whatsapp?.reason || "",
    },
  });
  return res.json({
    ...adminOrderView(saved),
    alreadyShipped: false,
    whatsappUrl: notify.whatsapp?.url || whatsappUrl,
    notify: saved.notify,
  });
});

async function handleMercadoPagoWebhook(req, res) {
  const body = req.body || {};
  const query = req.query || {};
  const resource = webhookResource(body, query);
  const dataId = resource.id || String(query["data.id"] || "").trim();
  const ipn = isIpnNotification(body, query);

  // Webhook moderno exige HMAC. IPN legado não valida assinatura — a prova é a consulta na API do MP.
  if (!ipn) {
    if (MODE === "live" && !MP_WEBHOOK_SECRET) {
      return res.status(401).json({ error: "invalid_signature" });
    }
    if (MP_WEBHOOK_SECRET) {
      const ok = isValidWebhookSignature({
        xSignature: req.get("x-signature"),
        xRequestId: req.get("x-request-id"),
        dataId,
        secret: MP_WEBHOOK_SECRET,
      });
      if (!ok) {
        return res.status(401).json({ error: "invalid_signature" });
      }
    }
  }

  if (DEMO_PAYMENTS || !MP_ACCESS_TOKEN) {
    return res.status(200).json({ ok: true });
  }

  try {
    await applyMercadoPagoNotification(resource);
  } catch (err) {
    console.error("webhook_failed", publicErrorCode(err));
  }
  return res.status(200).json({ ok: true });
}

app.post("/api/webhooks/mercadopago", handleMercadoPagoWebhook);
app.get("/api/webhooks/mercadopago", handleMercadoPagoWebhook);

async function applyMercadoPagoNotification(resource) {
  const topic = String(resource.topic || "");
  const id = String(resource.id || "").trim();
  if (!id) return;

  if (topic.includes("merchant_order") || topic.includes("merchant_orders")) {
    const order = await new MerchantOrder(mpClient()).get({ merchantOrderId: id });
    const payments = Array.isArray(order.payments) ? order.payments : [];
    const paid = payments.find((item) => item.status === "approved") || payments[0];
    if (paid?.id) {
      await rememberPayment(paid.id);
    }
    return;
  }

  if (!topic || topic.includes("payment")) {
    await rememberPayment(id);
  }
}

async function rememberPayment(paymentId) {
  const digits = String(paymentId || "").replace(/\D/g, "");
  if (!digits) return;
  const result = await new Payment(mpClient()).get({ id: digits });
  await rememberOrder(result.external_reference, paymentPatchFromMp(result));
}

app.use((req, res, next) => {
  if (isBlockedStaticPath(req.path)) {
    return res.status(404).end();
  }
  return next();
});
app.use(express.static(SITE_ROOT, { index: "index.html", extensions: ["html"], dotfiles: "deny" }));

async function bootStore() {
  try {
    const { backend, durable } = await initStore();
    if (backend !== "postgres") {
      console.warn(
        durable
          ? "Pedidos no disco /data. Ligue DATABASE_URL (Postgres) para o histórico não depender só do disco."
          : "DATABASE_URL ausente e sem disco: o histórico de pedidos some no restart do Render."
      );
    } else {
      console.log("Pedidos: Postgres conectado.");
    }
  } catch (err) {
    console.error(
      `Pedidos: Postgres ainda não aceita conexão (${err.code || err.message}). Nova tentativa em 5s.`
    );
    setTimeout(() => {
      void bootStore();
    }, 5000);
  }
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Loja CEME em http://127.0.0.1:${PORT}  (mode=${MODE}, storage=${ordersBackend()}, durable=${ordersDurable()})`);
  void bootStore();
});
