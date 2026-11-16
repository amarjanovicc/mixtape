// Javno (bez prijave): njen uređaj šalje svoje stanje i dobiva spojeno. Identitet je nasumičan ID uređaja.
import { HttpError } from "../lib/core.mjs";
import { sync } from "../lib/users.mjs";
import { handler, readBody, send } from "../lib/http.mjs";

export const COOKIE = "mx_uid";
export function uidFromCookie(req) {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{32})`).exec(req.headers.cookie || "");
  return m ? m[1] : "";
}

export default handler(async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Nedopuštena metoda." });
  if (req.headers["x-mixtape"] !== "1") throw new HttpError(403, "Nedostaje zaglavlje.");
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) throw new HttpError(403, "Krivi izvor zahtjeva.");
  const body = JSON.parse((await readBody(req, 32 * 1024)).toString("utf8") || "{}");
  const out = await sync({ hint: body?.uid, cookie: uidFromCookie(req), body, ua: req.headers["user-agent"] });
  send(res, 200, out, { "Set-Cookie": `${COOKIE}=${out.uid}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=63072000` });
});
