/*
 * ♥ Pjesma dana — sadržaj
 *
 * Ovo je JEDINA datoteka koju trebaš mijenjati svaki dan.
 *
 * Svaka pjesma:
 *   date    – "YYYY-MM-DD", dan kad se pjesma pojavi (obavezno, jedinstveno)
 *   title   – naziv pjesme (obavezno)
 *   artist  – izvođač
 *   note    – zašto te podsjetila na nju (kratko, iskreno)
 *   spotify – (neobavezno) link na pjesmu, npr. https://open.spotify.com/track/...
 *             → ako postoji, na stranici se prikaže Spotify player
 *   youtube – (neobavezno) link na YouTube video
 *             → koristi se kao player ako nema Spotify linka
 *
 * Pjesme s datumom u budućnosti se NE prikazuju dok taj dan ne dođe,
 * pa slobodno unaprijed napuni tjedan.
 * Ako za današnji dan nema pjesme, prikazuje se zadnja objavljena.
 *
 * Nakon promjene pokreni:  node scripts/check-songs.mjs
 */
window.DAILY_SONG = {
  config: {
    to: "",                        // njeno ime, npr. "Ana" → "Ana, imaš novu pjesmu"
    from: "",                      // tvoje ime / nadimak za potpis
    timeZone: "Europe/Zagreb",     // po kojoj zoni se računa "danas"
    noteLead: "podsjetila me na tebe jer…",
  },

  // ⚠️ PRIMJERI — zamijeni ih svojim pjesmama prije nego joj daš QR kod.
  songs: [
    {
      date: "2026-11-10",
      title: "Yellow",
      artist: "Coldplay",
      note: "Ovo je primjer. Ovdje napiši zašto te ova pjesma podsjetila na nju.",
    },
    {
      date: "2026-11-11",
      title: "Lover",
      artist: "Taylor Swift",
      note: "Još jedan primjer — kratko i iskreno je uvijek najbolje.",
    },
    {
      date: "2026-11-12",
      title: "Can't Help Falling in Love",
      artist: "Elvis Presley",
      note: "Primjer za danas. Dodaj spotify link pa će se ovdje pojaviti player.",
    },
  ],
};
