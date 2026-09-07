import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PRIVATE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "private/digital");

export const DIGITAL_PRODUCTS = {
  "musicas-neuroconectivas": {
    id: "musicas-neuroconectivas",
    title: "Déclic — Liberte sua Expressão",
    zipName: "declic-liberte-sua-expressao.zip",
    dir: "musicas-neuroconectivas",
    tracks: [
      { file: "01-fluxo-da-vida-fluir-dentro-de-mim.mp3", title: "Fluxo da Vida Fluir Dentro de Mim" },
      { file: "02-eu-me-perdoo.mp3", title: "Eu Me Perdoo" },
      { file: "03-expresse-sua-arte.mp3", title: "Expresse Sua Arte" },
      { file: "04-a-alma-canta.mp3", title: "A Alma Canta" },
      { file: "05-beleza-da-alma-voltou-a-cantar.mp3", title: "Beleza da Alma Voltou a Cantar" },
      { file: "06-a-musica-e-a-chave.mp3", title: "A Música É a Chave" },
      { file: "07-e-preciso-uniao.mp3", title: "É Preciso União" },
      { file: "08-declic.mp3", title: "Déclic" },
    ],
  },
};

export function isDigitalProductId(productId) {
  return Object.hasOwn(DIGITAL_PRODUCTS, String(productId || ""));
}

export function digitalDownloadsForOrder(order) {
  const ids = new Set((order?.items || []).map((item) => String(item.id || "")));
  return Object.values(DIGITAL_PRODUCTS).filter((product) => ids.has(product.id));
}

function orderIsApproved(order) {
  return String(order?.status || "").toLowerCase() === "approved";
}

export function canDownloadDigital(order, productId) {
  if (!orderIsApproved(order)) return false;
  const id = String(productId || "");
  if (!isDigitalProductId(id)) return false;
  return digitalDownloadsForOrder(order).some((product) => product.id === id);
}

export function publicDigitalDownloads(order) {
  if (!orderIsApproved(order)) return [];
  return digitalDownloadsForOrder(order).map((product) => ({
    id: product.id,
    name: product.title,
    filename: product.zipName,
  }));
}

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function u16(n) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(n);
  return buf;
}

function u32(n) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(n);
  return buf;
}

export function zipStore(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(String(file.name || ""), "utf8");
    const data = Buffer.from(file.data || []);
    const crc = crc32(data);
    const local = Buffer.concat([
      Buffer.from("PK\u0003\u0004"),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    const central = Buffer.concat([
      Buffer.from("PK\u0001\u0002"),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const central = Buffer.concat(centrals);
  const end = Buffer.concat([
    Buffer.from("PK\u0005\u0006"),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);
  return Buffer.concat([...locals, central, end]);
}

function assertInsideRoot(filePath) {
  const resolved = path.resolve(filePath);
  const root = PRIVATE_ROOT.endsWith(path.sep) ? PRIVATE_ROOT : `${PRIVATE_ROOT}${path.sep}`;
  if (resolved !== PRIVATE_ROOT && !resolved.startsWith(root)) {
    const error = new Error("not_found");
    error.code = "not_found";
    throw error;
  }
  return resolved;
}

export function buildDigitalZip(productId, { root = PRIVATE_ROOT } = {}) {
  const product = DIGITAL_PRODUCTS[String(productId || "")];
  if (!product) return null;
  const files = product.tracks.map((track) => {
    const full = assertInsideRoot(path.join(root, product.dir, track.file));
    return { name: track.file, data: fs.readFileSync(full) };
  });
  return { zipName: product.zipName, buffer: zipStore(files) };
}
