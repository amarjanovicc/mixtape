# ADR 0002: Novčić se podiže dodirom, ne povlačenjem

Status: prihvaćeno (zamijenilo „uhvati i povuci”)

## Kontekst
Prvi dizajn: uhvati novčić, drži i povuci na omot. Na iPhoneu grebanje nije imalo zvuka. Safari
otključava zvuk samo na dodir BEZ povlačenja (`touchend`/`click`); kraj povlačenja ne računa, pa se
zvuk nije otključao ni nakon prvog poteza.

## Odluka
- Dodir novčića ga podiže nad omot (taj dodir otključa zvuk), grebanje je zatim povlačenje po
  foliji i čuje se od prvog poteza.
- Puštanje prsta vraća novčić dolje; može ga se ponovo uzeti (i nakon 12 s mirovanja).
- Dok zvuk nije otključan, hvatanje povlačenjem se ne dopušta (novčić se zatrese, „samo ga
  dodirni”).
- Pečat „dodirni pa grebi” preko folije je ranije odbačen.

## Posljedice
Ne vraćati hvatanje povlačenjem kao jedini način. Klasa za vraćeni novčić je `returned` (`.back`
je već zauzet za poveznicu „na najnoviju” i pomaknuo bi novčić u stranu).
