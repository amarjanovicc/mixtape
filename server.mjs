#!/usr/bin/env node
// Backend za Mixtape: sučelje za unos pjesama + lokalni pregled stranice.
//
//   node server.mjs        ->  http://localhost:4321        (stranica)
//                             http://localhost:4321/admin  (unos pjesama)
//
// Bez ovisnosti. Sluša samo na 127.0.0.1 — sučelje nije zaštićeno lozinkom,
// pa ga ne izlaži na internet. Sprema u data/songs.js i public/audio/.
import http from "node:http";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { AUDIO_EXT, DEFAULT_CONFIG, HttpError, bad, cleanData, dataToJs, lookup, publicData } from "./lib/core.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");
const ADMIN = path.join(PUBLIC, "admin");
const SONGS = path.join(ROOT, "data", "songs.js");
const AUDIO = path.join(PUBLIC, "audio");
const PORT = Number(process.env.PORT) || 4321;
const MAX_AUDIO = 25 * 1024 * 1024;

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".webmanifest": "application/manifest+json", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".wav": "audio/wav",
};

const HEADER = `/*
 * Mixtape — sadržaj
 *
 * Ovu datoteku piše sučelje za unos (node server.mjs -> http://localhost:4321/admin).
 * Možeš je uređivati i ručno; polja su opisana u README.md.
 * Nakon ručne promjene pokreni:  node scripts/check-songs.mjs
 */
`;


// ---------- songs.js ----------

async function readData() {
  let data = {};
  try {
    const sandbox = { window: {} };
    vm.runInNewContext(await fs.readFile(SONGS, "utf8"), sandbox, { filename: "songs.js" });
    data = sandbox.window.DAILY_SONG || {};
  } catch (err) {
    if (err.code !== "ENOENT") throw new HttpError(500, "data/songs.js se ne može pročitati: " + err.message);
  }
  return {
    config: { ...DEFAULT_CONFIG, ...(data.config || {}) },
    songs: Array.isArray(data.songs) ? data.songs : [],
  };
}


async function writeData(data) {
  const before = await readData();
  await fs.writeFile(SONGS, `${HEADER}window.DAILY_SONG = ${JSON.stringify(data, null, 2)};\n`);
  // ukloni zvukove koje više nijedna pjesma ne koristi (samo one koje je prije koristila)
  const used = new Set(data.songs.map((s) => s.audio).filter(Boolean));
  for (const s of before.songs) {
    if (s.audio && !used.has(s.audio) && /^audio\/[A-Za-z0-9._-]+$/.test(s.audio)) {
      await fs.rm(path.join(PUBLIC, s.audio), { force: true });
    }
  }
}


// ---------- audio upload ----------

async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, "Datoteka je prevelika.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function saveAudio(req, name) {
  const ext = path.extname(String(name || "")).toLowerCase();
  if (!AUDIO_EXT.has(ext)) throw bad("Podržani formati: mp3, m4a, ogg, wav.");
  const body = await readBody(req, MAX_AUDIO);
  if (!body.length) throw bad("Datoteka je prazna.");
  const base = path.basename(String(name), ext).normalize("NFKD").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).toLowerCase() || "zvuk";
  const file = `${base}-${crypto.randomBytes(3).toString("hex")}${ext}`;
  await fs.mkdir(AUDIO, { recursive: true });
  await fs.writeFile(path.join(AUDIO, file), body);
  return { audio: `audio/${file}`, size: body.length };
}

// ---------- publish (provjera + git) ----------

const run = (cmd, args) => new Promise((resolve) => {
  execFile(cmd, args, { cwd: ROOT, timeout: 60000 }, (err, stdout, stderr) => {
    resolve({ ok: !err, out: `${stdout}${stderr}`.trim() });
  });
});

async function gitStatus() {
  const repo = await run("git", ["rev-parse", "--is-inside-work-tree"]);
  if (!repo.ok) return { repo: false, dirty: false, remote: false };
  const dirty = await run("git", ["status", "--porcelain", "--", "public", "data"]);
  const remote = await run("git", ["remote"]);
  return { repo: true, dirty: Boolean(dirty.out), remote: Boolean(remote.out) };
}

async function publish() {
  const log = [];
  const check = await run(process.execPath, [path.join(ROOT, "scripts", "check-songs.mjs")]);
  log.push(check.out);
  if (!check.ok) return { ok: false, log: log.join("\n\n") };

  const st = await gitStatus();
  if (!st.repo) return { ok: false, log: log.concat("Ovaj folder nije git repozitorij.").join("\n\n") };
  if (st.dirty) {
    await run("git", ["add", "--", "public", "data"]);
    const c = await run("git", ["commit", "-m", `Pjesme: ažurirano ${new Date().toISOString().slice(0, 16).replace("T", " ")}`]);
    log.push(c.out);
    if (!c.ok) return { ok: false, log: log.join("\n\n") };
  } else {
    log.push("Nema novih promjena za commit.");
  }
  if (!st.remote) {
    log.push("Spremljeno u git. Nema udaljenog repozitorija (git remote), pa ništa nije poslano na internet.");
    return { ok: true, pushed: false, log: log.join("\n\n") };
  }
  const p = await run("git", ["push"]);
  log.push(p.out || "git push: gotovo");
  return { ok: p.ok, pushed: p.ok, log: log.join("\n\n") };
}

// ---------- http ----------

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function serveFile(req, res, baseDir, relPath) {
  const file = path.resolve(baseDir, "." + path.posix.normalize("/" + relPath));
  if (file !== baseDir && !file.startsWith(baseDir + path.sep)) throw new HttpError(403, "Zabranjeno.");
  let stat;
  try { stat = await fs.stat(file); } catch { throw new HttpError(404, "Nema te stranice."); }
  if (stat.isDirectory()) return serveFile(req, res, baseDir, path.posix.join(relPath, "index.html"));

  const headers = {
    "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
    "Accept-Ranges": "bytes",
  };
  // Range: potreban da se zvuk može premotavati
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, stat.size - 1);
    if (start > end) { res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }); return res.end(); }
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
    if (req.method === "HEAD") return res.end();
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, "Content-Length": stat.size });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}

async function handle(req, res) {
  // samo lokalni pristup: štiti od DNS rebindinga i tuđih stranica koje bi gađale localhost
  const host = String(req.headers.host || "").replace(/:\d+$/, "");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) throw new HttpError(403, "Samo lokalni pristup.");

  const url = new URL(req.url, "http://localhost");
  const p = decodeURIComponent(url.pathname);

  if (p.startsWith("/api/")) {
    if (req.method !== "GET" && req.headers["x-mixtape"] !== "1") throw new HttpError(403, "Nedostaje zaglavlje.");
    if (p === "/api/login" && req.method === "GET") return json(res, 200, { configured: true, authed: true, local: true });
    if (p === "/api/data" && req.method === "GET") return json(res, 200, { ...(await readData()), git: await gitStatus() });
    if (p === "/api/data" && req.method === "PUT") {
      const data = cleanData(JSON.parse((await readBody(req, 2 * 1024 * 1024)).toString("utf8") || "null"));
      await writeData(data);
      return json(res, 200, { ...data, git: await gitStatus() });
    }
    if (p === "/api/lookup" && req.method === "POST") {
      const body = JSON.parse((await readBody(req, 4096)).toString("utf8") || "{}");
      return json(res, 200, await lookup(body.url));
    }
    if (p === "/api/audio" && req.method === "PUT") return json(res, 200, await saveAudio(req, url.searchParams.get("name")));
    if (p === "/api/publish" && req.method === "POST") return json(res, 200, { ...(await publish()), git: await gitStatus() });
    throw new HttpError(404, "Nepoznata ruta.");
  }

  if (req.method !== "GET" && req.method !== "HEAD") throw new HttpError(405, "Nedopuštena metoda.");
  if (p === "/songs.js") return serveFile(req, res, path.dirname(SONGS), "songs.js");   // lokalno: cijeli sadržaj
  if (p === "/admin") { res.writeHead(302, { Location: "/admin/" }); return res.end(); }
  if (p.startsWith("/admin/")) return serveFile(req, res, ADMIN, p.slice("/admin".length));
  return serveFile(req, res, PUBLIC, p);
}

http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    const status = err.status || (err instanceof SyntaxError ? 400 : 500);
    if (status >= 500) console.error(err);
    if (!res.headersSent) json(res, status, { error: err instanceof SyntaxError ? "Neispravan JSON." : err.message });
    else res.end();
  });
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Mixtape radi:\n  stranica  http://localhost:${PORT}\n  unos      http://localhost:${PORT}/admin`);
});
