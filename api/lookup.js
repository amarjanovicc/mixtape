import { lookup } from "../lib/core.mjs";
import { handler, readJson, requireAdmin, send } from "../lib/http.mjs";

export default handler(async (req, res) => {
  requireAdmin(req);
  if (req.method !== "POST") return send(res, 405, { error: "Nedopuštena metoda." });
  const body = await readJson(req);
  send(res, 200, await lookup(body?.url));
});
