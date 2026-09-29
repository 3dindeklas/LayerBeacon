# LayerBeacon: gedeelde gids met printerconfiguraties

## Opzet

Alle printers gebruiken hetzelfde sjabloon en dezelfde acht onderdelen als de oorspronkelijke Creality Hi Combo-gids. De algemene uitleg staat in `content/shared.json`. Slicer-instructies staan in `content/slicers.json`. Iedere printer heeft één configuratiebestand in `content/printers/`.

De generator combineert deze bronnen en schrijft statische HTML. Daardoor werkt de website rechtstreeks op GitHub Pages en blijft de inhoud zonder JavaScript leesbaar. De gegenereerde HTML wordt meegecommit; wijzig deze bestanden niet handmatig.

## Wat kan per printer verschillen?

- naam, route, bouwvolume, filament- en nozzlemaat;
- slicer en het exacte printerprofiel;
- offline medium, zoals USB of microSD;
- uitvoering zonder of met AMS, CFS of MMU3;
- aanvullingen of vervangingen binnen gedeelde stappen;
- foutcodes en storingsgevallen;
- FAQ, onderhoud, supportlinks en bronnen;
- downloads die aantoonbaar bij dat model horen.

Een printerpatch ondersteunt drie bewerkingen:

- `append`: toont de algemene uitleg en voegt een herkenbaar printerblok toe;
- `replace`: vervangt een compleet item wanneer de algemene uitleg niet klopt;
- `remove`: verwijdert een niet-relevant item.

Een patch verwijst altijd naar een bestaand stabiel ID. Dubbele patches, onbekende verwijzingen, foutieve routes, onveilige links en downloads van een ander printermodel blokkeren de build.

## Relevantie van uitvoeringen

Inhoud kan met `setups` worden gekoppeld aan `single` of `multicolor`. De website toont uitsluitend de relevante uitleg. Een diepe link naar een verborgen foutgeval schakelt automatisch naar de vereiste uitvoering. Zonder JavaScript blijven beide uitvoeringen leesbaar.

De aanduiding `multicolor` betekent alleen dat de benoemde uitbreiding aanwezig is. De precieze uitvoering staat in het label en de tekst. Neem instructies voor AMS lite, CFS 2 of een andere generatie niet automatisch over.

## Bestaande Hi-links

De Hi Combo blijft `index.html`. Bestaande ankers, waaronder `#creality-print`, `#fout-tc2854` en `#faq-formaat`, blijven werken. Alleen de Hi-configuratie biedt de Hi-PDF aan.

## Werkwijze

```sh
npm install
npm run build:guides
npm test
npm run check:guides
```

Voor de browsercontrole is een Chromium-installatie voor Playwright nodig:

```sh
npx playwright install chromium
npm run test:browser
```

De browsertest controleert desktop, 390 en 320 pixels, GitHub Pages-subpaden, printer- en uitvoeringskeuzes, diepe links, printweergave en werking zonder JavaScript.

## Nieuwe printer toevoegen

1. Voeg de ID toe aan `content/site.json`.
2. Maak `content/printers/<id>.json` en kies een bestaande slicer of voeg die toe.
3. Voeg uitsluitend gecontroleerde modelspecificaties en cases toe, met HTTPS-bronnen.
4. Genereer de pagina’s en voer de tests uit.
5. Controleer de gids visueel en op de fysieke printer voordat de status of tekst volledigheid suggereert.

Onbekende informatie blijft onbekend. Een maximale nozzletemperatuur bewijst bijvoorbeeld niet dat ieder filament, iedere bouwplaat of materiaalwisselaar geschikt is.

## Vervolg

De P1S-, K2- en MK4S-pagina’s bevatten de volledige gedeelde gids, aangevuld met een eerste set modelspecifieke informatie. Verdere PR’s kunnen per printer schermafbeeldingen, extra foutcodes, onderhoud, materiaalcombinaties en een eigen PDF toevoegen. Deze onderdelen moeten eerst tegen het exacte model en de relevante software- of firmwareversie worden gecontroleerd.
