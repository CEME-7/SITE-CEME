(function () {
  // URL da API na internet (Render da conta CEME).
  const RENDER_API_URL = "https://ceme-checkout-4pgd.onrender.com";

  const host = typeof location !== "undefined" ? location.hostname : "";
  const port = typeof location !== "undefined" ? location.port : "";
  const local = host === "localhost" || host === "127.0.0.1";
  const hostedHere =
    host.endsWith(".onrender.com") ||
    host === "familiaceme.com.br" ||
    host.endsWith(".familiaceme.com.br");
  const staticPreview = port === "8080";
  window.CEME_CHECKOUT = {
    apiUrl: local
      ? staticPreview
        ? `${location.protocol}//${host}:3001`
        : location.origin
      : hostedHere
        ? location.origin
        : RENDER_API_URL,
    mpPublicKey: "",
    maxInstallments: 3,
    freeShippingFrom: 360,
  };
})();
