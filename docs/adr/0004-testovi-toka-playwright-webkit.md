# ADR 0004: Testovi toka u Playwright WebKitu

Status: prihvaćeno

## Kontekst
Greške u toku (zvuk, novčić, pjesma koja svira prerano) vide se tek na mobitelu. iOS Simulator traži
puni Xcode koji nije uvijek dostupan.

## Odluka
`tests/flow.test.mjs` (Node test runner + Playwright, iPhone 13 emulacija, WebKit) prolazi cijeli tok
od zaključanog omota do kutije i provjerava pravila iz `docs/FLOW.md`. `playwright` je dev ovisnost,
a produkcija i dalje ovisi samo o `@vercel/blob`.

## Posljedice
Ne zamjenjuje test na pravom iPhoneu (zvuk, tihi prekidač). Trebaju `npm install` i
`npx playwright install webkit`.
