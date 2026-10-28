# Changelog

## [0.2.0] – 2026-10-28
### Přidáno
- Denní výzva: 10 dvojic z mixu okruhů, stejných pro všechny hráče (podle data v českém čase), přehled výsledků a sdílení
- „Věděl jsi, že…?“: krátká zajímavost ke každé položce po odkrytí, pokračování tlačítkem nebo klávesou Enter
- Náhledový obrázek pro sdílení odkazu (Messenger, WhatsApp, sociální sítě)
- Instalace na plochu telefonu (PWA): manifest, ikony a offline režim přes service worker
- Příprava na anonymní analytiku (Umami): události začátek a konec hry, denní výzva, sdílení

### Změněno
- Počty obyvatel ověřené z ČSÚ (stav k 1. 1. 2025); okruh rozšířen na 77 měst a obcí
- Ceny potravin podle průměrných spotřebitelských cen ČSÚ za prosinec 2025, s přesností na haléře; okruh má 54 položek
- Data okruhů přesunuta do samostatného souboru `data.js`, logika hry do `game.js`

### Opraveno
- Na mobilu se kotouč „VS“ překrýval s popiskem „Hádej“; teď stojí mezi kartami

## [0.1.1] – 2026-10-28
### Změněno
- Tlačítka bez ikon: „Víc/Míň“, „Dřív/Později“, „Dražší/Levnější“ a „Pokračovat po reklamě“ jsou jen textová
- Šipka zpět nahrazena tlačítkem „Menu“, emoji reproduktoru nahrazeno čistou ikonou ve stylu hry

## [0.1.0] – 2026-10-28
První verze.

### Přidáno
- Hra „Vyšší, nebo nižší“ se třemi okruhy: Města a obce ČR, Historie ČR, Potraviny a ceny
- Časovač, násobič za sérii, rekord pro každý okruh, sdílení výsledku
- Ovládání šipkami na klávesnici, zvuky s možností vypnout
- Simulace reklamy s odměnou (pokračování ve hře)
- Barevná paleta: modrá pro známou hodnotu, zelená pro nižší/dřív, oranžová pro vyšší/později; bílé pozadí; písmo Georgia
