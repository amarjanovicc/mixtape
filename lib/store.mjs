// Pohrana podataka za objavljenu stranicu.
//  - na Vercelu: PRIVATNI Vercel Blob (ništa nije javno; čita se samo kroz naše funkcije)
//  - lokalno (bez Bloba): datoteka data/.live-dev.json, samo za isprobavanje
// Početni sadržaj (dok ništa nije spremljeno) je data/songs.js.
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { DEFAULT_CONFIG, HttpError } from "./core.mjs";

const ROOT = process.cwd();
const DEV_FILE = path.join(ROOT, "data", ".live-dev.json");
const DATA_PATH = "mixtape/data.json";
const AUDIO_DIR = "mixtape/audio/";
const AUDIO_NAME = /^[A-Za-z0-9._-]{1,80}$/;

export function storeKind() {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) return "blob";
  return process.env.VERCEL ? "missing" : "file";
}
const blob = () => import("@vercel/blob");
function need() {
  if (storeKind() === "missing") throw new HttpError(503, "Pohrana nije povezana: u Vercelu dodaj Blob store ovom projektu (Storage).");
}

export async function seed() {
  try {
    const sandbox = { window: {} };
    vm.runInNewContext(await fs.readFile(path.join(ROOT, "data", "songs.js"), "utf8"), sandbox);
    return norm(sandbox.window.DAILY_SONG || {});
  } catch {
    return norm({});
  }
}
const norm = (d) => ({ config: { ...DEFAULT_CONFIG, ...(d.config || {}) }, songs: Array.isArray(d.songs) ? d.songs : [] });

async function readAll(stream) {
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

export async function readData() {
  need();
  if (storeKind() === "file") {
    try { return norm(JSON.parse(await fs.readFile(DEV_FILE, "utf8"))); } catch { return seed(); }
  }
  const { get } = await blob();
  const r = await get(DATA_PATH, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) return seed();
  return norm(JSON.parse((await readAll(r.stream)).toString("utf8")));
}

export async function writeData(data) {
  need();
  if (storeKind() === "file") {
    await fs.writeFile(DEV_FILE, JSON.stringify(data, null, 2));
    return;
  }
  const { put } = await blob();
  await put(DATA_PATH, JSON.stringify(data), {
    access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60,
  });
}

// Zvuk se sprema privatno, a njena stranica ga dobiva s /media/<ime> (api/media.js).
export async function putAudio(name, buffer, contentType) {
  need();
  if (!AUDIO_NAME.test(name)) throw new HttpError(400, "Neispravno ime datoteke.");
  if (storeKind() === "file") {
    await fs.mkdir(path.join(ROOT, "public", "audio"), { recursive: true });
    await fs.writeFile(path.join(ROOT, "public", "audio", name), buffer);
    return `audio/${name}`;
  }
  const { put } = await blob();
  await put(AUDIO_DIR + name, buffer, { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType });
  return `media/${name}`;
}

export async function getAudio(name) {
  need();
  if (!AUDIO_NAME.test(name)) return null;
  if (storeKind() === "file") {
    try { return { data: await fs.readFile(path.join(ROOT, "public", "audio", name)), type: "application/octet-stream" }; } catch { return null; }
  }
  const { get } = await blob();
  const r = await get(AUDIO_DIR + name, { access: "private" });
  if (!r || r.statusCode !== 200) return null;
  return { data: await readAll(r.stream), type: r.blob.contentType || "audio/mpeg" };
}

export async function deleteAudio(refs) {
  const names = refs.map((r) => /^media\/([A-Za-z0-9._-]+)$/.exec(r)?.[1]).filter(Boolean);
  if (names.length && storeKind() === "blob") {
    const { del } = await blob();
    await del(names.map((n) => AUDIO_DIR + n));
  }
}

// ---------- korisnici (anonimni uređaji) ----------
// Svaki uređaj je jedna datoteka: mixtape/users/<id>.json (privatno). Lokalno: data/.live-users/.
const USER_DIR = "mixtape/users/";
const USER_ID = /^[a-f0-9]{32}$/;
const DEV_USERS = path.join(ROOT, "data", ".live-users");

export async function readUser(id) {
  need();
  if (!USER_ID.test(id)) return null;
  if (storeKind() === "file") {
    try { return JSON.parse(await fs.readFile(path.join(DEV_USERS, id + ".json"), "utf8")); } catch { return null; }
  }
  const { get } = await blob();
  const r = await get(`${USER_DIR}${id}.json`, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse((await readAll(r.stream)).toString("utf8"));
}

export async function writeUser(user) {
  need();
  if (!USER_ID.test(user.id)) throw new HttpError(400, "Neispravan korisnik.");
  if (storeKind() === "file") {
    await fs.mkdir(DEV_USERS, { recursive: true });
    await fs.writeFile(path.join(DEV_USERS, user.id + ".json"), JSON.stringify(user));
    return;
  }
  const { put } = await blob();
  await put(`${USER_DIR}${user.id}.json`, JSON.stringify(user), {
    access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60,
  });
}

export async function userIds() {
  need();
  if (storeKind() === "file") {
    try { return (await fs.readdir(DEV_USERS)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).filter((i) => USER_ID.test(i)); } catch { return []; }
  }
  const { list } = await blob();
  const out = await list({ prefix: USER_DIR, limit: 200 });
  return out.blobs.map((b) => b.pathname.slice(USER_DIR.length, -5)).filter((i) => USER_ID.test(i));
}

export async function removeUser(id) {
  need();
  if (!USER_ID.test(id)) return;
  if (storeKind() === "file") { await fs.rm(path.join(DEV_USERS, id + ".json"), { force: true }); return; }
  const { del } = await blob();
  await del(`${USER_DIR}${id}.json`);
}
