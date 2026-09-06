# /review-security

Revisa o SITE-CEME atrás das cinco falhas do vídeo *USED VIBE CODING? YOU'RE AT RISK* (Mano Deyvin):

1. Banco sem tranca (front falando com DB / RLS off)
2. Permissão decidida no navegador
3. Rota entregando pedido só pelo ID sequencial (IDOR)
4. Chave de pagamento no front/Git
5. Inputs sem tratamento (XSS)

Rode `node scripts/security-scan.mjs` e `npm test` em `server/`. HIGH se faltar `canAccessPublicOrder`. Liste arquivo e linha; depois corrija. Não confiar no navegador.
