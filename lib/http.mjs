// Pomoćne funkcije za Vercel funkcije: odgovori, zaštita, čitanje tijela.
import crypto from "node:crypto";
import { HttpError } from "./core.mjs";

const COOKIE = "mx_admin";
const MAX_AGE = 30 * 24 * 3600;

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (typeof body === "string") res.end(body);
  else { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(body)); }
}

export function handler(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (err) {
      const status = err.status || (err instanceof SyntaxError ? 400 : 500);
      if (status >= 500) console.error(err);
      send(res, status, { error: err instanceof SyntaxError ? "Neispravan JSON." : status >= 500 && !err.status ? "Greška na serveru." : err.message });
    }
  };
}

// ---------- prijava ----------

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();
const key = () => sha("mixtape:" + process.env.ADMIN_PASSWORD);
const sign = (exp) => crypto.createHmac("sha256", key()).update(String(exp)).digest("hex");
export const authConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

export function passwordOk(input) {
  return authConfigured() && crypto.timingSafeEqual(sha(input ?? ""), sha(process.env.ADMIN_PASSWORD));
}
export function loginCookie() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return `${COOKIE}=${exp}.${sign(exp)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`;
}
export const logoutCookie = () => `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;

export function isAuthed(req) {
  if (!authConfigured()) return false;
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([0-9a-f]{64})`).exec(req.headers.cookie || "");
  if (!m || Number(m[1]) < Date.now() / 1000) return false;
  const good = Buffer.from(sign(m[1]), "hex");
  return crypto.timingSafeEqual(good, Buffer.from(m[2], "hex"));
}

// Sve što dira podatke traži prijavu; promjene još i zaglavlje i isti izvor (zaštita od CSRF-a).
export function requireAdmin(req) {
  if (!authConfigured()) throw new HttpError(503, "ADMIN_PASSWORD nije postavljen u Vercelu (Settings, Environment Variables).");
  if (!isAuthed(req)) throw new HttpError(401, "Prijava je potrebna.");
  if (req.method !== "GET") {
    if (req.headers["x-mixtape"] !== "1") throw new HttpError(403, "Nedostaje zaglavlje.");
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) throw new HttpError(403, "Krivi izvor zahtjeva.");
  }
}

// ---------- tijelo zahtjeva ----------

export async function readBody(req, limit) {
  let body = req.body;                         // Vercel ga raščlani prvi put kad ga zatražimo
  if (Buffer.isBuffer(body)) { /* ok */ }
  else if (typeof body === "string") body = Buffer.from(body);
  else if (body && typeof body === "object") body = Buffer.from(JSON.stringify(body));
  else {
    const chunks = [];
    let size = 0;
    for await (const c of req) {
      size += c.length;
      if (size > limit) throw new HttpError(413, "Datoteka je prevelika.");
      chunks.push(c);
    }
    body = Buffer.concat(chunks);
  }
  if (body.length > limit) throw new HttpError(413, "Datoteka je prevelika.");
  return body;
}
export async function readJson(req) {
  const b = await readBody(req, 2 * 1024 * 1024);
  return JSON.parse(b.toString("utf8") || "null");
}
