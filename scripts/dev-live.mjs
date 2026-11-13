#!/usr/bin/env node
// Lokalno pokreće ISTE funkcije kao Vercel (api/), uz lozinku i probnu pohranu u datoteku,
// da se živi tok (prijava, spremanje, /songs.js, reset) može isprobati bez objave.
//   node scripts/dev-live.mjs      ->  http://localhost:4330   (lozinka: lokalna-lozinka)
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.ADMIN_PASSWORD ||= "lokalna-lozinka";
const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 4330;
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webmanifest": "application/manifest+json" };

async function run(name, req, res) {
  const mod = await import(pathToFileURL(path.join(ROOT, "api", name + ".js")).href);
  await mod.default(req, res);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const p = decodeURIComponent(url.pathname);
    if (p === "/songs.js") return await run("songs", req, res);
    if (p.startsWith("/media/")) { req.url = `/api/media?f=${encodeURIComponent(p.slice(7))}`; return await run("media", req, res); }
    const m = /^\/api\/([a-z]+)$/.exec(p);
    if (m) return await run(m[1], req, res);
    let rel = p === "/admin" ? "/admin/index.html" : p.endsWith("/") ? p + "index.html" : p;
    const file = path.join(ROOT, "public", path.normalize(rel));
    if (!file.startsWith(path.join(ROOT, "public"))) { res.statusCode = 403; return res.end(); }
    const data = await fs.readFile(file);
    res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    res.end(data);
  } catch (err) {
    res.statusCode = err.code === "ENOENT" ? 404 : 500;
    res.end(err.code === "ENOENT" ? "Nema." : "Greška.");
    if (res.statusCode === 500) console.error(err);
  }
}).listen(PORT, "127.0.0.1", () => console.log(`Živi tok lokalno: http://localhost:${PORT}  (admin: /admin, lozinka: ${process.env.ADMIN_PASSWORD})`));
