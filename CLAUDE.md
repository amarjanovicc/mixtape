# Mixtape — pjesma dana

Mala statična web stranica: cura skenira **uvijek isti QR kod** pa otvori se „mixtape” s
najnovijom pjesmom i porukom „podsjetila me na tebe jer…”. Cilj je da joj bude zabavno
otvoriti to svaki dan, ne samo lijepo.

## Kako stranica radi (za nju)

Dva pogleda, jahači na dnu ekrana (ili povlačenje prstom lijevo/desno): **Danas** i **Kutija**.

### Ritual (pogled Danas) — svaki korak ima jasan razlog

Prizor ima dva predmeta: **omot** (kutija kasete) i **kaseta**. (Kućište kasetofona je
isprobano i odbačeno: korisniku se nije svidjelo. Ne vraćati ga.)

1. **Omot je srećka: koja je pjesma?** Omot je uspravna kutija kasete (`.sleeve`): hrbat s
   uspravnim natpisom, naslovnica gore, naslov i izvođač dolje, prozirna plastika s odsjajem.
   Pod srebrnom je folijom. Ispod omota leži **novčić** (`#coin`): uhvati ga, drži i povuče na
   omot pa grebe njime u istom potezu (novčić prati prst); kad ga pusti, ostaje joj „u ruci” i
   dalje grebe izravno po foliji. Zvuk se na mobitelu otključa tek kad prst prvi put napusti
   ekran, pa prvi potez može biti nijem. Razlog je zvuk: mobilni preglednik otključa zvuk samo na
   pravi dodir (klik), ne na povlačenje, pa bi grebanje inače bilo nijemo. Bez novčića folija
   se ne grebe, a novčić se zatrese. (Pečat „dodirni pa grebi” preko folije je isproban i
   odbačen.) Svaka peta pjesma je umjesto toga **pogodi unazad** (`guess`: omot pod lokotom,
   5 s pjesme unatrag, tri naslova). `reveal` to nadjača. Uvijek postoji „samo otvori”. Početni ekran je prazan: samo omot, novčić i poruka „uhvati novčić i ogrebi omot”; trag se pojavi tek nakon ~16 poteza (ili u „pogodi unazad” nakon slušanja), a „samo otvori” nakon 10 s. Treba ogrebati oko 60 % folije.
   **Krivi odgovori** su polje `decoys` ("naslov | naslov"), admin ih popuni iz izvođačevih
   drugih pjesama.
2. **Kaseta izađe iz omota.** Omot se otvori kao knjiga (`.sleeve.open`, vidi se ležište),
   kaseta izleti i spusti se na njegovo mjesto (`revealCassette`), a omot odleti u stranu i
   nestane (`.pack.out`). Ne ostavljati mali omot uz kasetu: isprobano i odbačeno. Tipke i
   klizač su ispod kasete.
3. **Premotaj je na početak da zasvira.** Kaseta je „na kraju vrpce”; drži tipku za unazad ili
   povuci kasetu ulijevo (oko 2 s). Čuje pjesmu ubrzano unatrag, a na početku pjesma krene.
   Uvijek postoji „samo pusti”. Bez teksta: samo animirane strelice uz kasetu; „samo pusti” se pojavi nakon ~9 s. Tijekom koraka 1–3 jahači su skriveni.
4. **Poruka** rukopisom, pa **reakcija** ikonom; tek nakon reakcije ispod nje se pojave tajni
   `ps` i poveznica „javi mu”.
5. **Spremi kasetu u kutiju** — završetak. Ispod piše koliko još do sljedeće naljepnice; ako se
   upravo otključala, pokaže se velika. Mala kaseta poleti od gumba do jahača Kutija.
6. Na dnu, sitno: poveznice na cijelu pjesmu (Spotify · YouTube) i odbrojavanje do sljedeće.
   Ugrađenog Spotify/YouTube playera nema: svira kasetofon.

Nakon otkrivanja kaseta ostaje pravi player: tipke s natpisima (drži za premotavanje),
povlačenje kasete (strelice na donjoj ploči), **klizač** s ručkom, i **mali player** iznad
jahača kad tipke izađu s ekrana.

**Šapat** („psst… netko ti je nešto napisao”, `peek` u `app.js`) pojavljuje se SAMO ako se ono
na što upućuje (poruka; u Kutiji naljepnice) još ne vidi na ekranu. Ako je poruka već vidljiva,
šapata nema.

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
- **Rijetka kaseta** (`designFor().rare`, otprilike svaka šesta, uvijek ista za istu pjesmu): zlatna folija umjesto srebrne, zlatni žig „rijetka” na kaseti, više konfeta i dulji zvon (`fx.rare`), isprekidan zlatni rub u Kutiji. Razlog: promjenjiva nagrada (kao rijetke karte u igrama s paketima) čini svaki dan malo neizvjesnim. Žig je ravna boja, bez sjaja.
- **Odgovor pjesmom**: uz „javi mu” stoji „pošalji mu svoju pjesmu” (WhatsApp ili dijeljenje s unaprijed napisanim tekstom; link zalijepi sama). Nema servera ni pohrane njenih pjesama, namjerno.
- **Cedulja „dodaj na početni zaslon”** u Kutiji: samo na iOS/Android, samo dok stranica nije dodana (`display-mode: standalone`) i dok je ne zatvori.
- **Uske kasete (320 px)**: naslov na naljepnici je manji, a strelice za premot su ispod kasete, nikad preko naljepnice.
- **Jedan ritual, ne izmjena četiri igre.** Navika traži isti početak; raznolikost dolazi iz
  pjesme, poruke, izgleda kasete i povremenog „pogodi unazad”.
- **Trud prije nagrade, ali kratak** (grebanje nekoliko sekundi, premotavanje oko dvije) i
  uvijek s izlazom. Poruka dolazi tek nakon truda i uz glazbu.
- **Siluete i „još N do…”** drže znatiželju i pokazuju da je cilj blizu.
- **Spremanje u kutiju je kraj**, da dan završi s osjećajem dovršenosti.

Stanje (otvoreno, spremljeno, reakcije, niz) živi samo u `localStorage` njenog mobitela.
**Reset pjesme** (kartica „Danas svira” u sučelju za unos: „Resetiraj pjesmu” i „Samo na ovom uređaju”; stranica i admin su na istoj adresi pa admin može očistiti `localStorage` stranice): pjesma
dobije polje `reset` (vrijeme u ms). Kad njena stranica vidi oznaku koju još nije primijenila
(`state.resets`), zaboravi da je pjesma otvorena, spremljena i ocijenjena, pa je ona opet
otkriva. Niz dana i ostale pjesme ostaju. Radi tek nakon objave, jer stanje živi na njenom
mobitelu, a ovako ga se može resetirati na daljinu bez servera.
Stranica se može dodati na početni zaslon (`manifest.webmanifest`, `icon-*.png`); nema
service workera, namjerno, da nikad ne vidi staru verziju.

## Struktura

- `public/` — cijela stranica (statično): `index.html`, `style.css`, `app.js`, `pixel.js`, ikone, manifest
  - `admin/index.html` — sučelje za unos (prijava lozinkom; radi i uživo i lokalno)
- `api/` — Vercel funkcije: `songs.js` (javni sadržaj kao JS, samo objavljene pjesme), `data.js`
  (čitanje/spremanje, traži prijavu), `lookup.js` (podaci iz linka), `audio.js` (vlastiti zvuk,
  do 4 MB), `media.js` (zvuk za nju: `/media/<ime>`, s Range), `login.js`
- `lib/` — `core.mjs` (čista logika: provjera podataka, dohvat linka, javni pogled), `store.mjs`
  (PRIVATNI Vercel Blob: `mixtape/data.json` i `mixtape/audio/`; lokalno datoteka), `http.mjs` (prijava, zaštita, tijelo zahtjeva)
- `data/songs.js` — **početni sadržaj** (dok u Blobu ništa nije spremljeno) i sadržaj lokalnog servera
- `server.mjs` — lokalni server (bez lozinke, 127.0.0.1): stranica, `/admin`, ista sučelja API-ja
- `scripts/check-songs.mjs` — provjera `data/songs.js`, pokreće se i kao Vercel build
- `scripts/dev-live.mjs` — lokalno pokreće ISTE funkcije kao Vercel (`node scripts/dev-live.mjs`,
  http://localhost:4330, lozinka `lokalna-lozinka`, pohrana u `data/.live-dev.json`): za
  isprobavanje živog toka (prijava, spremanje, reset) prije objave
- `tools/qr.html` — generator QR koda
- `vercel.json`, `package.json` (jedina ovisnost: `@vercel/blob`)

**Uživo je izvor istine Vercel Blob, ne git.** Sadržaj se mijenja u `/admin` i odmah je live;
`data/songs.js` je samo početno stanje. Nema više gumba „Objavi” uživo (lokalni server ga i dalje ima).

## Pravila

- Stranica (`public/`) je čisti HTML/CSS/JS bez frameworka i build koraka. Backend su male
  Vercel funkcije bez frameworka; jedina ovisnost je `@vercel/blob`.
- **Sigurnost**: sve u `api/` osim `songs.js` i `login.js` traži prijavu (cookie `mx_admin`,
  HMAC, HttpOnly/Secure/SameSite=Strict) i zaglavlje `X-Mixtape`; lozinka je samo u Vercel
  okruženju (`ADMIN_PASSWORD`), nikad u kodu. `api/songs.js` mora ostati jedino što stranica
  čita i **nikad ne smije poslati pjesme čije vrijeme nije došlo** (`publicData` u `lib/core.mjs`).
- **Zvuk**: `audio` (datoteka u `public/audio/`) ima prednost pred `preview` (službeni isječak
  od 30 s s iTunesa, svira se s njihovog servera). Ne dodaji skidanje cijelih pjesama sa
  Spotifyja/YouTubea — to bi bilo javno dijeljenje tuđe glazbe; vlastiti zvuk je za ono što
  korisnik smije dijeliti (glasovna poruka, vlastita snimka). Admin ima gumb „Snimi glas”: MediaRecorder, pa se u pregledniku pretvara u WAV (mono 22 kHz, do 80 s) da svira i na iPhoneu.
- **Zvučni efekti** (`fx` u `app.js`) su sintetizirani kroz Web Audio — nema zvučnih datoteka.
  **Mobiteli:** zvuk se otključava na prvi dodir bilo gdje (`touchstart/touchend/pointerup/click`,
  jer iOS priznaje tek `touchend`/`click`), a efekti zaobilaze tihi način mobitela preko
  `navigator.audioSession.type = "playback"` (iOS 17+) i uvijek tihim `<audio>` u petlji (gasi se kad
  stranica ode u pozadinu). Prvi potez po foliji može biti nijem: preglednik zvuk otključava tek kad
  prst napusti ekran.
  Bez toga efekti šute, a pjesma (običan `<audio>`) svira.
  Premotavanje pušta dekodirani isječak unazad/unaprijed (`fx.scrub`); ako se zvuk ne može
  dekodirati (CORS, datoteka veća od 3 MB), ostaje samo šum motora. AudioContext se smije
  stvoriti tek na dodir. Sve mora poštovati gumb za utišavanje (`state.muted`).
- **Mobile-first**: dok traje igra sve stane na jedan ekran (`.stage.gaming`), a kontrole su
  dolje pod palcem; dodirne mete su najmanje 44 px. Nakon otkrivanja redoslijed je:
  kaseta i tipke, pjesma, spremanje u kutiju, poruka, reakcija, P.S., cijela pjesma, odbrojavanje.
- Lokalni `server.mjs` sluša samo na 127.0.0.1 i nema lozinku — ne izlagati ga na internet.
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
- **`public/songs.js` NE SMIJE postojati.** Vercel prvo poslužuje datoteku iz `public/`, a tek onda
  primijeni `rewrite` na funkciju, pa bi zaostala statična kopija zasjenila živi sadržaj (stranica bi
  vječno prikazivala staro: nove pjesme i reset se ne bi vidjeli). Sadržaj je u `data/songs.js`
  (početni) i u Blobu (živi). Datoteka je u `.gitignore`, a build je briše.
- **`/songs.js` se nikad ne smije keširati na Vercelovom CDN-u.** Pravilo `headers` u `vercel.json`
  s `public, max-age=0, must-revalidate` na tom putu nadjačalo je `no-store` funkcije pa je CDN
  danima/minutama držao staru kopiju (nova pjesma i reset se nisu vidjeli). Zato `songs.js` nije u
  tom pravilu, a `lib/http.mjs` šalje i `CDN-Cache-Control: no-store`. Provjera: `curl -sI /songs.js`
  ne smije imati `x-vercel-cache: HIT`.
- **Stranica nikad ne smije imati bočno pomicanje** (na iPhoneu se pomaknula udesno): konfeti i
  strugotine žive u fiksnom sloju koji reže (`#fx-layer`), `.peek` nema `left:50%` + translate,
  a `html`/`body` imaju `overflow-x: clip` i `touch-action: pan-y pinch-zoom`.
- **Svježina stranice** (`checkFresh` u `app.js`): mobilni preglednici vraćaju stranicu iz memorije
  (gumb natrag) ili je zamrznu u pozadini, pa bi vidjela staro stanje (npr. resetiranu pjesmu).
  Zato `pageshow` iz memorije radi reload, a nakon povratka iz pozadine se `/songs.js` usporedi
  s učitanim i po promjeni se stranica učita opet.
- U adminu nema `confirm()`: potvrde su u samoj stranici (dvostruki klik), jer ga mobilni preglednici znaju ugušiti.
- Isprobavanje igre: `?igra=scratch`, `?igra=guess`. Stara pjesma: `?t=<date>`.

## Kad korisnik kaže „dodaj pjesmu” (glavni posao)

Korisnik to inače radi sam u živom sučelju (`/admin` na objavljenoj adresi, uz lozinku). Ako traži od tebe,
najlakše je preko istog API-ja dok server radi: `POST /api/lookup {url}` vrati naslov,
izvođača, omot i isječke, a `PUT /api/data` sprema cijeli `{config, songs}` (zaglavlje
`X-Mixtape: 1`). Ta sučelja traže prijavu uživo; lokalno (`node server.mjs`) ne. Ručno se uređuje samo početni sadržaj `data/songs.js`, po koracima ispod.

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
5. Dodaj unos u `data/songs.js` sortirano po vremenu, u istom formatu kao ostali.
6. Pokreni `node scripts/check-songs.mjs` i popravi greške.
7. Commitaj (`Pjesma za YYYY-MM-DD: Naslov — Izvođač`). Pushaj samo ako korisnik to traži
   ili je to već odobrio u ovoj sesiji.

Više pjesama odjednom pa rasporedi ih redom na uzastopne slobodne dane.

## Lokalno

```bash
node server.mjs                  # stranica http://localhost:4321, unos http://localhost:4321/admin
node scripts/check-songs.mjs     # provjera sadržaja
```
