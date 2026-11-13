// Zajednička jezgra: koriste je lokalni server (server.mjs) i funkcije na Vercelu (api/).
// Čiste funkcije, bez pristupa datotekama.

export const SONG_FIELDS = ["date", "title", "artist", "hint", "note", "ps", "spotify", "youtube", "audio", "preview", "cover", "reveal", "reset"];
export const CONFIG_FIELDS = ["to", "from", "whatsapp", "timeZone", "noteLead"];
export const DEFAULT_CONFIG = { to: "", from: "", whatsapp: "", timeZone: "Europe/Zagreb", noteLead: "podsjetila me na tebe jer…", rewards: [] };
export const AUDIO_EXT = new Set([".mp3", ".m4a", ".ogg", ".wav"]);

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const bad = (msg) => new HttpError(400, msg);

export function normalizeWhen(s) {
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?$/.exec(typeof s === "string" ? s.trim() : "");
  if (!m) return null;
  const at = `${m[1]}T${m[2] || "00:00"}`;
  const d = new Date(`${at}:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 16) === at ? at : null;
}

export function cleanData(input) {
  if (!input || typeof input !== "object" || !Array.isArray(input.songs)) throw bad("Neispravni podaci.");
  const config = { ...DEFAULT_CONFIG };
  for (const k of CONFIG_FIELDS) {
    const v = input.config?.[k];
    if (typeof v === "string" && v.trim()) config[k] = v.trim();
  }
  config.whatsapp = config.whatsapp.replace(/\D/g, "");
  // naljepnice: [{ count, text }] — otključaju se kad je u kutiji toliko kaseta
  const seenCounts = new Set();
  config.rewards = (Array.isArray(input.config?.rewards) ? input.config.rewards : []).map((r) => ({
    count: Math.round(Number(r?.count ?? r?.days)), text: String(r?.text ?? "").trim().slice(0, 400),
  })).filter((r) => r.count >= 1 && r.count <= 999 && !seenCounts.has(r.count) && seenCounts.add(r.count))
    .sort((a, b) => a.count - b.count);
  // likovi za pixel-art naljepnice
  const one = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);
  const HAIR = ["crna", "smeda", "plava", "rida", "sijeda"], SKIN = ["svijetla", "srednja", "tamna"];
  const FUR = ["crna", "bijela", "narancasta", "smeda", "siva"], PET = ["macka", "pas", "zec"];
  const person = (p, long) => ({ hair: one(p?.hair, HAIR, "smeda"), long: p?.long == null ? long : Boolean(p.long), skin: one(p?.skin, SKIN, "svijetla") });
  const cast = input.config?.cast || {};
  config.cast = {
    her: person(cast.her, true),
    him: person(cast.him, false),
    pets: (Array.isArray(cast.pets) ? cast.pets : []).slice(0, 4).map((a) => ({
      type: one(a?.type, PET, "macka"), color: one(a?.color, FUR, "siva"), name: String(a?.name ?? "").trim().slice(0, 20),
    })),
  };
  try { new Intl.DateTimeFormat("en-US", { timeZone: config.timeZone }); } catch { throw bad("Vremenska zona nije ispravna."); }

  const seen = new Set();
  const songs = input.songs.map((raw, i) => {
    const s = {};
    for (const k of SONG_FIELDS) {
      const v = raw?.[k];
      if (typeof v === "string" && v.trim()) s[k] = v.trim();
    }
    const name = s.title ? `„${s.title}”` : `#${i + 1}`;
    const at = normalizeWhen(s.date);
    if (!s.title) throw bad(`Pjesma ${name}: nedostaje naslov.`);
    if (!at) throw bad(`Pjesma ${name}: datum mora biti YYYY-MM-DD ili YYYY-MM-DD HH:MM.`);
    if (seen.has(at)) throw bad(`Pjesma ${name}: već postoji pjesma za ${s.date}.`);
    seen.add(at);
    s.date = at.endsWith("T00:00") ? at.slice(0, 10) : at.replace("T", " ");
    if (s.reveal && !["scratch", "guess"].includes(s.reveal)) delete s.reveal;
    if (s.reset && !/^\d{1,15}$/.test(s.reset)) delete s.reset;   // oznaka resetiranja (vrijeme u ms)
    if (s.audio && !/^audio\/[A-Za-z0-9._-]+$/.test(s.audio) && !/^media\/[A-Za-z0-9._-]+$/.test(s.audio)) throw bad(`Pjesma ${name}: neispravna putanja zvuka.`);
    for (const k of ["spotify", "youtube", "preview", "cover"]) {
      if (s[k] && !/^https:\/\//.test(s[k])) throw bad(`Pjesma ${name}: ${k} mora biti https link.`);
    }
    return { s, at };
  }).sort((a, b) => a.at.localeCompare(b.at)).map((x) => x.s);

  return { config, songs };
}

// ---------- lookup: link -> naslov, izvođač, omot, isječak ----------

async function get(url, as) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "Mozilla/5.0 (mixtape-admin)", "Accept-Language": "en" },
  });
  if (!res.ok) throw new Error(`${new URL(url).hostname} -> ${res.status}`);
  return as === "json" ? res.json() : res.text();
}

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const meta = (html, prop) => {
  const m = new RegExp(`<meta property="${prop}" content="([^"]*)"`).exec(html);
  return m ? decode(m[1]) : "";
};

export async function lookup(rawUrl) {
  let u;
  try { u = new URL(String(rawUrl).trim()); } catch { throw bad("To ne izgleda kao link."); }
  const host = u.hostname.replace(/^(www|m|music)\./, "");
  const out = { title: "", artist: "", cover: "", spotify: "", youtube: "", previews: [], notes: [] };

  if (host === "open.spotify.com") {
    const m = /\/track\/([A-Za-z0-9]{10,})/.exec(u.pathname);
    if (!m) throw bad("Treba link na pjesmu (open.spotify.com/track/…), ne na album ili playlistu.");
    out.spotify = `https://open.spotify.com/track/${m[1]}`;
    try {
      const html = await get(out.spotify, "text");
      out.title = meta(html, "og:title");
      out.artist = meta(html, "og:description").split(" · ")[0] || "";
      out.cover = meta(html, "og:image");
    } catch (err) { out.notes.push("Spotify nije odgovorio: " + err.message); }
  } else if (host === "youtube.com" || host === "youtu.be") {
    const id = host === "youtu.be" ? u.pathname.slice(1, 12) : u.searchParams.get("v") || (/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/.exec(u.pathname) || [])[1];
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw bad("Ne mogu pronaći YouTube video u tom linku.");
    out.youtube = `https://www.youtube.com/watch?v=${id}`;
    try {
      const o = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(out.youtube)}`, "json");
      const full = String(o.title || "");
      const channel = String(o.author_name || "").replace(/\s*-\s*Topic$|VEVO$/i, "").trim();
      const strip = (t) => t.replace(/\s*[([][^)\]]*[)\]]/g, "").trim();
      const dash = full.split(/\s+[-–—]\s+/);
      if (dash.length >= 2) { out.artist = dash[0].trim(); out.title = strip(dash.slice(1).join(" - ")); }
      else { out.artist = channel; out.title = strip(full); }
      out.cover = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;   // 16:9 bez crnih traka
    } catch (err) { out.notes.push("YouTube nije odgovorio: " + err.message); }
  } else {
    throw bad("Podržani su Spotify i YouTube linkovi.");
  }

  // službeni isječci od 30 s (iTunes Search API)
  const term = [out.artist, out.title].filter(Boolean).join(" ");
  if (term) {
    try {
      const r = await get(`https://itunes.apple.com/search?entity=song&limit=5&term=${encodeURIComponent(term)}`, "json");
      out.previews = (r.results || []).filter((x) => x.previewUrl).map((x) => ({
        title: x.trackName, artist: x.artistName, album: x.collectionName || "",
        preview: x.previewUrl, cover: String(x.artworkUrl100 || "").replace("100x100", "600x600"),
      }));
    } catch (err) { out.notes.push("Isječak nije pronađen: " + err.message); }
  }
  if (!out.previews.length) out.notes.push("Nema službenog isječka za ovu pjesmu — stranica će nuditi samo Spotify/YouTube player.");
  return out;
}

// "Zidni sat" u zadanoj zoni kao "YYYY-MM-DDTHH:MM" (isto kao u app.js).
export function wallNow(timeZone, date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// Javni pogled za njenu stranicu: samo pjesme čije je vrijeme došlo, plus (bez naslova)
// sljedeća, da se može prikazati odbrojavanje. Buduće pjesme nikad ne napuštaju server.
export function publicData(data, date = new Date()) {
  const config = { ...DEFAULT_CONFIG, ...(data.config || {}) };
  const now = wallNow(config.timeZone, date);
  const dated = (data.songs || []).map((s) => ({ s, at: normalizeWhen(s.date) })).filter((x) => x.at).sort((a, b) => a.at.localeCompare(b.at));
  const released = dated.filter((x) => x.at <= now).map((x) => x.s);
  const next = dated.find((x) => x.at > now);
  const songs = next ? [...released, { date: next.s.date, title: "?" }] : released;
  return { config, songs };
}

export function dataToJs(data) {
  return `window.DAILY_SONG = ${JSON.stringify(data).replace(/</g, "\\u003c")};\n`;
}
