// Vlastiti zvuk (glasovna poruka, snimka). Vercel funkcije prihvaćaju najviše ~4,5 MB tijela.
import path from "node:path";
import crypto from "node:crypto";
import { AUDIO_EXT, HttpError, bad } from "../lib/core.mjs";
import { putAudio } from "../lib/store.mjs";
import { handler, readBody, requireAdmin, send } from "../lib/http.mjs";

const MAX = 4 * 1024 * 1024;
const TYPES = { ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".wav": "audio/wav" };

export default handler(async (req, res) => {
  requireAdmin(req);
  if (req.method !== "PUT") return send(res, 405, { error: "Nedopuštena metoda." });
  const name = new URL(req.url, "http://x").searchParams.get("name") || "";
  const ext = path.extname(name).toLowerCase();
  if (!AUDIO_EXT.has(ext)) throw bad("Podržani formati: mp3, m4a, ogg, wav.");
  const body = await readBody(req, MAX);
  if (!body.length) throw bad("Datoteka je prazna.");
  const base = path.basename(name, ext).normalize("NFKD").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).toLowerCase() || "zvuk";
  const file = `${base}-${crypto.randomBytes(3).toString("hex")}${ext}`;
  send(res, 200, { audio: await putAudio(file, body, TYPES[ext]), size: body.length });
});
