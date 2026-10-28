# Vyšší, nebo nižší

Webová vědomostní hra v prohlížeči. Hráč vidí dvě položky a tipuje, jestli je hodnota té druhé vyšší, nebo nižší. Jedna chyba hru ukončí.

## Okruhy
- **Města a obce ČR**: počet obyvatel
- **Historie ČR**: letopočty událostí (dřív / později)
- **Potraviny a ceny**: orientační ceny v obchodě (dražší / levnější)

## Herní mechaniky
- Časový limit na tip: 10 s, s každým správným tipem se zkracuje (minimum 4 s)
- Násobič bodů za sérii: každých 5 správných v řadě o 1 výš, maximum ×4
- Rekord pro každý okruh se ukládá v prohlížeči
- Sdílení výsledku zkopírováním do schránky
- Simulace monetizace: „Pokračovat po reklamě“ jednou za hru

## Struktura
Celá hra je jeden soubor `index.html` bez build kroku. Data okruhů jsou v objektu `CATS` na začátku skriptu.

> Data jsou zatím přibližná a před veřejným spuštěním je potřeba je ověřit (obyvatelé: ČSÚ, ceny: aktuální průzkum).

## Nasazení
Netlify publikuje kořen repozitáře (viz `netlify.toml`).

## Verzování
Každá verze se zapisuje do `CHANGELOG.md` a označí se git tagem `vX.Y.Z`. Číslo verze je také v patičce hry.
