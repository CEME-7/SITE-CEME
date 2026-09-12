import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  DIGITAL_PRODUCTS,
  canDownloadDigital,
  digitalDownloadsForOrder,
  publicDigitalDownloads,
  zipStore,
  buildDigitalZip,
} from "./digital.js";

const albumOrder = {
  status: "approved",
  items: [{ id: "musicas-neuroconectivas", name: "Álbum", qty: 1 }],
};

test("só o pedido pago com o álbum libera download", () => {
  assert.equal(canDownloadDigital(albumOrder, "musicas-neuroconectivas"), true);
  assert.equal(canDownloadDigital({ ...albumOrder, status: "pending" }, "musicas-neuroconectivas"), false);
  assert.equal(canDownloadDigital({ status: "approved", items: [{ id: "bioluz" }] }, "musicas-neuroconectivas"), false);
  assert.equal(canDownloadDigital(albumOrder, "outro"), false);
  assert.equal(digitalDownloadsForOrder(albumOrder)[0].id, "musicas-neuroconectivas");
  assert.deepEqual(publicDigitalDownloads({ ...albumOrder, status: "pending" }), []);
  assert.equal(publicDigitalDownloads(albumOrder)[0].filename, "declic-liberte-sua-expressao.zip");
});

test("monta um ZIP válido com as faixas do álbum", () => {
  const zip = zipStore([
    { name: "ola.txt", data: Buffer.from("familia-ceme") },
  ]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ceme-zip-"));
  const zipPath = path.join(dir, "t.zip");
  fs.writeFileSync(zipPath, zip);
  const listing = execFileSync("unzip", ["-l", zipPath], { encoding: "utf8" });
  assert.match(listing, /ola\.txt/);
  execFileSync("unzip", ["-o", zipPath, "-d", dir]);
  assert.equal(fs.readFileSync(path.join(dir, "ola.txt"), "utf8"), "familia-ceme");

  const album = buildDigitalZip("musicas-neuroconectivas");
  assert.ok(album);
  assert.equal(album.zipName, DIGITAL_PRODUCTS["musicas-neuroconectivas"].zipName);
  const albumZip = path.join(dir, album.zipName);
  fs.writeFileSync(albumZip, album.buffer);
  const albumList = execFileSync("unzip", ["-l", albumZip], { encoding: "utf8" });
  assert.match(albumList, /01-beleza-da-alma-voltou-a-cantar\.mp3/);
  assert.match(albumList, /05-declic\.mp3/);
  assert.match(albumList, /08-a-alma-canta\.mp3/);
  assert.match(albumList, /09-musica-tudo-cura\.mp3/);
  assert.equal(
    DIGITAL_PRODUCTS["musicas-neuroconectivas"].tracks.filter((track) =>
      albumList.includes(track.file)
    ).length,
    9
  );
  assert.equal(buildDigitalZip("nao-existe"), null);
});
