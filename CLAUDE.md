# Pjesma dana 💌

Mala statična web stranica: cura skenira QR kod → otvori se stranica s **pjesmom dana**
i kratkom porukom „podsjetila me na tebe jer…”. QR kod je uvijek isti; stranica sama bira
pjesmu po današnjem datumu (zona `Europe/Zagreb`).

## Struktura

- `public/` — to je cijela stranica, objavljuje se kakva jest (bez build koraka)
  - `songs.js` — **jedini sadržaj**: `config` (njeno ime, potpis) + popis pjesama
  - `index.html`, `style.css`, `app.js` — izgled i logika
- `scripts/check-songs.mjs` — provjera `songs.js` (datumi, duplikati, linkovi, raspored)
- `tools/qr.html` — generator QR koda (otvori u pregledniku, upiši URL, preuzmi PNG)
- `.github/workflows/pages.yml` — na push na `main`: provjera pa objava na GitHub Pages

## Pravila

- Bez frameworka, bez npm ovisnosti, bez build koraka. Čisti HTML/CSS/JS koji radi i
  kad se `public/index.html` otvori direktno iz datoteke.
- Sav tekst na stranici je na hrvatskom, nježan i kratak. Ne pretjerivati s emojijima.
- Sadržaj se ubacuje kroz `textContent`, nikad `innerHTML`.
- Animacije poštuju `prefers-reduced-motion`. Stranica mora izgledati dobro na mobitelu
  (≈375 px širine) jer se uvijek otvara preko QR koda.
- Pjesme s budućim datumom se ne prikazuju — to je namjerno (iznenađenje).

## Kad korisnik kaže „dodaj pjesmu” (glavni posao)

Npr. „dodaj za sutra Lover od Taylor Swift, podsjetila me jer smo je pjevali u autu”.

1. Odredi datum: ako nije rečen, uzmi **prvi slobodan dan od danas nadalje** (zona Europe/Zagreb).
   „Sutra”, „petak” itd. pretvori u `YYYY-MM-DD`.
2. Nađi službeni Spotify link pjesme (WebSearch: `"<naslov>" <izvođač> site:open.spotify.com/track`).
   Uzmi samo `https://open.spotify.com/track/<id>` bez `?si=` parametra. Ako nisi siguran da je
   to prava pjesma (originalna verzija, pravi izvođač), **izostavi `spotify`** — stranica će
   tada sama ponuditi Spotify pretragu. Nikad ne izmišljaj ID.
3. Poruku (`note`) piše korisnik. Smiješ je samo lagano ispraviti (pravopis, interpunkcija);
   ne dodaji sadržaj ni patetiku koju nije rekao. Ako poruke nema, pitaj za nju.
4. Dodaj unos u `public/songs.js` sortirano po datumu, u istom formatu kao ostali.
5. Pokreni `node scripts/check-songs.mjs` i popravi greške.
6. Commitaj (`Pjesma za YYYY-MM-DD: Naslov — Izvođač`). Pushaj samo ako korisnik to traži
   ili je to već prije odobrio u ovoj sesiji.

Ako korisnik da više pjesama odjednom, rasporedi ih po redu na uzastopne slobodne dane.

## Lokalno

```bash
python3 -m http.server 4321 -d public   # http://localhost:4321
node scripts/check-songs.mjs            # provjera sadržaja
```
