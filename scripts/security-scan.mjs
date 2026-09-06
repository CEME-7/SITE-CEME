#!/usr/bin/env node
/**
 * Scanner estático das cinco falhas do vídeo (Mano Deyvin / vibe coding).
 * HIGH se faltar canAccessPublicOrder ou se token de pagamento aparecer no front.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const findings = [];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const lib = read("server/lib.js");
const index = read("server/index.js");
const yaml = read("render.yaml");
const config = read("checkout-config.js");

if (!/export function canAccessPublicOrder\s*\(/.test(lib)) {
  findings.push({
    severity: "HIGH",
    file: "server/lib.js",
    msg: "falta canAccessPublicOrder — IDOR de pedido sequencial",
  });
}
if (!/export function trackingPageUrl\s*\(/.test(lib)) {
  findings.push({
    severity: "HIGH",
    file: "server/lib.js",
    msg: "falta trackingPageUrl com chave pública",
  });
}
if (!/canAccessPublicOrder\(/.test(index)) {
  findings.push({
    severity: "HIGH",
    file: "server/index.js",
    msg: "rastreio/download não chamam canAccessPublicOrder",
  });
}
if (!/MODE === "live"/.test(index) || !/invalid_signature/.test(index)) {
  findings.push({
    severity: "HIGH",
    file: "server/index.js",
    msg: "webhook live sem assinatura não está fechado",
  });
}
if (!/ipAllowList:\s*\[\]/.test(yaml)) {
  findings.push({
    severity: "HIGH",
    file: "render.yaml",
    msg: "Postgres precisa de ipAllowList vazio (só o Render)",
  });
}
if (/createClient\(|firebase|supabase/i.test(config)) {
  findings.push({
    severity: "HIGH",
    file: "checkout-config.js",
    msg: "front não pode falar com banco",
  });
}

const front = walk(ROOT).filter((file) => {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel.startsWith("server/")) return false;
  return /\.(js|html|json)$/.test(rel) && !rel.startsWith("docs/");
});

for (const file of front) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const text = fs.readFileSync(file, "utf8");
  if (/APP_USR-|MP_ACCESS_TOKEN\s*=\s*["'](?!["'])/.test(text)) {
    findings.push({ severity: "HIGH", file: rel, msg: "chave de pagamento no front/Git" });
  }
  if (/localStorage\.admin\s*=/.test(text) || (/admin\s*=\s*true/.test(text) && /localStorage/.test(text))) {
    findings.push({ severity: "HIGH", file: rel, msg: "permissão de admin decidida no navegador" });
  }
}

const high = findings.filter((item) => item.severity === "HIGH");
if (high.length) {
  for (const item of high) {
    console.error(`[HIGH] ${item.file}: ${item.msg}`);
  }
  process.exit(1);
}

console.log("security-scan: ok (canAccessPublicOrder, webhook live, sem token no front)");
