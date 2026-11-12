#!/usr/bin/env node
// Provjera public/songs.js: ispravni datumi, nema duplikata, linkovi u dobrom formatu.
// Pokretanje:  node scripts/check-songs.mjs
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

const file = new URL("../public/songs.js", import.meta.url);
const errors = [];
const warnings = [];

let data;
try {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(file, "utf8"), sandbox, { filename: "songs.js" });
  data = sandbox.window.DAILY_SONG;
} catch (err) {
  console.error("GREŠKA: songs.js se ne može učitati (sintaksna greška?):\n ", err.message);
  process.exit(1);
}

if (!data || !Array.isArray(data.songs)) {
  console.error("GREŠKA: songs.js mora postaviti window.DAILY_SONG = { config, songs: [...] }");
  process.exit(1);
}

const config = { timeZone: "Europe/Zagreb", ...(data.config || {}) };
try {
  new Intl.DateTimeFormat("en-US", { timeZone: config.timeZone });
} catch {
  console.error(`GREŠKA: config.timeZone "${config.timeZone}" nije ispravna vremenska zona`);
  process.exit(1);
}
if (config.whatsapp && !/^\d{8,15}$/.test(String(config.whatsapp))) {
  errors.push(`config.whatsapp "${config.whatsapp}" mora biti samo znamenke s pozivnim brojem (npr. 385911234567)`);
}

// "YYYY-MM-DD" ili "YYYY-MM-DD HH:MM" -> "YYYY-MM-DDTHH:MM" (isto kao u app.js)
const normalizeWhen = (s) => {
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?$/.exec(typeof s === "string" ? s.trim() : "");
  if (!m) return null;
  const at = `${m[1]}T${m[2] || "00:00"}`;
  const d = new Date(`${at}:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 16) === at ? at : null;
};

const SPOTIFY = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode)\/[A-Za-z0-9]{10,}/;
const YOUTUBE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))[A-Za-z0-9_-]{11}/;
const KNOWN = new Set(["date", "title", "artist", "note", "hint", "ps", "spotify", "youtube", "audio", "preview", "cover", "reveal"]);
const REVEALS = new Set(["scratch", "tap", "hold", "guess"]);

const seen = new Map();
const valid = [];
data.songs.forEach((s, i) => {
  const where = `pjesma #${i + 1}${s?.title ? ` ("${s.title}")` : ""}`;
  if (!s || typeof s !== "object") return errors.push(`${where}: nije objekt`);
  const at = normalizeWhen(s.date);
  if (!at) errors.push(`${where}: date "${s.date}" mora biti "YYYY-MM-DD" ili "YYYY-MM-DD HH:MM"`);
  if (!s.title || typeof s.title !== "string") errors.push(`${where}: nedostaje title`);
  if (!s.artist) warnings.push(`${where}: nema artist`);
  if (!s.note) warnings.push(`${where}: nema note — poruka je pola čarolije`);
  if (s.spotify && !SPOTIFY.test(s.spotify)) errors.push(`${where}: spotify link nije oblika https://open.spotify.com/track/...`);
  if (s.youtube && !YOUTUBE.test(s.youtube)) errors.push(`${where}: youtube link nije prepoznat`);
  if (s.audio && !existsSync(new URL(`../public/${s.audio}`, import.meta.url))) errors.push(`${where}: zvuk ${s.audio} ne postoji u public/`);
  if (!s.audio && !s.preview) warnings.push(`${where}: nema zvuka (ni isječka ni vlastite datoteke) — kaseta će se vrtjeti bez glazbe`);
  if (/\p{Extended_Pictographic}/u.test(`${s.hint ?? ""}${s.note ?? ""}${s.ps ?? ""}`)) warnings.push(`${where}: tekst sadrži emoji — stranica koristi samo ikone, napiši riječima`);
  if (s.reveal && !REVEALS.has(s.reveal)) errors.push(`${where}: reveal mora biti "scratch", "tap", "hold" ili "guess"`);
  for (const k of Object.keys(s)) if (!KNOWN.has(k)) warnings.push(`${where}: nepoznato polje "${k}" (tipfeler?)`);
  if (!at) return;
  if (seen.has(at)) errors.push(`${where}: vrijeme ${s.date} se ponavlja (već ga ima pjesma #${seen.get(at) + 1})`);
  else { seen.set(at, i); valid.push({ ...s, at }); }
});
valid.sort((a, b) => a.at.localeCompare(b.at));

// Pregled rasporeda
const parts = Object.fromEntries(
  new Intl.DateTimeFormat("en-US", {
    timeZone: config.timeZone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date()).map((p) => [p.type, p.value]),
);
const now = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
const today = now.slice(0, 10);

const released = valid.filter((s) => s.at <= now);
const upcoming = valid.filter((s) => s.at > now);
const current = released.at(-1);
const days = new Set(valid.map((s) => s.at.slice(0, 10)));

// Koliko uzastopnih dana od danas ima barem jednu pjesmu
let covered = 0;
const d = new Date(`${today}T00:00:00Z`);
while (days.has(d.toISOString().slice(0, 10))) { covered++; d.setUTCDate(d.getUTCDate() + 1); }

console.log(`Sada (${config.timeZone}): ${now.replace("T", " ")}`);
console.log(current ? `  trenutno svira: #${released.length} ${current.title} — ${current.artist ?? ""} (od ${current.at.replace("T", " ")})` : "  još nijedna pjesma nije objavljena");
console.log(`  ukupno: ${valid.length}, u redu čekanja: ${upcoming.length}, pokriveno dana zaredom od danas: ${covered}`);
if (upcoming[0]) console.log(`  sljedeća: ${upcoming[0].at.replace("T", " ")} — ${upcoming[0].title}`);
if (!days.has(today)) warnings.push("za danas nema nove pjesme (prikazuje se zadnja)");
if (covered < 2) warnings.push("nema pjesme za sutra — dodaj je da se niz ne prekine");
if (data.songs.some((s) => /primjer/i.test(`${s?.note ?? ""} ${s?.ps ?? ""}`))) warnings.push("još postoje PRIMJER pjesme — zamijeni ih svojima");
for (const r of Array.isArray(config.rewards) ? config.rewards : []) {
  if (!(Number(r?.days) >= 1) || !r?.text) errors.push(`config.rewards: svaka nagrada treba days (broj dana) i text`);
}
if (!config.to) warnings.push("config.to je prazan (njeno ime na kaseti)");
if (!config.whatsapp) warnings.push("config.whatsapp je prazan — gumb „javi mu” koristit će dijeljenje iz mobitela");

for (const w of warnings) console.log(`UPOZORENJE: ${w}`);
for (const e of errors) console.error(`GREŠKA: ${e}`);
if (errors.length) {
  console.error(`\nBroj grešaka: ${errors.length} — popravi prije objave.`);
  process.exit(1);
}
console.log("\nU redu: songs.js je ispravan");
