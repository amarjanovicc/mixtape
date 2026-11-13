// Zvuk iz privatne pohrane za njenu stranicu: /media/<ime>. Podržava Range (premotavanje).
import { getAudio } from "../lib/store.mjs";

export default async function media(req, res) {
  try {
    const name = new URL(req.url, "http://x").searchParams.get("f") || "";
    const file = await getAudio(name);
    if (!file) { res.statusCode = 404; return res.end("Nema zvuka."); }
    const { data, type } = file;
    res.setHeader("Content-Type", type);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");   // imena su jedinstvena
    res.setHeader("X-Robots-Tag", "noindex");
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (m && (m[1] || m[2])) {
      let start = m[1] ? Number(m[1]) : data.length - Number(m[2]);
      let end = m[1] && m[2] ? Number(m[2]) : data.length - 1;
      start = Math.max(0, start);
      end = Math.min(end, data.length - 1);
      if (start > end) { res.statusCode = 416; res.setHeader("Content-Range", `bytes */${data.length}`); return res.end(); }
      res.statusCode = 206;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${data.length}`);
      res.setHeader("Content-Length", end - start + 1);
      return res.end(data.subarray(start, end + 1));
    }
    res.statusCode = 200;
    res.setHeader("Content-Length", data.length);
    res.end(data);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Greška.");
  }
}
