(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const cfg = () => window.CEME_CHECKOUT || {};
  const shop = () => window.CEMEShop;
  // TEMPORÁRIO (teste live): frete grátis desde R$ 0.
  const FREE_FROM_DEFAULT = 0;

  function apiBase() {
    if (
      typeof location !== "undefined" &&
      (/\.onrender\.com$/i.test(location.hostname) || /(^|\.)familiaceme\.com\.br$/i.test(location.hostname))
    ) {
      return location.origin;
    }
    const apiUrl = String(cfg().apiUrl || "").replace(/\/$/, "");
    if (!apiUrl) return "";
    if (typeof location !== "undefined" && location.protocol === "https:" && /^http:\/\//i.test(apiUrl)) {
      return "";
    }
    return apiUrl;
  }

  const state = {
    step: "data",
    paying: false,
    demo: true,
    mode: "local",
    orderId: "",
    lastQuoteTotal: 0,
    idempotencyKey: "",
    shipMethod: "delivery",
    waProofPending: false,
    waProofOrderId: "",
  };

  function t(key) {
    return shop() ? shop().t(key) : key;
  }

  function money(n) {
    return shop() ? shop().money(n) : `R$ ${Number(n).toFixed(2)}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function isEmail(value) {
    const email = String(value || "").trim().toLowerCase();
    if (email.length < 6 || email.length > 120) return false;
    return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i.test(email);
  }

  function brazilianMobileDigits(value) {
    let digits = onlyDigits(value);
    if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
    return digits.slice(0, 11);
  }

  function isBrazilianMobile(value) {
    const digits = brazilianMobileDigits(value);
    if (digits.length !== 11) return false;
    const ddd = Number(digits.slice(0, 2));
    if (ddd < 11 || ddd > 99) return false;
    if (digits[2] !== "9") return false;
    if (/^(\d)\1+$/.test(digits)) return false;
    return true;
  }

  function maskPhone(value) {
    const d = brazilianMobileDigits(value);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function maskCep(value) {
    const d = onlyDigits(value).slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  }

  function shippingRegion(cep) {
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

  function regionFee(region) {
    // TEMPORÁRIO (teste live): frete R$ 0.
    return (
      {
        df: 0,
        centroOeste: 0,
        sudeste: 0,
        sul: 0,
        nordeste: 0,
        norte: 0,
        unknown: 0,
      }[region] || 0
    );
  }

  function freeFrom() {
    return Number(cfg().freeShippingFrom || FREE_FROM_DEFAULT);
  }

  function cartItems() {
    if (!shop()) return [];
    return shop().getCart();
  }

  function isPhysical(product) {
    const kind = product?.kind || "spray";
    return kind === "spray" || kind === "garrafada";
  }

  function selectedShipMethod() {
    const checked = document.querySelector('input[name="ship-method"]:checked');
    return checked?.value === "pickup" ? "pickup" : "delivery";
  }

  function quote() {
    const items = cartItems()
      .map((item) => {
        const product = PRODUCTS.find((p) => p.id === item.id);
        if (!product) return null;
        return {
          ...item,
          name: product.name,
          image: product.image,
          volume: product.volume,
          kind: product.kind || "spray",
          unitPrice: product.price,
          lineTotal: product.price * item.qty,
        };
      })
      .filter(Boolean);
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const hasPhysical = items.some((item) => isPhysical(item));
    const method = hasPhysical ? selectedShipMethod() : "none";
    let shipping = 0;
    if (hasPhysical && method === "delivery") {
      if (subtotal >= freeFrom()) shipping = 0;
      else shipping = regionFee(shippingRegion($("#pay-cep")?.value || ""));
    }
    return { items, subtotal, shipping, hasPhysical, shippingMethod: method, total: subtotal + shipping };
  }

  function setError(id, msg) {
    const field = document.getElementById(id);
    const err = document.getElementById(`${id}-error`);
    if (field) field.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg || "";
  }

  function formData() {
    const get = (id) => (document.getElementById(id)?.value || "").trim();
    return {
      name: get("pay-name"),
      email: get("pay-email"),
      emailConfirm: get("pay-email-confirm"),
      phone: get("pay-phone"),
      phoneConfirm: get("pay-phone-confirm"),
      birthDate: get("pay-birth"),
      cep: get("pay-cep"),
      street: get("pay-street"),
      number: get("pay-number"),
      complement: get("pay-complement"),
      neighborhood: get("pay-neighborhood"),
      city: get("pay-city"),
      state: get("pay-state"),
    };
  }

  function hasNeuroItem() {
    return quote().items.some((item) => item.id === "musica-neuroconexao" || item.kind === "neuro");
  }

  function needsAddress() {
    const { hasPhysical, shippingMethod } = quote();
    return hasPhysical && shippingMethod === "delivery";
  }

  function isBirthDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    if (d > today) return false;
    const year = Number(value.slice(0, 4));
    return year >= 1900 && year <= today.getFullYear();
  }

  function validateData(data) {
    let ok = true;
    if (data.name.length < 3) {
      setError("pay-name", t("errPayName"));
      ok = false;
    } else setError("pay-name");
    if (!isEmail(data.email)) {
      setError("pay-email", t("errEmail"));
      ok = false;
    } else setError("pay-email");
    if (!data.emailConfirm || !isEmail(data.emailConfirm) || data.emailConfirm.toLowerCase() !== data.email.toLowerCase()) {
      setError("pay-email-confirm", t("errEmailConfirm"));
      ok = false;
    } else setError("pay-email-confirm");
    if (!isBrazilianMobile(data.phone)) {
      setError("pay-phone", t("errPhone"));
      ok = false;
    } else setError("pay-phone");
    if (
      !data.phoneConfirm ||
      !isBrazilianMobile(data.phoneConfirm) ||
      brazilianMobileDigits(data.phoneConfirm) !== brazilianMobileDigits(data.phone)
    ) {
      setError("pay-phone-confirm", t("errPhoneConfirm"));
      ok = false;
    } else setError("pay-phone-confirm");

    const neuroFields = document.getElementById("checkout-neuro-fields");
    const needBirth = hasNeuroItem();
    if (neuroFields) neuroFields.hidden = !needBirth;
    if (needBirth) {
      if (!isBirthDate(data.birthDate)) {
        setError("pay-birth", t("errBirth"));
        ok = false;
      } else setError("pay-birth");
    } else {
      setError("pay-birth");
    }

    if (!needsAddress()) {
      ["pay-cep", "pay-street", "pay-number", "pay-neighborhood", "pay-city", "pay-state"].forEach((id) =>
        setError(id)
      );
    } else {
      if (onlyDigits(data.cep).length !== 8) {
        setError("pay-cep", t("errCep"));
        ok = false;
      } else setError("pay-cep");
      if (data.street.length < 2) {
        setError("pay-street", t("errStreet"));
        ok = false;
      } else setError("pay-street");
      if (!data.number) {
        setError("pay-number", t("errNumber"));
        ok = false;
      } else setError("pay-number");
      if (data.neighborhood.length < 2) {
        setError("pay-neighborhood", t("errNeighborhood"));
        ok = false;
      } else setError("pay-neighborhood");
      if (data.city.length < 2) {
        setError("pay-city", t("errCity"));
        ok = false;
      } else setError("pay-city");
      if (!/^[A-Za-z]{2}$/.test(data.state)) {
        setError("pay-state", t("errState"));
        ok = false;
      } else setError("pay-state");
    }

    const privacy = document.getElementById("pay-privacy");
    if (!privacy?.checked) {
      setError("pay-privacy", t("errPrivacy"));
      ok = false;
    } else setError("pay-privacy");
    return ok;
  }

  function shippingLabel(q) {
    if (!q.hasPhysical) return t("checkoutShippingNone");
    if (q.shippingMethod === "pickup") return t("checkoutShippingPickup");
    if (q.shipping === 0) return t("checkoutShippingGratis");
    return money(q.shipping);
  }

  function renderSummary() {
    const q = quote();
    const list = $("#checkout-items");
    if (!list) return;
    list.innerHTML = q.items
      .map(
        (item) => `
        <li>
          <img src="${escapeHtml(item.image)}" alt="">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${item.qty} × ${money(item.unitPrice)}</span>
          </div>
          <em>${money(item.lineTotal)}</em>
        </li>`
      )
      .join("");
    $("#checkout-subtotal").textContent = money(q.subtotal);
    $("#checkout-shipping").textContent = shippingLabel(q);
    $("#checkout-total").textContent = money(q.total);
    const hint = $("#checkout-free-hint");
    if (hint) {
      hint.hidden = !q.hasPhysical || q.subtotal >= freeFrom() || q.shippingMethod === "pickup";
      hint.textContent = t("checkoutShippingFreeOver").replace("{price}", money(freeFrom()));
    }
    syncFulfillmentUI(q);
    const payBtn = $("#checkout-pay");
    if (payBtn) payBtn.textContent = t("checkoutPayNow").replace("{price}", money(q.total));
    state.lastQuoteTotal = q.total;
  }

  function syncFulfillmentUI(q) {
    const methods = $("#ship-methods");
    const address = $("#checkout-address");
    const digitalNote = $("#checkout-digital-note");
    const neuroFields = $("#checkout-neuro-fields");
    const hasNeuro = (q.items || []).some(
      (item) => item.id === "musica-neuroconexao" || item.kind === "neuro"
    );
    if (methods) methods.hidden = !q.hasPhysical;
    if (address) address.hidden = !q.hasPhysical || q.shippingMethod !== "delivery";
    if (neuroFields) neuroFields.hidden = !hasNeuro;
    const birth = $("#pay-birth");
    if (birth) birth.required = hasNeuro;
    if (digitalNote) {
      digitalNote.hidden = q.hasPhysical && !hasNeuro;
      if (hasNeuro && !q.hasPhysical) digitalNote.textContent = t("checkoutNeuroHint");
      else if (!q.hasPhysical) digitalNote.textContent = t("checkoutDigitalNote");
    }
  }

  function setStep(step) {
    state.step = step;
    $$(".checkout-step").forEach((el) => {
      el.hidden = el.dataset.step !== step;
    });
    $$(".checkout-progress span").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.step === step);
      el.classList.toggle(
        "is-done",
        ["data", "pay", "done"].indexOf(el.dataset.step) < ["data", "pay", "done"].indexOf(step)
      );
    });
    const title = $("#checkout-title");
    if (title) {
      title.textContent = step === "done" ? t("checkoutSuccessTitle") : t("checkoutTitle");
    }
  
    const verifyBtn = document.getElementById("checkout-verify-pay");
    if (verifyBtn) {
      verifyBtn.hidden = !(step === "pay" && loadReturnContext()?.orderId);
    }
  }

  async function fillAddressFromCep() {
    const cep = onlyDigits($("#pay-cep").value);
    if (cep.length !== 8) {
      renderSummary();
      return;
    }
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) $("#pay-street").value = data.logradouro;
        if (data.bairro) $("#pay-neighborhood").value = data.bairro;
        if (data.localidade) $("#pay-city").value = data.localidade;
        if (data.uf) $("#pay-state").value = data.uf;
      }
    } catch {
      /* ignore */
    }
    renderSummary();
  }

  async function loadRemoteConfig() {
    const apiUrl = apiBase();
    if (!apiUrl) {
      state.demo = true;
      state.mode = "local";
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/config`);
      const data = await res.json();
      if (typeof data.freeShippingFrom === "number") cfg().freeShippingFrom = data.freeShippingFrom;
      state.mode = data.mode || (data.sandbox ? "sandbox" : data.demo ? "demo" : "live");
      state.demo = state.mode === "demo" || state.mode === "local";
    } catch {
      state.mode = "local";
      state.demo = true;
    }
  }

  function showDemoBanner() {
    const banner = $("#checkout-demo-banner");
    if (!banner) return;
    if (state.mode === "live") {
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    const key =
      state.mode === "sandbox"
        ? "checkoutSandboxBanner"
        : state.mode === "demo"
          ? "checkoutApiTestBanner"
          : "checkoutDemoBanner";
    banner.textContent = t(key);
  }

  function setPayMessage(msg, kind) {
    const el = $("#checkout-pay-message");
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || "";
    el.classList.toggle("is-error", kind === "error");
  }

  function payerPayload(data) {
    return {
      name: data.name,
      email: data.email,
      emailConfirm: data.emailConfirm,
      phone: data.phone,
      phoneConfirm: data.phoneConfirm,
      birthDate: data.birthDate,
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
    };
  }

  function rememberPublicKey(orderId, publicKey) {
    const id = String(orderId || "").trim();
    const key = String(publicKey || "").trim();
    if (!id || !key || !window.sessionStorage) return key;
    try {
      sessionStorage.setItem(`ceme-order-key:${id}`, key);
      try { localStorage.setItem(`ceme-order-key:${id}`, key); } catch { /* ignore */ }
    } catch {
      /* ignore quota / private mode */
    }
    return key;
  }

  function orderPublicKey(orderId, result) {
    const id = String(orderId || result?.orderId || "").trim();
    const fromResult = String(result?.publicKey || result?.accessToken || "").trim();
    if (fromResult) return rememberPublicKey(id, fromResult);
    try {
      const params = new URLSearchParams(location.search);
      const fromUrl = params.get("k") || params.get("t") || "";
      if (fromUrl) return rememberPublicKey(id, fromUrl);
      return (
        (id && (sessionStorage.getItem(`ceme-order-key:${id}`) || localStorage.getItem(`ceme-order-key:${id}`) || sessionStorage.getItem(`ceme-access:${id}`) || localStorage.getItem(`ceme-access:${id}`))) ||
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


  function isPixPayment({ paymentType = "", paymentMethod = "" } = {}) {
    const method = String(paymentMethod || "").toLowerCase();
    const type = String(paymentType || "").toLowerCase();
    if (method === "pix" || type === "pix" || method.includes("pix")) return true;
    if (type === "bank_transfer") return true;
    return false;
  }

  function storeProofMessage(result, token) {
    const id = String(result.orderId || "").trim();
    const who = String(result.customerName || "").trim() || "Cliente";
    const key = String(token || result.publicKey || "").trim();
    const money = moneyFmt(result.total);
    const pix = !!result.isPix || isPixPayment(result);
    const track = withAccessQuery(
      `${location.origin}/pedidos.html?pedido=${encodeURIComponent(id)}`,
      key
    );
    const lines = [
      pix ? `Comprovante Pix — Família CEME` : `Pagamento confirmado — Família CEME`,
      `Número de rastreio: ${id}`,
      `Chave de rastreio: ${key || "—"}`,
      `Cliente: ${who}`,
      `Total: ${money}`,
    ];
    if (!pix) {
      lines.splice(1, 0, `Forma: ${result.paymentMethod || result.paymentType || "cartão/outro"}`);
    }
    if (track) lines.push(`Acompanhar pedido: ${track}`);
    lines.push(
      "",
      pix
        ? "Documento do cliente: envio o comprovante Pix com número e chave de rastreio para a loja registrar o pedido."
        : "Documento do cliente: envio os dados do pedido (número e chave de rastreio) para a loja registrar."
    );
    return lines.join("\n");
  }

  function openStoreProofWhatsApp(result, token) {
    const msg = storeProofMessage(result, token);
    const wa = storeWhatsApp();
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
    const proof = $("#checkout-proof-wa");
    if (proof) {
      proof.href = url;
      proof.hidden = false;
    }
    try {
      const win = window.open(url, "_blank", "noopener");
      if (!win) {
        // Popup bloqueado: o botão obrigatório permanece como caminho principal.
        return { url, opened: false };
      }
      return { url, opened: true };
    } catch {
      return { url, opened: false };
    }
  }

  function setSuccessExtrasLocked(locked) {
    ["checkout-cupom-link", "checkout-album-link", "checkout-track-link", "checkout-success-close"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      // Sempre remove listener antigo para não empilhar em reentradas.
      if (el.tagName === "A") el.removeEventListener("click", blockUntilWhatsApp, true);
      if (locked) {
        el.setAttribute("data-wa-locked", "1");
        el.classList.add("is-wa-locked");
        if (el.tagName === "A") {
          const current = el.getAttribute("href") || "";
          if (!el.dataset.hrefBackup && current && current !== "#") {
            el.dataset.hrefBackup = current;
          }
          el.setAttribute("href", "#");
          el.addEventListener("click", blockUntilWhatsApp, true);
        } else {
          el.disabled = true;
        }
      } else {
        el.classList.remove("is-wa-locked");
        el.removeAttribute("data-wa-locked");
        if (el.tagName === "A") {
          if (el.dataset.hrefBackup) {
            el.setAttribute("href", el.dataset.hrefBackup);
            delete el.dataset.hrefBackup;
          }
        } else {
          el.disabled = false;
        }
      }
    });
    const unlock = document.getElementById("checkout-wa-sent");
    if (unlock) unlock.hidden = !locked;
  }

  function blockUntilWhatsApp(event) {
    event.preventDefault();
    event.stopPropagation();
    const hint = $("#checkout-track-hint");
    if (hint) hint.textContent = t("checkoutWhatsAppOpened");
    const proof = $("#checkout-proof-wa");
    if (proof?.href && !proof.href.endsWith("#")) {
      try {
        window.open(proof.href, "_blank", "noopener");
      } catch {
        /* ignore */
      }
    }
  }

  function moneyFmt(n) {
    return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function storeWhatsApp() {
    if (typeof WHATSAPP === "string" && WHATSAPP) return WHATSAPP;
    return "5561999291377";
  }

  function finishOrder(result) {
    if (result.status === "pending" || result.status === "in_process") {
      setStep("pay");
      setPayMessage(t("checkoutNotConfirmed"), "error");
      return;
    }
    state.orderId = result.orderId;
    const token = orderPublicKey(result.orderId, result);
    $("#checkout-order-id").textContent = result.orderId;
    const keyEl = $("#checkout-public-key");
    if (keyEl) {
      const key = token || result.publicKey || "";
      keyEl.textContent = key ? `Chave de rastreio: ${key}` : "";
      keyEl.hidden = !key;
    }
    const paid = true;
    const hadAlbum = quote().items.some((item) => item.id === "musicas-neuroconectivas" || item.kind === "musica");
    const track = $("#checkout-track-link");
    if (track) {
      track.href = withAccessQuery(`pedidos.html?pedido=${encodeURIComponent(result.orderId)}`, token);
      track.hidden = !paid;
    }
    const cupom = $("#checkout-cupom-link");
    if (cupom) {
      const base = apiBase();
      if (paid && base && result.orderId && /^CEME-[A-Z0-9-]+$/i.test(result.orderId)) {
        cupom.href = withAccessQuery(`${base}/api/order/${encodeURIComponent(result.orderId)}/cupom.pdf`, token);
        cupom.hidden = false;
      } else {
        cupom.removeAttribute("href");
        cupom.hidden = true;
      }
    }
    const album = $("#checkout-album-link");
    if (album) {
      const base = apiBase();
      if (paid && hadAlbum && base && result.orderId && /^CEME-[A-Z0-9-]+$/i.test(result.orderId)) {
        album.href = withAccessQuery(
          `${base}/api/order/${encodeURIComponent(result.orderId)}/download/musicas-neuroconectivas`,
          token
        );
        album.hidden = false;
      } else {
        album.removeAttribute("href");
        album.hidden = true;
      }
    }
    const title = $("#checkout-success-title");
    if (title) {
      title.textContent = t("checkoutSuccessTitle");
    }
    $("#checkout-success-text").textContent = t(
      result.demo || state.demo ? "checkoutDemoSuccess" : "checkoutSuccessText"
    ).replace("{order}", result.orderId);

    const pix = !!result.isPix || isPixPayment(result);
    const proof = $("#checkout-proof-wa");
    const opened = openStoreProofWhatsApp(result, token);
    if (proof) {
      proof.textContent = t(pix ? "checkoutSendPixProof" : "checkoutSendCardNotice");
      proof.hidden = !paid;
      proof.setAttribute("aria-required", "true");
    }
    const hint = $("#checkout-track-hint");
    if (hint) {
      hint.textContent = opened.opened
        ? t("checkoutWhatsAppOpened")
        : t("checkoutWhatsAppPopupBlocked");
    }
    // Obrigatório documentar no WhatsApp antes dos outros atalhos.
    setSuccessExtrasLocked(true);
    state.waProofPending = true;
    state.waProofOrderId = result.orderId;
    const mandatory = $("#checkout-wa-mandatory");
    if (mandatory) {
      mandatory.hidden = false;
      mandatory.textContent = t("checkoutMustSendWhatsApp");
    }

    if (shop()) shop().clearCart();
    setStep("done");
  }

  async function startMercadoPago() {
    if (state.paying) return;
    const data = formData();
    if (!validateData(data)) {
      setStep("data");
      setPayMessage(t("checkoutFixData"), "error");
      const first = document.querySelector("#checkout-modal [aria-invalid='true']");
      if (first) first.focus();
      return;
    }
    const q = quote();
    if (!q.items.length || q.total <= 0) {
      setPayMessage(t("checkoutEmptyCart"), "error");
      return;
    }

    state.paying = true;
    const btn = $("#checkout-pay");
    if (btn) {
      btn.disabled = true;
      btn.textContent = t("checkoutRedirecting");
    }
    setPayMessage(t("checkoutRedirecting"), "");

    const payload = {
      items: q.items.map((item) => ({ id: item.id, qty: item.qty })),
      shippingMethod: q.shippingMethod,
      idempotencyKey: state.idempotencyKey || `ceme-${Date.now()}`,
      payer: payerPayload(data),
    };

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 25000) : null;
    try {
      const apiUrl = apiBase();
      if (!apiUrl) {
        finishOrder({
          orderId: `CEME-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          demo: true,
          status: "approved",
        });
        return;
      }
      const res = await fetch(`${apiUrl}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller?.signal,
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.checkoutUrl) {
        throw Object.assign(new Error(result.error || "checkout_failed"), { code: result.error });
      }
      if (result.orderId && (result.publicKey || result.accessToken)) {
        rememberPublicKey(result.orderId, result.publicKey || result.accessToken);
      }
      if (result.orderId) {
        saveReturnContext({
          orderId: result.orderId,
          paymentId: "",
          token: result.publicKey || result.accessToken || "",
          paymentTypeHint: "",
          at: Date.now(),
        });
      }
      window.location.assign(result.checkoutUrl);
    } catch (err) {
      const aborted = err && (err.name === "AbortError" || /abort/i.test(String(err.message || "")));
      setPayMessage(t(aborted ? "checkoutPayTimeout" : "checkoutPayError"), "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = t("checkoutPayNow").replace("{price}", money(quote().total));
      }
      state.paying = false;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function clearReturnQuery() {
    const url = new URL(location.href);
    ["mp", "collection_id", "collection_status", "payment_id", "status", "external_reference", "preference_id", "merchant_order_id", "payment_type", "t", "k"].forEach(
      (key) => url.searchParams.delete(key)
    );
    history.replaceState({}, "", url.pathname + url.search + url.hash);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function saveReturnContext(ctx) {
    try {
      sessionStorage.setItem("ceme-mp-return", JSON.stringify(ctx));
      localStorage.setItem("ceme-mp-return", JSON.stringify(ctx));
    } catch {
      /* ignore */
    }
  }

  function loadReturnContext() {
    try {
      const raw = sessionStorage.getItem("ceme-mp-return") || localStorage.getItem("ceme-mp-return");
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    try {
      // Resgate: mesmo navegador que iniciou o checkout ainda tem a chave CEME-N.
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i) || "";
        if (!key.startsWith("ceme-order-key:") && !key.startsWith("ceme-access:")) continue;
        const orderId = key.split(":").slice(1).join(":");
        const token = sessionStorage.getItem(key) || "";
        if (orderId && token) return { orderId, paymentId: "", token, paymentTypeHint: "" };
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  function clearReturnContext() {
    try {
      sessionStorage.removeItem("ceme-mp-return");
      localStorage.removeItem("ceme-mp-return");
    } catch {
      /* ignore */
    }
  }

  async function fetchOrderStatus(orderId, paymentId, token) {
    const qs = new URLSearchParams();
    if (paymentId) qs.set("payment_id", paymentId);
    if (token) qs.set("k", token);
    const suffix = qs.toString() ? `?${qs}` : "";
    const res = await fetch(`${apiBase()}/api/order/${encodeURIComponent(orderId)}${suffix}`);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  async function confirmPaidOrder({ orderId, paymentId, token, paymentTypeHint = "" }) {
    // Pix real: webhook/API podem atrasar. Poll longo + retry em 429/5xx.
    const attempts = 40;
    let last = { ok: false, data: {} };
    for (let i = 0; i < attempts; i++) {
      setPayMessage(t("checkoutChecking"), "");
      last = await fetchOrderStatus(orderId, paymentId, token);
      if (last.data?.status === "approved") {
        const paymentType = last.data.paymentType || paymentTypeHint || "";
        const paymentMethod = last.data.paymentMethod || "";
        const key = last.data.publicKey || token;
        if (key) rememberPublicKey(orderId, key);
        finishOrder({
          orderId: last.data.orderId || orderId,
          publicKey: key,
          customerName: last.data.customerName || "",
          total: last.data.total,
          paymentType,
          paymentMethod,
          isPix: last.data.isPix === true || isPixPayment({ paymentType, paymentMethod }),
          demo: !!last.data.demo,
          status: "approved",
        });
        clearReturnContext();
        return true;
      }
      // Mesmo pending: já mostra CEME + chave para o cliente não ficar sem rastreio.
      const keyNow = last.data?.publicKey || token || orderPublicKey(orderId);
      if (keyNow) {
        rememberPublicKey(orderId, keyNow);
        showTrackingCredentials(orderId, keyNow, { pending: true });
      }
      const statusCode = Number(last.status || 0);
      const pending =
        ["pending", "in_process", "inprocess", "authorized"].includes(
          String(last.data?.status || "").toLowerCase()
        ) ||
        last.data?.error === "payment_not_confirmed" ||
        statusCode === 404 ||
        statusCode === 429 ||
        statusCode >= 500;
      if (!pending && i >= 2) break;
      await sleep(Math.min(4000, 1200 + i * 150));
    }
    return false;
  }

    function showTrackingCredentials(orderId, publicKey, { pending = false } = {}) {
    const id = String(orderId || "").trim();
    const key = String(publicKey || "").trim();
    if (!id || !key) return;
    rememberPublicKey(id, key);
    const msg = t(pending ? "checkoutPendingKeepKey" : "checkoutTrackCredentials")
      .replace("{order}", id)
      .replace("{key}", key);
    const hint = $("#checkout-track-hint");
    if (hint) {
      hint.textContent = msg;
      hint.hidden = false;
    }
    const payMsg = $("#checkout-pay-message") || $("#checkout-pay-msg");
    if (pending && payMsg && !String(payMsg.textContent || "").includes(id)) {
      // keep primary waiting message; credentials stay in hint
    }
    const track = $("#checkout-track-link");
    if (track) {
      track.href = withAccessQuery(`pedidos.html?pedido=${encodeURIComponent(id)}`, key);
      track.hidden = false;
    }
    const keyBox = $("#checkout-public-key");
    if (keyBox) {
      keyBox.textContent = `Chave de rastreio: ${key}`;
      keyBox.hidden = false;
    }
  }

  async function handleReturn() {
    const params = new URLSearchParams(location.search);
    let orderId = params.get("external_reference") || "";
    let paymentId = params.get("payment_id") || params.get("collection_id") || "";
    const mp = params.get("mp");
    const paymentTypeHint = params.get("payment_type") || "";
    if (!orderId && !paymentId && !mp) {
      const saved = loadReturnContext();
      if (saved?.orderId) {
        orderId = saved.orderId;
        paymentId = saved.paymentId || "";
      } else {
        return false;
      }
    }

    open();
    setPayMessage(t("checkoutChecking"), "");
    try {
      if (mp === "demo" || (!apiBase() && orderId)) {
        finishOrder({ orderId: orderId || `CEME-DEMO`, demo: true, status: "approved" });
        clearReturnQuery();
        clearReturnContext();
        return true;
      }
      if (!apiBase() || !orderId) {
        setPayMessage(t("checkoutPayError"), "error");
        setStep("pay");
        clearReturnQuery();
        return true;
      }

      const mpStatus = String(params.get("status") || params.get("collection_status") || "").toLowerCase();
      const rejected = ["rejected", "cancelled", "canceled", "refunded", "charged_back"].includes(mpStatus);
      if (rejected) {
        setStep("pay");
        setPayMessage(t("checkoutNotConfirmed"), "error");
        clearReturnQuery();
        clearReturnContext();
        return true;
      }

      const token = orderPublicKey(orderId);
      saveReturnContext({ orderId, paymentId, token, paymentTypeHint, at: Date.now() });

      // Não confiar só no status da URL: Pix às vezes volta "pending" e depois aprova.
      const ok = await confirmPaidOrder({ orderId, paymentId, token, paymentTypeHint });
      if (!ok) {
        setStep("pay");
        const verifyBtn = document.getElementById("checkout-verify-pay");
        if (verifyBtn) verifyBtn.hidden = false;
        const key = orderPublicKey(orderId) || token;
        if (key) showTrackingCredentials(orderId, key, { pending: true });
        setPayMessage(
          t("checkoutWaitingPix") +
            " " +
            t("checkoutPendingKeepKey").replace("{order}", orderId).replace("{key}", key || "—"),
          "error"
        );
      }
    } catch {
      setStep("pay");
      setPayMessage(t("checkoutPayError"), "error");
    }
    clearReturnQuery();
    return true;
  }
  function open() {
    const modal = $("#checkout-modal");
    if (!modal) return;
    if (shop()) {
      shop().closeCart();
      shop().closeModal();
    }
    state.idempotencyKey =
      crypto && crypto.randomUUID ? crypto.randomUUID() : `ceme-${Date.now()}`;
    state.orderId = "";
    modal.hidden = false;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setStep("data");
    renderSummary();
    showDemoBanner();
    loadRemoteConfig().then(() => {
      showDemoBanner();
      renderSummary();
    });
    modal.querySelector(".checkout-panel")?.focus();
  }

  function close() {
    const modal = $("#checkout-modal");
    if (!modal) return;
    if (state.waProofPending && state.step === "done") {
      const hint = $("#checkout-track-hint");
      if (hint) hint.textContent = t("checkoutWhatsAppOpened");
      const proof = $("#checkout-proof-wa");
      if (proof?.href && !proof.href.endsWith("#")) {
        try {
          window.open(proof.href, "_blank", "noopener");
        } catch {
          /* ignore */
        }
      }
      return;
    }
    modal.classList.remove("is-open");
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setPayMessage("");
    if (state.step === "done") setStep("data");
  }

  function refresh() {
    const modal = $("#checkout-modal");
    if (!modal || modal.hidden) return;
    renderSummary();
    showDemoBanner();
  }

  function bind() {
    const modal = $("#checkout-modal");
    if (!modal) return;

    $("#checkout-close")?.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    $("#checkout-continue")?.addEventListener("click", () => {
      if (!validateData(formData())) {
        const first = modal.querySelector("[aria-invalid='true']");
        if (first) first.focus();
        return;
      }
      setStep("pay");
      renderSummary();
    });
    $("#checkout-back")?.addEventListener("click", () => setStep("data"));
    $("#checkout-pay")?.addEventListener("click", startMercadoPago);
    $("#checkout-success-close")?.addEventListener("click", close);

    document.querySelectorAll('input[name="ship-method"]').forEach((input) => {
      input.addEventListener("change", () => {
        state.shipMethod = selectedShipMethod();
        renderSummary();
      });
    });

    $("#pay-cep")?.addEventListener("input", (e) => {
      e.target.value = maskCep(e.target.value);
      if (onlyDigits(e.target.value).length === 8) fillAddressFromCep();
      else renderSummary();
    });
    $("#pay-cep")?.addEventListener("blur", fillAddressFromCep);
    $("#pay-state")?.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
    });
    $("#pay-phone")?.addEventListener("input", (e) => {
      e.target.value = maskPhone(e.target.value);
    });
    $("#pay-phone-confirm")?.addEventListener("input", (e) => {
      e.target.value = maskPhone(e.target.value);
    });
    ["pay-email", "pay-email-confirm", "pay-phone", "pay-phone-confirm"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("blur", () => validateData(formData()));
      el.addEventListener("change", () => validateData(formData()));
    });
    // Evita colar um valor diferente no campo de confirmação sem perceber.
    ["pay-email-confirm", "pay-phone-confirm"].forEach((id) => {
      document.getElementById(id)?.addEventListener("paste", (e) => {
        e.preventDefault();
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) close();
    });


  document.getElementById("checkout-wa-sent")?.addEventListener("click", () => {
    state.waProofPending = false;
    setSuccessExtrasLocked(false);
    const mandatory = $("#checkout-wa-mandatory");
    if (mandatory) mandatory.hidden = true;
    const hint = $("#checkout-track-hint");
    if (hint) hint.textContent = t("checkoutWhatsAppThanks");
  });

  document.getElementById("checkout-proof-wa")?.addEventListener("click", () => {
    const hint = $("#checkout-track-hint");
    if (hint) hint.textContent = t("checkoutWhatsAppOpened");
  });

    handleReturn();

  document.getElementById("checkout-verify-pay")?.addEventListener("click", async () => {
    const saved = loadReturnContext();
    if (!saved?.orderId || !apiBase()) {
      setPayMessage(t("checkoutNotConfirmed"), "error");
      return;
    }
    open();
    setStep("pay");
    setPayMessage(t("checkoutChecking"), "");
    const ok = await confirmPaidOrder({
      orderId: saved.orderId,
      paymentId: saved.paymentId || "",
      token: saved.token || orderPublicKey(saved.orderId),
      paymentTypeHint: saved.paymentTypeHint || "",
    });
    if (!ok) {
        const verifyBtn = document.getElementById("checkout-verify-pay");
        if (verifyBtn) verifyBtn.hidden = false;
        const key = saved.token || orderPublicKey(saved.orderId);
        if (key) showTrackingCredentials(saved.orderId, key, { pending: true });
        setPayMessage(
          t("checkoutWaitingPix") +
            " " +
            t("checkoutPendingKeepKey").replace("{order}", saved.orderId).replace("{key}", key || "—"),
          "error"
        );
      }
  });

  }

  document.addEventListener("DOMContentLoaded", bind);

  window.CEMECheckout = { open, close, refresh };
})();
