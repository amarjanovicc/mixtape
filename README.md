# Mixtape — pjesma dana

Ona skenira QR kod (uvijek isti) pa otvori se kaseta sa skrivenom pjesmom koja te podsjetila na nju.

**Zašto se isplati otvoriti svaki dan:**

- **Pjesma je skrivena** — vidi samo trag (npr. „naša prva vožnja”) i mora je otkriti: jedan dan grebe **srećku** sa srebrnom folijom, drugi puni srce tapkanjem, treći drži gumb dok se kaseta premotava.
- Nakon otkrivanja **pjesma krene svirati**, uz konfete i tvoju poruku rukopisom.
- **Kaseta je pravi player**: povuče je prstom ili drži tipke za premotavanje i kolutovi se vrte unazad i unaprijed dok se zvuk premotava.
- **Zvučni efekti**: dok premotava, pjesma se čuje ubrzano unazad (kao kad rukom vratiš ploču), srećka šušti pod prstom i zazvoni kad dobije, tipke kazetofona klikću. Gumb zvučnika gore desno sve utiša.
- Reagira emojijem pa otključa se **tajni P.S.** i gumb „javi mu” koji ti pošalje njenu reakciju (WhatsApp).
- Odbrojavanje do sljedeće pjesme i niz „5 dana zaredom”.
- **Kutija s kasetama**: svaku otvorenu kasetu sprema u kutiju. Svaka izgleda drugačije, a propušteni dani ostaju prazna mjesta.
- **Pogodi unazad**: četvrta igra, čuje nekoliko sekundi pjesme unatrag i bira između tri naslova.
- **Nagrade za niz**: kuponi koje upišeš u sučelju (npr. 7 dana: doručak u krevet) otključaju se kad otvara dovoljno dana zaredom.
- Stranicu može dodati na početni zaslon kao aplikaciju.

Čisti HTML/CSS/JS, bez ovisnosti i build koraka. Na stranici nema emojija: sve su vlastite SVG ikone.

## Dodaj pjesmu (sučelje)

```bash
node server.mjs
```

Otvori http://localhost:4321/admin:

1. Zalijepi **Spotify ili YouTube link** pa *Dohvati*. Naslov, izvođač, omot i službeni isječak od 30 s popune se sami.
2. Odaberi dan (i vrijeme, ako želiš), napiši poruku, trag i tajni P.S.
3. Po želji učitaj **vlastiti zvuk** (mp3, m4a, ogg, wav) — sprema se u `public/audio/` i svira umjesto isječka.
4. *Spremi pjesmu*, pa *Objavi* (provjera + git commit + push, ako repo ima `origin`).

Uvijek se prikazuje najnovija pjesma čije je vrijeme došlo:

- **jednom dnevno** pa pjesme s datumima unaprijed, mijenjaju se u ponoć;
- **kad god** pa dan + vrijeme; čim to vrijeme prođe, ona dobije novu igru i novu pjesmu.

### O zvuku

Sučelje **ne skida cijele pjesme** sa Spotifyja ili YouTubea: to bi značilo javno dijeliti tuđu glazbu s tvoje stranice (a Spotify je ionako zaštićen). Umjesto toga:

- **isječak od 30 s** — službeni pretpregled (iTunes), svira sam nakon otkrivanja;
- **cijela pjesma** — gumbi i player za Spotify/YouTube odmah ispod;
- **vlastiti zvuk** — za ono što smiješ dijeliti: glasovna poruka, tvoja snimka ili obrada. Glasovna poruka umjesto pjesme zna biti i najbolji dan na kaseti.

Sučelje radi samo na tvom računalu (127.0.0.1) i nema lozinku, pa ga ne izlaži na internet. Objavljena stranica ostaje statična.

Polja se mogu uređivati i ručno u [`public/songs.js`](public/songs.js): `date`, `title`, `artist`, `hint`, `note`, `ps`, `spotify`, `youtube`, `audio`, `preview`, `cover`, `reveal`. Nakon ručne promjene: `node scripts/check-songs.mjs`.

## Prvo postavljanje

1. U sučelju pod *Postavke* upiši njeno ime, svoj potpis i WhatsApp broj, obriši primjere i dodaj svoje pjesme.
2. Napravi repo na GitHubu i pushaj na `main`.
3. Na GitHubu: **Settings pa Pages pa Source: GitHub Actions**. Svaki push provjeri pjesme i objavi stranicu na `https://<korisnik>.github.io/<repo>/`.
   (Pages iz privatnog repoa traži plaćeni plan — alternativa je Netlify/Cloudflare Pages s folderom `public`.)
4. Otvori [`tools/qr.html`](tools/qr.html), upiši adresu stranice, preuzmi PNG i isprintaj.

## Isprobavanje

`node server.mjs` pa http://localhost:4321. Igru možeš ponovno odigrati s `?igra=scratch`, `?igra=tap`, `?igra=hold` ili `?igra=guess`.

## Napomene

- „Sada” se računa po zoni `Europe/Zagreb` (`config.timeZone`).
- Njen niz, reakcije i što je otvorila pamte se samo u njenom mobitelu (bez servera). Ako obriše podatke preglednika ili skenira drugim mobitelom, kreće ispočetka.
- Spotify player svira cijelu pjesmu ako je prijavljena u Spotify u pregledniku, inače 30 s; gumb *Spotify* uvijek otvara aplikaciju.
- Sadržaj `songs.js` je dostupan svakome tko zna adresu (i buduće pjesme, ako netko čačka po kodu).
