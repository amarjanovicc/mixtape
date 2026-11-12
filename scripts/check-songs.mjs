#!/usr/bin/env node
// Provjera public/songs.js: ispravni datumi, nema duplikata, linkovi u dobrom formatu.
// Pokretanje:  node scripts/check-songs.mjs
import { readFileSync } from "node:fs";
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
  console.error("✗ songs.js se ne može učitati (sintaksna greška?):\n ", err.message);
  process.exit(1);
}

if (!data || !Array.isArray(data.songs)) {
  console.error("✗ songs.js mora postaviti window.DAILY_SONG = { config, songs: [...] }");
  process.exit(1);
}

const config = { timeZone: "Europe/Zagreb", ...(data.config || {}) };
try {
  new Intl.DateTimeFormat("en-US", { timeZone: config.timeZone });
} catch {
  errors.push(`config.timeZone "${config.timeZone}" nije ispravna vremenska zona`);
}

const isRealDate = (s) =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

const SPOTIFY = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode)\/[A-Za-z0-9]{10,}/;
const YOUTUBE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))[A-Za-z0-9_-]{11}/;
const KNOWN = new Set(["date", "title", "artist", "note", "spotify", "youtube"]);

const seen = new Map();
data.songs.forEach((s, i) => {
  const where = `pjesma #${i + 1}${s?.title ? ` ("${s.title}")` : ""}`;
  if (!s || typeof s !== "object") return errors.push(`${where}: nije objekt`);
  if (!isRealDate(s.date)) errors.push(`${where}: date "${s.date}" nije ispravan datum (YYYY-MM-DD)`);
  if (!s.title || typeof s.title !== "string") errors.push(`${where}: nedostaje title`);
  if (!s.artist) warnings.push(`${where}: nema artist`);
  if (!s.note) warnings.push(`${where}: nema note — poruka je pola čarolije 💌`);
  if (s.spotify && !SPOTIFY.test(s.spotify)) errors.push(`${where}: spotify link nije oblika https://open.spotify.com/track/...`);
  if (s.youtube && !YOUTUBE.test(s.youtube)) errors.push(`${where}: youtube link nije prepoznat`);
  for (const k of Object.keys(s)) if (!KNOWN.has(k)) warnings.push(`${where}: nepoznato polje "${k}" (tipfeler?)`);
  if (seen.has(s.date)) errors.push(`${where}: datum ${s.date} se ponavlja (već ga ima pjesma #${seen.get(s.date) + 1})`);
  else seen.set(s.date, i);
});

// Pregled rasporeda
const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: config.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
}).formatToParts(new Date());
const get = (t) => parts.find((p) => p.type === t).value;
const today = `${get("year")}-${get("month")}-${get("day")}`;

const valid = data.songs.filter((s) => s && isRealDate(s.date)).sort((a, b) => a.date.localeCompare(b.date));
const todaySong = valid.find((s) => s.date === today);
const upcoming = valid.filter((s) => s.date > today);

// Koliko uzastopnih dana od danas je pokriveno
let covered = 0;
const d = new Date(`${today}T00:00:00Z`);
while (seen.has(d.toISOString().slice(0, 10))) { covered++; d.setUTCDate(d.getUTCDate() + 1); }

console.log(`Danas (${config.timeZone}): ${today}`);
console.log(todaySong ? `  ♥ danas: ${todaySong.title} — ${todaySong.artist ?? ""}` : "  ⚠ za danas nema pjesme (prikazat će se zadnja objavljena)");
console.log(`  ukupno pjesama: ${valid.length}, u redu čekanja: ${upcoming.length}, pokriveno dana zaredom od danas: ${covered}`);
if (upcoming[0]) console.log(`  sljedeća: ${upcoming[0].date} — ${upcoming[0].title}`);
if (covered < 2) warnings.push("manje od 2 dana unaprijed — dodaj pjesmu za sutra");
if (data.songs.some((s) => /primjer/i.test(s?.note ?? ""))) warnings.push("još postoje PRIMJER pjesme — zamijeni ih svojima");
if (!config.to) warnings.push("config.to je prazan (njeno ime na kuverti)");

for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);
if (errors.length) {
  console.error(`\n${errors.length} greš${errors.length === 1 ? "ka" : "aka"} — popravi prije objave.`);
  process.exit(1);
}
console.log("\n✓ songs.js je ispravan");
