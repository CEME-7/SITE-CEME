(function () {
  function apiBase() {
    if (/\.onrender\.com$/i.test(location.hostname) || /(^|\.)familiaceme\.com\.br$/i.test(location.hostname)) {
      return location.origin;
    }
    const apiUrl = String(window.CEME_CHECKOUT?.apiUrl || "").replace(/\/$/, "");
    if (!apiUrl) return "";
    if (location.protocol === "https:" && /^http:\/\//i.test(apiUrl)) return "";
    return apiUrl;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function shipLabel(method) {
    if (method === "pickup") return "Retirada em Brasília";
    if (method === "delivery") return "Entrega pelos Correios";
    return "Pedido digital — sem postagem";
  }

  function statusLabel(order) {
    if (order.headline) return order.headline;
    if (order.shipped) return "Seu pedido foi enviado";
    if (order.status === "approved") return "Pagamento aprovado";
    if (order.status === "pending" || order.status === "in_process") return "Aguardando pagamento no Mercado Pago";
    return "Pagamento não confirmado";
  }

  function trackSteps(order) {
    const phase = order.phase || "packing";
    if (order.shippingMethod === "pickup") {
      return [
        { label: "Pagamento aprovado", state: "done" },
        {
          label: order.shipped ? "Pode retirar na loja" : "Separando para retirada",
          state: order.shipped ? "done" : "current",
        },
      ];
    }
    if (order.shippingMethod !== "delivery") {
      return [{ label: "Pedido digital disponível", state: "done" }];
    }
    const eta = order.etaLabel ? `Chegada prevista: ${order.etaLabel}` : "Prazo de 3 dias após o envio";
    const posted = ["left_today", "in_transit", "arrives_tomorrow", "due_today", "overdue"].includes(phase);
    let lastLabel = eta;
    let lastState = "todo";
    if (phase === "left_today") {
      lastLabel = eta;
      lastState = "todo";
    } else if (phase === "in_transit") {
      lastState = "current";
    } else if (phase === "arrives_tomorrow") {
      lastLabel = "Chega amanhã";
      lastState = "current";
    } else if (phase === "due_today") {
      lastLabel = "Chega hoje";
      lastState = "done";
    } else if (phase === "overdue") {
      lastLabel = order.etaLabel ? `Previsão era ${order.etaLabel}` : "Fora do prazo previsto";
      lastState = "done";
    }
    return [
      { label: "Pagamento aprovado", state: "done" },
      {
        label: phase === "left_today" ? "Saiu hoje" : posted ? "Pedido enviado" : "Aguardando postagem",
        state: posted ? "done" : "current",
      },
      { label: lastLabel, state: lastState },
    ];
  }

  function stepsHtml(order) {
    const items = trackSteps(order)
      .map(
        (step) =>
          `<li class="track-step is-${escapeHtml(step.state)}"><span></span>${escapeHtml(step.label)}</li>`
      )
      .join("");
    return `<ol class="track-steps">${items}</ol>`;
  }

  function publicKeyFor(orderId, fromOrder) {
    const id = String(orderId || "").trim();
    const fromResult = String(fromOrder?.publicKey || fromOrder?.accessToken || "").trim();
    if (fromResult) {
      try {
        sessionStorage.setItem(`ceme-order-key:${id}`, fromResult);
      } catch {
        /* ignore */
      }
      return fromResult;
    }
    try {
      const params = new URLSearchParams(location.search);
      const fromUrl = params.get("k") || params.get("t") || "";
      if (fromUrl) {
        sessionStorage.setItem(`ceme-order-key:${id}`, fromUrl);
        return fromUrl;
      }
      return (
        (id && (sessionStorage.getItem(`ceme-order-key:${id}`) || sessionStorage.getItem(`ceme-access:${id}`))) ||
        ""
      );
    } catch {
      return "";
    }
  }

  function withAccessQuery(url, publicKey) {
    const base = String(url || "").trim();
    const key = String(publicKey || "").trim();
    if (!base || !key) return base;
    return `${base}${base.includes("?") ? "&" : "?"}k=${encodeURIComponent(key)}`;
  }

  function render(order) {
    const box = document.getElementById("track-result");
    const base = apiBase();
    const token = publicKeyFor(order.orderId, order);
    const items = (order.items || [])
      .map((item) => `<li>${escapeHtml(item.name)} × ${Number(item.qty)}</li>`)
      .join("");
    const tracking = order.trackingCode
      ? `<p><strong>Código dos Correios:</strong> ${escapeHtml(order.trackingCode)}</p>
         <p><a class="btn btn-ghost" href="${escapeHtml(order.trackingUrl)}" target="_blank" rel="noopener">Ver nos Correios</a></p>`
      : order.shippingMethod === "delivery"
        ? "<p class=\"track-note\">O número CEME é o rastreio da loja, não o código dos Correios. Sem código dos Correios, o prazo é de 3 dias a partir do envio. Avisamos no e-mail e no WhatsApp: saiu hoje e chega amanhã.</p>"
        : "";
    const cupom = base
      ? `<p><a class="btn btn-gold" href="${escapeHtml(withAccessQuery(`${base}/api/order/${encodeURIComponent(order.orderId)}/cupom.pdf`, token))}" download>Baixar cupom PDF</a></p>`
      : "";
    const downloads = (order.downloads || [])
      .map(
        (file) =>
          base
            ? `<p><a class="btn btn-gold" href="${escapeHtml(withAccessQuery(`${base}/api/order/${encodeURIComponent(order.orderId)}/download/${encodeURIComponent(file.id)}`, token))}" download>Baixar álbum — ${escapeHtml(file.name || "completo")}</a></p>`
            : ""
      )
      .join("");
    box.innerHTML = `
      <p class="kicker">${escapeHtml(statusLabel(order))}</p>
      <h2>Rastreio ${escapeHtml(order.trackingId || order.orderId)}</h2>
      ${stepsHtml(order)}
      <p><strong>${escapeHtml(order.customerName || "Cliente")}</strong></p>
      <p>${escapeHtml(shipLabel(order.shippingMethod))}</p>
      ${order.addressText ? `<p>${escapeHtml(order.addressText)}</p>` : ""}
      <ul>${items}</ul>
      ${tracking}
      ${downloads}
      ${cupom}
    `;
    box.hidden = false;
  }

  async function lookup(orderId) {
    const error = document.getElementById("track-error");
    const result = document.getElementById("track-result");
    error.hidden = true;
    result.hidden = true;
    const id = String(orderId || "").trim().toUpperCase();
    if (!/^CEME-[A-Z0-9-]+$/i.test(id)) {
      error.textContent = "Número de pedido inválido.";
      error.hidden = false;
      return;
    }
    const base = apiBase();
    if (!base) {
      error.textContent = "Abra a loja em http://127.0.0.1:3001 para consultar o pedido.";
      error.hidden = false;
      return;
    }
    const key = publicKeyFor(id) || String(document.getElementById("track-key")?.value || "").trim();
    if (!key) {
      error.textContent = "Informe a chave do pedido ou abra o link do comprovante (ele já traz o acesso).";
      error.hidden = false;
      return;
    }
    const qs = new URLSearchParams();
    qs.set("k", key);
    try {
      const res = await fetch(`${base}/api/order/${encodeURIComponent(id)}?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        error.textContent =
          data.error === "payment_pending" || data.error === "payment_not_confirmed" || data.error === "payment_rejected"
            ? "O Mercado Pago não confirmou este pagamento. O pedido só aparece depois da aprovação."
            : "Não encontramos esse pedido. Confira o número e a chave, ou use o link do e-mail/WhatsApp.";
        error.hidden = false;
        return;
      }
      if (data.publicKey && document.getElementById("track-key")) {
        document.getElementById("track-key").value = data.publicKey;
      }
      render(data);
    } catch {
      error.textContent = "Não encontramos esse pedido. Confira o número e a chave.";
      error.hidden = false;
    }
  }

  document.getElementById("track-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    lookup(document.getElementById("track-order").value);
  });

  const params = new URLSearchParams(location.search);
  const fromUrl = params.get("pedido");
  const fromKey = params.get("k") || params.get("t");
  if (fromKey && document.getElementById("track-key")) {
    document.getElementById("track-key").value = fromKey;
  }
  if (fromUrl) {
    document.getElementById("track-order").value = fromUrl;
    lookup(fromUrl);
  }
})();
