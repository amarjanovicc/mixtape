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
        "count": 1,
        "text": "Primjer: prva naljepnica, kupon za kavu po izboru."
      },
      {
        "count": 3,
        "text": "Primjer: netko te čeka kod kuće."
      },
      {
        "count": 5,
        "text": "Primjer: doručak u krevet."
      },
      {
        "count": 10,
        "text": "Primjer: izlet iznenađenja."
      }
    ],
    "cast": {
      "her": {
        "hair": "smeda",
        "long": true,
        "skin": "svijetla"
      },
      "him": {
        "hair": "crna",
        "long": false,
        "skin": "svijetla"
      },
      "pets": [
        {
          "type": "macka",
          "color": "narancasta",
          "name": "Primjer mačka"
        }
      ]
    }
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
      "date": "2026-11-12",
      "title": "Yellow",
      "artist": "Coldplay",
      "hint": "zvijezde i jedna boja",
      "note": "Primjer za danas, unesen kroz sučelje: zalijepiš link, a naslov, omot i isječak od 30 s dođu sami.",
      "ps": "Primjer tajne poruke: vidi je tek kad reagira.",
      "spotify": "https://open.spotify.com/track/3AJwUDP919kvQ9QcozQPxg",
      "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/66/f3/1a/66f31a76-a6ed-cb4c-f353-23310a7ae9a8/mzaf_10593596652344378873.plus.aac.p.m4a",
      "cover": "https://i.scdn.co/image/ab67616d0000b2739164bafe9aaa168d93f4816a"
    },
    {
      "date": "2026-11-12 23:14",
      "title": "Tu noć kad si se udavala",
      "artist": "Prljavci",
      "hint": "pjevanje u autu",
      "note": "Još jedan primjer — kratko i iskreno je uvijek najbolje.",
      "ps": "Primjer tajne poruke: vidi je tek kad reagira.",
      "youtube": "https://www.youtube.com/watch?v=hTSg6S1h5V8",
      "preview": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/48/32/c7/4832c76c-42b3-8f58-da06-2d7c2582230e/mzaf_1610818130004524660.plus.aac.p.m4a",
      "cover": "https://i.ytimg.com/vi/hTSg6S1h5V8/hqdefault.jpg",
      "reset": "1794649024281"
    }
  ]
};
