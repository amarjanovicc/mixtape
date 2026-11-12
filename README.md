# Mixtape — pjesma dana 💌

Ona skenira QR kod (uvijek isti) → otvori se kaseta sa skrivenom pjesmom koja te podsjetila na nju.

**Zašto se isplati otvoriti svaki dan:**

- 🎮 **Pjesma je skrivena** — vidi samo trag (npr. `🚗🌊`) i mora je otkriti: jedan dan grebe karticu, drugi puni srce tapkanjem, treći drži gumb dok se kaseta premotava.
- 💌 Nakon otkrivanja: konfeti, player, tvoja poruka rukopisom.
- 😍 Reagira emojijem → otključa se **tajni P.S.** i gumb „javi mu” koji ti pošalje njenu reakciju (WhatsApp).
- ⏳ Odbrojavanje do sljedeće pjesme i niz „🔥 5 dana zaredom”.
- 📼 „Tvoja kaseta” — raste svaki dan; sve dosadašnje pjesme s njenim reakcijama.

Čisti HTML/CSS/JS, bez servera, ovisnosti i build koraka.

## Dodaj pjesmu

Uredi [`public/songs.js`](public/songs.js):

```js
{
  date: "2026-11-13",              // ili "2026-11-13 18:30" za točno vrijeme
  title: "Lover",
  artist: "Taylor Swift",
  hint: "🚗🎤",                    // trag prije otkrivanja
  note: "jer smo je pjevali u autu na putu za more",
  ps: "u subotu vozim ja",         // tajna poruka nakon njene reakcije
  spotify: "https://open.spotify.com/track/...",
},
```

Obavezni su samo `date` i `title`. Uvijek se prikazuje najnovija pjesma čije je vrijeme došlo, pa:

- **jednom dnevno** → dodaj pjesme s datumima unaprijed, mijenjaju se u ponoć;
- **kad god** → dodaj pjesmu s današnjim datumom i vremenom (`"2026-11-13 18:30"`); čim to vrijeme prođe, ona dobije novu igru i novu pjesmu.

Provjeri pa pushaj:

```bash
node scripts/check-songs.mjs
```

Ili u Claude Code u ovom folderu reci: *„dodaj za sutra Lover od Taylor Swift, jer…”* — [`CLAUDE.md`](CLAUDE.md) mu objašnjava cijeli postupak.

## Prvo postavljanje

1. U `public/songs.js` upiši `config.to` (njeno ime), `config.from` (potpis) i `config.whatsapp` (tvoj broj, samo znamenke s pozivnim), obriši primjere i dodaj svoje pjesme.
2. Napravi repo na GitHubu i pushaj na `main`.
3. Na GitHubu: **Settings → Pages → Source: GitHub Actions**. Svaki push provjeri pjesme i objavi stranicu na `https://<korisnik>.github.io/<repo>/`.
   (Pages iz privatnog repoa traži plaćeni plan — alternativa je Netlify/Cloudflare Pages s folderom `public`.)
4. Otvori [`tools/qr.html`](tools/qr.html), upiši adresu stranice, preuzmi PNG i isprintaj.

## Lokalno

```bash
python3 -m http.server 4321 -d public
```

Pa otvori http://localhost:4321. Igru možeš ponovno odigrati s `?igra=scratch`, `?igra=tap` ili `?igra=hold`.

## Napomene

- „Sada” se računa po zoni `Europe/Zagreb` (`config.timeZone`).
- Njen niz, reakcije i što je otvorila pamte se samo u njenom mobitelu (bez servera). Ako obriše podatke preglednika ili skenira drugim mobitelom, kreće ispočetka.
- Spotify player svira cijelu pjesmu ako je prijavljena u Spotify u pregledniku, inače 30 s; gumb *Spotify* uvijek otvara aplikaciju.
- Sadržaj `songs.js` je dostupan svakome tko zna adresu (i buduće pjesme, ako netko čačka po kodu).
