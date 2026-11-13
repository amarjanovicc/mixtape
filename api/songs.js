// Javni sadržaj za njenu stranicu (<script src="/songs.js">): samo pjesme čije je vrijeme došlo.
import { dataToJs, publicData } from "../lib/core.mjs";
import { readData, seed } from "../lib/store.mjs";
import { send } from "../lib/http.mjs";

export default async function songs(req, res) {
  let data;
  try { data = await readData(); } catch (err) { console.error(err); data = await seed(); }
  send(res, 200, dataToJs(publicData(data)), { "Content-Type": "application/javascript; charset=utf-8" });
}
