# Tok igre: kako se stranica mora ponašati

Ovo je izvor istine za ponašanje dnevnog rituala. Svaka promjena toka mora ažurirati ovaj dokument
i `tests/flow.test.mjs` (pokreće se s `npm test`). Zašto je nešto baš tako: `docs/adr/`.

## Načelo: jednostavno

1. **Jedan korak, jedna uputa.** Na ekranu je u svakom trenutku najviše jedna rečenica i jedan
   predmet koji se dira. Nema objašnjenja uz objašnjenje (npr. natpis pod novčićem + natpis ispod
   + ceduljica traga odjednom).
2. **Predmet pokazuje što treba**: novčić koji pulsira, strelice uz kasetu. Tekst samo potvrđuje.
3. **Uvijek izlaz** („samo otvori”, „samo pusti”), ali tek kad zatreba (10 s, 9 s), da ne
   odvlači od igre.
4. **Ništa se ne može preskočiti ni slučajno pokrenuti**: dok je omot zaključan pjesma se ne
   smije ni čuti, ni tiho pokrenuti, ni pojaviti u playeru.
5. **Greška se oprašta**: puštanje novčića ga vraća dolje i može ga se opet uzeti; propušten dan
   ništa ne oduzima.

## Koraci (jedan po jedan)

| # | Što vidi | Što radi | Što se čuje / dogodi |
| --- | --- | --- | --- |
| 1 | omot pod folijom, novčić, „dodirni novčić” | **dodirne novčić** | zvuk se otključa; novčić poleti nad omot, tekst „sad grebi omot” |
| 2 | novčić nad omotom | **grebe** po foliji (prst vuče novčić) | grebanje čim dodirne foliju; puštanjem prsta novčić se vrati dolje („uzmi novčić…”); ~16 poteza pa se pojavi trag |
| 3 | ~60 % ogrebano | ništa | zvon, omot se otvori, kaseta izleti i spusti se, omot odleti |
| 4 | kaseta, tipke, strelice | **drži „unazad”** ili povuče kasetu ulijevo (~2 s) | zvuk premotavanja; na početku pjesma zasvira |
| 5 | poruka rukopisom | čita | pjesma svira; tipke se mogu koristiti; mali player kad tipke izađu s ekrana |
| 6 | reakcije | **dodirne reakciju** | pojave se tajni P.S., „javi mu”, „pošalji mu svoju pjesmu” |
| 7 | „spremi kasetu u kutiju” | **dodirne** | kaseta poleti u Kutiju; piše koliko do sljedeće naljepnice |

Alternativa koraka 1: „pogodi unazad” (svaka peta pjesma, ili `reveal: guess`).

## Stanja i pravila

- **Tijekom koraka 1 do 4**: jahači (Danas / Kutija) skriveni, mali player skriven, šapat skriven.
- **Pjesma** (`<audio>`) se pokreće samo iz premotavanja (korak 4) ili tipkom „pusti”. Klik po
  pozadini u koracima 1 do 3 ne smije je pokrenuti.
- **Novčić**: središnji (nikad pomaknut u stranu), dodir ga podiže, puštanje ga vraća. Prvi put
  se ne hvata povlačenjem (iOS otključava zvuk samo na dodir; vidi ADR 0002).
- **Već otvorena pjesma** (ponovno skeniranje QR-a): nema igre, odmah poruka i player.
- **Bez bočnog pomicanja** na 320 i 375 px.
- **Zvuk**: efekti kroz Web Audio, pjesma kroz `<audio>`; utišavanje gasi oboje.

## Isprobavanje

```bash
npm install && npx playwright install webkit   # jednom
npm test                                        # cijeli tok u iPhone emulaciji (WebKit)
```

Na mobitelu: `?dbg=1` ispiše stanje zvuka; `?igra=scratch` / `?igra=guess` prisili igru.
Testovi ne mogu potvrditi da se zvuk stvarno ČUJE (nema tihog prekidača ni pravog iOS pravila o
dodiru): to se provjerava na pravom telefonu.
