# Mixtape — pjesma dana 💌

Mala statična web stranica: cura skenira **uvijek isti QR kod** → otvori se „mixtape” s
najnovijom pjesmom i porukom „podsjetila me na tebe jer…”. Cilj je da joj bude zabavno
otvoriti to svaki dan, ne samo lijepo.

## Kako stranica radi (za nju)

1. Kaseta + skrivena pjesma. Prije otkrivanja vidi samo trag (`hint`) i mora odigrati
   mini-igru: **ogrebi karticu** (`scratch`), **napuni srce** (`tap`) ili **drži gumb**
   (`hold`). Igre se izmjenjuju po rednom broju pjesme; `reveal` u pjesmi to nadjača.
2. Otkrivanje: konfeti, kaseta se zavrti, player, poruka rukopisom.
3. Reakcija emojijem → pojavi se tajni `ps` i gumb „javi mu” (WhatsApp ako je
   `config.whatsapp` postavljen, inače dijeljenje iz mobitela).
4. Odbrojavanje do sljedeće pjesme, niz „🔥 N dana zaredom”, i „Tvoja kaseta” — popis svih
   dosadašnjih pjesama s njenim reakcijama.

Stanje (otvoreno, reakcije, niz) živi samo u `localStorage` njenog mobitela — nema servera.

## Struktura

- `public/` — cijela stranica, objavljuje se kakva jest (bez build koraka)
  - `songs.js` — **jedini sadržaj**: `config` + popis pjesama
  - `index.html`, `style.css`, `app.js` — izgled i logika
- `scripts/check-songs.mjs` — provjera `songs.js` (datumi, duplikati, linkovi, raspored)
- `tools/qr.html` — generator QR koda
- `.github/workflows/pages.yml` — push na `main` → provjera → GitHub Pages

## Pravila

- Bez frameworka, npm ovisnosti i build koraka. Mora raditi i kad se `public/index.html`
  otvori direktno iz datoteke.
- Tekst na stranici je hrvatski, kratak i topao. Ne pretjerivati s emojijima.
- Sadržaj ide kroz `textContent`, nikad `innerHTML`.
- **Nikad ne otkrij pjesmu prije igre**: popis „Tvoja kaseta”, `<title>` i sl. ne smiju
  sadržavati naslov neotvorene pjesme. Buduće pjesme se ne prikazuju nigdje.
- Svaka igra mora imati izlaz „samo otvori” i raditi na dodir. Animacije poštuju
  `prefers-reduced-motion`. Dizajn se provjerava na ≈375 px širine.
- Vrijeme se uspoređuje kao „zidni sat” u `config.timeZone` (tekst `YYYY-MM-DDTHH:MM`);
  ista logika je u `app.js` i `check-songs.mjs` — mijenjaj obje zajedno.
- Isprobavanje igre: `?igra=scratch`, `?igra=tap`, `?igra=hold`. Stara pjesma: `?t=<date>`.

## Kad korisnik kaže „dodaj pjesmu” (glavni posao)

Npr. „dodaj za sutra Lover od Taylor Swift, podsjetila me jer smo je pjevali u autu”.

1. **Vrijeme** (`date`): ako nije rečeno, prvi slobodan dan od danas nadalje (Europe/Zagreb),
   kao `"YYYY-MM-DD"`. „Odmah / sad” → današnji datum s trenutnim vremenom
   `"YYYY-MM-DD HH:MM"` (tako nova pjesma zamijeni današnju i ona opet dobije igru).
2. **Spotify link**: potraži (WebSearch: `"<naslov>" <izvođač> site:open.spotify.com/track`).
   Upiši samo `https://open.spotify.com/track/<id>` bez `?si=`. Ako nisi siguran da je prava
   verzija, **izostavi `spotify`** — stranica tada nudi pretragu. Nikad ne izmišljaj ID.
3. **Poruka** (`note`) je korisnikova. Smiješ ispraviti pravopis; ne dodaji sadržaj ni
   patetiku. Ako je nema, pitaj.
4. **Trag** (`hint`): ako ga korisnik nije dao, predloži 2–3 emojija koji asociraju na pjesmu
   ili na njegovu poruku, ali ne odaju naslov. `ps` dodaj samo ako ga korisnik kaže.
5. Dodaj unos u `public/songs.js` sortirano po vremenu, u istom formatu kao ostali.
6. Pokreni `node scripts/check-songs.mjs` i popravi greške.
7. Commitaj (`Pjesma za YYYY-MM-DD: Naslov — Izvođač`). Pushaj samo ako korisnik to traži
   ili je to već odobrio u ovoj sesiji.

Više pjesama odjednom → rasporedi ih redom na uzastopne slobodne dane.

## Lokalno

```bash
python3 -m http.server 4321 -d public   # http://localhost:4321
node scripts/check-songs.mjs            # provjera sadržaja
```
