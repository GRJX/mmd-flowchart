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
14. [Undo / Redo](#14-undo--redo)

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

De editor ondersteunt vijf bloktypen. Alle per-type eigenschappen zijn centraal gedefinieerd als configuratie — nieuwe bloktypen toevoegen vereist alleen een nieuwe config-entry, geen conditionele logica verspreid door de codebase.

### Blok-configuratietabel

| Type | ID-patroon | Max. inputs | Max. outputs | Label bewerkbaar | Data Field | Expected Outcome | Visueel |
|---|---|---|---|---|---|---|---|
| **Start** | `S` | 0 | 1 | nee | ja | nee | Cirkel |
| **End** | `E1..En` | onbeperkt | 0 | nee | nee | nee | Cirkel |
| **Action** | `A1..An` | 1 | 1 | ja | ja | nee | Afgerond rechthoek |
| **Decision** | `D1..Dn` | 1 | 2 | ja | nee | nee | Ruit (diamant) |
| **Result** | `R1..Rn` | 1 | 1 | ja | nee | ja | Rechthoek met teal linkerzijde |

De config legt ook per type vast:
- Standaardlabel bij aanmaken
- Beschikbaar in het palette (Start uitgeschakeld als al aanwezig)
- Beschikbaar in het QuickAddMenu (Start altijd uitgesloten)
- Handle-posities voor uitgaande verbindingen (Decision: rechts = Y, onder = N)

### Start

- Er is precies één Start-blok per diagram.
- Het label "Start" is niet bewerkbaar.
- Kan niet als doel van een verbinding dienen.
- Heeft één uitgaande verbinding (naar het eerste blok in de flow).
- Heeft een optioneel **Data Field** voor het vastleggen van de initiële staat of precondities van de flow (max. 2000 tekens).

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
- De verbindingslabels (standaard "Y" en "N") zijn vrij aanpasbaar in de verbindingseigenschappen.

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

| Type | Wanneer | Label (standaard) |
|---|---|---|
| **default** | Elk blok → elk blok (niet Start als doel, niet End als bron) | *(leeg)* |
| **Y** | Decision → elk blok, rechter uitgang | Y |
| **N** | Decision → elk blok, onderste uitgang | N |

Elk verbindingslabel is vrij aanpasbaar: leeg laten of max. 50 tekens tekst. Voor Decision-uitgangen worden "Y" en "N" als standaard ingesteld op basis van de handle-richting.

### Regels

- Een verbinding van en naar hetzelfde blok (self-loop) is niet toegestaan.
- Wanneer de limiet is bereikt, worden verbindingspunten (handles) geblokkeerd. Slepen naar een geblokkeerd punt maakt geen verbinding aan.

### Verbindingen aanmaken

1. Hover over een blok — de verbindingspunten worden zichtbaar.
2. Klik en sleep van een bronpunt naar een doelpunt (deze zitten op dezelfde posities en zijn niet visueel anders).
3. Tijdens het slepen toont een **preview-lijn** (gestippeld, orthogonaal) exact hoe de verbinding zal lopen als je loslaat.
4. Loslaten op een geldig doelpunt maakt de verbinding aan; loslaten erbuiten annuleert de actie.

De definitieve verbindingslijn is **orthogonaal met licht afgeronde hoeken**. De lijn start en eindigt op het exacte verbindingspunt waarvandaan gesleept is.

### YN-toewijzing

Het label van een nieuwe verbinding vanuit een Decision-blok wordt automatisch ingesteld op basis van de handle-richting:

- **Rechts** uit het Decision-blok → label "Y"
- **Onder** uit het Decision-blok → label "N"

Als het bijbehorende pad al bestaat, wordt het omgeleid naar het nieuwe doel. Het label kan achteraf altijd gewijzigd worden in de verbindingseigenschappen.

### Verbindingseigenschappen

- **Label** — vrij tekstveld, max. 50 tekens; standaard "Y" of "N" voor Decision-uitgangen, leeg voor overige verbindingen
- **Van** — ID + label van het bronblok (read-only)
- **Naar** — ID + label van het doelblok (read-only)
- **Data Field** — optionele metadata voor deze verbinding (testcondities voor dit pad)
- **Verwijderen** — verwijdert de verbinding

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
- Alleen `.mmd`-bestanden worden getoond

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
- Map verwijderen

Het is mogelijk om bestanden of folder te verslepen naar een andere locatie in de geopende mappenstructuur.

---

## 6. Canvas-interacties

### Navigatie

- **Zoomen:** scrollwiel of zoom-knoppen in de toolbar (10% – 400%)
- **Pannen:** klik-en-sleep op de achtergrond
- **Fit to screen:** past het zoom-niveau aan zodat alle blokken zichtbaar zijn (Ctrl/Cmd+Shift+F)
- **Zoom resetten:** dubbelklik op het zoompercentage in de toolbar

### Grid

- Het canvas heeft een vaste grid van **8px**.
- Blokken snappen altijd aan het grid bij slepen en loslaten.

### Blokken toevoegen

**Via het palette (right panel):**
- Sleep een bloktype van het palette naar het canvas.
- Tijdens het slepen is een **transparante preview** van het blok zichtbaar die live mee-snapt aan het grid.
- Loslaten plaatst het blok op de dichtstbijzijnde gridpositie.

**Via het quick-add-menu:**
- Klik de **+**-knop die uit een blok steekt (stem).
- Een radiaalmenu verschijnt met de beschikbare bloktypen.
- Selecteren plaatst het nieuwe blok automatisch op een vrije positie en maakt de verbinding aan.
- Het nieuwe blok wordt altijd gecenteerd onder het huidige blok geplaatst zodat deze op een mooie afstrond onder elkaar of naast elkaar komen te staan.

### Blokken selecteren

- **Enkelvoudig:** klik op een blok.
- **Meervoudig:** Shift+klik of marquee-selectie (sleep over de canvas-achtergrond).
- **Alles:** `Ctrl/Cmd+A`.
- **Deselecteren:** klik op de canvas-achtergrond.

Geselecteerde blokken tonen een uniforme 2 px blauwe ring (accent-kleur) rondom de vorm, ongeacht het bloktype.

### Blokken verplaatsen

- Klik en sleep een blok (of meerdere geselecteerde blokken). Het blok snapt live aan het 8 px grid.
- Positie wordt opgeslagen zodra het blok losgelaten wordt (undo-entry aangemaakt).

### Blokken verwijderen

- Selecteer een of meer blokken en druk op `Delete` of `Backspace`.
- Als een blok commentaar bevat, verschijnt een bevestigingsdialoog.
- Alle verbindingen van/naar het verwijderde blok worden mee verwijderd.

### Labels bewerken

- Dubbelklik op het label van een **Action**, **Decision** of **Result**-blok om inline-bewerking te starten.
- De labels van **Start** en **End** zijn vast en kunnen niet worden gewijzigd.
- `Enter` bevestigt, `Escape` annuleert, klik buiten het blok bevestigt.

### Verbindingen selecteren en verwijderen

- Klik op een verbindingslijn om deze te selecteren; het right panel toont de verbindingseigenschappen.
- Druk op `Delete` of `Backspace` om de geselecteerde verbinding te verwijderen.

---

## 7. Quick-add & radiaalmenu

### NodeAddStem

Een **stem** is een korte lijn met pijlpunt en een **+**-knop die buiten de node-rand uitsteekt. De lijn en knop hebben dezelfde kleur als de verbindingslijnen op het canvas.

De stem verschijnt **alleen bij nieuw op het canvas geplaatste blokken** — als visuele hint om direct door te bouwen. Een blok is "nieuw" als het via het right panel palette is gesleept of geklikt, of als het via het QuickAddMenu op het canvas is gekomen.

- **Bottom stem** (omlaag): op Start, Action en Result direct na plaatsing, zolang er nog geen uitgaande verbinding is.
- **Right stem** (rechts): op Decision direct na plaatsing, voor het Y-pad.
- **Bottom stem** (omlaag): op Decision direct na plaatsing, voor het N-pad.

De stem verdwijnt zodra het bijbehorende pad aangemaakt is. **Als een bestaande verbinding later verwijderd wordt, keert de stem niet terug.** Verbindingspunten blijven wel altijd beschikbaar via hover op het blok.

Het **verbindingspunt** (source handle) voor de bottom- en right-richting is geplaatst op het uiteinde van de stemlijn — niet op de node-rand. Dit betekent:
- De **+**-knop opent het radiaalmenu voor een snelle node-toevoeging.
- Het **verbindingspunt** op de lijnpunt maakt het mogelijk om handmatig een verbinding te slepen naar een bestaande node.

### QuickAddMenu

Klikken op een stem opent het **radiaalmenu** op de cursorpositie:

- Vier bloktypen in een neerwaartse boog: Decision · Action · Result · End. Start ontbreekt bewust — een diagram heeft altijd precies één Start-blok dat al bij aanmaken aanwezig is.
- Elk item toont een miniatuur van de blokvorm.
- Selecteer een type om:
  1. Een nieuw blok aan te maken op een vrije positie (~120px verwijderd, gridgesnapped).
  2. Een verbinding aan te maken van het bronblok naar het nieuwe blok.
  3. Bij een Decision-bron: automatisch het juiste padtype (Y of N) toe te kennen op basis van de stemrichting.
- `Escape` of klikken buiten het menu sluit het zonder actie.

---

## 8. Right panel

Het right panel is een vaste shell aan de rechterkant van het scherm. De inhoud is uitwisselbaar op basis van de selectiecontext — de shell zelf verandert niet, alleen de content erin. Elke content-view is een zelfstandig component dat in de shell geplaatst wordt.

**Content-views en wanneer ze actief zijn:**

| View | Wanneer |
|---|---|
| Palette | Geen selectie of meervoudige selectie |
| Blok-properties | Één blok geselecteerd |
| Verbindingseigenschappen | Één verbinding geselecteerd |
| Commentaarpaneel | Commentaar-knop geklikt vanuit blok-properties |

Overgangen tussen views verlopen zonder herladen van de shell.

### Blok-palette (standaard, geen selectie of meervoudige selectie)

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

- **Label** — bewerkbaar tekstveld, max. 50 tekens
- **Van** — ID + label van het bronblok (read-only)
- **Naar** — ID + label van het doelblok (read-only)
- **Data Field** — optionele metadata voor deze verbinding (testcondities voor dit pad)
- **Verwijderen** — verwijdert de verbinding

### Commentaarpaneel

Het commentaarpaneel vervangt de blok-properties in het right panel (schuift in vanuit rechts). Bovenaan staat een **← terug**-knop die terugkeert naar de blok-properties.

- Lijst van bestaande opmerkingen met datum/tijd en verwijderknop.
- Tekstgebied voor een nieuwe opmerking onderaan het paneel.
- `Enter` verstuurt, `Shift+Enter` voegt een nieuwe regel in.
- **Toevoegen**-knop (uitgeschakeld bij leeg veld).
- Maximaal 2000 tekens per opmerking.
- Het paneel blijft zichtbaar zolang het blok geselecteerd is. Bij deselecteren keert het right panel terug naar de standaardweergave (palette).

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
| `Enter` (commentaarveld) | Opmerking toevoegen |
| `Shift+Enter` (commentaarveld) | Nieuwe regel in opmerking |

Sneltoetsen worden genegeerd wanneer de focus in een tekstveld of textarea zit.

---

## 12. Fout- en waarschuwingsstatussen

### Violation (verbindingslimiet overschreden)

- Het blok krijgt een **oranje pulserende rand**.
- Treedt op als meer verbindingen aangemaakt zijn dan het type toestaat (kan ontstaan door een extern gewijzigd bestand).
- De editor laat het diagram nog steeds opslaan; overtollige verbindingen worden bij het laden genegeerd.

### Meldingen (tijdelijk, 4 seconden)

| Situatie | Melding |
|---|---|
| Metadata niet leesbaar | "Metadata kon niet worden gelezen. Opmerkingen en datavelden zijn niet geladen." |
| Meerdere start-kandidaten | "Meerdere startblokken gevonden. 'S' wordt gebruikt; de overige worden als eindblok behandeld." |
| Diagram te groot | "Dit diagram heeft N blokken (limiet 200). Geopend in alleen-lezen." |
| Opslaan mislukt | Foutmelding afhankelijk van oorzaak |
| Bestand niet leesbaar | "Bestand kon niet worden geopend." |

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
- Is exporteren niet mogelijk.

---

## 14. Undo / Redo

- Elke bewerkingsactie legt een snapshot vast van de volledige diagramtoestand (blokken + verbindingen).
- De undo-stack bewaart maximaal **100 entries** per diagram.
- Bij het laden van een nieuw diagram worden beide stacks gewist.

**Acties die undo ondersteunen:**

| Actie |
|---|
| Blok toevoegen |
| Blok verwijderen |
| Blok verplaatsen |
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
