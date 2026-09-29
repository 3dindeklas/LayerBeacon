# LayerBeacon · praktische 3D-printhulp

Praktische 3D-printhulp voor het onderwijs, van 3dindeklas.

Nederlandstalige naslagsite voor docenten en begeleiders. De site ondersteunt de Creality Hi Combo, Bambu Lab P1S, Creality K2 en Original Prusa MK4S.

## Publiceren op GitHub Pages

Deze website is gewone HTML, CSS en JavaScript. Publiceren vereist geen build, database, account voor bezoekers of externe scripts.

1. Plaats de bestanden in de hoofdmap van de repository. `index.html` moet direct in de hoofdmap staan.
2. Open **Settings → Pages** in GitHub.
3. Kies **Deploy from a branch**, branch **main**, map **/(root)**, en **Save**.
4. Wacht totdat GitHub de site heeft gepubliceerd. De daadwerkelijke URL verschijnt bij Pages.

De website werkt ook in een repository-submap: alle lokale bestandsverwijzingen zijn relatief. Het bestand `.nojekyll` laat GitHub de statische bestanden rechtstreeks publiceren. Houd de repository vrij van persoonlijke of vertrouwelijke informatie.

Officiële uitleg: https://docs.github.com/en/pages/quickstart

## Aanpassen

- `content/shared.json`: algemene stappen, filamentuitleg, storingshulp en FAQ.
- `content/slicers.json`: uitleg voor Creality Print, Bambu Studio en PrusaSlicer.
- `content/printers/*.json`: specificaties, uitvoeringen, aanvullingen, foutcodes, bronnen en downloads.
- `templates/guide.html`: het gedeelde sjabloon in de vormgeving van de Hi Combo-gids.
- `scripts/build-guides.mjs`: validatie, samenstelling en statische HTML-uitvoer.
- `style.css` en `catalog.css`: kleuren, typografie, responsive vormgeving en printweergave.
- `app.js`: printer- en uitvoeringskeuze, mobiel menu, navigatie en diepe links.
- `assets/`: het 3dindeklas-logo, favicon en lokaal opgeslagen Quicksand-lettertype.
- `downloads/`: modelgebonden PDF-bestanden.

Bewerk de gegenereerde HTML-bestanden niet rechtstreeks. Iedere printer gebruikt dezelfde acht onderdelen als de Hi Combo-gids. Een printerconfiguratie kan algemene informatie aanvullen, vervangen of verwijderen.

Gebruik bijvoorbeeld `#fout-tc2854` of `#fout-eerste-laag` achter de website-URL om direct naar een specifiek probleem te verwijzen. Zonder JavaScript blijven inhoud, normale ankerlinks en uitklapbare onderdelen beschikbaar.

## Lokaal bekijken

Open `index.html` in een browser. Alle sitebestanden, het lettertype en de PDF staan lokaal. Officiële bronlinks hebben internet nodig.

Voor ontwikkeling met automatisch herladen:

```sh
npm install
npm run dev
```

Inhoud wijzigen en controleren:

```sh
npm run build:guides
npm test
npm run check:guides
```

Voor de uitgebreide browsercontrole installeer je Chromium voor Playwright en voer je `npm run test:browser` uit. Deze controleert desktop, mobiel, GitHub Pages-subpaden, configuratiekeuzes, diepe links, afdrukweergave en werking zonder JavaScript.

Vite is alleen ontwikkelgereedschap. Voor publiceren via de hoofdmap op GitHub Pages is geen build nodig. Publiceer geen `node_modules` of lokale testbestanden.

## Herkomst en inhoud

De algemene basisuitleg wordt gedeeld. Modelspecificaties, uitzonderingen en foutcodes staan bij de betreffende printer en verwijzen naar fabrikantbronnen. Startinstellingen zijn voorstellen en geen universeel bewezen profielen. De P1S-, K2- en MK4S-gidsen zijn een eerste inhoudelijke versie en zijn nog niet op een schoolprinter getest.

Zie [de technische opzet](docs/multi-printer-plan.md) voor de configuratiestructuur, testcriteria en het toevoegen van printers.

Huisstijl overgenomen van https://www.3dindeklas.nl/: paars `#4c325b`, geel `#fbbd30`, turquoise `#5ab3b1` en Quicksand. Logo en favicon behoren bij 3dindeklas. Quicksand is beschikbaar onder de SIL Open Font License; zie `assets/OFL.txt`.

Er staan geen analytics, advertentietrackers, formulieren, cookies of lokale opslag in de sitecode. Het openen van een externe link valt onder die externe website. Hostingproviders kunnen eigen technische loggegevens verwerken.
