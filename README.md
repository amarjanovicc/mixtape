# Pjesma dana 💌

Ona skenira QR kod → otvori se stranica s današnjom pjesmom i porukom zašto te podsjetila na nju.

- Prvi put u danu stranica pokaže kuvertu „Imaš novu pjesmu” → dodir → pjesma, Spotify player, poruka.
- Pjesme s budućim datumom su skrivene dok ne dođe njihov dan, pa možeš napuniti tjedan unaprijed.
- Ako zaboraviš dodati pjesmu, prikaže se zadnja — stranica nikad nije prazna.
- Ispod je arhiva prijašnjih pjesama.

Čisti HTML/CSS/JS, bez ovisnosti i bez build koraka — nema što puknuti.

## Svakodnevno: dodaj pjesmu

Uredi [`public/songs.js`](public/songs.js):

```js
{
  date: "2026-11-13",
  title: "Lover",
  artist: "Taylor Swift",
  note: "jer smo je pjevali u autu na putu za more",
  spotify: "https://open.spotify.com/track/...",   // neobavezno → ugrađeni player
},
```

Spotify link: u aplikaciji *Share → Copy Song Link*. Bez linka stranica ponudi pretragu na Spotifyju i YouTubeu.

Provjeri pa pushaj:

```bash
node scripts/check-songs.mjs
```

Ili u Claude Code u ovom folderu samo reci: *„dodaj za sutra Lover od Taylor Swift, jer…”* — [`CLAUDE.md`](CLAUDE.md) mu objašnjava cijeli postupak.

## Prvo postavljanje

1. U `public/songs.js` upiši `config.to` (njeno ime) i `config.from` (potpis), obriši primjere i dodaj svoje pjesme.
2. Napravi **privatni ili javni** repo na GitHubu i pushaj na `main`.
3. Na GitHubu: **Settings → Pages → Source: GitHub Actions**. Svaki push na `main` provjeri pjesme i objavi stranicu na `https://<korisnik>.github.io/<repo>/`.
   (GitHub Pages iz privatnog repoa traži plaćeni plan — alternativa je Netlify/Cloudflare Pages s folderom `public`.)
4. Otvori [`tools/qr.html`](tools/qr.html) u pregledniku, upiši adresu stranice, preuzmi PNG i isprintaj/pokloni.

## Lokalno

```bash
python3 -m http.server 4321 -d public
```

Pa otvori http://localhost:4321. Za testiranje drugog dana: `?d=2026-11-10` (radi samo za današnje i prošle datume).

## Napomene

- „Danas” se računa po zoni `Europe/Zagreb` (mijenja se u `config.timeZone`).
- Spotify player svira cijelu pjesmu ako je prijavljena u Spotify u pregledniku, inače 30 s pretpregleda — gumb *Spotify* uvijek otvara aplikaciju.
- Sadržaj `songs.js` je javno dostupan svakome tko zna adresu (i buduće pjesme, ako netko čačka po kodu).
