# Mixtape — pjesma dana

Ona skenira QR kod (uvijek isti) pa otvori se kaseta sa skrivenom pjesmom koja te podsjetila na nju.

**Kako izgleda njen dan:**

1. **Kaseta je srećka.** Naljepnica kasete prekrivena je srebrnom folijom. Vidi samo trag i grebe je prstom, a ispod rukom piše koja je pjesma. Svaka peta pjesma je umjesto toga "pogodi unazad".
2. **Kaseta.** Premota je na početak (drži tipku ili povuče kasetu ulijevo), čuje pjesmu ubrzano unatrag, i onda pjesma zasvira.
3. **Poruka.** Tvoja poruka rukopisom, pa reakcija ikonom koja otključa tajni P.S. i gumb "javi mu".
4. **Kutija.** Kasetu spremi u kutiju. Svaka izgleda drugačije, a propušteni dani ostaju prazna mjesta koja može naknadno popuniti.
5. **Naljepnice.** Kad skupi dovoljno kaseta, otključa pixel-art naljepnicu: nju, tebe, vaše životinje i na kraju vas dvoje, svaku s tvojom porukom. Zaključane vidi kao siluete.

Nagrade idu po broju spremljenih kaseta, ne po nizu dana, pa propušten dan ništa ne oduzima. Zvuk se može utišati, a stranicu može dodati na početni zaslon.

Čisti HTML/CSS/JS, bez ovisnosti i build koraka. Na stranici nema emojija: sve su vlastite SVG ikone.

## Dodaj pjesmu (sučelje, live)

Otvori **https://mixtape-wine.vercel.app/admin** i prijavi se lozinkom (`ADMIN_PASSWORD` u Vercelu). Sve što spremiš je **odmah live**, bez commita i čekanja objave. Obrazac ima tri koraka:

1. **Zalijepi link** sa Spotifyja ili YouTubea. Naslov, izvođač, omot i službeni isječak od 30 s popune se sami.
2. **Kad se pojavi?** Sljedeći slobodan dan (zadano), odmah, ili odabrani dan.
3. **Zašto te podsjetila na nju?** Tvoja poruka.

Zatim *Spremi pjesmu*. Uz pjesmu koja trenutno svira je gumb **Resetiraj**: ona je odmah opet otkriva od početka (igra, premotavanje, poruka), a iz kutije joj nestaje dok je ponovno ne spremi. Niz dana ostaje.

Ostalo je skriveno pod **Više opcija**: trag prije otkrivanja, tajni P.S., odabir igre, izbor isječka i vlastiti zvuk (mp3, m4a, ogg, wav, do 4 MB). Njeno ime, tvoj potpis, WhatsApp, likovi za naljepnice (kosa, ten, životinje) i same naljepnice su pod **Postavke**.

Kako je to složeno: pjesme i zvukovi su u Vercel Blobu, a njena stranica ih dobiva preko `/songs.js` (funkcija `api/songs.js`). **Pjesme čije vrijeme još nije došlo nikad ne napuštaju server**, pa ih nitko ne može pročitati iz koda stranice; vidi se samo odbrojavanje do sljedeće. Dok pohrana ne postoji, stranica prikazuje početni sadržaj iz `data/songs.js`.

Uvijek se prikazuje najnovija pjesma čije je vrijeme došlo:

- **jednom dnevno** pa pjesme s datumima unaprijed, mijenjaju se u ponoć;
- **kad god** pa dan + vrijeme; čim to vrijeme prođe, ona dobije novu igru i novu pjesmu.

### O zvuku

Sučelje **ne skida cijele pjesme** sa Spotifyja ili YouTubea: to bi značilo javno dijeliti tuđu glazbu s tvoje stranice (a Spotify je ionako zaštićen). Umjesto toga:

- **isječak od 30 s** — službeni pretpregled (iTunes), svira sam nakon otkrivanja;
- **cijela pjesma** — gumbi i player za Spotify/YouTube odmah ispod;
- **vlastiti zvuk** — za ono što smiješ dijeliti: glasovna poruka, tvoja snimka ili obrada. Glasovna poruka umjesto pjesme zna biti i najbolji dan na kaseti.

Sučelje radi samo na tvom računalu (127.0.0.1) i nema lozinku, pa ga ne izlaži na internet. Objavljena stranica ostaje statična.

Polja pjesme (vidi i početni sadržaj u [`data/songs.js`](data/songs.js)): `date`, `title`, `artist`, `hint`, `note`, `ps`, `spotify`, `youtube`, `audio`, `preview`, `cover`, `reveal`. Početni sadržaj provjeri s `node scripts/check-songs.mjs`.

**Adresa stranice: https://mixtape-wine.vercel.app** (QR kod vodi na nju; ne mijenja se kad dodaješ pjesme).

## Prvo postavljanje

1. Repozitorij je na GitHubu (privatan), a Vercel objavljuje svaki push na `main`. Postavke su u `vercel.json` (izlazni folder `public`, funkcije u `api/`, prije objave provjera početnog sadržaja).
2. U Vercelu, projekt `mixtape`: **Storage, Create, Blob** (poveži s projektom) i **Settings, Environment Variables, `ADMIN_PASSWORD`** (dugačka lozinka). Nakon toga *Redeploy*.
3. Otvori `/admin`, prijavi se, u *Postavke* upiši njeno ime, svoj potpis i WhatsApp, obriši primjere i dodaj svoje pjesme.
4. Otvori [`tools/qr.html`](tools/qr.html), adresa je već upisana; preuzmi PNG i isprintaj.

## Isprobavanje

`node server.mjs` pa http://localhost:4321 (lokalna kopija koja piše u `data/songs.js`, bez lozinke; ne dira live). Igru možeš ponovno odigrati s `?igra=scratch` ili `?igra=guess`.

## Napomene

- „Sada” se računa po zoni `Europe/Zagreb` (`config.timeZone`).
- Njen niz, reakcije i što je otvorila pamte se samo u njenom mobitelu (bez servera). Ako obriše podatke preglednika ili skenira drugim mobitelom, kreće ispočetka.
- Spotify player svira cijelu pjesmu ako je prijavljena u Spotify u pregledniku, inače 30 s; gumb *Spotify* uvijek otvara aplikaciju.
- Objavljene pjesme vidi svatko tko zna adresu; buduće ne vidi nitko.
