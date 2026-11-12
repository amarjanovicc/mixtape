/*
 * ♥ Mixtape — sadržaj
 *
 * Ovo je JEDINA datoteka koju trebaš mijenjati.
 *
 * Svaka pjesma:
 *   date    – kad se pjesma pojavi (obavezno, jedinstveno):
 *               "2026-11-13"        → od ponoći tog dana
 *               "2026-11-13 18:30"  → od točno tog trenutka (pjesma "kad god")
 *   title   – naziv pjesme (obavezno)
 *   artist  – izvođač
 *   note    – zašto te podsjetila na nju
 *   hint    – (neobavezno) trag prije otkrivanja, npr. "🚗🌊🎶" ili "naša prva vožnja"
 *   ps      – (neobavezno) tajna poruka koja se pojavi tek kad ona reagira emojijem
 *   spotify – (neobavezno) https://open.spotify.com/track/...  → ugrađeni player
 *   youtube – (neobavezno) YouTube link → player ako nema Spotify linka
 *   reveal  – (neobavezno) "scratch" | "tap" | "hold" — igra otkrivanja;
 *             ako ne navedeš, igre se same izmjenjuju iz dana u dan
 *
 * Uvijek se prikazuje NAJNOVIJA pjesma čije je vrijeme došlo. Buduće su skrivene,
 * a ona vidi samo odbrojavanje do sljedeće. Slobodno napuni tjedan unaprijed.
 *
 * Nakon promjene pokreni:  node scripts/check-songs.mjs
 */
window.DAILY_SONG = {
  config: {
    to: "",                      // njeno ime → "mixtape za Anu"
    from: "",                    // tvoj potpis ispod poruke
    whatsapp: "",                // tvoj broj s pozivnim, samo znamenke (npr. "385911234567")
                                 // → gumb "javi mu" otvara WhatsApp s njenom reakcijom
    timeZone: "Europe/Zagreb",
    noteLead: "podsjetila me na tebe jer…",
  },

  // ⚠️ PRIMJERI — zamijeni ih svojim pjesmama prije nego joj daš QR kod.
  songs: [
    {
      date: "2026-11-10",
      title: "Yellow",
      artist: "Coldplay",
      hint: "⭐️💛",
      note: "Ovo je primjer. Ovdje napiši zašto te ova pjesma podsjetila na nju.",
    },
    {
      date: "2026-11-11",
      title: "Lover",
      artist: "Taylor Swift",
      hint: "🚗🎤",
      note: "Još jedan primjer — kratko i iskreno je uvijek najbolje.",
      ps: "Primjer tajne poruke: vidi je tek kad reagira.",
    },
    {
      date: "2026-11-12",
      title: "Can't Help Falling in Love",
      artist: "Elvis Presley",
      hint: "🕺👑",
      note: "Primjer za danas. Dodaj spotify link pa će se ovdje pojaviti player.",
      ps: "Primjer tajne poruke: vidi je tek kad reagira.",
    },
  ],
};
