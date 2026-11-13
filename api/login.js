// Prijava u sučelje za unos: lozinka je u Vercelu (ADMIN_PASSWORD), a ne u kodu.
import { HttpError } from "../lib/core.mjs";
import { authConfigured, handler, isAuthed, loginCookie, logoutCookie, passwordOk, readJson, send } from "../lib/http.mjs";

export default handler(async (req, res) => {
  if (req.method === "GET") return send(res, 200, { configured: authConfigured(), authed: isAuthed(req) });
  if (req.headers["x-mixtape"] !== "1") throw new HttpError(403, "Nedostaje zaglavlje.");
  if (req.method === "DELETE") return send(res, 200, { authed: false }, { "Set-Cookie": logoutCookie() });
  if (req.method !== "POST") return send(res, 405, { error: "Nedopuštena metoda." });
  if (!authConfigured()) throw new HttpError(503, "Lozinka još nije postavljena u Vercelu (ADMIN_PASSWORD).");
  const body = await readJson(req);
  if (!passwordOk(body?.password)) {
    await new Promise((r) => setTimeout(r, 800));   // uspori pogađanje
    throw new HttpError(401, "Kriva lozinka.");
  }
  send(res, 200, { authed: true }, { "Set-Cookie": loginCookie() });
});
