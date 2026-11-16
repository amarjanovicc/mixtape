// Anonimni korisnici po uređaju: bez prijave. Svaki uređaj dobije nasumičan ID (nije pogodiv),
// pamti se u localStorage i u kolačiću, a stanje (otvoreno, spremljeno, reakcije) sinkronizira
// se na server. Tako admin vidi što je ona napravila, a napredak preživi brisanje podataka preglednika.
import crypto from "node:crypto";
import { HttpError } from "./core.mjs";
import { readUser, removeUser, userIds, writeUser } from "./store.mjs";

export const UID = /^[a-f0-9]{32}$/;
const AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const MAX_USERS = 50;     // zaštita od punjenja pohrane
const MAX_KEYS = 500;

const isMap = (m) => m && typeof m === "object" && !Array.isArray(m);

function cleanMap(m, kind) {
  const out = {};
  if (!isMap(m)) return out;
  for (const k of Object.keys(m).slice(0, MAX_KEYS)) {
    if (!AT.test(k)) continue;
    const v = m[k];
    if (kind === "num") { if (Number.isFinite(Number(v)) && Number(v) > 0) out[k] = Math.round(Number(v)); }
    else if (typeof v === "string" || typeof v === "number") out[k] = String(v).slice(0, 24);
  }
  return out;
}

export function deviceName(ua) {
  const s = String(ua || "");
  if (/iPhone/.test(s)) return "iPhone";
  if (/iPad/.test(s)) return "iPad";
  if (/Android/.test(s)) return "Android";
  if (/Macintosh/.test(s)) return "Mac";
  if (/Windows/.test(s)) return "Windows";
  return "Uređaj";
}

const blank = (id, ua) => ({
  id, name: "", device: deviceName(ua), created: Date.now(), seen: Date.now(),
  opened: {}, collected: {}, reactions: {}, resets: {}, admin: {},
});

function dropSong(u, k) { delete u.opened[k]; delete u.collected[k]; delete u.reactions[k]; }

// Spaja stanje s uređaja u zapis na serveru. Vraća stanje koje uređaj treba prihvatiti.
export async function sync({ hint, cookie, body, ua }) {
  const want = UID.test(hint || "") ? hint : UID.test(cookie || "") ? cookie : null;
  let user = want ? await readUser(want) : null;
  if (!user) {
    if ((await userIds()).length >= MAX_USERS) throw new HttpError(429, "Previše uređaja.");
    user = blank(crypto.randomBytes(16).toString("hex"), ua);
  }
  const c = {
    opened: cleanMap(body?.opened, "num"), collected: cleanMap(body?.collected, "num"),
    reactions: cleanMap(body?.reactions), resets: cleanMap(body?.resets), ur: cleanMap(body?.ur),
  };
  // novi reset pjesme (iz admina): zaboravi što je server imao za tu pjesmu
  for (const k of Object.keys(c.resets)) {
    if ((user.resets[k] || "") !== c.resets[k]) { dropSong(user, k); user.resets[k] = c.resets[k]; }
  }
  for (const k of new Set([...Object.keys(c.opened), ...Object.keys(c.collected), ...Object.keys(c.reactions)])) {
    // admin je resetirao ovu pjesmu za ovaj uređaj, a uređaj to još nije primijenio: ignoriraj njegove podatke
    if (user.admin[k] && c.ur[k] !== user.admin[k]) continue;
    if (c.opened[k] && !(user.opened[k] <= c.opened[k])) user.opened[k] = c.opened[k];
    if (c.collected[k] && !(user.collected[k] <= c.collected[k])) user.collected[k] = c.collected[k];
    if (c.reactions[k]) user.reactions[k] = c.reactions[k];
  }
  user.seen = Date.now();
  user.device = deviceName(ua);
  await writeUser(user);
  return { uid: user.id, opened: user.opened, collected: user.collected, reactions: user.reactions, admin: user.admin };
}

// ---------- admin ----------

export async function listUsers() {
  const ids = await userIds();
  const all = await Promise.all(ids.map((id) => readUser(id).catch(() => null)));
  return all.filter(Boolean).sort((a, b) => b.seen - a.seen);
}

export async function adminAction(body) {
  const id = String(body?.id || "");
  if (!UID.test(id)) throw new HttpError(400, "Neispravan korisnik.");
  if (body.action === "delete") { await removeUser(id); return { ok: true }; }
  const user = await readUser(id);
  if (!user) throw new HttpError(404, "Nema tog korisnika.");
  if (body.action === "rename") user.name = String(body.name || "").trim().slice(0, 30);
  else if (body.action === "reset") {
    if (!AT.test(String(body.at || ""))) throw new HttpError(400, "Neispravna pjesma.");
    dropSong(user, body.at);
    user.admin[body.at] = String(Date.now());
  } else throw new HttpError(400, "Nepoznata radnja.");
  await writeUser(user);
  return { ok: true };
}
