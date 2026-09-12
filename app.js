(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const LOCALES = { pt: "pt-BR", en: "en-US", es: "es-ES", de: "de-DE", fr: "fr-FR" };
  const ALBUM_PRICE_BRL = 72;
  const PRODUCT_IDS = new Set(PRODUCTS.map((p) => p.id));
  const CATEGORY_KEYS = ["todos", "mente", "comunicacao", "sensorial", "emocao", "detox", "corpo", "frequencial"];

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem("ceme-cart") || "[]");
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((item) => item && PRODUCT_IDS.has(String(item.id)))
        .map((item) => ({
          id: String(item.id),
          qty: Math.min(20, Math.max(1, Number(item.qty) || 1)),
        }));
    } catch {
      return [];
    }
  }

  const state = {
    cart: readCart(),
    filter: "todos",
    currentAudio: null,
    lang: localStorage.getItem("ceme-lang") || "pt",
  };

  if (!I18N[state.lang]) state.lang = "pt";

  function t(key) {
    return (I18N[state.lang] && I18N[state.lang][key]) || I18N.pt[key] || key;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function money(amount, currency = "BRL") {
    const cur = currency === "USD" ? "USD" : "BRL";
    return Number(amount).toLocaleString(LOCALES[state.lang] || "pt-BR", {
      style: "currency",
      currency: cur,
    });
  }

  function usdBrlRate() {
    const rate = Number(window.CEME_CHECKOUT && window.CEME_CHECKOUT.usdBrlRate);
    return Number.isFinite(rate) && rate > 0 ? rate : 5.5;
  }

  function productCurrency(p) {
    return p && String(p.currency || "BRL").toUpperCase() === "USD" ? "USD" : "BRL";
  }

  function productPriceBrl(p) {
    if (!p) return 0;
    const value = Number(p.price) || 0;
    return productCurrency(p) === "USD" ? value * usdBrlRate() : value;
  }

  function productPriceLabel(p) {
    return money(p.price, productCurrency(p));
  }

  function moneyForWhatsApp(amountBrl) {
    return money(amountBrl, "BRL");
  }

  function renderAlbumPrice() {
    const el = $(".album-price");
    if (!el) return;
    el.textContent = money(ALBUM_PRICE_BRL);
  }

  function refreshPrices() {
    renderProducts();
    renderExtras();
    renderCart();
    renderAlbumPrice();
    const modal = $("#product-modal");
    if (modal && !modal.hidden && modal.dataset.openId) {
      openModal(modal.dataset.openId);
    }
    if (window.CEMECheckout) window.CEMECheckout.refresh();
  }

  function waLink(text) {
    return `https://wa.me/${WHATSAPP}/?text=${encodeURIComponent(text)}`;
  }

  function localizedProduct(p) {
    const copy = (p.i18n && (p.i18n[state.lang] || p.i18n.pt)) || {};
    return {
      ...p,
      tagline: copy.tagline || p.tagline || "",
      description: copy.description || p.description || "",
      indications: copy.indications || p.indications || [],
      categoryLabel: t(`cat_${p.category}`),
    };
  }

  function applyStaticI18n() {
    const dict = I18N[state.lang] || I18N.pt;
    document.documentElement.lang = dict.htmlLang || "pt-BR";

    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key || dict[key] == null) return;
      if (el.tagName === "TITLE" || el.tagName === "META") {
        if (el.tagName === "TITLE") el.textContent = dict[key];
        else el.setAttribute("content", dict[key]);
      } else {
        el.textContent = dict[key];
      }
    });

    $$("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key && dict[key] != null) el.setAttribute("placeholder", dict[key]);
    });

    $$("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (key && dict[key] != null) el.setAttribute("aria-label", dict[key]);
    });

    $$("[data-i18n-alt]").forEach((el) => {
      const key = el.getAttribute("data-i18n-alt");
      if (key && dict[key] != null) el.setAttribute("alt", dict[key]);
    });

    $$("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (key && dict[key] != null) el.setAttribute("title", dict[key]);
    });

    const evalText = encodeURIComponent(t("waEval"));
    ["#cta-eval-hero", "#cta-eval-band", "#cta-eval-tools"].forEach((sel) => {
      const a = $(sel);
      if (a) a.href = `https://wa.me/${WHATSAPP}/?text=${evalText}`;
    });

    $$(".lang-btn").forEach((btn) => {
      const active = btn.dataset.lang === state.lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function setLanguage(lang) {
    if (!I18N[lang]) return;
    state.lang = lang;
    localStorage.setItem("ceme-lang", lang);
    if (!CATEGORY_KEYS.includes(state.filter)) state.filter = "todos";
    applyStaticI18n();
    renderFilters();
    refreshPrices();
  }

  function saveCart() {
    localStorage.setItem(
      "ceme-cart",
      JSON.stringify(state.cart.map((item) => ({ id: item.id, qty: item.qty })))
    );
    renderCart();
  }

  function cartCount() {
    return state.cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function cartTotal() {
    return state.cart.reduce((sum, item) => {
      const p = PRODUCTS.find((x) => x.id === item.id);
      return sum + (p ? productPriceBrl(p) * item.qty : 0);
    }, 0);
  }

  function addToCart(id, qty = 1, opts = {}) {
    const found = state.cart.find((i) => i.id === id);
    if (found) found.qty += qty;
    else state.cart.push({ id, qty });
    saveCart();
    if (opts.open !== false) openCart();
    if (window.CEMECheckout) window.CEMECheckout.refresh();
  }

  function setQty(id, qty) {
    const item = state.cart.find((i) => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, qty);
    saveCart();
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter((i) => i.id !== id);
    saveCart();
  }

  function checkoutWhatsApp() {
    if (!state.cart.length) return;
    const lines = state.cart.map((item) => {
      const p = PRODUCTS.find((x) => x.id === item.id);
      return `• ${p.name} (${p.volume}) x${item.qty} — ${money(p.price * item.qty, productCurrency(p))}`;
    });
    const text = [
      t("waHelloBuy"),
      "",
      ...lines,
      "",
      `${t("waTotal")} ${moneyForWhatsApp(cartTotal())}`,
      t("currencyHint"),
    ].join("\n");
    window.open(waLink(text), "_blank", "noopener");
  }

  function buyNow(id) {
    addToCart(id, 1, { open: false });
    closeModal();
    closeCart();
    if (window.CEMECheckout) window.CEMECheckout.open();
  }

  function stopAudio() {
    $$("audio").forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    $$(".audio-btn").forEach((b) => {
      b.classList.remove("is-playing");
      b.setAttribute("aria-pressed", "false");
      const label = b.querySelector(".audio-label");
      if (label) label.textContent = b.dataset.audioLabel || t("listenAudio");
    });
    state.currentAudio = null;
  }

  function toggleAudio(btn, src) {
    const audio = btn.parentElement.querySelector("audio");
    if (!audio) return;
    if (state.currentAudio && state.currentAudio !== audio) stopAudio();
    if (audio.paused) {
      audio.src = src;
      audio.play().catch(() => {});
      btn.classList.add("is-playing");
      btn.setAttribute("aria-pressed", "true");
      const label = btn.querySelector(".audio-label");
      if (label) {
        if (!btn.dataset.audioLabel) btn.dataset.audioLabel = label.textContent;
        label.textContent = t("pauseAudio");
      }
      state.currentAudio = audio;
      audio.onended = () => stopAudio();
    } else {
      stopAudio();
    }
  }

  function productCard(raw) {
    const p = localizedProduct(raw);
    const audioBlock = p.audio
      ? `<div class="audio-row">
            <button class="audio-btn" type="button" data-audio="${escapeHtml(p.audio)}" aria-pressed="false">
              <span class="audio-icon" aria-hidden="true"></span>
              <span class="audio-label">${escapeHtml(t("listenAudio"))}</span>
            </button>
            <audio preload="none"></audio>
          </div>`
      : "";
    const actions = `<div class="card-actions">
            <button class="btn btn-ghost" type="button" data-add="${escapeHtml(p.id)}">${escapeHtml(t("add"))}</button>
            <button class="btn btn-gold" type="button" data-buy="${escapeHtml(p.id)}">${escapeHtml(t("buy"))}</button>
          </div>`;
    return `
      <article class="card" data-id="${escapeHtml(p.id)}" data-category="${escapeHtml(p.category)}">
        <button class="card-media" type="button" data-open="${escapeHtml(p.id)}" aria-label="${escapeHtml(t("detailsOf"))} ${escapeHtml(p.name)}">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)} — ${escapeHtml(p.tagline)}" loading="lazy" width="900" height="1272">
        </button>
        <div class="card-body">
          <span class="pill">${escapeHtml(p.categoryLabel)} · ${escapeHtml(p.volume)}</span>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="tagline">${escapeHtml(p.tagline)}</p>
          <p class="price">${escapeHtml(productPriceLabel(p))}</p>
          ${audioBlock}
          ${actions}
        </div>
      </article>
    `;
  }

  function sprayProducts() {
    return PRODUCTS.filter((p) => !p.kind || p.kind === "spray");
  }

  function productsByKind(kind) {
    return PRODUCTS.filter((p) => p.kind === kind);
  }

  function renderProducts() {
    const grid = $("#product-grid");
    if (!grid) return;
    const sprays = sprayProducts();
    const list =
      state.filter === "todos" ? sprays : sprays.filter((p) => p.category === state.filter);
    grid.innerHTML = list.map(productCard).join("");
  }

  function renderSoloSection(gridId, kind) {
    const grid = $(gridId);
    if (!grid) return;
    grid.innerHTML = productsByKind(kind).map(productCard).join("");
  }

  function renderExtras() {
    renderSoloSection("#morfo-grid", "morfo");
    renderSoloSection("#mentorias-grid", "mentoria");
  }

  function renderFilters() {
    const wrap = $("#product-filters");
    if (!wrap) return;
    wrap.innerHTML = CATEGORY_KEYS.map(
      (c) =>
        `<button type="button" class="filter-btn ${c === state.filter ? "is-active" : ""}" data-filter="${escapeHtml(c)}">${escapeHtml(
          t(`cat_${c}`)
        )}</button>`
    ).join("");
  }

  function openModal(id) {
    const raw = PRODUCTS.find((x) => x.id === id);
    if (!raw) return;
    const p = localizedProduct(raw);
    stopAudio();
    closeCart();
    const modal = $("#product-modal");
    modal.dataset.openId = id;
    $("#modal-img").src = p.image;
    $("#modal-img").alt = p.name;
    $("#modal-name").textContent = p.name;
    $("#modal-tag").textContent = p.tagline;
    $("#modal-price").textContent = productPriceLabel(p);
    $("#modal-desc").textContent = p.description;
    $("#modal-indications").innerHTML = p.indications.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
    $("#modal-add").dataset.add = p.id;
    $("#modal-buy").dataset.buy = p.id;
    $("#modal-add").textContent = t("add");
    $("#modal-buy").textContent = t("buy");
    const audioBtn = $("#modal-audio");
    const audioRow = audioBtn && audioBtn.closest(".audio-row");
    if (p.audio) {
      if (audioRow) audioRow.hidden = false;
      audioBtn.hidden = false;
      audioBtn.dataset.audio = p.audio;
      const label = audioBtn.querySelector(".audio-label");
      if (label) label.textContent = t("listenAudio");
    } else if (audioBtn) {
      delete audioBtn.dataset.audio;
      audioBtn.hidden = true;
      if (audioRow) audioRow.hidden = true;
    }
    $("#modal-buy").hidden = false;
    $("#modal-add").hidden = false;
    const usage = $("#modal-usage");
    if (usage) {
      if (p.kind === "morfo") usage.textContent = t("morfoUsage");
      else if (p.kind === "musica") usage.textContent = t("musicaUsage");
      else if (p.kind === "neuro") usage.textContent = t("neuroUsage");
      else if (p.kind === "mentoria") usage.textContent = t("mentoriaUsage");
      else usage.textContent = t("usageHint");
    }
    modal.hidden = false;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal-panel").focus();
  }

  function closeModal() {
    const modal = $("#product-modal");
    if (!modal) return;
    stopAudio();
    modal.classList.remove("is-open");
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    delete modal.dataset.openId;
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
  }

  function renderCart() {
    const badge = $("#cart-count");
    if (badge) {
      badge.textContent = cartCount();
      badge.hidden = cartCount() === 0;
    }
    const list = $("#cart-list");
    const empty = $("#cart-empty");
    const footer = $("#cart-footer");
    if (!list) return;
    if (!state.cart.length) {
      list.innerHTML = "";
      empty.hidden = false;
      footer.hidden = true;
      return;
    }
    empty.hidden = true;
    footer.hidden = false;
    list.innerHTML = state.cart
      .map((item) => {
        const p = PRODUCTS.find((x) => x.id === item.id);
        return `
          <li class="cart-item">
            <img src="${escapeHtml(p.image)}" alt="">
            <div>
              <strong>${escapeHtml(p.name)}</strong>
              <span>${escapeHtml(money(p.price * item.qty, productCurrency(p)))}</span>
              <div class="qty">
                <button type="button" data-qty-minus="${escapeHtml(p.id)}" aria-label="${escapeHtml(t("decrease"))}">−</button>
                <input type="number" min="1" value="${Number(item.qty)}" data-qty="${escapeHtml(p.id)}" aria-label="${escapeHtml(t("qtyOf"))} ${escapeHtml(p.name)}">
                <button type="button" data-qty-plus="${escapeHtml(p.id)}" aria-label="${escapeHtml(t("increase"))}">+</button>
              </div>
            </div>
            <button type="button" class="icon-btn" data-remove="${escapeHtml(p.id)}" aria-label="${escapeHtml(t("remove"))} ${escapeHtml(p.name)}">×</button>
          </li>
        `;
      })
      .join("");
    $("#cart-total").textContent = money(cartTotal());
  }

  function openCart() {
    $("#cart-drawer").classList.add("is-open");
    $("#cart-drawer").setAttribute("aria-hidden", "false");
    $("#overlay").hidden = false;
  }

  function closeCart() {
    $("#cart-drawer").classList.remove("is-open");
    $("#cart-drawer").setAttribute("aria-hidden", "true");
    $("#overlay").hidden = true;
  }

  function maskPhone(value) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function setError(id, msg) {
    const field = document.getElementById(id);
    const err = document.getElementById(`${id}-error`);
    if (!field || !err) return;
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    err.textContent = msg || "";
  }

  function validateForm(data) {
    let ok = true;
    if (data.nome.trim().length < 2) {
      setError("nome", t("errName"));
      ok = false;
    } else setError("nome");
    if (data.sobrenome.trim().length < 2) {
      setError("sobrenome", t("errSurname"));
      ok = false;
    } else setError("sobrenome");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError("email", t("errEmail"));
      ok = false;
    } else setError("email");
    if (data.telefone.replace(/\D/g, "").length < 10) {
      setError("telefone", t("errPhone"));
      ok = false;
    } else setError("telefone");
    if (data.apresentacao.trim().length < 10) {
      setError("apresentacao", t("errAbout"));
      ok = false;
    } else setError("apresentacao");
    if (data.motivo.trim().length < 15) {
      setError("motivo", t("errWhy"));
      ok = false;
    } else setError("motivo");
    if (!$("#form-privacy")?.checked) {
      setError("form-privacy", t("errPrivacy"));
      ok = false;
    } else setError("form-privacy");
    return ok;
  }

  function handleForm(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (!validateForm(data)) {
      const first = form.querySelector("[aria-invalid='true']");
      if (first) first.focus();
      return;
    }
    const text = [
      t("waFormHello"),
      "",
      `${t("waFormName")} ${data.nome} ${data.sobrenome}`,
      `${t("waFormEmail")} ${data.email}`,
      `${t("waFormPhone")} ${data.telefone}`,
      "",
      `${t("waFormAbout")} ${data.apresentacao}`,
      "",
      `${t("waFormWhy")} ${data.motivo}`,
    ].join("\n");
    window.open(waLink(text), "_blank", "noopener");
    form.reset();
    $("#form-success").hidden = false;
    $("#form-success").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function setupNav() {
    const toggle = $("#menu-toggle");
    const nav = $("#site-nav");
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      const key = open ? "menuClose" : "menuOpen";
      toggle.setAttribute("data-i18n-aria", key);
      toggle.setAttribute("aria-label", t(key));
    };

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setOpen(!nav.classList.contains("is-open"));
    });
    $$("#site-nav a").forEach((a) =>
      a.addEventListener("click", () => setOpen(false))
    );
    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (toggle.contains(event.target) || nav.contains(event.target)) return;
      setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });

    const header = $(".site-header");
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function onClick(e) {
    const langBtn = e.target.closest("[data-lang]");
    if (langBtn && langBtn.dataset.lang) {
      setLanguage(langBtn.dataset.lang);
      return;
    }
    const tEl = e.target.closest(
      "[data-filter],[data-open],[data-add],[data-buy],[data-audio],[data-remove],[data-qty-minus],[data-qty-plus]"
    );
    if (!tEl) return;
    if (tEl.dataset.filter) {
      state.filter = tEl.dataset.filter;
      renderFilters();
      renderProducts();
    } else if (tEl.dataset.open) {
      openModal(tEl.dataset.open);
    } else if (tEl.dataset.add) {
      addToCart(tEl.dataset.add);
    } else if (tEl.dataset.buy) {
      buyNow(tEl.dataset.buy);
    } else if (tEl.dataset.audio) {
      toggleAudio(tEl, tEl.dataset.audio);
    } else if (tEl.dataset.remove) {
      removeFromCart(tEl.dataset.remove);
    } else if (tEl.dataset.qtyMinus) {
      const id = tEl.dataset.qtyMinus;
      const item = state.cart.find((i) => i.id === id);
      if (item) setQty(id, item.qty - 1);
    } else if (tEl.dataset.qtyPlus) {
      const id = tEl.dataset.qtyPlus;
      const item = state.cart.find((i) => i.id === id);
      if (item) setQty(id, item.qty + 1);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyStaticI18n();
    renderFilters();
    renderProducts();
    renderExtras();
    renderCart();
    renderAlbumPrice();
    setupNav();
    document.addEventListener("click", onClick);
    document.addEventListener("change", (e) => {
      const input = e.target.closest("[data-qty]");
      if (input) setQty(input.dataset.qty, Number(input.value) || 1);
    });
    $("#cart-open").addEventListener("click", openCart);
    $("#cart-close").addEventListener("click", closeCart);
    $("#cart-checkout").addEventListener("click", () => {
      closeCart();
      if (window.CEMECheckout) window.CEMECheckout.open();
    });
    $("#cart-checkout-wa")?.addEventListener("click", checkoutWhatsApp);
    $("#overlay").addEventListener("click", () => {
      closeCart();
      closeModal();
    });
    $("#modal-close").addEventListener("click", closeModal);
    $("#product-modal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCart();
        closeModal();
      }
    });
    const phone = $("#telefone");
    phone.addEventListener("input", () => {
      phone.value = maskPhone(phone.value);
    });
    $("#distribuidora-form").addEventListener("submit", handleForm);
    $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
  });

  window.CEMEShop = {
    t,
    money,
    getCart: () => state.cart.map((item) => ({ ...item })),
    cartTotal,
    addToCart,
    clearCart() {
      state.cart = [];
      saveCart();
    },
    closeCart,
    closeModal,
    getLang: () => state.lang,
  };
})();
