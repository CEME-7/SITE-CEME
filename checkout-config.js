(function () {
  // Fallback só quando o HTML está no GitHub Pages.
  // No Render a loja e a API são o mesmo origin — não precisa desta URL.
  const RENDER_API_URL = "https://ceme-checkout.onrender.com";

  const host = typeof location !== "undefined" ? location.hostname : "";
  const port = typeof location !== "undefined" ? location.port : "";
  const protocol = typeof location !== "undefined" ? location.protocol : "https:";
  const origin = typeof location !== "undefined" ? location.origin : "";
  const local = host === "localhost" || host === "127.0.0.1";
  const onPages = /\.github\.io$/i.test(host);
  const staticPreview = port === "8080";

  function resolveApiUrl() {
    if (local) {
      return staticPreview ? `${protocol}//${host}:3001` : origin;
    }
    if (onPages) return RENDER_API_URL;
    return origin || RENDER_API_URL;
  }

  window.CEME_CHECKOUT = {
    apiUrl: resolveApiUrl(),
    mpPublicKey: "",
    maxInstallments: 3,
    freeShippingFrom: 360,
  };
})();
