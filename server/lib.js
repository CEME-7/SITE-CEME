import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { publicDigitalDownloads } from "./digital.js";

export const MAX_QTY = 20;
export const MIN_INSTALLMENT = 20;
// TEMPORÁRIO (teste live): frete zerado. Restaurar 360 depois do teste.
export const FREE_SHIPPING_FROM = 0;

/** demo = API local sem Mercado Pago; sandbox = credenciais TEST; live = produção. */
export function paymentMode({ accessToken = "", demoPayments, testMode } = {}) {
  const token = String(accessToken || "").trim();
  const forceDemo =
    String(demoPayments).toLowerCase() === "true" || !token;
  if (forceDemo) return "demo";
  const sandbox =
    String(testMode).toLowerCase() === "true" || token.startsWith("TEST-");
  return sandbox ? "sandbox" : "live";
}

export function isPaymentApproved(order) {
  return String(order?.status || "").toLowerCase() === "approved";
}

/** Pix no Checkout Pro: payment_method_id=pix ou payment_type_id=bank_transfer. */
export function isPixPayment({ paymentType = "", paymentMethod = "" } = {}) {
  const method = String(paymentMethod || "").toLowerCase();
  const type = String(paymentType || "").toLowerCase();
  if (method === "pix" || type === "pix" || method.includes("pix")) return true;
  if (type === "bank_transfer") return true;
  return false;
}

export function paymentPatchFromMp(result = {}) {
  const paymentId = String(result.id || "").replace(/\D/g, "");
  const patch = {
    status: result.status || "unknown",
    paymentType: String(result.payment_type_id || "").trim(),
    paymentMethod: String(result.payment_method_id || "").trim(),
  };
  if (paymentId) patch.paymentId = paymentId;
  return patch;
}

/** Pedido sem aprovação do Mercado Pago: não aparece na loja nem no painel. */
export function unpaidPaymentError(status) {
  return isPaymentApproved({ status }) ? "" : "payment_not_confirmed";
}

export function paidFulfillmentOrders(orders = []) {
  return orders.filter(isPaymentApproved);
}

// TEMPORÁRIO (teste live): frete R$ 0 em todas as regiões.
export const SHIPPING_FEES = {
  pickup: 0,
  df: 0,
  centroOeste: 0,
  sudeste: 0,
  sul: 0,
  nordeste: 0,
  norte: 0,
  unknown: 0,
};

export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function isEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length < 6 || email.length > 120) return false;
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i.test(email);
}

export function brazilianMobileDigits(value) {
  let digits = onlyDigits(value);
  if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
  return digits.slice(0, 11);
}

export function isBrazilianMobile(value) {
  const digits = brazilianMobileDigits(value);
  if (digits.length !== 11) return false;
  const ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (digits[2] !== "9") return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}

export function isCpf(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(cpf[10]);
}

export function isCep(value) {
  return onlyDigits(value).length === 8;
}

export function luhn(value) {
  const s = onlyDigits(value);
  if (s.length < 13 || s.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i -= 1) {
    let n = Number(s[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function isPhysicalProduct(product) {
  const kind = product?.kind || "spray";
  return kind === "spray" || kind === "garrafada";
}

export function shippingRegion(cep) {
  const d = onlyDigits(cep);
  if (d.length !== 8) return "unknown";
  const n = Number(d.slice(0, 5));
  if ((n >= 70000 && n <= 72799) || (n >= 73000 && n <= 73699)) return "df";
  if (n <= 39999) return "sudeste";
  if (n <= 65999) return "nordeste";
  if (n <= 69999) return "norte";
  if (n <= 76799) return "centroOeste";
  if (n <= 77999) return "norte";
  if (n <= 79999) return "centroOeste";
  return "sul";
}

export function calcShipping({
  method = "delivery",
  cep = "",
  subtotal = 0,
  hasPhysical = true,
  freeFrom = FREE_SHIPPING_FROM,
} = {}) {
  if (!hasPhysical) return 0;
  if (method === "pickup") return 0;
  if (Number(subtotal) >= Number(freeFrom || FREE_SHIPPING_FROM)) return 0;
  const region = shippingRegion(cep);
  return SHIPPING_FEES[region] ?? SHIPPING_FEES.unknown;
}

export function catalogMap(products) {
  const map = new Map();
  for (const product of products) {
    map.set(product.id, {
      id: product.id,
      name: product.name,
      volume: product.volume,
      price: Number(product.price),
      kind: product.kind || "spray",
    });
  }
  return map;
}

export function quoteCart(products, items, options = {}) {
  const catalog = catalogMap(products);
  if (!Array.isArray(items) || !items.length) {
    const error = new Error("empty_cart");
    error.code = "empty_cart";
    throw error;
  }

  const lines = [];
  let subtotal = 0;
  let hasPhysical = false;

  for (const item of items) {
    const product = catalog.get(item && item.id);
    if (!product) {
      const error = new Error("invalid_item");
      error.code = "invalid_item";
      throw error;
    }
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      const error = new Error("invalid_qty");
      error.code = "invalid_qty";
      throw error;
    }
    const lineTotal = product.price * qty;
    subtotal += lineTotal;
    if (isPhysicalProduct(product)) hasPhysical = true;
    lines.push({
      id: product.id,
      name: product.name,
      volume: product.volume,
      kind: product.kind,
      qty,
      unitPrice: product.price,
      lineTotal,
    });
  }

  const method = options.shippingMethod === "pickup" ? "pickup" : "delivery";
  const shipping = calcShipping({
    method,
    cep: options.cep,
    subtotal,
    hasPhysical,
    freeFrom: options.freeFrom,
  });

  return {
    lines,
    subtotal,
    shipping,
    shippingMethod: hasPhysical ? method : "none",
    hasPhysical,
    total: subtotal + shipping,
  };
}

export function installmentOptions(total, maxInstallments = 3) {
  const max = Math.min(12, Math.max(1, Number(maxInstallments) || 1));
  const options = [];
  for (let n = 1; n <= max; n += 1) {
    const value = Math.round((total / n) * 100) / 100;
    if (n > 1 && value < MIN_INSTALLMENT) break;
    options.push({ n, value, total });
  }
  return options;
}

export function timingSafeEqualText(left, right) {
  const a = Buffer.from(String(left || ""), "utf8");
  const b = Buffer.from(String(right || ""), "utf8");
  if (!a.length || a.length !== b.length) {
    if (a.length) timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function createPublicKey() {
  return randomUUID();
}

/** Pedidos gravados na rodada anterior ainda podem ter accessToken. */
export function orderPublicKey(order) {
  return String(order?.publicKey || order?.accessToken || "").trim();
}

export function canAccessPublicOrder(order, { publicKey = "", paymentMatched = false } = {}) {
  if (paymentMatched) return true;
  const expected = orderPublicKey(order);
  const given = String(publicKey || "").trim();
  if (!expected || !given) return false;
  return timingSafeEqualText(expected, given);
}

export function withAccessQuery(url, publicKey) {
  const base = String(url || "").trim();
  const key = String(publicKey || "").trim();
  if (!base || !key) return base;
  const join = base.includes("?") ? "&" : "?";
  return `${base}${join}k=${encodeURIComponent(key)}`;
}

export function trackingPageUrl(siteUrl, orderId, publicKey) {
  const shop = String(siteUrl || "").replace(/\/$/, "");
  const id = String(orderId || "").trim();
  if (!shop || !id) return "";
  return withAccessQuery(`${shop}/pedidos.html?pedido=${encodeURIComponent(id)}`, publicKey);
}

export function isOriginAllowed(origin, { allowedOrigins = [], mode = "demo", serverOrigin = "" } = {}) {
  const list = (allowedOrigins || []).map((item) => String(item).trim()).filter(Boolean);
  if (!origin) return true;
  if (serverOrigin && origin === String(serverOrigin).replace(/\/$/, "")) return true;
  if (list.includes(origin)) return true;
  if (list.length) return false;
  return mode !== "live";
}

const BLOCKED_STATIC_PREFIXES = [
  "/server",
  "/.git",
  "/node_modules",
  "/.github",
  "/.cursor",
  "/docs",
  "/scripts",
];

const BLOCKED_STATIC_NAMES = new Set([
  "/render.yaml",
  "/render.yml",
  "/abrir-local.sh",
  "/package.json",
  "/package-lock.json",
  "/readme.md",
  "/license",
  "/license.md",
]);

export function isBlockedStaticPath(pathname) {
  const raw = String(pathname || "").split("?")[0];
  let p = raw;
  try {
    p = decodeURIComponent(raw);
  } catch {
    return true;
  }
  p = p.toLowerCase();
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.includes("\0") || p.includes("\\")) return true;
  if (BLOCKED_STATIC_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) return true;
  if (p.includes("/.")) return true;
  if (BLOCKED_STATIC_NAMES.has(p)) return true;
  if (/\.(md|yml|yaml|sh|example|env|sql|lock)$/.test(p)) return true;
  return false;
}

export function hasForbiddenCardPayload(body) {
  if (!body || typeof body !== "object") return false;
  if (body.card != null) return true;
  const keys = ["cardNumber", "card_number", "pan", "cvv", "securityCode", "security_code", "cardCvv"];
  return keys.some((key) => body[key] != null && String(body[key]).trim() !== "");
}

export function publicErrorCode(err) {
  const code = String(err?.code || "pay_failed");
  const allowed = new Set([
    "invalid_payer",
    "empty_cart",
    "invalid_item",
    "invalid_qty",
    "invalid_installments",
    "missing_token",
    "rejected",
    "rate_limited",
    "card_data_not_allowed",
    "origin_not_allowed",
    "invalid_payment",
    "not_found",
    "payment_pending",
    "payment_not_confirmed",
    "payment_rejected",
    "pay_failed",
    "checkout_failed",
    "invalid_signature",
    "unauthorized",
    "admin_not_configured",
    "invalid_tracking",
  ]);
  return allowed.has(code) ? code : "pay_failed";
}

export function preferenceItems(quote) {
  const items = (quote?.lines || []).map((line) => ({
    id: String(line.id).slice(0, 256),
    title: String(line.name).slice(0, 256),
    description: `${line.name} ${line.volume || ""}`.trim().slice(0, 256),
    quantity: line.qty,
    unit_price: Number(Number(line.unitPrice).toFixed(2)),
    currency_id: "BRL",
    category_id: "others",
  }));
  if (Number(quote?.shipping) > 0) {
    items.push({
      id: "frete",
      title: "Frete",
      quantity: 1,
      unit_price: Number(Number(quote.shipping).toFixed(2)),
      currency_id: "BRL",
      category_id: "others",
    });
  }
  return items;
}

export function isHttpsUrl(value) {
  try {
    return new URL(String(value)).protocol === "https:";
  } catch {
    return false;
  }
}

export function publicApiOrigin({
  publicApiUrl = "",
  renderExternalUrl = "",
  requestOrigin = "",
} = {}) {
  const candidates = [publicApiUrl, renderExternalUrl, requestOrigin];
  for (const value of candidates) {
    const origin = String(value || "").trim().replace(/\/$/, "");
    if (isHttpsUrl(origin)) return origin;
  }
  return "";
}

export function notificationUrlFromOrigin(origin) {
  const base = String(origin || "").trim().replace(/\/$/, "");
  if (!isHttpsUrl(base)) return "";
  // source_news=webhooks evita IPN legado sem assinatura válida.
  return `${base}/api/webhooks/mercadopago?source_news=webhooks`;
}

export function webhookResource(body = {}, query = {}) {
  const topic = String(query.topic || query.type || body.type || body.topic || "")
    .trim()
    .toLowerCase();
  let id = String(
    query["data.id"] || query.data_id || body?.data?.id || query.id || ""
  ).trim();
  if (!id && body?.resource) {
    const match = String(body.resource).match(/(\d+)\/?$/);
    if (match) id = match[1];
  }
  return { topic, id };
}

/** IPN legado: topic+id (sem data.id). A assinatura HMAC desses avisos não valida. */
export function isIpnNotification(body = {}, query = {}) {
  const hasTopic = Boolean(query.topic || body.topic);
  const hasTypeData = Boolean((query.type || body.type) && (query["data.id"] || body?.data?.id));
  return hasTopic && !hasTypeData;
}

export function webhookManifest({ dataId = "", requestId = "", ts = "" } = {}) {
  const parts = [];
  if (dataId) parts.push(`id:${String(dataId).toLowerCase()}`);
  if (requestId) parts.push(`request-id:${requestId}`);
  parts.push(`ts:${ts}`);
  return `${parts.join(";")};`;
}

export function parseWebhookSignature(header) {
  const hashes = {};
  let ts = "";
  for (const part of String(header || "").split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    const value = part.slice(eq + 1).trim();
    if (!key || !value) continue;
    if (key === "ts") ts = value;
    else if (/^v\d+$/.test(key)) hashes[key] = value;
  }
  return { ts, hashes };
}

export function isValidWebhookSignature({
  xSignature,
  xRequestId,
  dataId,
  secret,
  now = Date.now,
  toleranceSeconds = 300,
} = {}) {
  const key = String(secret || "").trim();
  if (!key) return false;
  const { ts, hashes } = parseWebhookSignature(xSignature);
  const received = hashes.v1;
  if (!ts || !/^\d+$/.test(ts) || !received) return false;
  const expected = createHmac("sha256", key)
    .update(webhookManifest({ dataId, requestId: xRequestId, ts }))
    .digest("hex");
  if (expected.length !== received.length) return false;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(received))) return false;
  if (toleranceSeconds != null) {
    const drift = Math.abs(now() - Number(ts)) / 1000;
    if (drift > Number(toleranceSeconds)) return false;
  }
  return true;
}

export function validatePayer(payer, { requireAddress = true, requireBirthDate = false } = {}) {
  const name = String(payer?.name || "").trim().slice(0, 80);
  const email = String(payer?.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 120);
  const phone = brazilianMobileDigits(payer?.phone);
  const birthDate = String(payer?.birthDate || "").trim().slice(0, 10);
  const cep = onlyDigits(payer?.cep).slice(0, 8);
  const street = String(payer?.street || "").trim().slice(0, 120);
  const number = String(payer?.number || "").trim().slice(0, 16);
  const neighborhood = String(payer?.neighborhood || "").trim().slice(0, 80);
  const city = String(payer?.city || "").trim().slice(0, 80);
  const state = String(payer?.state || "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  const complement = String(payer?.complement || "").trim().slice(0, 80);

  const errors = [];
  if (name.length < 3) errors.push("name");
  if (!isEmail(email)) errors.push("email");
  const emailConfirm = String(payer?.emailConfirm || "").trim().toLowerCase();
  if (!emailConfirm || emailConfirm !== email) errors.push("emailConfirm");
  if (!isBrazilianMobile(phone)) errors.push("phone");
  const phoneConfirm = brazilianMobileDigits(payer?.phoneConfirm);
  if (!phoneConfirm || phoneConfirm !== phone) errors.push("phoneConfirm");
  if (requireBirthDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) errors.push("birthDate");
    else {
      const d = new Date(`${birthDate}T12:00:00`);
      const today = new Date();
      const year = Number(birthDate.slice(0, 4));
      if (Number.isNaN(d.getTime()) || d > today || year < 1900) errors.push("birthDate");
    }
  }

  if (requireAddress) {
    if (!isCep(cep)) errors.push("cep");
    if (street.length < 2) errors.push("street");
    if (!number) errors.push("number");
    if (neighborhood.length < 2) errors.push("neighborhood");
    if (city.length < 2) errors.push("city");
    if (!/^[A-Z]{2}$/.test(state)) errors.push("state");
  }

  if (errors.length) {
    const error = new Error("invalid_payer");
    error.code = "invalid_payer";
    error.fields = errors;
    throw error;
  }

  return {
    name,
    email,
    phone,
    birthDate: requireBirthDate ? birthDate : "",
    cep,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
  };
}

export function formatOrderId(n) {
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1) return "";
  return `CEME-${num}`;
}

export function orderSequence(orderId) {
  const match = /^CEME-(\d+)$/i.exec(String(orderId || "").trim());
  return match ? Number(match[1]) : 0;
}

export function nextOrderSequence(orderIds = []) {
  let max = 0;
  for (const id of orderIds) {
    const n = orderSequence(id);
    if (n > max) max = n;
  }
  return max + 1;
}

export function normalizeTrackingCode(value) {
  const code = String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "");
  if (code.length < 8 || code.length > 22 || !/^[A-Z0-9]+$/.test(code)) return "";
  return code;
}

export function correiosTrackingUrl(code) {
  const tracking = normalizeTrackingCode(code);
  if (!tracking) return "";
  return `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(tracking)}`;
}

export function formatAddress(address) {
  if (!address) return "";
  const line = [address.street, address.number, address.complement].filter(Boolean).join(", ");
  const city = [address.neighborhood, address.city, address.state].filter(Boolean).join(" — ");
  const cep = address.cep
    ? `CEP ${String(address.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2")}`
    : "";
  return [line, city, cep].filter(Boolean).join(". ");
}

export function fulfillmentSnapshot({ orderId, quote, payer, status = "pending", now = Date.now } = {}) {
  const delivery = quote?.shippingMethod === "delivery" && quote?.hasPhysical;
  return {
    orderId,
    publicKey: createPublicKey(),
    status,
    createdAt: now(),
    shippingMethod: quote?.shippingMethod || "none",
    items: (quote?.lines || []).map((line) => ({
      id: line.id,
      name: line.name,
      volume: line.volume || "",
      kind: line.kind || "",
      qty: line.qty,
      unitPrice: line.unitPrice,
    })),
    subtotal: quote?.subtotal || 0,
    shipping: quote?.shipping || 0,
    total: quote?.total || 0,
    customer: {
      name: payer?.name || "",
      phone: payer?.phone || "",
      email: payer?.email || "",
      birthDate: payer?.birthDate || "",
    },
    shipped: false,
    shippedAt: null,
    address: delivery
      ? {
          cep: payer?.cep || "",
          street: payer?.street || "",
          number: payer?.number || "",
          complement: payer?.complement || "",
          neighborhood: payer?.neighborhood || "",
          city: payer?.city || "",
          state: payer?.state || "",
        }
      : null,
    trackingCode: "",
  };
}

export const DELIVERY_DAYS = 3;
const BRASILIA_TZ = "America/Sao_Paulo";

export function brasiliaDateKey(ms = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRASILIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

export function brasiliaAddDays(fromMs, days) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BRASILIA_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(fromMs));
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return brasiliaDateKey(Date.UTC(year, month - 1, day + days, 15, 0, 0));
}

export function formatBrasiliaDate(ms) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRASILIA_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ms));
}

export function etaMsFromShip(shippedAt, days = DELIVERY_DAYS) {
  const key = brasiliaAddDays(shippedAt || Date.now(), days);
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day, 15, 0, 0);
}

export function deliveryProgress(order, now = Date.now()) {
  const method = order?.shippingMethod || "none";
  if (method === "pickup") {
    return order?.shipped
      ? { phase: "pickup_ready", etaAt: null, etaLabel: "", headline: "Pode retirar na loja a partir de hoje." }
      : { phase: "packing", etaAt: null, etaLabel: "", headline: "Separando para retirada em Brasília." };
  }
  if (method !== "delivery") {
    return { phase: "digital", etaAt: null, etaLabel: "", headline: "Pedido digital — sem postagem." };
  }
  if (!order?.shipped) {
    return {
      phase: "packing",
      etaAt: null,
      etaLabel: "",
      headline: `Aguardando postagem. Depois de enviado, o prazo é de ${DELIVERY_DAYS} dias.`,
    };
  }
  const shippedAt = order.shippedAt || now;
  const etaAt = etaMsFromShip(shippedAt);
  const etaLabel = formatBrasiliaDate(etaAt);
  const today = brasiliaDateKey(now);
  const shipDay = brasiliaDateKey(shippedAt);
  const etaDay = brasiliaDateKey(etaAt);
  const tomorrow = brasiliaAddDays(now, 1);
  if (today === shipDay) {
    return {
      phase: "left_today",
      etaAt,
      etaLabel,
      headline: `Sua entrega saiu hoje. Prazo de ${DELIVERY_DAYS} dias. Chegada prevista: ${etaLabel}.`,
    };
  }
  if (etaDay === tomorrow) {
    return { phase: "arrives_tomorrow", etaAt, etaLabel, headline: "Sua entrega chega amanhã." };
  }
  if (today === etaDay) {
    return { phase: "due_today", etaAt, etaLabel, headline: `Sua entrega chega hoje (previsão ${etaLabel}).` };
  }
  if (today > etaDay) {
    return {
      phase: "overdue",
      etaAt,
      etaLabel,
      headline: `Previsão era ${etaLabel}. Se ainda não chegou, fale com a loja.`,
    };
  }
  return { phase: "in_transit", etaAt, etaLabel, headline: `A caminho. Chegada prevista: ${etaLabel}.` };
}

export function publicOrderView(order) {
  if (!order) return null;
  const trackingCode = normalizeTrackingCode(order.trackingCode);
  const paymentType = String(order.paymentType || "").trim();
  const paymentMethod = String(order.paymentMethod || "").trim();
  return {
    orderId: order.orderId,
    publicKey: orderPublicKey(order),
    status: order.status || "pending",
    demo: !!order.demo,
    shippingMethod: order.shippingMethod || "none",
    paymentType,
    paymentMethod,
    isPix: isPixPayment({ paymentType, paymentMethod }),
    items: (order.items || []).map((item) => ({
      id: item.id || "",
      name: item.name,
      volume: item.volume || "",
      kind: item.kind || "",
      qty: item.qty,
    })),
    downloads: publicDigitalDownloads(order),
    customerName: order.customer?.name || "",
    addressText: formatAddress(order.address),
    trackingCode,
    trackingUrl: correiosTrackingUrl(trackingCode),
    trackingId: order.orderId || "",
    createdAt: order.createdAt || null,
    total: order.total,
    shipped: !!order.shipped,
    shippedAt: order.shippedAt || null,
    ...deliveryProgress(order),
  };
}

export function sanitizeStoredOrder(order) {
  if (!order || typeof order !== "object") return order;
  const customer = { ...(order.customer || {}) };
  delete customer.cpf;
  delete customer.document;
  const email = String(customer.email || "").trim().toLowerCase();
  if (email) customer.email = email;
  else delete customer.email;
  const clean = { ...order, customer };
  delete clean.cpf;
  return clean;
}

export { ownerDashboardStats } from "../dashboard-stats.js";

export function adminOrderView(order) {
  const pub = publicOrderView(order);
  if (!pub) return null;
  return {
    ...pub,
    createdAt: order.createdAt,
    phone: order.customer?.phone || "",
    email: order.customer?.email || "",
    birthDate: order.customer?.birthDate || "",
    paymentId: order.paymentId || "",
    hasEmail: Boolean(order.customer?.email),
    subtotal: order.subtotal,
    shipping: order.shipping,
    items: order.items || [],
    address: order.address,
    notify: order.notify || null,
    notifyArrival: order.notifyArrival || null,
  };
}

export function demoCardDecision(cardNumber) {
  const num = onlyDigits(cardNumber);
  if (num === "4000000000000002") return "rejected";
  if (num === "4000000000009995") return "rejected";
  if (!luhn(num)) return "invalid";
  return "approved";
}

export function demoPixPayload(orderId, total) {
  const amount = Number(total).toFixed(2);
  return `CEMEPIX|DEMO|${orderId}|BRL${amount}|FAMILIA-CEME`;
}
