import { ownerDashboardStats } from "./dashboard-stats.js";

const PICKUP_ADDRESS =
  "CLN 211, Bloco D, Sala 211 — Asa Norte, Brasília-DF — CEP 70863-540";
const KEY_NAME = "ceme-admin-key";
let ordersCache = [];
let currentFilter = "all";

  function apiBase() {
    if (/\.onrender\.com$/i.test(location.hostname)) return location.origin;
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

  function money(n) {
    return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function when(value) {
    const time = Number(value);
    if (!time) return "";
    return new Date(time).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function shipLabel(method) {
    if (method === "pickup") return "Retirada em Brasília";
    if (method === "delivery") return "Correios";
    return "Digital";
  }

  function formatPhone(value) {
    const d = String(value || "").replace(/\D/g, "");
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    return d;
  }

  function formatCep(value) {
    const d = String(value || "").replace(/\D/g, "");
    if (d.length === 8) return `${d.slice(0, 5)}-${d.slice(5)}`;
    return d;
  }

  function waNumber(value) {
    let d = String(value || "").replace(/\D/g, "");
    if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
    return d.length === 11 ? `55${d}` : "";
  }

  function deltaLabel(pct) {
    if (pct === null || pct === undefined) return "Sem mês anterior para comparar";
    if (pct === 0) return "Igual ao mês passado";
    const abs = Math.abs(pct).toLocaleString("pt-BR");
    return pct > 0 ? `+${abs}% vs mês passado` : `−${abs}% vs mês passado`;
  }

  function barChart(series, { bestKey = "", aria = "" } = {}) {
    const max = Math.max(1, ...series.map((row) => Number(row.revenue || 0)));
    const width = 720;
    const height = 210;
    const padTop = 16;
    const padBottom = 32;
    const padX = 6;
    const innerW = width - padX * 2;
    const innerH = height - padTop - padBottom;
    const barW = innerW / Math.max(series.length, 1);
    const cols = series
      .map((row, index) => {
        const value = Number(row.revenue || 0);
        const barH = (value / max) * innerH;
        const x = padX + index * barW;
        const y = padTop + innerH - barH;
        const title = `${row.label || row.short}: ${money(value)}${row.count ? ` · ${row.count} pedido${row.count === 1 ? "" : "s"}` : ""}`;
        return `<g class="dash-bar${row.key === bestKey ? " is-best" : ""}${value ? "" : " is-empty"}">
          <title>${escapeHtml(title)}</title>
          <rect x="${(x + barW * 0.2).toFixed(2)}" y="${y.toFixed(2)}" width="${(barW * 0.6).toFixed(2)}" height="${Math.max(value ? 2 : 0, barH).toFixed(2)}" rx="4"></rect>
          <text x="${(x + barW / 2).toFixed(2)}" y="${height - 10}" text-anchor="middle">${escapeHtml(String(row.short || ""))}</text>
        </g>`;
      })
      .join("");
    return `<svg class="dash-bars" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(aria)}">${cols}</svg>`;
  }

  function mixRow(label, bucket, total) {
    const pct = total ? Math.round((bucket.revenue / total) * 100) : 0;
    return `<li>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(money(bucket.revenue))}</strong>
      <small>${bucket.count} pedido${bucket.count === 1 ? "" : "s"} · ${pct}%</small>
      <i style="width:${pct}%"></i>
    </li>`;
  }

  function addressBlock(order) {
    if (order.shippingMethod === "pickup") {
      return `<div class="order-address">
        <p class="order-address-kicker">Retirada na loja</p>
        <p>${escapeHtml(PICKUP_ADDRESS)}</p>
        <p>Quem retira: <strong>${escapeHtml(order.customerName || "Cliente")}</strong></p>
      </div>`;
    }
    if (order.shippingMethod !== "delivery") {
      return `<div class="order-address is-digital">
        <p class="order-address-kicker">Pedido digital</p>
        <p>Sem postagem — o cliente recebe o conteúdo por e-mail/WhatsApp.</p>
      </div>`;
    }
    const a = order.address || {};
    const line = [a.street, a.number, a.complement].filter(Boolean).join(", ");
    const city = [a.neighborhood, a.city, a.state].filter(Boolean).join(" — ");
    const cep = formatCep(a.cep);
    const text = order.addressText || [line, city, cep ? `CEP ${cep}` : ""].filter(Boolean).join(". ");
    if (!text) {
      return `<div class="order-address">
        <p class="order-address-kicker">Endereço de entrega</p>
        <p>Endereço não informado neste pedido.</p>
      </div>`;
    }
    return `<div class="order-address">
      <p class="order-address-kicker">Endereço de entrega</p>
      ${line ? `<p>${escapeHtml(line)}</p>` : ""}
      ${city ? `<p>${escapeHtml(city)}</p>` : ""}
      ${cep ? `<p>CEP ${escapeHtml(cep)}</p>` : ""}
      ${!line && !city ? `<p>${escapeHtml(text)}</p>` : ""}
    </div>`;
  }

  function contactBlock(order) {
    const phoneLabel = formatPhone(order.phone);
    const wa = waNumber(order.phone);
    const email = String(order.email || "").trim();
    const birth = String(order.birthDate || "").trim();
    const waLink = wa
      ? `<a href="https://wa.me/${escapeHtml(wa)}" target="_blank" rel="noopener">WhatsApp ${escapeHtml(phoneLabel)}</a>`
      : "<span>WhatsApp não informado</span>";
    const mailLink = email
      ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`
      : "<span>E-mail não informado</span>";
    const birthLine = birth
      ? `<p>Nascimento: ${escapeHtml(birth.split("-").reverse().join("/"))}</p>`
      : "";
    return `<div class="contact-block">
      <p class="contact-links">${waLink}<span aria-hidden="true"> · </span>${mailLink}</p>
      ${birthLine}
      <p class="contact-fallback">Se o WhatsApp não responder, use o e-mail. Se os dois falharem, fale pelo Mercado Pago desta venda.</p>
    </div>`;
  }

  function notifyHint(order) {
    if (!order.shipped) {
      return "<p class=\"ship-hint\">Quando postar, marque como enviado. O cliente recebe: “sua entrega saiu hoje, prazo de 3 dias”. Dois dias depois: “sua entrega chega amanhã”.</p>";
    }
    const bits = [];
    if (order.headline) bits.push(order.headline);
    const emailOk = order.notify?.email;
    bits.push(
      emailOk
        ? "E-mail de envio disparado."
        : order.hasEmail
          ? "WhatsApp aberto. Para o e-mail ir sozinho, coloque GMAIL_USER no Render."
          : "Pedido antigo sem e-mail. WhatsApp segue no telefone."
    );
    if (order.notifyArrival?.email || order.notifyArrival?.whatsapp) {
      bits.push("Aviso “chega amanhã” já enviado.");
    }
    return `<p class="ship-hint is-sent">${escapeHtml(bits.join(" "))}</p>`;
  }

  function card(order) {
    const items = (order.items || [])
      .map((item) => {
        const volume = item.volume ? ` (${escapeHtml(item.volume)})` : "";
        return `<li>${escapeHtml(item.name)}${volume} × ${Number(item.qty)}</li>`;
      })
      .join("");
    const sent = !!order.shipped;
    const created = when(order.createdAt);
    return `<article class="order-card${sent ? " is-shipped" : ""}" data-order="${escapeHtml(order.orderId)}">
      <div class="order-card-head">
        <p class="kicker">${sent ? "Enviado" : "Pendente de envio"} · ${escapeHtml(shipLabel(order.shippingMethod))}${
          order.etaLabel ? ` · chega ${escapeHtml(order.etaLabel)}` : ""
        }</p>
        <p class="order-date">${escapeHtml(created)}</p>
      </div>
      <h2>${escapeHtml(order.orderId)}</h2>
      <p><strong>${escapeHtml(order.customerName || "Cliente")}</strong></p>
      ${contactBlock(order)}
      ${addressBlock(order)}
      <ul>${items}</ul>
      <p><strong>${money(order.total)}</strong>${order.shipping ? ` · frete ${money(order.shipping)}` : ""}</p>
      ${
        order.shippingMethod === "delivery"
          ? `<form class="track-row track-admin">
              <input name="tracking" maxlength="22" placeholder="Código dos Correios" value="${escapeHtml(
                order.trackingCode || ""
              )}">
              <button class="btn btn-ghost" type="submit">Salvar rastreio</button>
            </form>`
          : "<p>Não precisa de código dos Correios.</p>"
      }
      <button type="button" class="ship-mark${sent ? " is-sent" : ""}" data-ship ${sent ? "disabled" : ""} aria-pressed="${sent ? "true" : "false"}">
        <span class="ship-x" aria-hidden="true">${sent ? "×" : ""}</span>
        ${sent ? "Enviado" : "Marcar como enviado"}
      </button>
      ${notifyHint(order)}
    </article>`;
  }

  function showGateError(message) {
    const error = document.getElementById("admin-error");
    error.textContent = message;
    error.hidden = false;
  }

  function showBoardError(message) {
    const error = document.getElementById("owner-error");
    error.textContent = message;
    error.hidden = !message;
  }

  function showStorageBanner({ storage, durable } = {}) {
    const el = document.getElementById("owner-storage");
    if (!el) return;
    if (storage === "postgres") {
      el.hidden = false;
      el.className = "storage-banner is-ok";
      el.textContent =
        "Pedidos, rastreio e gráficos ficam no banco Postgres. Não somem no restart nem no deploy.";
      return;
    }
    if (durable) {
      el.hidden = false;
      el.className = "storage-banner is-warn";
      el.textContent =
        "Pedidos estão no disco do Render. Ainda falta o Postgres: no painel, New → PostgreSQL e ligue DATABASE_URL no serviço ceme-checkout. Confira /api/health com “storage”: “postgres”.";
      return;
    }
    el.hidden = false;
    el.className = "storage-banner is-bad";
    el.textContent =
      "Atenção: este histórico ainda não é permanente. No Render, aplique o Blueprint deste repositório (cria Postgres + disco) ou crie um PostgreSQL e cole DATABASE_URL. Sem isso, gráfico e pedidos somem no próximo restart.";
  }

  function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll(".dash-tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab.getAttribute("data-filter") === filter);
    });
    renderBoard();
  }

  function visibleOrders() {
    const query = String(document.getElementById("dash-search")?.value || "")
      .trim()
      .toLowerCase();
    return ordersCache.filter((order) => {
      if (currentFilter === "pending" && order.shipped) return false;
      if (currentFilter === "shipped" && !order.shipped) return false;
      if (!query) return true;
      const hay = [
        order.orderId,
        order.customerName,
        order.addressText,
        order.address?.city,
        order.address?.neighborhood,
        order.email,
        order.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }

  function renderKpis() {
    const stats = ownerDashboardStats(ordersCache);
    const box = document.getElementById("dash-kpis");
    const cards = [
      { filter: "all", label: "Vendas", value: money(stats.revenue), hint: `${stats.count} pedido${stats.count === 1 ? "" : "s"}` },
      { filter: "all", label: "Histórico", value: String(stats.count), hint: "pagos no Mercado Pago" },
      { filter: "pending", label: "Pendentes", value: String(stats.pending), hint: "esperando postagem" },
      { filter: "shipped", label: "Enviados", value: String(stats.shipped), hint: "já marcados" },
    ];
    box.innerHTML = cards
      .map(
        (card) => `<button type="button" class="dash-kpi${currentFilter === card.filter ? " is-on" : ""}" data-filter="${card.filter}">
          <span>${escapeHtml(card.label)}</span>
          <strong>${escapeHtml(card.value)}</strong>
          <small>${escapeHtml(card.hint)}</small>
        </button>`
      )
      .join("");
  }

  function renderAnalytics() {
    const box = document.getElementById("dash-analytics");
    if (!box) return;
    if (!ordersCache.length) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    const stats = ownerDashboardStats(ordersCache);
    const best = stats.bestMonth;
    const top = stats.topProducts[0];
    const products = stats.topProducts.length
      ? stats.topProducts
          .map(
            (item) => `<li>
              <span>${escapeHtml(item.name)}</span>
              <strong>${item.qty} un.</strong>
              <small>${escapeHtml(item.revenue ? money(item.revenue) : "—")}</small>
            </li>`
          )
          .join("")
      : "<li>Ainda sem itens para ranquear.</li>";
    const delta = stats.monthDeltaPct;
    const deltaClass = delta > 0 ? "is-up" : delta < 0 ? "is-down" : "";
    box.hidden = false;
    box.innerHTML = `
      <div class="dash-highlights">
        <article class="dash-hi">
          <span>Ticket médio</span>
          <strong>${escapeHtml(money(stats.ticket))}</strong>
          <small>por pedido pago</small>
        </article>
        <article class="dash-hi${best ? " is-best" : ""}">
          <span>Mês que mais vendeu</span>
          <strong>${escapeHtml(best ? best.label : "—")}</strong>
          <small>${escapeHtml(best ? `${money(best.revenue)} · ${best.count} pedido${best.count === 1 ? "" : "s"}` : "Ainda sem mês campeão")}</small>
        </article>
        <article class="dash-hi">
          <span>Este mês</span>
          <strong>${escapeHtml(money(stats.thisMonth.revenue))}</strong>
          <small class="${deltaClass}">${escapeHtml(deltaLabel(delta))} · ${stats.thisMonth.count} pedido${stats.thisMonth.count === 1 ? "" : "s"}</small>
        </article>
        <article class="dash-hi">
          <span>Mais vendido</span>
          <strong>${escapeHtml(top ? top.name : "—")}</strong>
          <small>${escapeHtml(top ? `${top.qty} unidade${top.qty === 1 ? "" : "s"}` : "Sem produto em destaque")}</small>
        </article>
      </div>
      <div class="dash-charts">
        <section class="dash-chart-card">
          <p class="kicker">Últimos 14 dias</p>
          <h2>Vendas por dia</h2>
          ${barChart(stats.days, { aria: "Gráfico de vendas dos últimos 14 dias" })}
        </section>
        <section class="dash-chart-card">
          <p class="kicker">Últimos 12 meses</p>
          <h2>Vendas por mês</h2>
          ${barChart(stats.months, { bestKey: best?.key || "", aria: "Gráfico de vendas dos últimos 12 meses" })}
          <p class="dash-chart-note">${
            best
              ? `O mês mais forte foi <strong>${escapeHtml(best.label)}</strong> (${escapeHtml(money(best.revenue))}).`
              : "Quando as vendas aparecerem, o mês mais forte fica marcado no gráfico."
          }</p>
        </section>
      </div>
      <div class="dash-breakdown">
        <section class="dash-chart-card">
          <p class="kicker">Produtos</p>
          <h2>Mais pedidos</h2>
          <ol class="dash-rank">${products}</ol>
        </section>
        <section class="dash-chart-card">
          <p class="kicker">Entrega</p>
          <h2>Como saiu</h2>
          <ul class="dash-mix">
            ${mixRow("Correios", stats.shipping.delivery, stats.revenue)}
            ${mixRow("Retirada em Brasília", stats.shipping.pickup, stats.revenue)}
            ${mixRow("Digital", stats.shipping.digital, stats.revenue)}
          </ul>
        </section>
      </div>
    `;
  }

  function renderBoard() {
    renderKpis();
    renderAnalytics();
    const list = document.getElementById("admin-list");
    const shown = visibleOrders();
    if (!ordersCache.length) {
      list.innerHTML = "<p class=\"dash-empty\">Nenhuma venda paga ainda. O pedido só entra aqui depois que o Mercado Pago confirmar.</p>";
      return;
    }
    if (!shown.length) {
      list.innerHTML = "<p class=\"dash-empty\">Nenhum pedido neste filtro.</p>";
      return;
    }
    list.innerHTML = shown.map((order) => card(order)).join("");
  }

  function showApp(on) {
    document.getElementById("owner-login").hidden = on;
    document.getElementById("owner-app").hidden = !on;
  }

  function key() {
    return sessionStorage.getItem(KEY_NAME) || document.getElementById("admin-key").value;
  }

  async function load(adminKey) {
    document.getElementById("admin-error").hidden = true;
    showBoardError("");
    const submit = document.getElementById("admin-submit");
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Entrando…";
    }
    const base = apiBase();
    if (!base) {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Entrar";
      }
      showGateError("O painel usa a API do Render. Abra a loja pelo endereço publicado.");
      return;
    }
    let res;
    try {
      res = await fetch(`${base}/api/orders`, { headers: { "x-admin-key": adminKey } });
    } catch {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Entrar";
      }
      sessionStorage.removeItem(KEY_NAME);
      showApp(false);
      showGateError("Não deu para falar com a API desta loja. Abra https://ceme-checkout-4pgd.onrender.com/envios.html");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Entrar";
      }
      sessionStorage.removeItem(KEY_NAME);
      showApp(false);
      showGateError(
        data.error === "unauthorized"
          ? "Senha incorreta. Use a ADMIN_KEY do Environment no Render (não é ceme-local)."
          : data.error === "admin_not_configured"
            ? "Falta ADMIN_KEY no Environment do Render."
            : "Não foi possível abrir o painel. Tente de novo."
      );
      return;
    }
    sessionStorage.setItem(KEY_NAME, adminKey);
    ordersCache = data.orders || [];
    let storage = data.storage;
    let durable = data.durable;
    if (storage == null) {
      try {
        const health = await fetch(`${base}/api/health`).then((res) => res.json());
        storage = health.storage;
        durable = health.durable;
      } catch {
        storage = "";
        durable = false;
      }
    }
    showStorageBanner({ storage, durable });
    showApp(true);
    if (submit) {
      submit.disabled = false;
      submit.textContent = "Entrar";
    }
    renderBoard();
  }

  function openWhatsApp(url) {
    if (!url) return;
    window.open(url, "_blank", "noopener");
  }

  document.getElementById("admin-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    load(document.getElementById("admin-key").value);
  });

  document.getElementById("owner-logout")?.addEventListener("click", () => {
    sessionStorage.removeItem(KEY_NAME);
    ordersCache = [];
    document.getElementById("admin-key").value = "";
    showApp(false);
  });

  document.getElementById("dash-kpis")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (button) setFilter(button.getAttribute("data-filter"));
  });

  document.querySelector(".dash-tabs")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (button) setFilter(button.getAttribute("data-filter"));
  });

  document.getElementById("dash-search")?.addEventListener("input", () => renderBoard());

  document.getElementById("admin-list")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target.closest(".track-admin");
    if (!form) return;
    const article = form.closest("[data-order]");
    const orderId = article?.getAttribute("data-order");
    const trackingCode = form.querySelector("[name=tracking]")?.value;
    const adminKey = key();
    const base = apiBase();
    const res = await fetch(`${base}/api/orders/${encodeURIComponent(orderId)}/tracking`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ trackingCode }),
    });
    if (!res.ok) {
      showBoardError("Não foi possível salvar o rastreio.");
      return;
    }
    load(adminKey);
  });

  document.getElementById("admin-list")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-ship]");
    if (!button || button.disabled) return;
    const article = button.closest("[data-order]");
    const orderId = article?.getAttribute("data-order");
    const trackingCode = article?.querySelector("[name=tracking]")?.value || "";
    const adminKey = key();
    const base = apiBase();
    button.disabled = true;
    const res = await fetch(`${base}/api/orders/${encodeURIComponent(orderId)}/shipped`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ trackingCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      button.disabled = false;
      showBoardError("Não foi possível marcar como enviado.");
      return;
    }
    openWhatsApp(data.whatsappUrl);
    load(adminKey);
  });

  const saved = sessionStorage.getItem(KEY_NAME);
  if (saved) {
    document.getElementById("admin-key").value = saved;
    load(saved);
  }
