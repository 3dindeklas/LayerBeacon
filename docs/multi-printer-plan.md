# LayerBeacon: meerdere printers

## Doel en grenzen van deze pull request

Een werkende, statische eerste opzet voor Bambu Lab P1S, Creality K2 en Original Prusa MK4S. De bestaande Hi Combo-gids en zijn URL's blijven beschikbaar. `printers.html` is het nieuwe overzicht; vanuit de bestaande gids staat een link naar dit overzicht.

Deze PR levert gedeelde basisinhoud, printergegevens, softwareverwijzingen, uitvoeringskeuze en de architectuur voor vervolgstappen. Het zijn nog geen volledige modelspecifieke handleidingen. Die grens staat ook op de pagina's. K2 is uitdrukkelijk de K2, niet K2 Pro, K2 Plus of K2 SE. Accessoires horen bij een configuratie, niet automatisch bij iedere printer.

## Inhoud en samenstelling

`content/catalog.json` is de bron voor de nieuwe gidsen. De generator combineert algemene secties met een printerprofiel en zijn software. `overrides` vervangt een volledige algemene sectie voor één model; geen impliciete samenvoeging van tegenstrijdige instructies. Een onbekende sectie of verwijzing is een fout.

De bronbestanden bevatten geen HTML. Alle tekst wordt bij uitvoer ge-escaped. Links moeten HTTPS gebruiken. Model-ID's zijn vaste slugs en dienen als stabiele routes; bij een latere naamswijziging blijft de slug behouden.

De gegenereerde HTML staat in de repository. GitHub Pages kan daardoor vanuit `main`/root blijven publiceren zonder een build op de server. Na wijzigingen: `npm run build:guides`, `npm test`, `npm run check:guides`. Een toekomstige CI kan precies deze commando's uitvoeren. De generator levert deterministische uitvoer zonder afhankelijkheden.

## Welke onderdelen moeten kunnen variëren?

| Facet | Eerste opzet | Vervolg en beslisregel |
|---|---|---|
| Printeridentiteit | Vaste ID, modelnaam, bron | Hardware-revisie en modelvarianten apart identificeren |
| Bouwvolume | X/Y/Z in mm + ruimtebeperking | Brim, purge/wipe tower en uitsluitingszones koppelen aan configuratie; nominaal volume nooit als gegarandeerde objectmaat presenteren |
| Uitvoering | Eén rol of benoemde materiaalwisselaar | Exact accessoire, generatie, aantal units, aansluitset en firmwarevereisten |
| Nozzle | Onbekend/null | Diameter, materiaal, high-flow, slijtage; uitsluitend werkelijk gecontroleerde combinaties |
| Bouwplaat | Onbekend/null | Plaattype, coating, reiniging en scheidingsmiddel per materiaal |
| Behuizing | Onbekend/null | Open/dicht, verwarming en ventilatie; geen geschiktheid afleiden uit alleen maximumtemperatuur |
| Materialen | Algemene basisuitleg | Matrix printer × nozzle × plaat × toevoer; geschikt, ongeschikt, voorwaardelijk of onbekend, met reden en bron |
| Slicer | Eigen software-entiteit + profieladvies | Versie, platform, UI-taal, screenshots, instellingen en alternatieve slicers; geen onbegrensde versieclaim |
| Firmware | Onbekend/null | Geldigheidsbereik en incompatibiliteiten per instructie; wijziging triggert review |
| Verbinding | Nog leeg | USB/SD/LAN/cloud per model, accountvereisten, schoolnetwerk en offline alternatief |
| Snelstart | Gedeelde workflow | Laden/lossen, kalibratie en schermstappen per model/uitvoering |
| Printinstellingen | Geen universele temperatuur/snelheid | Printer-, nozzle-, plaat- en materiaalprofiel met versie; presets pas na praktijktest |
| Storingen | Algemene herkenning | Foutcode binnen fabrikant/model, symptomen, controles, stopcriteria en escalatie; geen merkoverschrijdende foutcode-lookup |
| Onderhoud | Verwijzing naar fabrikant | Taak, interval/trigger, benodigde middelen, bevoegdheid en officiële procedure |
| FAQ | Nog geen afzonderlijke collectie | Vraag-ID, toepasselijkheid, versie en overrides; alleen relevante antwoorden tonen |
| Onderwijs | Gedeelde lespraktijk | Docent/leerling, lesduur, groepsgrootte, printwachtrij en lokaalafspraken |
| Downloads | Nieuwe profielen hebben geen PDF | Genereren uit dezelfde samengestelde inhoud; model/configuratie/revisie in titel en bestandsnaam |
| Schoolafspraken | Niet publiek opslaan | Later aparte lokale of afgeschermde laag voor contactpersoon, printerlocatie en beheer; geen wifiwachtwoorden of persoonsgegevens in GitHub |
| Bronnen en review | Bron-ID, datum, status, praktijktest-vlag | Auteur/reviewer, bron per risicovolle instructie, hercontrole en wijzigingshistorie |
| Taal en huisstijl | Nederlands, 3dindeklas, centraal schooljaar | Vertalingen op stabiele content-ID's; merkgegevens centraal houden |

Lege collecties en null zijn bewust onbekend, niet 'ondersteund' of 'niet nodig'. De validator blokkeert momenteel vulling van gereserveerde facetten: eerst het schema, de toepasbaarheidsregels, renderer en tests uitbreiden. Zo verdwijnt nieuwe informatie niet ongemerkt uit de zichtbare gids.

## Gebruikerservaring

- Overzicht met vier printers; de Hi Combo verwijst naar de bestaande uitgebreide gids.
- Een vaste pagina per printer, geschikt voor een QR-sticker en browserbladwijzer.
- `?setup=single` of `?setup=multicolor` selecteert de uitvoering. Dit verandert alleen de toelichting op materiaaltoevoer; het suggereert nog geen volledig aangepaste onderhouds- of materiaalhandleiding.
- Ankers zoals `#eerste-print` blijven bruikbaar bij het delen. Onbekende querywaarden vallen terug op de standaarduitvoering, zonder foutmelding of lege pagina.
- Zonder JavaScript blijven beide uitvoeringsteksten en alle uitleg beschikbaar.
- Geen accounts, analytics of browseropslag nodig. De schoolkeuze wordt niet naar een backend verstuurd.
- Label, toetsenbordfocus, semantische koppen, native links en responsive kaarten. Geen afbeeldingen van printers waarvoor gebruiksrechten onduidelijk zijn.
- Afdrukstijl aanwezig; een browserafdruk is nog geen verzorgde, gecontroleerde PDF-uitgave.

## Migratie, tests en publicatie

De oude `index.html`, ankers en PDF behouden hun functie. De catalogus is aanvullend, zodat de training op de Hi Combo-gids kan blijven draaien. Verplaats de catalogus pas in een aparte PR naar de homepage, met expliciete mapping van oude links.

Tests controleren foutieve verwijzingen, ID-conflicten, dimensies, configuraties, escaping, modelisolatie van overrides en lokale links. Gegenereerde pagina's moeten exact overeenkomen met hun bron. Voor samenvoegen ook handmatig controleren: mobiel/desktop, tab-toets, JavaScript uit, configuratielink, printvoorbeeld en de oude Hi Combo-gids. De nieuwe gidsen zijn nog niet op de fysieke printers getest.

## Vervolg in behapbare PR's

1. Modelspecificaties en bedieningsstappen verdiepen, met foto's/schermen en praktijktest per model.
2. Materiaal/nozzle/bouwplaat/uitbreidingsmatrix implementeren, inclusief negatieve en onbekende combinaties.
3. Slicerflows met versiecontrole en schoolnetwerk/offline-instructies toevoegen.
4. Modelspecifieke foutcodes, onderhoud, FAQ en zoekfunctie met toepasselijkheidsfilters.
5. PDF-uitvoer uit dezelfde inhoud, met visuele controle en revisie per download.
6. Catalogus als homepage, redirect/ankerbeleid en optionele schoolconfiguraties.

Acceptatie voor een complete modelgids: bediening en eerstelaagprint op het model gecontroleerd; links en bronnen nagekeken; materiaaladviezen exact afgebakend; storingshulp met stopcriteria; passende PDF; mobiel en printweergave beoordeeld. Tot die tijd blijft de zichtbare status 'Basisgids'.
