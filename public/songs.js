/*
 * Mixtape — sadržaj
 *
 * Ovu datoteku piše sučelje za unos (node server.mjs -> http://localhost:4321/admin).
 * Možeš je uređivati i ručno; polja su opisana u README.md.
 * Nakon ručne promjene pokreni:  node scripts/check-songs.mjs
 */
window.DAILY_SONG = {
  "config": {
    "to": "",
    "from": "",
    "whatsapp": "",
    "timeZone": "Europe/Zagreb",
    "noteLead": "podsjetila me na tebe jer…",
    "rewards": [
      {
        "days": 1,
        "text": "Primjer nagrade: kupon za kavu po izboru."
      },
      {
        "days": 7,
        "text": "Primjer nagrade: doručak u krevet."
      },
      {
        "days": 30,
        "text": "Primjer nagrade: izlet iznenađenja."
      }
    ]
  },
  "songs": [
    {
      "date": "2026-11-10",
      "title": "Can't Help Falling in Love",
      "artist": "Elvis Presley",
      "hint": "kralj u bijelom odijelu",
      "note": "Ovo je primjer. Ovdje napiši zašto te ova pjesma podsjetila na nju."
    },
    {
      "date": "2026-11-11",
      "title": "Lover",
      "artist": "Taylor Swift",
      "hint": "pjevanje u autu",
      "note": "Još jedan primjer — kratko i iskreno je uvijek najbolje.",
      "ps": "Primjer tajne poruke: vidi je tek kad reagira."
    },
    {
      "date": "2026-11-12",
      "title": "Yellow",
      "artist": "Coldplay",
      "hint": "zvijezde i jedna boja",
      "note": "Primjer za danas, unesen kroz sučelje: zalijepiš link, a naslov, omot i isječak od 30 s dođu sami.",
      "ps": "Primjer tajne poruke: vidi je tek kad reagira.",
      "spotify": "https://open.spotify.com/track/3AJwUDP919kvQ9QcozQPxg",
      "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/66/f3/1a/66f31a76-a6ed-cb4c-f353-23310a7ae9a8/mzaf_10593596652344378873.plus.aac.p.m4a",
      "cover": "https://i.scdn.co/image/ab67616d0000b2739164bafe9aaa168d93f4816a"
    }
  ]
};
