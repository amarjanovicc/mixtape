// Sadržaj za sučelje za unos: čitanje i spremanje (odmah je live).
import { cleanData } from "../lib/core.mjs";
import { deleteAudio, readData, writeData } from "../lib/store.mjs";
import { handler, readJson, requireAdmin, send } from "../lib/http.mjs";

export default handler(async (req, res) => {
  requireAdmin(req);
  if (req.method === "GET") return send(res, 200, { ...(await readData()), live: true });
  if (req.method !== "PUT") return send(res, 405, { error: "Nedopuštena metoda." });
  const before = await readData();
  const data = cleanData(await readJson(req));
  await writeData(data);
  // makni zvukove koje više nijedna pjesma ne koristi
  const used = new Set(data.songs.map((s) => s.audio).filter(Boolean));
  await deleteAudio(before.songs.map((s) => s.audio).filter((a) => a && !used.has(a))).catch((e) => console.error(e));
  send(res, 200, { ...data, live: true });
});
