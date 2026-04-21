# Functioneel Ontwerp — MMD Flowchart Editor

## Inhoudsopgave

1. [Doel & scope](#1-doel--scope)
2. [Bloktypen](#2-bloktypen)
3. [Verbindingen](#3-verbindingen)
4. [Bestandsformaat (.mmd)](#4-bestandsformaat-mmd)
5. [Bestandsbeheer](#5-bestandsbeheer)
6. [Canvas-interacties](#6-canvas-interacties)
7. [Quick-add & radiaalmenu](#7-quick-add--radiaalmenu)
8. [Right panel](#8-right-panel)
9. [Toolbar](#9-toolbar)
10. [Exporteren](#10-exporteren)
11. [Toetsenbordsneltoetsen](#11-toetsenbordsneltoetsen)
12. [Fout- en waarschuwingsstatussen](#12-fout--en-waarschuwingsstatussen)
13. [Read-only modus](#13-read-only-modus)
14. [Thema](#14-thema)
15. [Undo / Redo](#15-undo--redo)

---

## 1. Doel & scope

De MMD Flowchart Editor is een browser-gebaseerde editor voor het visueel opstellen van flowcharts. Diagrammen worden opgeslagen als `.mmd`-bestanden (Mermaid-syntax), aangevuld met embedded metadata (positie, commentaar, datafields). Het doel is het efficiënt ontwerpen van functionele flows voor test- en specificatiedoeleinden.

De editor werkt volledig lokaal in de browser — er is geen server of account nodig. Opslag gaat rechtstreeks naar de schijf via de File System Access API.

**Buiten scope:**
- Samenwerking / multi-user editing
- Versiegeschiednis (vertrouwen op Git)
- Andere diagramtypen (sequence, classDiagram, etc.) — worden alleen in read-only gerenderd

---

## 2. Bloktypen

De editor ondersteunt vijf bloktypen. Elk type heeft vaste regels voor het aantal in- en uitgaande verbindingen.

### Overzicht

| Type | ID-patroon | Max. inputs | Max. outputs | Standaardlabel | Visueel |
|---|---|---|---|---|---|
| **Start** | `S` | 0 | 1 | "Start" | Groene cirkel |
| **End** | `E1..En` | onbeperkt | 0 | "End" | Rode cirkel |
| **Action** | `A1..An` | 1 | 1 | "Action/State" | Afgerond rechthoek |
| **Decision** | `D1..Dn` | 1 | 2 | "Condition?" | Ruit (diamant) |
| **Result** | `R1..Rn` | 1 | 1 | "Result" | Rechthoek met teal linkerzijde |

### Start

- Er is precies één Start-blok per diagram.
- Het label "Start" is niet bewerkbaar.
- Kan niet als doel van een verbinding dienen.
- Heeft één uitgaande verbinding (naar het eerste blok in de flow).

### End

- Er kunnen meerdere End-blokken zijn (één per afsluitend pad).
- Het label "End" is niet bewerkbaar.
- Kan niet als bron van een verbinding dienen.
- Ontvangt onbeperkt inkomende verbindingen.

### Action

- Vertegenwoordigt een processtap of toestand.
- Heeft een bewerkbaar label.
- Heeft een optioneel **Data Field** voor testdata of precondities (max. 2000 tekens).

### Decision

- Vertegenwoordigt een voorwaarde met twee uitgaande paden: **Y** (ja) en **N** (nee).
- Het label is bedoeld als vraagstelling (eindigt conventioneel op `?`).
- Heeft exact twee uitgangen: één Y-pad en één N-pad.
- Het Y-pad gaat rechts uit (right handle), het N-pad gaat omlaag (bottom handle).
- De Y- en N-paden kunnen worden omgewisseld via de **Y/N omwisselen**-knop in de verbindingseigenschappen (right panel).

### Result

- Documenteert een testuitkomst of tussenresultaat.
- Heeft een bewerkbaar label.
- Heeft een optioneel **Expected Outcome** veld (beschrijving van het verwachte resultaat).

### Blok-properties (gemeenschappelijk)

Elk blok heeft:
- **ID** — stabiel, leesbaar (`S`, `A1`, `D2`, …); read-only
- **Label** — bewerkbaar via inline-edit (dubbelklik) of het right panel
- **Commentaar** — lijst van tijdgestempelde notities; beheerd via het commentaarpaneel

---

## 3. Verbindingen

### Verbindingstypen

| Type | Wanneer | Visueel | Label |
|---|---|---|---|
| **default** | Elk blok → elk blok (niet start als doel, niet end als bron) | Grijze pijl | — |
| **yes (Y)** | Decision → elk blok | Teal pijl | Y |
| **no (N)** | Decision → elk blok | Rode pijl | N |

### Regels

- Een verbinding van en naar hetzelfde blok (self-loop) is niet toegestaan.
- Wanneer de limiet is bereikt, worden verbindingspunten (handles) geblokkeerd.

### Verbindingen aanmaken

1. Hover over een blok — de verbindingspunten worden zichtbaar.
2. Klik en sleep van een bronpunt naar een doelpunt.
3. Tijdens het slepen toont een **preview-lijn** (gestippeld, orthogonaal) exact hoe de verbinding zal lopen als je loslaat.
4. Bij een Decision-blok als bron: de YN-picker verschijnt om het padtype te kiezen.

De verbindingslijn start en eindigt op het exacte verbindingspunt waarvandaan gesleept is. Een verbinding van het linkerpunt van node A naar het bovenpunt van node B ziet er dus ook zo uit — niet hardcoded van onder naar boven.

### Verbindingseigenschappen

- **Type** — default / Y / N (alleen aanpasbaar voor Decision-uitgangen)
- **Data Field** — optionele metadata voor testcondities op dit specifieke pad (max. 2000 tekens)

### YN-picker

Wanneer een verbinding handmatig getrokken wordt vanuit een Decision-blok:

1. Een modaal venster verschijnt met twee knoppen: **Y path** en **N path**.
2. Als het gekozen pad al bestaat, toont de knop "Redirect Y/N path" als waarschuwing.
3. Annuleren sluit het modaal zonder de verbinding op te slaan.
4. Escape sluit het modaal.

---

## 4. Bestandsformaat (.mmd)

Diagrammen worden opgeslagen als `.mmd`-tekstbestanden met twee onderdelen:

### Structuur

```
%% MMD_META_START
%% {"version":"1","meta":{...},"connections":{...}}
%% MMD_META_END
flowchart TD
    S([Start])
    A1[Label]
    D1{Condition?}
    R1[/Result/]
    E1([End])
    S --> A1
    A1 --> D1
    D1 -- Y --> R1
    D1 -- N --> E1
```

### Mermaid-bloknodes (syntaxis per type)

| Type | Syntaxis |
|---|---|
| Start / End | `S([Label])` |
| Action | `A1[Label]` |
| Decision | `D1{Label}` |
| Result | `R1[/Label/]` |

### Embedded metadata (MMD_META)

De metadata-sectie bevat alle informatie die niet in Mermaid-syntax past:

```json
{
  "version": "1",
  "meta": {
    "A1": {
      "dataField": "testgegeven of null",
      "expectedOutcome": null,
      "position": { "x": 100, "y": 200 },
      "width": 120,
      "height": 88,
      "comments": [
        { "id": "uuid", "text": "notitie", "timestamp": "2026-04-20T10:00:00.000Z" }
      ]
    }
  },
  "connections": {
    "A1-D1-default": {
      "waypoints": [],
      "dataField": null
    }
  }
}
```

### Volgorde in het bestand

Blokken worden in vaste volgorde weggeschreven:
1. Start (`S`)
2. Action-blokken (`A1`, `A2`, … numeriek oplopend)
3. Decision-blokken (`D1`, `D2`, …)
4. Result-blokken (`R1`, `R2`, …)
5. End-blokken (`E1`, `E2`, …)

Verbindingen worden weggeschreven via een depth-first traversal vanaf het Start-blok. Niet-verbonden subgrafen worden achteraan toegevoegd.

---

## 5. Bestandsbeheer

### Map openen

- De gebruiker opent een lokale map via de **Open Folder**-knop of de knop in de lege sidebar.
- De browser vraagt eenmalig toestemming voor de map (File System Access API).
- De map-handle wordt opgeslagen in IndexedDB en hersteld bij de volgende sessie.

### Bestandsstructuur in sidebar

- Mappen worden boven bestanden getoond (beide alfabetisch gesorteerd).
- Mappen zijn uitklapbaar; de status wordt bewaard zolang de sidebar open is.
- Alleen `.mmd`-bestanden worden getoond.

### Bestand openen

- Klik op een bestand in de sidebar om het diagram te laden.
- Bij het openen wordt gecontroleerd of het bestand extern gewijzigd is (timestamp-vergelijking).
- Niet-flowchart-diagrammen (sequence, state, classDef, etc.) worden in read-only modus geopend.
- Diagrammen met meer dan 200 blokken worden in read-only modus geopend.

### Opslaan

- **Auto-save:** 2 seconden na de laatste wijziging wordt automatisch opgeslagen (zonder melding).
- **Handmatig:** via de **Save**-knop of `Ctrl/Cmd+S`.
- Bij handmatig opslaan wordt gecontroleerd op externe wijzigingen; de gebruiker kan kiezen tussen overschrijven of herladen.
- Opslaan mislukt als het diagram geen geldig Start-blok heeft.

### Nieuw diagram

- De **New Diagram**-knop opent een dialoogvenster voor de bestandsnaam.
- Het diagram wordt aangemaakt in de geselecteerde map (of root-map) met een leeg Start-blok.

### Bestandscontextmenu (rechtermuisknop in sidebar)

**Op een bestand:**
- Hernoemen
- Verplaatsen naar een andere map
- Verwijderen

**Op een map:**
- Nieuw diagram aanmaken in deze map
- Submap aanmaken

---

## 6. Canvas-interacties

### Navigatie

- **Zoomen:** scrollwiel of zoom-knoppen in de toolbar (10% – 400%)
- **Pannen:** klik-en-sleep op de achtergrond
- **Fit to screen:** past het zoom-niveau aan zodat alle blokken zichtbaar zijn (Ctrl/Cmd+Shift+F)
- **Zoom resetten:** dubbelklik op het zoompercentage in de toolbar

### Grid

- Het canvas heeft een vaste grid van **16px**.
- Blokken snappen altijd aan het grid bij slepen en loslaten.

### Blokken toevoegen

**Via het palette (right panel):**
- Sleep een bloktype van het palette naar het canvas.
- Loslaten plaatst het blok op de dichtstbijzijnde gridpositie (veelvoud van 16 px).

**Via het quick-add-menu:**
- Klik de **+**-knop die uit een blok steekt (stem).
- Een radiaalmenu verschijnt met de beschikbare bloktypen.
- Selecteren plaatst het nieuwe blok automatisch op een vrije positie en maakt de verbinding aan.

### Blokken selecteren

- **Enkelvoudig:** klik op een blok.
- **Meervoudig:** Shift+klik of marquee-selectie (sleep over de canvas-achtergrond).
- **Alles:** `Ctrl/Cmd+A`.
- **Deselecteren:** klik op de canvas-achtergrond.

Geselecteerde blokken tonen een uniforme 2 px blauwe ring (accent-kleur) rondom de vorm, ongeacht het bloktype.

### Blokken verplaatsen

- Klik en sleep een blok (of meerdere geselecteerde blokken). Het blok snapt live aan het 16 px grid.
- Positie wordt opgeslagen zodra het blok losgelaten wordt (undo-entry aangemaakt).

### Blokken verwijderen

- Selecteer een of meer blokken en druk op `Delete` of `Backspace`.
- Als een blok commentaar bevat, verschijnt een bevestigingsdialoog.
- Alle verbindingen van/naar het verwijderde blok worden mee verwijderd.

### Labels bewerken

- Dubbelklik op het label van een **Action**, **Decision** of **Result**-blok om inline-bewerking te starten.
- De labels van **Start** en **End** zijn vast en kunnen niet worden gewijzigd.
- `Enter` bevestigt, `Escape` annuleert, klik buiten het blok bevestigt.

### Verbindingen selecteren

- Klik op een pijl om de verbinding te selecteren.
- Het right panel toont de verbindingseigenschappen.

### Verbindingen verwijderen

- Selecteer een verbinding en druk op `Delete` of `Backspace`.

---

## 7. Quick-add & radiaalmenu

### NodeAddStem

Elk blok dat nog uitgaande verbindingen kan aanmaken, toont een **stem**: een korte lijn met pijlpunt en een **+**-knop die buiten de node-rand uitsteekt. De lijn en knop hebben dezelfde kleur als de verbindingslijnen op het canvas.

- **Bottom stem** (omlaag): aanwezig op Start, Action en Result zolang er nog geen uitgaande verbinding is.
- **Right stem** (rechts): aanwezig op Decision zolang het Y-pad nog niet bestaat.
- **Bottom stem** (omlaag): aanwezig op Decision zolang het N-pad nog niet bestaat.
- De stem verdwijnt zodra het bijbehorende pad ingevuld is en keert terug als de verbinding verwijderd wordt.

Het **verbindingspunt** (source handle) voor de bottom- en right-richting is geplaatst op het uiteinde van de stemlijn — niet op de node-rand. Dit betekent:
- De **+**-knop opent het radiaalmenu voor een snelle node-toevoeging.
- Het **verbindingspunt** op de lijnpunt maakt het mogelijk om handmatig een verbinding te slepen naar een bestaande node.

### QuickAddMenu

Klikken op een stem opent het **radiaalmenu** op de cursorpositie:

- Vier bloktypen in een neerwaartse boog: Decision · Action · Result · End.
- Elk item toont een miniatuur van de blokpvorm.
- Selecteer een type om:
  1. Een nieuw blok aan te maken op een vrije positie (~120px verwijderd, gridgesnapped).
  2. Een verbinding aan te maken van het bronblok naar het nieuwe blok.
  3. Bij een Decision-bron: automatisch het juiste padtype (Y of N) toe te kennen op basis van de stemrichting.
- `Escape` of klikken buiten het menu sluit het zonder actie.

---

## 8. Right panel

Het right panel past zijn inhoud aan op basis van de selectie:

### Blok-palette (standaard, geen selectie)

- Vijf sleepbare blokitems: Start, Action, Decision, Result, End.
- **Start** is uitgeschakeld als het diagram al een Start-blok bevat.
- Blokken kunnen ook geklikt worden om ze op het midden van het canvas te plaatsen.

### Blok-properties (één blok geselecteerd)

- **Type** — read-only label van het bloktype
- **ID** — read-only monospace ID
- **Label / Condition** — bewerkbaar tekstveld (bewerkbaar label of conditietekst voor Decision)
- **Data Field** *(Action, Start, End)* — optionele metadata (testdata, precondities), max. 2000 tekens
- **Expected Outcome** *(Result)* — verwacht testresultaat, max. 2000 tekens
- **Y-pad / N-pad** *(Decision)* — read-only weergave van het doelblok; toont `—` als het pad ontbreekt
- **Commentaar-knop** — opent het commentaarpaneel; toont het aantal bestaande opmerkingen

### Verbindingseigenschappen (één verbinding geselecteerd)

- **Type** — dropdown (Y / N / Default); alleen aanpasbaar voor Decision-uitgangen
- **Van** — ID + label van het bronblok (read-only)
- **Naar** — ID + label van het doelblok (read-only)
- **Data Field** — optionele metadata voor deze verbinding (testcondities voor dit pad)
- **Y/N omwisselen** — wisselt het padtype (Y → N of N → Y) inclusief herindeling in de store
- **Verwijderen** — verwijdert de verbinding

### Commentaarpaneel (via commentaar-knop in blok-properties)

- Lijst van bestaande opmerkingen met datum/tijd en verwijderknop.
- Tekstgebied voor een nieuwe opmerking.
- `Enter` verstuurt, `Shift+Enter` voegt een nieuwe regel in.
- **Toevoegen**-knop (uitgeschakeld bij leeg veld).
- Maximaal 2000 tekens per opmerking.

---

## 9. Toolbar

De toolbar bevat de volgende elementen (van links naar rechts):

| Element | Functie |
|---|---|
| **Open Folder** | Open een lokale map |
| **Save** | Handmatig opslaan (`Ctrl/Cmd+S`) |
| **New Diagram** | Nieuw `.mmd`-bestand aanmaken |
| **Export** | Dropdown: exporteren als PNG of SVG |
| *(spacer)* | — |
| **Fit to screen** | Zoom aanpassen zodat alle blokken zichtbaar zijn |
| **Zoom Out** | Zoom verminderen |
| **Zoom %** | Huidig zoomniveau; dubbelklik reset naar 100% |
| **Zoom In** | Zoom vergroten |
| **Undo** | Laatste actie terugdraaien (`Ctrl/Cmd+Z`) |
| **Redo** | Teruggedraaide actie opnieuw uitvoeren (`Ctrl/Cmd+Y`) |
| **Thema** | Wisselen tussen licht en donker; rechtsklik reset naar systeeminstelling |

Alle knoppen behalve **Open Folder**, **New Diagram** en **Thema** zijn uitgeschakeld zolang er geen diagram open is.

---

## 10. Exporteren

### PNG

- Maakt een bitmap van het huidige diagram.
- Achtergrondkleur: wit (light-modus) of `#111111` (dark-modus).
- Bestandsnaam: `{diagramnaam}.png`.

### SVG

- Maakt een vectorafbeelding van het huidige diagram.
- Bestandsnaam: `{diagramnaam}.svg`.

Beide exports berekenen de bounding box van alle blokken dynamisch (32px padding) en schalen het beeld voor optimale kwaliteit.

---

## 11. Toetsenbordsneltoetsen

| Sneltoets | Actie |
|---|---|
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Y` | Redo |
| `Ctrl/Cmd+Shift+Z` | Redo (alternatief) |
| `Ctrl/Cmd+S` | Handmatig opslaan |
| `Ctrl/Cmd+Shift+F` | Fit to screen |
| `Ctrl/Cmd+A` | Alles selecteren |
| `Delete` / `Backspace` | Geselecteerde blokken of verbindingen verwijderen |
| `Pijltjestoetsen` | Geselecteerde blokken 8px verplaatsen |
| `Shift+Pijltjestoetsen` | Geselecteerde blokken 1px verplaatsen |
| `Dubbelklik op label` | Inline bewerken starten (alleen Action, Decision, Result) |
| `Enter` (inline edit) | Label bevestigen |
| `Escape` (inline edit) | Bewerking annuleren |
| `Escape` (QuickAddMenu) | Menu sluiten |
| `Escape` (YN-picker) | Verbinding annuleren |
| `Enter` (commentaarveld) | Opmerking toevoegen |
| `Shift+Enter` (commentaarveld) | Nieuwe regel in opmerking |

Sneltoetsen worden genegeerd wanneer de focus in een tekstveld of textarea zit.

---

## 12. Fout- en waarschuwingsstatussen

### Violation (verbindingslimiet overschreden)

- Het blok krijgt een **oranje pulserende rand**.
- Treedt op als meer verbindingen aangemaakt zijn dan het type toestaat (kan ontstaan door een extern gewijzigd bestand).
- De editor laat het diagram nog steeds opslaan; overtollige verbindingen worden bij het laden genegeerd.

### Toast-meldingen (tijdelijk, 4 seconden)

| Situatie | Melding |
|---|---|
| Metadata niet leesbaar | "Metadata could not be read. Comments and data fields were not loaded." |
| Meerdere start-kandidaten | "Multiple start block candidates found. Using 'S'; others treated as end blocks." |
| Diagram te groot | "This diagram has N blocks (limit 200). Opening in read-only preview." |
| Opslaan mislukt | Foutmelding afhankelijk van oorzaak |
| Bestand niet leesbaar | "Failed to open file." |

### Opslaan geblokkeerd

Het opslaan mislukt (met foutmelding) wanneer:
- Er geen Start-blok aanwezig is.
- Er meer dan één Start-blok aanwezig is.

---

## 13. Read-only modus

Het diagram wordt in read-only modus geopend bij:

1. **Niet-ondersteund diagramtype** — de `.mmd` bevat een `sequenceDiagram`, `classDiagram`, `stateDiagram`, `pie`, etc.
2. **Te veel blokken** — het diagram heeft meer dan 200 blokken.

In read-only modus:
- Wordt het diagram gerenderd via de Mermaid.js-bibliotheek (statische SVG).
- Toont een banner met de reden voor read-only.
- Zijn geen bewerkingen mogelijk.
- Kan het diagram niet worden geëxporteerd via de normale exportfunctie.

---

## 14. Thema

De editor ondersteunt licht en donker thema, met twee modi:

**Automatisch (systeeminstelling):**
- De editor volgt de `prefers-color-scheme`-instelling van het besturingssysteem.
- Schakelt automatisch mee als de gebruiker de systeeminstelling wijzigt.
- Het icoon in de toolbar toont een **monitor**-symbool.

**Handmatig (gebruikersvoorkeur):**
- Klik op de themaknop (rechts in de toolbar, na undo/redo) om te wisselen tussen licht en donker.
- De keuze wordt opgeslagen in `localStorage` en blijft behouden bij herladen.
- Het icoon toont een **zon** (licht) of **maan** (donker).
- Rechtsklik op de themaknop reset naar de automatische systeeminstelling.

**Donker (standaard):**
- Canvas: `#111111`
- Panelen: `#181818` / `#141414`
- Blokken: donkerblauwe/groene fills

**Licht:**
- Canvas: `#ffffff`
- Panelen: `#ebebeb` / `#e2e2e2`
- Blokken: lichtblauwe/groene fills

---

## 15. Undo / Redo

- Elke bewerkingsactie legt een snapshot vast van de volledige diagramtoestand (blokken + verbindingen).
- De undo-stack bewaart maximaal **100 entries** per diagram.
- Bij het laden van een nieuw diagram worden beide stacks gewist.

**Acties die undo ondersteunen:**

| Actie |
|---|
| Blok toevoegen |
| Blok verwijderen |
| Blok verplaatsen |
| Blok formaat wijzigen |
| Label bewerken |
| Verbinding toevoegen |
| Verbinding verwijderen |
| Verbindingstype wijzigen |
| Commentaar toevoegen |
| Commentaar verwijderen |
| Data Field bewerken |
| Verbinding Data Field bewerken |
| Expected Outcome bewerken |

**Meerdere pijltjestoetsen** worden samengevoegd tot één undo-entry (300ms venster), zodat nudging niet de stack volvult.
