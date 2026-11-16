// Popis uređaja i njihov napredak za sučelje za unos (traži prijavu).
import { adminAction, listUsers } from "../lib/users.mjs";
import { handler, readJson, requireAdmin, send } from "../lib/http.mjs";

export default handler(async (req, res) => {
  requireAdmin(req);
  if (req.method === "GET") return send(res, 200, { users: await listUsers() });
  if (req.method !== "POST") return send(res, 405, { error: "Nedopuštena metoda." });
  send(res, 200, await adminAction(await readJson(req)));
});
