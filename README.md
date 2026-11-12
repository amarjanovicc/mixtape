# Mixtape — pjesma dana

Ona skenira QR kod (uvijek isti) pa otvori se kaseta sa skrivenom pjesmom koja te podsjetila na nju.

**Kako izgleda njen dan:**

1. **Srećka.** Vidi samo trag i grebe srebrnu foliju da otkrije koja je pjesma. Svaka peta pjesma je umjesto toga "pogodi unazad".
2. **Kaseta.** Premota je na početak (drži tipku ili povuče kasetu ulijevo), čuje pjesmu ubrzano unatrag, i onda pjesma zasvira.
3. **Poruka.** Tvoja poruka rukopisom, pa reakcija ikonom koja otključa tajni P.S. i gumb "javi mu".
4. **Kutija.** Kasetu spremi u kutiju. Svaka izgleda drugačije, a propušteni dani ostaju prazna mjesta koja može naknadno popuniti.
5. **Naljepnice.** Kad skupi dovoljno kaseta, otključa pixel-art naljepnicu: nju, tebe, vaše životinje i na kraju vas dvoje, svaku s tvojom porukom. Zaključane vidi kao siluete.

Nagrade idu po broju spremljenih kaseta, ne po nizu dana, pa propušten dan ništa ne oduzima. Zvuk se može utišati, a stranicu može dodati na početni zaslon.

Čisti HTML/CSS/JS, bez ovisnosti i build koraka. Na stranici nema emojija: sve su vlastite SVG ikone.

## Dodaj pjesmu (sučelje)

```bash
node server.mjs
```

Otvori http://localhost:4321/admin. Obrazac ima tri koraka:

1. **Zalijepi link** sa Spotifyja ili YouTubea. Naslov, izvođač, omot i službeni isječak od 30 s popune se sami.
2. **Kad se pojavi?** Sljedeći slobodan dan (zadano), odmah, ili odabrani dan.
3. **Zašto te podsjetila na nju?** Tvoja poruka.

Zatim *Spremi pjesmu*. Žuti okvir na vrhu javi da ima promjena koje ona još ne vidi; *Objavi* ih šalje (provjera, git commit i push ako repo ima `origin`).

Ostalo je skriveno pod **Više opcija**: trag prije otkrivanja, tajni P.S., odabir igre, izbor isječka i vlastiti zvuk (mp3, m4a, ogg, wav, sprema se u `public/audio/`). Njeno ime, tvoj potpis, WhatsApp, likovi za naljepnice (kosa, ten, životinje) i same naljepnice su pod **Postavke**.

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

`node server.mjs` pa http://localhost:4321. Igru možeš ponovno odigrati s `?igra=scratch` ili `?igra=guess`.

## Napomene

- „Sada” se računa po zoni `Europe/Zagreb` (`config.timeZone`).
- Njen niz, reakcije i što je otvorila pamte se samo u njenom mobitelu (bez servera). Ako obriše podatke preglednika ili skenira drugim mobitelom, kreće ispočetka.
- Spotify player svira cijelu pjesmu ako je prijavljena u Spotify u pregledniku, inače 30 s; gumb *Spotify* uvijek otvara aplikaciju.
- Sadržaj `songs.js` je dostupan svakome tko zna adresu (i buduće pjesme, ako netko čačka po kodu).
