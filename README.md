# Mixtape — pjesma dana

Mala web stranica za jednu osobu. Ona skenira **uvijek isti QR kod** i otvori se kaseta s pjesmom dana i porukom „podsjetila me na tebe jer…”. Cilj nije samo da bude lijepa, nego da joj bude zabavno otvoriti je svaki dan.

Čisti HTML/CSS/JS bez frameworka i build koraka. Backend su malene Vercel funkcije; jedina ovisnost je `@vercel/blob`. Sadržaj se mijenja kroz vlastito admin sučelje, bez commita i bez čekanja.

- Tekst na stranici je na hrvatskom.
- Izgled je papir, tinta i ljepljiva traka (spomenar), a sve su ikone vlastiti SVG, bez emojija.
- Izrađeno za mobitel (provjereno do 320 px širine).

## Kako izgleda njen dan

1. **Omot je srećka.** Na ekranu je samo omot kasete pod srebrnom folijom i novčić. Dodirne novčić da ga podigne i njime ogrebe oko 60 % folije; kad pusti, novčić se vrati dolje. Svaka peta pjesma je umjesto toga „pogodi unazad”: pet sekundi pjesme unatrag i tri naslova. Uvijek postoji „samo otvori”.
2. **Kaseta izleti iz omota.** Omot se otvori kao knjiga, kaseta se spusti na njegovo mjesto, a omot odleti.
3. **Premotavanje.** Kaseta je „na kraju vrpce”: drži tipku za unazad ili povuče kasetu ulijevo. Čuje ubrzani zvuk premotavanja, a na početku pjesma zasvira.
4. **Poruka i reakcija.** Poruka rukopisom, pa reakcija ikonom. Tek nakon reakcije pojave se tajni P.S., „javi mu” i „pošalji mu svoju pjesmu”.
5. **Kutija.** Kaseta se sprema u kutiju. Svaka izgleda drugačije, a propušteni dani su prazna mjesta koja može popuniti kasnije.
6. **Naljepnice.** Kad u kutiji ima dovoljno kaseta, otključava pixel-art likove (ona, on, njihove životinje, „nas dvoje”) uz poruku. Zaključani su siluete.

Povremeno je kaseta **rijetka** (zlatna folija i žig), kao rijetke karte u igrama s paketima.

Nagrade se računaju po broju spremljenih kaseta, ne po nizu dana, pa propušten dan ništa ne oduzima. Stranicu može dodati na početni zaslon.

## Kako je složeno

```
  admin (/admin)  --PUT-->  Vercel funkcije (api/)  -->  privatni Vercel Blob
                                   |                      data.json + zvukovi
  njena stranica  <--/songs.js--  api/songs.js  (samo pjesme čije je vrijeme došlo)
                  <--/media/x---  api/media.js  (zvuk, s podrškom za Range)
```

- **Izvor istine je Blob, ne git.** `data/songs.js` je samo početni sadržaj dok u Blobu ništa nije spremljeno (i sadržaj lokalnog servera).
- **Buduće pjesme nikad ne napuštaju server.** `api/songs.js` šalje samo objavljene pjesme i anonimno „sljedeću” za odbrojavanje.
- **Uređaji umjesto računa:** nema prijave. Svaki mobitel dobije nasumičan anonimni ID (`localStorage` i kolačić), a njegov napredak (otvoreno, spremljeno, reakcije) sinkronizira se na server, pa ga admin vidi, a napredak se vrati i ako preglednik obriše podatke. Ne sprema se ništa osobno, samo ID, vrsta uređaja i napredak.

### Struktura

| Putanja | Što je |
| --- | --- |
| `public/` | cijela stranica: `index.html`, `style.css`, `app.js`, `pixel.js`, ikone, manifest |
| `public/admin/index.html` | admin sučelje (prijava lozinkom) |
| `api/` | Vercel funkcije: `songs`, `sync`, `users`, `data`, `lookup`, `audio`, `media`, `login` |
| `lib/` | `core.mjs` (čista logika), `store.mjs` (Blob / lokalna datoteka), `http.mjs` (prijava, zaštita) |
| `data/songs.js` | početni sadržaj (u ovom repou samo primjeri) |
| `server.mjs` | lokalni server za isprobavanje |
| `scripts/` | `check-songs.mjs` (provjera sadržaja), `dev-live.mjs` (lokalno pokreće iste funkcije kao Vercel) |
| `tools/qr.html` | generator QR koda |

## Pokretanje lokalno

Treba Node 22.

```bash
npm install
node server.mjs                 # stranica http://localhost:4321, admin http://localhost:4321/admin
node scripts/check-songs.mjs    # provjera sadržaja
node scripts/dev-live.mjs       # iste funkcije kao na Vercelu, http://localhost:4330 (lozinka: lokalna-lozinka)
```

Lokalni `server.mjs` nema lozinku i sluša samo na `127.0.0.1`. **Ne izlaži ga na internet.**

Za isprobavanje igre: `?igra=scratch` ili `?igra=guess`; za staru pjesmu: `?t=<datum>`.

## Postavljanje (Vercel)

1. Uvezi repozitorij u Vercel kao novi projekt. Postavke su u `vercel.json` (izlazni folder `public`, funkcije u `api/`, prije objave provjera sadržaja).
2. U projektu: **Storage, Create, Blob, Private** (poveži s projektom) i **Settings, Environment Variables, `ADMIN_PASSWORD`** (dugačka lozinka). Zatim *Redeploy*.
3. Otvori `/admin`, prijavi se, u *Postavke* upiši njeno ime, svoj potpis i WhatsApp, obriši primjere i dodaj prve pjesme.
4. Otvori `tools/qr.html`, upiši adresu svoje stranice, preuzmi PNG i isprintaj. QR se ne mijenja kad dodaješ pjesme.

## Admin

Pet odjeljaka:

- **Danas:** koliko je dana unaprijed složeno, objava (lokalno) i **Resetiraj pjesmu**: današnja se pjesma opet otkriva od početka na njenom mobitelu kad sljedeći put otvori stranicu (niz dana ostaje).
- **Raspored:** idućih 14 dana, slobodan dan ima gumb „Dodaj”, a pjesme bez poruke ili linka imaju upozorenje.
- **Dodaj:** zalijepi link sa Spotifyja ili YouTubea (naslov, izvođač, omot i isječak od 30 s popune se sami), odaberi kad se pojavi i upiši poruku. Pod „Više opcija”: trag, P.S., odabir igre, krivi odgovori, vlastiti zvuk, snimanje glasa u pregledniku.
- **Uređaji:** popis mobitela koji su otvorili stranicu (ime možeš dati sam), što su otvorili i kako su reagirali, reset po uređaju.
- **Postavke:** njeno ime, tvoj potpis, WhatsApp, likovi i naljepnice.

### Polja pjesme

| Polje | Značenje |
| --- | --- |
| `date` | `YYYY-MM-DD` ili `YYYY-MM-DD HH:MM` (zona `config.timeZone`) |
| `title`, `artist` | naslov i izvođač |
| `note` | tvoja poruka („podsjetila me na tebe jer…”) |
| `hint` | kratak trag prije otkrivanja (ne odaje naslov) |
| `ps` | tajna poruka, vidi se tek nakon reakcije |
| `spotify`, `youtube` | poveznice na cijelu pjesmu |
| `audio`, `preview`, `cover` | vlastiti zvuk, službeni isječak od 30 s, naslovnica |
| `reveal` | `scratch` ili `guess` (nadjača zadani raspored) |
| `decoys` | krivi odgovori za „pogodi unazad”, `naslov | naslov` |

Uvijek se prikazuje najnovija pjesma čije je vrijeme došlo. Datum bez sata mijenja se u ponoć, a datum sa satom čim to vrijeme prođe.

## O glazbi i zvuku

Projekt **ne skida cijele pjesme** sa Spotifyja ili YouTubea: to bi bilo javno dijeljenje tuđe glazbe. Umjesto toga:

- **isječak od 30 s** je službeni pretpregled (iTunes) i svira se s njihovog servera;
- **cijela pjesma** je poveznica na Spotify ili YouTube;
- **vlastiti zvuk** (glasovna poruka, tvoja snimka) služi za ono što smiješ dijeliti.

Zvučni efekti su sintetizirani u pregledniku (Web Audio), pa nema zvučnih datoteka. Na iPhoneu se zvuk otključava tek na dodir bez povlačenja, zato se novčić podiže dodirom.

## Sigurnost

- Sve u `api/` osim `songs`, `login` i `sync` traži prijavu (`sync` je javan, ali radi samo s nasumičnim ID-om uređaja, ograničen je veličinom i brojem uređaja): HMAC kolačić (`HttpOnly`, `Secure`, `SameSite=Strict`), zaglavlje `X-Mixtape` i provjeru izvora.
- Lozinka je samo u Vercel okruženju (`ADMIN_PASSWORD`), nikad u kodu.
- Zvuk i podaci su u privatnom Blobu i dostupni samo kroz funkcije.
- Sadržaj ide kroz `textContent`, nikad `innerHTML`.
- Stranica nije indeksirana (`noindex`), ali je dostupna svakome tko zna adresu.

## Dizajnerska pravila

Zašto je nešto napravljeno baš tako (nagrade po broju kaseta, kratak trud prije nagrade, jedan ritual umjesto izmjene igara, bez emojija i „AI izgleda”) zapisano je u [`CLAUDE.md`](CLAUDE.md), uz upute za razvoj.

## Licenca

Licenca još nije odabrana. Dok je nema, sva prava pridržana.
