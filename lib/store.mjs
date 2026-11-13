// Pohrana podataka za objavljenu stranicu.
//  - na Vercelu: Vercel Blob (BLOB_READ_WRITE_TOKEN dolazi kad se Blob poveže s projektom)
//  - lokalno (bez tokena): datoteka data/.live-dev.json, samo za isprobavanje
// Početni sadržaj (dok ništa nije spremljeno) je data/songs.js.
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { DEFAULT_CONFIG, HttpError } from "./core.mjs";

const ROOT = process.cwd();
const DEV_FILE = path.join(ROOT, "data", ".live-dev.json");

export function storeKind() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
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
    const d = sandbox.window.DAILY_SONG || {};
    return { config: { ...DEFAULT_CONFIG, ...(d.config || {}) }, songs: Array.isArray(d.songs) ? d.songs : [] };
  } catch {
    return { config: { ...DEFAULT_CONFIG }, songs: [] };
  }
}

async function newestBlob(list) {
  const r = await list({ prefix: "mixtape/data-" });
  return (r.blobs || []).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export async function readData() {
  need();
  if (storeKind() === "file") {
    try { return JSON.parse(await fs.readFile(DEV_FILE, "utf8")); } catch { return seed(); }
  }
  const { list } = await blob();
  const all = await newestBlob(list);
  if (!all.length) return seed();
  const res = await fetch(all[0].url, { cache: "no-store" });
  if (!res.ok) throw new HttpError(502, "Podaci se ne mogu pročitati iz pohrane.");
  const d = await res.json();
  return { config: { ...DEFAULT_CONFIG, ...(d.config || {}) }, songs: Array.isArray(d.songs) ? d.songs : [] };
}

export async function writeData(data) {
  need();
  if (storeKind() === "file") {
    await fs.writeFile(DEV_FILE, JSON.stringify(data, null, 2));
    return;
  }
  const { put, list, del } = await blob();
  const saved = await put(`mixtape/data-${Date.now()}.json`, JSON.stringify(data), {
    access: "public", addRandomSuffix: true, contentType: "application/json",
  });
  // ostavi samo najnoviju verziju
  const old = (await newestBlob(list)).filter((b) => b.url !== saved.url).map((b) => b.url);
  if (old.length) await del(old);
}

export async function putAudio(name, buffer, contentType) {
  need();
  if (storeKind() === "file") {
    await fs.mkdir(path.join(ROOT, "public", "audio"), { recursive: true });
    await fs.writeFile(path.join(ROOT, "public", "audio", name), buffer);
    return `audio/${name}`;
  }
  const { put } = await blob();
  const saved = await put(`mixtape/audio/${name}`, buffer, { access: "public", addRandomSuffix: true, contentType });
  return saved.url;
}

export async function deleteAudio(refs) {
  const urls = refs.filter((r) => /^https:\/\//.test(r));
  if (urls.length && storeKind() === "blob") {
    const { del } = await blob();
    await del(urls);
  }
}
