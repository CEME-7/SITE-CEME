import test from "node:test";
import assert from "node:assert/strict";
import {
  shippedMessage,
  shippedEmailSubject,
  arrivesTomorrowMessage,
  arrivesTomorrowSubject,
  paidMessage,
  paidEmailSubject,
  newSaleMessage,
  customerStoreProofMessage,
  whatsappSendUrl,
  gmailConfigured,
  whatsappApiConfigured,
  notifyShipped,
  notifyPaid,
  notifyArrival,
} from "./notify.js";

test("monta o aviso de envio com rastreio", () => {
  const text = shippedMessage({
    name: "Maria Silva",
    orderId: "CEME-1",
    trackingCode: "AB123456789BR",
    trackingUrl: "https://rastreamento.correios.com.br/app/index.php?objetos=AB123456789BR",
    etaLabel: "29/08/2026",
  });
  assert.match(text, /sua entrega do pedido CEME-1 saiu hoje/);
  assert.match(text, /Prazo de 3 dias/);
  assert.match(text, /Chegada prevista: 29\/08\/2026/);
  assert.match(text, /AB123456789BR/);
  assert.equal(shippedEmailSubject("CEME-1"), "Sua entrega saiu hoje — pedido CEME-1");
});

test("monta o aviso de chega amanhã", () => {
  const text = arrivesTomorrowMessage({ name: "Maria Silva", orderId: "CEME-1" });
  assert.match(text, /sua entrega do pedido CEME-1 chega amanhã/);
  assert.equal(arrivesTomorrowSubject("CEME-1"), "Sua entrega chega amanhã — pedido CEME-1");
});

test("abre o WhatsApp do cliente com a mensagem pronta", () => {
  const url = whatsappSendUrl("61999991111", "sua entrega saiu hoje");
  assert.match(url, /^https:\/\/wa\.me\/5561999991111\?text=/);
  assert.equal(whatsappSendUrl("12", "x"), "");
});

test("manda e-mail e devolve o link do WhatsApp ao marcar enviado", async () => {
  const sent = [];
  const result = await notifyShipped(
    {
      orderId: "CEME-2",
      shippingMethod: "delivery",
      customer: { name: "Ana", email: "ana@email.com", phone: "61988887777" },
    },
    {
      env: {},
      sendEmail: async (payload) => sent.push(payload),
      progress: { etaLabel: "29/08/2026" },
    }
  );
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "ana@email.com");
  assert.match(sent[0].text, /sua entrega do pedido CEME-2 saiu hoje/);
  assert.match(sent[0].text, /Chegada prevista: 29\/08\/2026/);
  assert.equal(result.email.sent, true);
  assert.equal(result.whatsapp.sent, false);
  assert.match(result.whatsapp.url, /wa\.me\/5561988887777/);
  assert.equal(gmailConfigured({}), false);
  assert.equal(gmailConfigured({ GMAIL_USER: "a@b.c", GMAIL_APP_PASSWORD: "x" }), true);
});

test("manda o aviso de chega amanhã por e-mail", async () => {
  const sent = [];
  const result = await notifyArrival(
    {
      orderId: "CEME-4",
      customer: { name: "Ana", email: "ana@email.com", phone: "61988887777" },
    },
    {
      env: {},
      sendEmail: async (payload) => sent.push(payload),
    }
  );
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "Sua entrega chega amanhã — pedido CEME-4");
  assert.match(sent[0].text, /chega amanhã/);
  assert.equal(result.email.sent, true);
  assert.equal(result.whatsapp.sent, false);
});

test("monta o aviso de pagamento recebido", () => {
  const text = paidMessage({
    name: "Maria Silva",
    orderId: "CEME-1",
    total: 120,
    trackingUrl: "https://exemplo.github.io/Site/pedidos.html?pedido=CEME-1",
  });
  assert.match(text, /recebemos o pagamento do seu pedido CEME-1/);
  assert.match(text, /R\$\s*120/);
  assert.match(text, /pedidos\.html\?pedido=CEME-1/);
  assert.equal(paidEmailSubject("CEME-1"), "Recebemos o pagamento do seu pedido CEME-1");
  assert.match(newSaleMessage({ name: "Maria Silva", orderId: "CEME-1", total: 120, paymentMethod: "pix", paymentType: "bank_transfer", publicKey: "abc" }), /Nova venda CEME-1/);
  assert.match(newSaleMessage({ name: "Maria Silva", orderId: "CEME-1", total: 120, paymentMethod: "pix", paymentType: "bank_transfer", publicKey: "abc" }), /Pix/);
  assert.match(newSaleMessage({ name: "Maria Silva", orderId: "CEME-1", total: 120, paymentMethod: "pix", paymentType: "bank_transfer", publicKey: "abc" }), /Chave de rastreio: abc/);
  const pixProof = customerStoreProofMessage({
    name: "Maria Silva",
    orderId: "CEME-1",
    total: 120,
    publicKey: "abc-key",
    trackingUrl: "https://loja/pedidos.html?pedido=CEME-1&k=abc-key",
    paymentType: "bank_transfer",
    paymentMethod: "pix",
  });
  assert.match(pixProof, /Comprovante Pix — pedido CEME-1/);
  assert.match(pixProof, /Chave de rastreio: abc-key/);
  assert.match(pixProof, /pedidos\.html\?pedido=CEME-1/);
  const cardProof = customerStoreProofMessage({
    name: "Maria Silva",
    orderId: "CEME-2",
    total: 88,
    publicKey: "card-key",
    paymentType: "credit_card",
    paymentMethod: "visa",
  });
  assert.match(cardProof, /Pagamento confirmado — pedido CEME-2/);
  assert.match(cardProof, /visa/);
  assert.doesNotMatch(cardProof, /Comprovante Pix/);
  const album = paidMessage({
    name: "Maria Silva",
    orderId: "CEME-1",
    total: 8,
    downloadUrl: "https://ceme-checkout.onrender.com/api/order/CEME-1/download/musicas-neuroconectivas",
  });
  assert.match(album, /Baixe o álbum completo/);
  assert.match(album, /download\/musicas-neuroconectivas/);
});

test("no pagamento tenta e-mail e WhatsApp sem disparar se a API da Meta não estiver ligada", async () => {
  const sent = [];
  const result = await notifyPaid(
    {
      orderId: "CEME-3",
      total: 88,
      customer: { name: "Ana", email: "ana@email.com", phone: "61988887777" },
    },
    {
      env: { GMAIL_USER: "loja@email.com" },
      sendEmail: async (payload) => sent.push(payload),
    }
  );
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to, "ana@email.com");
  assert.equal(sent[1].to, "loja@email.com");
  assert.match(sent[0].text, /recebemos o pagamento do seu pedido CEME-3/);
  assert.equal(result.email.sent, true);
  assert.equal(result.whatsapp.sent, false);
  assert.equal(whatsappApiConfigured({}), false);
  assert.equal(
    whatsappApiConfigured({ WHATSAPP_TOKEN: "x", WHATSAPP_PHONE_ID: "123" }),
    true
  );
});
