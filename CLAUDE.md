# Mixtape — pjesma dana

Mala statična web stranica: cura skenira **uvijek isti QR kod** pa otvori se „mixtape” s
najnovijom pjesmom i porukom „podsjetila me na tebe jer…”. Cilj je da joj bude zabavno
otvoriti to svaki dan, ne samo lijepo.

## Kako stranica radi (za nju)

Dva pogleda, jahači na dnu ekrana (ili povlačenje prstom lijevo/desno): **Danas** i **Kutija**.

### Ritual (pogled Danas) — svaki korak ima jasan razlog

1. **Naljepnica kasete je srećka: koja je pjesma?** Kaseta i srećka su jedan predmet.
   Naljepnicu prekriva srebrna folija; vidi samo trag (`hint`) i grebe je prstom. Ispod
   rukom piše naslov i izvođač, pa svaka kaseta nosi ime svoje pjesme (i u Kutiji). Nema
   zasebnog listića ni kartice s naslovom. Ritual je svaki dan isti, a iznenađenje je sadržaj.
   Svaka peta pjesma je umjesto toga **pogodi unazad** (`guess`: naljepnica je pod lokotom,
   5 s pjesme unatrag, tri naslova; treba zvuk i dvije druge objavljene pjesme, inače srećka).
   `reveal` u pjesmi to nadjača. Uvijek postoji „samo otvori”. Dok traje igra, povlačenje po
   kaseti grebe, a ne premotava.
2. **Kaseta: premotaj je na početak da zasvira.** Kaseta je „na kraju vrpce”; drži tipku za
   unazad ili povuci kasetu ulijevo (oko 2 s). Dok premotava čuje pjesmu ubrzano unatrag,
   a kad dođe do početka pjesma krene. Zato se kaseta vrti: premotaš je da bi je čula.
   Uvijek postoji „samo pusti”. Tijekom koraka 1 i 2 jahači su skriveni.
3. **Poruka** rukopisom (emotivni vrhunac, dok pjesma svira), pa **reakcija** ikonom koja
   otključa tajni `ps` i gumb „javi mu”.
4. **Spremi kasetu u kutiju** — završetak rituala. Ispod piše koliko još kaseta treba do
   sljedeće naljepnice (uz njenu siluetu); ako se upravo otključala, pokaže se velika, s porukom.
5. Cijela pjesma (Spotify/YouTube) i odbrojavanje do sljedeće.

Nakon otkrivanja kaseta ostaje pravi player: tipke i povlačenje premotavaju u oba smjera.

### Kutija

- Spremljene kasete kao male kasete; nespremljene su prazna mjesta („nije spremljena”,
  „propuštena”, „čeka te danas”). **Svaka kaseta izgleda drugačije** (`designFor` u `app.js`).
- **Naljepnice** (`config.rewards = [{ count, text }]`): pixel-art likovi (ona, on, njihove
  životinje, „nas dvoje”) koji se otključaju kad je u kutiji `count` kaseta. Zaključane su
  siluete s „? ? ?”. Likove crta `public/pixel.js` prema `config.cast`
  (`her`/`him`: `hair`, `long`, `skin`; `pets`: `type`, `color`, `name`); isti kod koristi i
  sučelje za unos za pregled uživo. Redoslijed: ona, prva životinja, on, ostale, nas dvoje.

### Zašto baš tako (ne mijenjati bez razloga)

- **Nagrade idu po broju kaseta u kutiji, ne po nizu dana.** Propušten dan ne smije ništa
  oduzeti niti stvarati grižnju savjesti; propuštenu kasetu može otvoriti i spremiti kasnije.
  Niz dana je samo veseli plamen u kutu.
- **Jedan ritual, ne izmjena četiri igre.** Navika traži isti početak; raznolikost dolazi iz
  pjesme, poruke, izgleda kasete i povremenog „pogodi unazad”.
- **Trud prije nagrade, ali kratak** (grebanje nekoliko sekundi, premotavanje oko dvije) i
  uvijek s izlazom. Poruka dolazi tek nakon truda i uz glazbu.
- **Siluete i „još N do…”** drže znatiželju i pokazuju da je cilj blizu.
- **Spremanje u kutiju je kraj**, da dan završi s osjećajem dovršenosti.

Stanje (otvoreno, spremljeno, reakcije, niz) živi samo u `localStorage` njenog mobitela.
**Reset pjesme** (gumb „Resetiraj” uz pjesmu koja trenutno svira, u sučelju za unos): pjesma
dobije polje `reset` (vrijeme u ms). Kad njena stranica vidi oznaku koju još nije primijenila
(`state.resets`), zaboravi da je pjesma otvorena, spremljena i ocijenjena, pa je ona opet
otkriva. Niz dana i ostale pjesme ostaju. Radi tek nakon objave, jer stanje živi na njenom
mobitelu, a ovako ga se može resetirati na daljinu bez servera.
Stranica se može dodati na početni zaslon (`manifest.webmanifest`, `icon-*.png`); nema
service workera, namjerno, da nikad ne vidi staru verziju.

## Struktura

- `public/` — cijela stranica, objavljuje se kakva jest (bez build koraka)
  - `songs.js` — **jedini sadržaj**: `config` + popis pjesama (piše ga sučelje za unos)
  - `audio/` — vlastiti zvukovi učitani kroz sučelje
  - `index.html`, `style.css`, `app.js` — izgled i logika
  - `pixel.js` — pixel-art likovi za naljepnice (koristi ga i sučelje za unos)
- `server.mjs` — backend bez ovisnosti: servira `public/`, sučelje `/admin` i `/api/*`
  (dohvat podataka iz linka, spremanje `songs.js`, učitavanje zvuka, „Objavi” = provjera + git)
- `admin/index.html` — sučelje za unos (ne objavljuje se, radi samo lokalno). Mora ostati
  jednostavno: tri koraka (link, kad, poruka) na vidiku, sve ostalo u „Više opcija” ili
  „Postavke”. Novo polje ide u skrivene opcije osim ako ga treba svaka pjesma.
- `scripts/check-songs.mjs` — provjera `songs.js` (datumi, duplikati, linkovi, raspored)
- `tools/qr.html` — generator QR koda
- `.github/workflows/pages.yml` — push na `main` pa provjera pa GitHub Pages

## Pravila

- Bez frameworka, npm ovisnosti i build koraka. Mora raditi i kad se `public/index.html`
  otvori direktno iz datoteke. Objavljena stranica je i dalje čisto statična — backend
  služi samo za unos na korisnikovom računalu.
- **Zvuk**: `audio` (datoteka u `public/audio/`) ima prednost pred `preview` (službeni isječak
  od 30 s s iTunesa, svira se s njihovog servera). Ne dodaji skidanje cijelih pjesama sa
  Spotifyja/YouTubea — to bi bilo javno dijeljenje tuđe glazbe; vlastiti zvuk je za ono što
  korisnik smije dijeliti (glasovna poruka, vlastita snimka).
- **Zvučni efekti** (`fx` u `app.js`) su sintetizirani kroz Web Audio — nema zvučnih datoteka.
  Premotavanje pušta dekodirani isječak unazad/unaprijed (`fx.scrub`); ako se zvuk ne može
  dekodirati (CORS, datoteka veća od 3 MB), ostaje samo šum motora. AudioContext se smije
  stvoriti tek na dodir. Sve mora poštovati gumb za utišavanje (`state.muted`).
- **Mobile-first**: dok traje igra sve stane na jedan ekran (`.stage.gaming`), a kontrole su
  dolje pod palcem; dodirne mete su najmanje 44 px. Nakon otkrivanja redoslijed je:
  kaseta i tipke, pjesma, spremanje u kutiju, poruka, reakcija, P.S., cijela pjesma, odbrojavanje.
- `server.mjs` sluša samo na 127.0.0.1, provjerava `Host` i traži zaglavlje `X-Mixtape` za
  sve što mijenja podatke. Nema lozinke — ne izlagati ga na internet.
- **Nikad emojiji ni ukrasni znakovi** (srca, zvjezdice, strelice, kvačice, „№” i sl.) — nigdje:
  ni na stranici, ni u sučelju, ni u QR alatu, ni u ispisu skripti, ni u primjerima.
  Uvijek SVG ikona: na stranici `icon("ime")` / `<use href="#i-ime">` iz `<defs>` na vrhu
  `public/index.html` (nova ikona = novi `<symbol>` tamo). Reakcije su ikone s tekstualnom
  oznakom (`REACTIONS` u `app.js`), a poruka za WhatsApp ide riječima.
- **Izgled je papir, tinta i ljepljiva traka** — kao ručno složen spomenar. Ne smije izgledati
  kao generički „AI dizajn”: bez tamne pozadine, preljeva, sjaja i neonskih sjena, bez
  prozirnih „staklenih” ploča, bez zaobljenih pilula i velikih slova s razmakom. Umjesto toga:
  podloga boje papira sa zrnom, listovi s tintanim rubom i tvrdom sjenom (`4px 5px 0`),
  jedna ravna boja po pjesmi (`INKS` u `app.js`), rukopis (Caveat) za naslove odjeljaka i
  poruke, pisaći stroj (Courier Prime) za sitni tekst, tipke koje se stvarno utisnu,
  lagano zakrenuti papirići. Novi dijelovi neka budu predmet (ceduljica, etiketa, pečat),
  ne „kartica”.
- Tekst na stranici je hrvatski, kratak i topao.
- Sadržaj ide kroz `textContent`, nikad `innerHTML`.
- **Nikad ne otkrij pjesmu prije igre**: Kutija, `<title>` i sl. ne smiju
  sadržavati naslov neotvorene pjesme. Buduće pjesme se ne prikazuju nigdje.
- Svaka igra mora imati izlaz „samo otvori” i raditi na dodir. Animacije poštuju
  `prefers-reduced-motion`. Dizajn se provjerava na ≈375 px širine.
- Vrijeme se uspoređuje kao „zidni sat” u `config.timeZone` (tekst `YYYY-MM-DDTHH:MM`);
  ista logika je u `app.js` i `check-songs.mjs` — mijenjaj obje zajedno.
- Isprobavanje igre: `?igra=scratch`, `?igra=guess`. Stara pjesma: `?t=<date>`.

## Kad korisnik kaže „dodaj pjesmu” (glavni posao)

Korisnik to inače radi sam kroz sučelje (`node server.mjs` pa `/admin`). Ako traži od tebe,
najlakše je preko istog API-ja dok server radi: `POST /api/lookup {url}` vrati naslov,
izvođača, omot i isječke, a `PUT /api/data` sprema cijeli `{config, songs}` (zaglavlje
`X-Mixtape: 1`). Inače uredi `public/songs.js` ručno po koracima ispod.

Npr. „dodaj za sutra Lover od Taylor Swift, podsjetila me jer smo je pjevali u autu”.

1. **Vrijeme** (`date`): ako nije rečeno, prvi slobodan dan od danas nadalje (Europe/Zagreb),
   kao `"YYYY-MM-DD"`. „Odmah / sad” pa današnji datum s trenutnim vremenom
   `"YYYY-MM-DD HH:MM"` (tako nova pjesma zamijeni današnju i ona opet dobije igru).
2. **Spotify link**: potraži (WebSearch: `"<naslov>" <izvođač> site:open.spotify.com/track`).
   Upiši samo `https://open.spotify.com/track/<id>` bez `?si=`. Ako nisi siguran da je prava
   verzija, **izostavi `spotify`** — stranica tada nudi pretragu. Nikad ne izmišljaj ID.
3. **Poruka** (`note`) je korisnikova. Smiješ ispraviti pravopis; ne dodaji sadržaj ni
   patetiku. Ako je nema, pitaj.
4. **Trag** (`hint`): ako ga korisnik nije dao, predloži kratak trag riječima (2–4 riječi) koji
   asocira na pjesmu ili na njegovu poruku, ali ne odaje naslov. Bez emojija. `ps` dodaj samo ako ga korisnik kaže.
5. Dodaj unos u `public/songs.js` sortirano po vremenu, u istom formatu kao ostali.
6. Pokreni `node scripts/check-songs.mjs` i popravi greške.
7. Commitaj (`Pjesma za YYYY-MM-DD: Naslov — Izvođač`). Pushaj samo ako korisnik to traži
   ili je to već odobrio u ovoj sesiji.

Više pjesama odjednom pa rasporedi ih redom na uzastopne slobodne dane.

## Lokalno

```bash
node server.mjs                  # stranica http://localhost:4321, unos http://localhost:4321/admin
node scripts/check-songs.mjs     # provjera sadržaja
```
