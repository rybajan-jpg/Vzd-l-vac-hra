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
Bez build kroku:
- `index.html` – stránka a styly
- `data.js` – okruhy, položky a zajímavosti (`[název, podtitul, hodnota, zajímavost]`)
- `game.js` – herní logika, denní výzva, analytika (`track()`)
- `sw.js`, `manifest.webmanifest`, `icons/` – instalace na plochu a offline režim
- `og-image.png` – náhled při sdílení odkazu

## Zdroje dat
- Počet obyvatel: ČSÚ, Počet obyvatel v obcích k 1. 1. 2025
- Ceny potravin: ČSÚ, Průměrné spotřebitelské ceny vybraných druhů zboží, prosinec 2025 (hodnoty v haléřích)

## Denní výzva
Sada 10 dvojic se generuje z data (český čas) deterministickým generátorem, takže ji všichni hráči mají stejnou. Změna dat v `data.js` změní i sady denní výzvy.

## Nasazení
Netlify publikuje kořen repozitáře (viz `netlify.toml`).

## Verzování
Každá verze se zapisuje do `CHANGELOG.md`. Číslo verze je v `game.js` (`VERSION`) a v `sw.js` (`CACHE`), při vydání je potřeba zvednout obě.
