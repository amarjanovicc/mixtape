# ADR 0003: Zvuk na mobitelu i pjesma koja se ne smije pokrenuti prije otvaranja

Status: prihvaćeno

## Kontekst
Pjesma je običan `<audio>`, a efekti (grebanje, tipke, zvon) Web Audio. iOS ušutka Web Audio ako
kontekst nije pokrenut u priznatom dodiru ili je telefon na tihom, a `<audio>` pušta iz koda samo ako
je taj element već jednom pokrenut u dodiru. Prvi popravak je „budio” `<audio>` pri prvom dodiru
bilo gdje, što je pjesmu pokretalo (tiho) dok je omot još bio zaključan.

## Odluka
- Web Audio: kontekst se stvara i budi u svakom dodiru (`fx.unlock`), `audioSession = playback`,
  i uvijek tihi `<audio>` u petlji (u DOM-u).
- Budenje pjesme (`fx.allowPrime`) dopušteno je tek kad je omot otvoren, a ne prije.
- `?dbg=1` ispisuje stanje zvuka za dijagnostiku na pravom mobitelu.

## Posljedice
Test „klik po pozadini ne pokreće pjesmu” čuva ovo. Čujnost zvuka testovi ne dokazuju.
