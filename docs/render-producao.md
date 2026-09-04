# Produção no Render (loja + API + Postgres)

A loja inteira sobe **num serviço só**. O Express serve o HTML e a API. O Blueprint cria o **Postgres** `ceme-orders`. Sem esse banco o processo não sobe.

Daqui **não** dá para aplicar o Blueprint nem colar as chaves do Mercado Pago — isso é no painel, logado na conta do cliente. **Nunca cole token neste chat nem no GitHub.**

## 1. Hospedar (agora)

1. Conta no [Render](https://dashboard.render.com) (a do cliente / Família CEME).
2. **Blueprints → New Blueprint Instance** → repositório `CEME-7/SITE-CEME` → branch `main` → **Apply**.
3. O Render cria:
   - web service `ceme-checkout` (loja + API)
   - banco **PostgreSQL** `ceme-orders` (`DATABASE_URL` entra sozinho)
   - disco `/data` (cópia de segurança dos pedidos)
4. Espere o deploy ficar **Live**.
5. Abra `https://ceme-checkout.onrender.com/api/health` (ou a URL que o Render mostrar). Tem que vir:

```json
{
  "ok": true,
  "storage": "postgres",
  "durable": true,
  "database": true
}
```

`mode` pode ser `"demo"` nesta etapa — ainda **não** tem a chave do Mercado Pago. A loja abre, o catálogo funciona, o checkout **não cobra**.

Se o nome `ceme-checkout` já estiver em uso, anote a URL nova. No Render a loja e a API são o mesmo endereço: não precisa mudar `checkout-config.js`.

Painel do dono: `https://SEU-SERVICO.onrender.com/envios.html`. Defina `ADMIN_KEY` em **Environment** (uma senha nova, só da loja). Sem isso o painel responde `admin_not_configured`.

## 2. Conferir o banco

No Render: serviço `ceme-orders` (Postgres) tem que estar **Available**.

No web service → **Environment**:

| Variável | Quem preenche |
|---|---|
| `DATABASE_URL` | o Blueprint (não edite) |
| `REQUIRE_POSTGRES` | `true` (já vem no `render.yaml`) |

Se `/api/health` mostrar `"storage":"file"` ou `"ok":false`, o Blueprint não ligou o banco. Recrie pelo Blueprint — **não** suba só um Web Service avulso.

Pedidos ficam na tabela `orders` (`order_id` tipo `CEME-1`, payload JSON). O primeiro pedido aprovado no banco do cliente é `CEME-1`.

## 3. Ligar o Mercado Pago do cliente (depois)

Só depois do passo 1 estar Live e o health com Postgres.

1. Login na conta **Mercado Pago da Família CEME** (a que recebe o dinheiro).
2. [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) → app **Checkout Pro**.
3. **Credenciais de produção** (`APP_USR-`). Cadastre a URL do Render.
4. Webhook: `https://SEU-SERVICO.onrender.com/api/webhooks/mercadopago`  
   Eventos: pagamentos / merchant order. Guarde o **segredo**.
5. No Render → `ceme-checkout` → **Environment**, cole **só no painel**:

```
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=...
DEMO_PAYMENTS=false
MP_TEST_MODE=false
ADMIN_KEY=senha-nova-da-loja
```

6. **Save** e espere o redeploy.
7. `/api/health` agora tem que mostrar `"mode":"live"`, `"sandbox":false`, `"storage":"postgres"`.

Com token `TEST-` o modo vira `sandbox` (não cai dinheiro). Produção é só `APP_USR-`.

## 4. Opcional (avisos)

Sem Gmail / WhatsApp oficial o site **não dispara sozinho**. O painel abre o WhatsApp com o texto pronto.

```
GMAIL_USER=
GMAIL_APP_PASSWORD=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
STORE_ALERT_PHONE=
```

## 5. Compra de conferência

1. Abra a URL do Render.
2. Compre 1 item (preços reais do catálogo).
3. Pague no Checkout Pro da conta do cliente.
4. Pedido `CEME-1` em `envios.html` (senha `ADMIN_KEY`).
5. Cliente acompanha em `pedidos.html`.

## O que não fazer

- Não cole Access Token no GitHub, no `checkout-config.js` nem no chat.
- Não publique a pasta `server/private/` no GitHub Pages (faixas completas).
- Não apague o banco `ceme-orders` — some o histórico.
- Não use a conta Mercado Pago pessoal de teste para vender.
