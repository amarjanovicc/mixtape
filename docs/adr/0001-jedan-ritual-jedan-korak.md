# ADR 0001: Jedan ritual, u svakom trenutku jedan korak

Status: prihvaćeno

## Kontekst
Cilj je da joj bude zabavno otvoriti stranicu svaki dan, a ne da svaki put uči novu igru. Kroz
razvoj su se gomilali natpisi, ceduljice i stanja (natpis pod novčićem, poruka ispod, trag,
„samo otvori”, tekst uz premotavanje), pa je tok postajao zbunjujuć.

## Odluka
- Isti ritual svaki dan, raznolikost dolazi iz pjesme, poruke, izgleda kasete i povremenog
  „pogodi unazad” i rijetke kasete.
- Najviše jedna uputa i jedan predmet za diranje na ekranu. Predmeti (novčić koji pulsira,
  strelice uz kasetu) pokazuju što treba; tekst je jedna kratka rečenica.
- Izlazi („samo otvori”, „samo pusti”) pojavljuju se tek kad zatreba, ne odmah.
- Opis toka je u `docs/FLOW.md`, provjerava ga `tests/flow.test.mjs`.

## Posljedice
Nova mehanika ne ulazi bez da se izbaci neka druga. Svaka izmjena toka mijenja FLOW.md i testove.
