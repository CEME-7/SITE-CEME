# Passar a loja para o dono

O código já está neste repositório. A **produção é o Render**: loja, API e **Postgres** no mesmo Blueprint. O Mercado Pago do cliente entra **depois**, só no painel.

Daqui **não** dá para criar a conta Render ou Mercado Pago dele. Marca da CEME (WhatsApp, endereço, YouTube, `familiaceme.com.br`) **já está no site**. Não mexe.

Passo a passo completo: **`docs/render-producao.md`**.

## O que vocês NÃO copiam da conta de teste

- Access Token / Public Key (`TEST-` ou `APP_USR-`)
- `DATABASE_URL`
- senha de app do Gmail
- senha `ADMIN_KEY` de teste

Cada um desses nasce **na conta dele**.

## 1. GitHub (conta dele)

Repositório: `CEME-7/SITE-CEME`, branch `main`.

O Render clona este repo. GitHub Pages é **opcional** (só o HTML). As faixas completas do álbum **não** vão para o Pages — o download sai pela API no Render.

## 2. Render primeiro (site + banco)

1. [Blueprints](https://dashboard.render.com/blueprints) → **New Blueprint Instance** → este repositório → **Apply**.
2. Isso cria o site `ceme-checkout` (HTML + API), o **Postgres** `ceme-orders` e um disco. O `DATABASE_URL` entra sozinho.
3. Confira `https://ceme-checkout.onrender.com/api/health`:
   - `"storage":"postgres"`
   - `"durable":true`
   - `"database":true`
4. Sem esse passo, pedido, rastreio e gráfico **somem** no restart — e com `REQUIRE_POSTGRES=true` o serviço **nem sobe**.

Se o nome `ceme-checkout` já estiver usado, anote a URL nova. A loja e a API são o **mesmo** endereço: não precisa editar `checkout-config.js`.

## 3. Mercado Pago (conta dele, a que recebe o dinheiro)

Só depois do Render estar Live com Postgres.

1. Login na conta **Família CEME**.
2. [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) → app **Checkout Pro**.
3. **Credenciais de produção** (`APP_USR-`). Cadastre a URL do Render.
4. Webhook: `https://ceme-checkout.onrender.com/api/webhooks/mercadopago` (ou a URL nova).
5. No Render → **Environment**, ele cola **só no painel**:

```
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=...
DEMO_PAYMENTS=false
MP_TEST_MODE=false
ADMIN_KEY=uma-senha-nova-só-da-loja
```

`PUBLIC_SITE_URL` e `ALLOWED_ORIGINS` podem ficar vazios enquanto a loja mora no Render (mesmo origin). Só preencha se o HTML ficar no GitHub Pages.

Sem Gmail e sem API da Meta, o site **não dispara sozinho** no celular. Aí o painel abre o WhatsApp com o texto pronto.

## 4. Conferir

`/api/health` tem que mostrar:

- `"storage":"postgres"`
- `"durable":true`
- `"database":true`
- `"sandbox":false`
- `"mode":"live"`

Uma compra na conta **dele**: o pedido vira `CEME-1` em `envios.html` com a senha `ADMIN_KEY` nova.

Pronto: as contas dele hospedam, guardam o histórico no Postgres e cobram.
