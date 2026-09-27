# 🗼 LayerBeacon

> **Guiding educators through the world of 3D printing, layer by layer.**  
> *Een complete demonstratiehandleiding en toolkit voor docenten en begeleiders.*

Welkom bij **LayerBeacon**! Dit project dient als hét baken voor onderwijsgevenden die aan de slag gaan met 3D-printing. Deze repository bevat alle handleidingen, demo-bestanden en best practices om docenten en werkplekbegeleiders stap voor stap (laag voor laag) door het 3D-printproces te loodsen.

## 🎯 Doel van dit project
LayerBeacon verlaagt de drempel voor 3D-printen in het onderwijs. Begeleiders vinden hier:
- 📖 **Stappenplannen:** Van digitaal 3D-ontwerp naar een succesvolle fysieke print.
- 🛠️ **Demo-bestanden:** Kant-en-klare testmodellen (STL/3MF/G-code) voor live demonstraties.
- ⚠️ **Troubleshooting:** Eerste hulp bij veelvoorkomende printproblemen (zoals warping, stringing en bed leveling).

---
*Gemaakt met ❤️ voor het onderwijs.*

## Creality Hi Combo-naslagsite

Nederlandstalige naslagsite voor docenten en begeleiders. Bevat snelstart, filamentkeuze, Creality Print, supports, kleurwissels, storingshulp, FAQ, onderhoud en een downloadbare schoolhandleiding.

## Publiceren op GitHub Pages

Deze website is gewone HTML, CSS en JavaScript. Publiceren vereist geen build, database, account voor bezoekers of externe scripts.

1. Plaats de bestanden in de hoofdmap van de repository. `index.html` moet direct in de hoofdmap staan.
2. Open **Settings → Pages** in GitHub.
3. Kies **Deploy from a branch**, branch **main**, map **/(root)**, en **Save**.
4. Wacht totdat GitHub de site heeft gepubliceerd. De daadwerkelijke URL verschijnt bij Pages.

De website werkt ook in een repository-submap: alle lokale bestandsverwijzingen zijn relatief. Het bestand `.nojekyll` laat GitHub de statische bestanden rechtstreeks publiceren. Houd de repository vrij van persoonlijke of vertrouwelijke informatie.

Officiële uitleg: https://docs.github.com/en/pages/quickstart

## Aanpassen

- `index.html`: alle leesbare inhoud en FAQ-antwoorden; geen content verborgen in JavaScript.
- `style.css`: kleuren, typografie, responsive vormgeving en printweergave.
- `app.js`: mobiel menu, actieve navigatie en het openen van foutmeldingen via ankerlinks.
- `assets/`: het bestaande 3dindeklas-logo, favicon en lokaal opgeslagen Quicksand-lettertype.
- `downloads/`: PDF voor docenten.

Gebruik bijvoorbeeld `#fout-tc2854` of `#fout-eerste-laag` achter de website-URL om direct naar een specifiek probleem te verwijzen. Zonder JavaScript blijven inhoud, normale ankerlinks en uitklapbare onderdelen beschikbaar.

## Lokaal bekijken

Open `index.html` in een browser. Alle sitebestanden, het lettertype en de PDF staan lokaal. Officiële bronlinks hebben internet nodig.

Voor ontwikkeling met automatisch herladen:

```sh
npm install
npm run dev
```

Vite is alleen ontwikkelgereedschap. Voor publiceren via de hoofdmap op GitHub Pages is geen build nodig. Publiceer geen `node_modules` of lokale testbestanden.

## Herkomst en inhoud

De inhoud is gebaseerd op de schoolhandleiding en trainersgids van 25 september 2026. Primaire Creality-bronnen en materiaal-/veiligheidsbronnen zijn gelinkt op de site. Startinstellingen zijn voorstellen, niet op iedere schoolmachine bewezen profielen. Controleer bij inhoudelijke updates de modelspecifieke documentatie.

Huisstijl overgenomen van https://www.3dindeklas.nl/: paars `#4c325b`, geel `#fbbd30`, turquoise `#5ab3b1` en Quicksand. Logo en favicon behoren bij 3dindeklas. Quicksand is beschikbaar onder de SIL Open Font License; zie `assets/OFL.txt`.

Er staan geen analytics, advertentietrackers, formulieren, cookies of lokale opslag in de sitecode. Het openen van een externe link valt onder die externe website. Hostingproviders kunnen eigen technische loggegevens verwerken.

## Meerdere printers (eerste opzet)

Open `printers.html` voor de P1S, K2 en MK4S. De bestaande Hi Combo-gids blijft op `index.html`. Nieuwe printergidsen worden samengesteld uit `content/catalog.json`; bewerk de gegenereerde HTML niet rechtstreeks.

```sh
npm run build:guides
npm test
npm run check:guides
```

De statische uitvoer wordt meegecommit en werkt op GitHub Pages vanuit main/root. De drie nieuwe gidsen zijn basisgidsen, nog geen complete bedieningshandleidingen. Zie [het uitbreidingsplan](docs/multi-printer-plan.md) voor het datamodel, dynamische onderdelen, migratie, testcriteria en vervolgwerk.
