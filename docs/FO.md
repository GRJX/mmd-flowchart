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
| **Start** | `S` | 0 | 1 | nee | ja | nee | Cirkel — groene tint |
| **End** | `E1..En` | onbeperkt | 0 | nee | nee | nee | Cirkel — neutrale (slate) tint |
| **Action** | `A1..An` | onbeperkt | 1 | ja | ja | nee | Afgerond rechthoek — blauwe tint |
| **Decision** | `D1..Dn` | onbeperkt | 2 | ja | ja (×2 — Ja-pad / Nee-pad) | nee | Ruit (diamant) — amber tint |
| **Result** | `R1..Rn` | onbeperkt | 1 | ja | nee | ja | Afgerond rechthoek — teal tint |

Vorm is het primaire onderscheid; de subtiele kleur-tint disambigueert vooral Action vs Result (allebei rounded rect). Alle tints worden centraal beheerd via `--node-fill-<type>` CSS-vars in [`src/styles/globals.css`](../src/styles/globals.css) — zowel light als dark mode.

De config legt ook per type vast:
- Standaardlabel bij aanmaken
- Beschikbaar in het palette (Start uitgeschakeld als al aanwezig)
- Beschikbaar in het QuickAddMenu (Start altijd uitgesloten)
- **Verbindingspunten (handles):** Start heeft alleen een uitgaand punt (onder). Alle overige bloktypen hebben verbindingspunten op **alle vier de zijdes** (N, O, Z, W). Elk zichtbaar punt is **bidirectioneel**: het kan zowel als bron als als doel van een verbinding dienen. Bij een Decision bepaalt de richting het kind: onder = N, rechts of links = Y (de default-zijde voor Y is rechts, links is alternatief); de bovenzijde dient uitsluitend als inkomend punt.

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
- Ontvangt onbeperkt inkomende verbindingen op elk van de vier zijdes.

### Action

- Vertegenwoordigt een processtap of toestand.
- Heeft een bewerkbaar label.
- Heeft een optioneel **Data Field** voor testdata of precondities (max. 2000 tekens).
- Ontvangt onbeperkt inkomende verbindingen. De uitgaande verbinding kan vanuit elk van de vier zijdes vertrekken.

### Decision

- Vertegenwoordigt een voorwaarde met twee uitgaande paden: **Y** (ja) en **N** (nee).
- Het label is bedoeld als vraagstelling (eindigt conventioneel op `?`).
- Heeft exact twee uitgangen: één Y-pad en één N-pad.
- Het N-pad vertrekt vanaf de **onderste** handle. Het Y-pad vertrekt default vanaf de **rechter** handle; bij voorkeur-layouts mag dit ook vanaf de **linker** handle — beide richtingen worden als Y-kind geïnterpreteerd. Een nieuwe Y-verbinding vervangt een bestaande Y-verbinding, ongeacht van welke zijde die vertrekt.
- De verbindingslabels (standaard "Y" en "N") zijn vrij aanpasbaar in de verbindingseigenschappen; de Y/N-semantiek blijft behouden via de metadata.
- Ontvangt onbeperkt inkomende verbindingen op elk van de vier zijdes.
- Heeft twee optionele **Data / context**-velden (max. 2000 tekens elk), één per uitgaand pad: **Ja-pad** en **Nee-pad**. Deze velden leven op het Decision-blok (niet op de verbinding) en zijn bedoeld voor testcondities of context die specifiek bij dat pad horen.

### Result

- Documenteert een testuitkomst of tussenresultaat.
- Heeft een bewerkbaar label.
- Heeft een optioneel **Expected Outcome** veld (beschrijving van het verwachte resultaat).
- Ontvangt onbeperkt inkomende verbindingen. De uitgaande verbinding kan vanuit elk van de vier zijdes vertrekken.

### Blok-properties (gemeenschappelijk)

Elk blok heeft:
- **ID** — stabiel, leesbaar (`S`, `A1`, `D2`, …); read-only
- **Label** — bewerkbaar via inline-edit (dubbelklik) of het right panel
- **Commentaar** — lijst van tijdgestempelde notities; beheerd via het commentaarpaneel. Blokken met ≥ 1 comment tonen een accent-badge met het aantal in de rechterbovenhoek van het blok.

---

## 3. Verbindingen

### Verbindingstypen

| Type | Wanneer | Label (standaard) |
|---|---|---|
| **default** | Elk blok → elk blok (niet Start als doel, niet End als bron) | *(leeg)* |
| **Y** | Decision → elk blok, rechter of linker uitgang | Y |
| **N** | Decision → elk blok, onderste uitgang | N |

Elk verbindingslabel is vrij aanpasbaar: leeg laten of max. 50 tekens tekst. Voor Decision-uitgangen worden "Y" en "N" als standaard ingesteld op basis van de handle-richting, maar de gebruiker kan ze overschrijven zonder dat de Y/N-semantiek verloren gaat (de kind wordt in de metadata vastgelegd).

### Regels

- Een verbinding van en naar hetzelfde blok (self-loop) is niet toegestaan.
- Een blok heeft hooguit zoveel uitgaande verbindingen als zijn `maxOutputs` toelaat (Start en Action/Result: 1; Decision: 2 — één Y, één N).
- Action, Decision, Result en End ontvangen **onbeperkt** inkomende verbindingen. De aangesloten zijde (N/O/Z/W) bepaalt waar de lijn aan het blok vastzit.
- Wanneer de output-limiet is bereikt, worden uitgaande verbindingspunten geblokkeerd. Slepen naar een geblokkeerd punt maakt geen verbinding aan.

### Verbindingen aanmaken

1. Hover over een blok — de verbindingspunten worden zichtbaar.
2. Klik en sleep van een bronpunt naar een doelpunt (deze zitten op dezelfde posities en zijn niet visueel anders).
3. Tijdens het slepen toont een **preview-lijn** (gestippeld, orthogonaal) exact hoe de verbinding zal lopen als je loslaat.
4. Loslaten op een geldig doelpunt maakt de verbinding aan; loslaten erbuiten annuleert de actie.

De definitieve verbindingslijn is **orthogonaal met licht afgeronde hoeken**. De lijn start en eindigt op het exacte verbindingspunt waarvandaan gesleept is.

### Verbindingen herverbinden

Een bestaande verbinding kan aan beide uiteinden opnieuw worden aangesloten:

1. Klik op de verbindingslijn — aan beide uiteinden verschijnt een sleep-anker.
2. Sleep het bron- of doelanker los en laat het los op een ander verbindingspunt (eventueel op een ander blok).
3. De verbinding behoudt haar label; bij een Decision wordt het kind (Y/N) opnieuw bepaald op basis van de nieuwe bronzijde.

Wordt het anker buiten een geldig verbindingspunt losgelaten, dan blijft de oorspronkelijke verbinding ongewijzigd.

### YN-toewijzing

Het kind van een nieuwe verbinding vanuit een Decision-blok wordt automatisch bepaald op basis van de handle-richting:

- **Rechts** of **links** uit het Decision-blok → kind "yes", label "Y"
- **Onder** uit het Decision-blok → kind "no", label "N"

Als het bijbehorende pad al bestaat, wordt het omgeleid naar het nieuwe doel (ook wanneer de nieuwe Y vanaf de andere zijde vertrekt dan de bestaande). Het label kan achteraf altijd gewijzigd worden in de verbindingseigenschappen.

### Verbindingseigenschappen

- **Label** — vrij tekstveld, max. 50 tekens; standaard "Y" of "N" voor Decision-uitgangen, leeg voor overige verbindingen. Voor Y/N-verbindingen blijft het kind (yes/no) ongewijzigd ook als de gebruiker de tekst aanpast.
- **Van** — ID + label van het bronblok (read-only, klikbaar om naar het blok te springen)
- **Naar** — ID + label van het doelblok (read-only, klikbaar om naar het blok te springen)
- **Verwijderen** — verwijdert de verbinding

> Verbindingen hebben zelf géén data/context-veld. Voor een Decision wordt de context per pad opgeslagen op het Decision-blok (zie §2).

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

### Label-escaping

Mermaid breekt op een aantal tekens binnen labels (zowel node-labels als edge-labels). De editor laat de gebruiker vrij typen — het in-memory model bevat altijd de letterlijke tekst — en escapet enkel **op serialize naar `.mmd`** met mermaid's numerieke HTML-entities. Op load worden ze weer gedecodeerd.

| Letterlijk | In `.mmd` | Reden |
|---|---|---|
| `&` | `#amp;` | Start van HTML-entity |
| `"` | `#quot;` | Sluit het quoted-label-statement |
| `<` | `#lt;` | Wordt als HTML-tag geïnterpreteerd |
| `>` | `#gt;` | Wordt als HTML-tag geïnterpreteerd |

Daarnaast worden harde regeleinden en tabs in een label op serialize gecollapseerd tot één spatie — de regel-gebaseerde mermaid-grammatica splitst anders midden in een label door.

Round-trip (open → wijzig niets → save) is lossless. Edge-case: als de gebruiker letterlijk een tekenreeks als `#quot;` typt, wordt die op load teruggemapt naar `"`. Dit is een geaccepteerd verlies, omdat het patroon zeldzaam is en escapen-van-de-escape de `.mmd` onleesbaar zou maken.

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
    },
    "D1": {
      "dataField": null,
      "expectedOutcome": null,
      "yesDataField": "context bij Ja-pad",
      "noDataField": null,
      "position": { "x": 200, "y": 320 },
      "width": 160,
      "height": 112,
      "comments": []
    }
  },
  "connections": {
    "A1-D1-default": {
      "kind": "default",
      "sourceSide": "bottom",
      "targetSide": "top"
    }
  }
}
```

`yesDataField` en `noDataField` worden alleen weggeschreven voor Decision-blokken; bij andere bloktypen worden ze weggelaten en op load als `null` geïnitialiseerd.

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
- Elke save controleert eerst of het bestand op schijf nieuwer is dan `lastSavedAt`. Zo ja, wordt de write geannuleerd en toont de editor een sticky toast met **Overschrijven** (forceren) en **Herladen** (lokale wijzigingen weggooien, disk-versie inladen).
- Bij tab-focus / visibility-change checkt de editor dezelfde timestamp en toont een Herladen-toast wanneer het bestand extern gewijzigd is.
- Opslaan mislukt als het diagram geen geldig Start-blok heeft.

### Nieuw diagram

- De **New Diagram**-knop opent een dialoogvenster voor de bestandsnaam.
- Het diagram wordt aangemaakt in de geselecteerde map (of root-map) met een leeg Start-blok.

### Bestandscontextmenu (rechtermuisknop in sidebar)

**Op een bestand:**
- Hernoemen (inline — basenaam geselecteerd, Enter = bevestig, Escape = annuleer)
- Verwijderen (met bevestigingsdialoog)

**Op een map:**
- Nieuw diagram hier…
- Nieuwe map hier…
- Hernoemen
- Verwijderen (recursief, met bevestigingsdialoog)

**Op de lege tree-achtergrond (rechtsklik buiten een rij):**
- Nieuw diagram hier… (= root)
- Nieuwe map hier… (= root)

Verplaatsen gebeurt via drag-and-drop, niet via het menu.

### Drag-and-drop in sidebar

Bestanden en mappen kunnen direct in de tree gesleept worden naar een andere map:

- Sleep een rij (bestand of map) en drop op een doelmap, of op de lege ruimte onder de tree om naar de root te verplaatsen.
- De doelmap licht op tijdens een hover.
- Na drop wordt de doelmap automatisch uitgeklapt zodat het item direct zichtbaar is.
- De editor volgt de verplaatsing: als het open bestand (of een bestand binnen de verplaatste map) meeverhuist, wordt het pad in de editor automatisch bijgewerkt — auto-save blijft schrijven naar de nieuwe locatie.

**Geblokkeerd:**
- Drop op zichzelf of op een eigen submap (folder-in-descendant).
- Drop waarbij in de doelmap al een item met dezelfde naam bestaat (name-conflict).

---

## 6. Canvas-interacties

### Navigatie

- **Zoomen:** scrollwiel of zoom-knoppen in de toolbar (10% – 400%)
- **Pannen:** klik-en-sleep op de canvas-achtergrond (zonder modifier)
- **Fit to screen:** past het zoom-niveau aan zodat alle blokken zichtbaar zijn (Ctrl/Cmd+Shift+F)
- **Zoom resetten:** dubbelklik op het zoompercentage in de toolbar

### Grid

- Het canvas heeft een vaste grid van **8px**.
- Blokken snappen altijd aan het grid bij slepen en loslaten.
- **Blok-afmetingen zijn óók veelvouden van 8.** De `defaultSize.width` en `defaultSize.height` per type in [`src/config/blockConfig.ts`](../src/config/blockConfig.ts) moeten daarom altijd deelbaar door 8 zijn — anders valt het verticale center van een blok niet op een grid-lijn en krijg je knikken in horizontale verbindingen tussen blokken met verschillende hoogte.
- Voor recht-aansluitende horizontale verbindingen tussen twee bloktypen moeten beide types **dezelfde `height`** hebben. Action, Decision en Result delen daarom 112px hoogte; Start/End delen 64px (de cirkel hoeft alleen aan zichzelf gelijk te zijn — in de praktijk worden Start/End los van de andere blokken op andere y-niveaus geplaatst).

### Macro-grid (Align)

Naast het 8 px micro-grid is er een **macro-grid** voor het uitlijnen van complete diagrammen — handig om snel een rommelig schets om te zetten in een nette layout.

- **Cel-afmeting:** 160 × 112 (gelijk aan het standaard Action/Decision/Result-blok).
- **Goot rondom:** 40 px aan elke kant van een cel, gereserveerd voor verbindingen.
- **Cel-pitch (afstand tussen cel-centra):** **240 px horizontaal** en **192 px verticaal** (cel + 2× goot). Beide veelvouden van 8 dus alles blijft op het micro-grid landen.
- **Origin:** het centrum van het Start-blok = midden van macro-cel (0, 0). Het macro-grid is dus per diagram uniek; elk Start zet z'n eigen raster op.
- **Constanten:** `MACRO_CELL_WIDTH`, `MACRO_CELL_HEIGHT`, `MACRO_GUTTER`, `MACRO_PITCH_X`, `MACRO_PITCH_Y` in [`src/types/domain.ts`](../src/types/domain.ts).

#### Align-knop (toolbar, links van Fit-to-screen)

- Werkt op **alle blokken** in het diagram (Start blijft staan).
- Per blok wordt het centrum naar de dichtstbijzijnde macro-cel geprojecteerd. Bloktypen met afwijkende afmetingen (Start/End op 64×64) hangen visueel gecentreerd in hun cel.
- **Botsingen** worden in BFS-volgorde opgelost: cellen dichter bij Start claimen eerst (sortering op kwadratische afstand tot origin, tiebreaker op blok-id), latere blokken zoeken outward in Chebyshev-distance naar de eerste vrije cel.
- Verbindingen worden niet aangeraakt — `sourceSide`/`targetSide` blijven hetzelfde, ReactFlow herberekent automatisch de orthogonal smoothstep-paden.
- Hele actie is **één undo-stap**.
- Disabled wanneer er geen Start-blok is, geen bestand open is, of het diagram read-only is.

#### Macro-grid overlay (toggle-knop)

- Naast de Align-knop staat een toggle die het macro-grid als **gestippelde accent-kleur lijnen** over de canvas legt. Verticale lijnen op cel-pitch (240px), horizontale op 192px, beide met origin door Start.center.
- De overlay is editor-state — niet gepersisteerd in `.mmd`-metadata, niet in undo. Toggle blijft binnen de huidige sessie aan/uit; bij file-switch resetten we 'm niet (handig voor "nu wil ik even uitlijnen, doe alle bestanden achter elkaar").
- De toggle gebruikt het bestaande `<Background>`-mechanisme van ReactFlow zodat de grid pant en zoomt met de canvas.

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
- **Meervoudig:** Shift+klik (toevoegen/verwijderen aan selectie) of **Shift+sleep** op de canvas-achtergrond voor marquee-selectie.
- **Alles:** `Ctrl/Cmd+A`.
- **Deselecteren:** klik op de canvas-achtergrond.

Geselecteerde blokken tonen een accent-outline die **de vorm van het blok volgt**: een cirkel om Start/End, een afgeronde rand om Action/Result, en een accent-stroke om het ruit-silhouet bij Decision. Zo voelt de selectie-indicator natuurlijk bij elk bloktype.

### Blokken verplaatsen

- Klik en sleep een blok (of meerdere geselecteerde blokken). Het blok snapt live aan het 8 px grid.
- Positie wordt opgeslagen zodra het blok losgelaten wordt (undo-entry aangemaakt).

### Blokken verwijderen

- Selecteer een of meer blokken en druk op `Delete` of `Backspace`.
- Als een blok commentaar bevat, verschijnt een bevestigingsdialoog.
- Alle verbindingen van/naar het verwijderde blok worden mee verwijderd.

### Blokken dupliceren

Twee patronen, allebei beschikbaar afhankelijk van de werkstroom:

**Direct dupliceren (`Ctrl/Cmd+D`)** — kopieert de selectie meteen één positie naast het origineel.

**Kopiëren en plakken (`Ctrl/Cmd+C` → `Ctrl/Cmd+V`)** — neemt een **snapshot** van de selectie in een in-memory klembord. Elke `Ctrl/Cmd+V` plakt opnieuw — handig om hetzelfde patroon meerdere keren neer te zetten. Het klembord overleeft alleen binnen het huidige bestand: het wordt gewist bij **bestand wisselen**, **map sluiten** of een **page-refresh**.

Gemeenschappelijke regels voor beide patronen:

- Elke selectie wordt gekopieerd inclusief label, data-velden, verwachte uitkomst en commentaren (commentaren krijgen nieuwe id's zodat ze los te bewerken zijn).
- Verbindingen worden mee-gekopieerd **alleen** wanneer beide endpoints in de selectie zaten — verbindingen naar buiten de selectie blijven bij het origineel.
- Nieuwe blokken krijgen automatisch een nieuw uniek id (`A2`, `D3`, …) en worden geplaatst met een offset rechts en omlaag, gesnapt aan het 8 px-grid.
- Het Start-blok kan niet gedupliceerd worden (singleton); zo'n selectie wordt stilzwijgend overgeslagen.
- Na het dupliceren of plakken is de **selectie verplaatst naar de nieuwe blokken** zodat ze direct verder versleept of opnieuw gedupliceerd kunnen worden.
- Eén undo-stap maakt de hele duplicatie/plak-actie ongedaan.

Specifiek voor copy/paste:

- `Ctrl/Cmd+C` zonder block-selectie laat de standaard browser-kopieer-actie staan (zodat tekst in inputs/textareas normaal te kopiëren blijft).
- `Ctrl/Cmd+V` faalt stil als het klembord leeg is.
- Successieve plak-acties **stapelen op**: paste #1 = +24 px offset, paste #2 = +48 px, enzovoort. Een nieuwe `Ctrl/Cmd+C` reset deze teller, zodat de eerstvolgende paste opnieuw met +24 px begint.

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
| Palette | Geen selectie |
| Blok-properties | Één blok geselecteerd (bevat de Comments-sectie inline) |
| Verbindingseigenschappen | Één verbinding geselecteerd |
| Meervoudige selectie | Meer dan één item geselecteerd — toont alleen een verwijder-knop |

Overgangen tussen views verlopen zonder herladen van de shell.

### Blok-palette (standaard, geen selectie)

- Vijf sleepbare blokitems: Start, Action, Decision, Result, End.
- **Start** is uitgeschakeld als het diagram al een Start-blok bevat.
- Blokken kunnen ook geklikt worden om ze op het midden van het canvas te plaatsen.

### Blok-properties (één blok geselecteerd)

Het paneel heeft een vaste verticale indeling:

1. **Header** — bloktype + subtitle.
2. **Eigenschappen (scrollbaar, bovenste helft):**
   - **ID** — read-only monospace ID
   - **Label / Condition** — bewerkbaar tekstveld (bewerkbaar label of conditietekst voor Decision)
   - **Data Field** *(Action, Start)* — optionele metadata (testdata, precondities), max. 2000 tekens
   - **Expected Outcome** *(Result)* — verwacht testresultaat, max. 2000 tekens
   - **Data / context — Ja-pad** en **Data / context — Nee-pad** *(Decision)* — twee aparte 4-regelige textareas, max. 2000 tekens elk. Hier komt de context per uitgaand pad te staan; deze velden leven op het Decision-blok zelf en blijven gekoppeld aan de Y/N-semantiek (niet aan de visuele label-tekst).
   - **Uitgaande paden** *(alle bloktypen behalve End)* — lijst van klikbare doelblokken, één rij per uitgaande verbinding. Een badge voor de rij toont het feitelijke verbindingslabel (volgt bv. een hernoeming "Y" → "Ja"); valt terug op **Y** / **N** / **→** als het label leeg is. Klikken springt de selectie naar het doelblok.
3. **Comments-sectie (onderste helft, eigen scroll):**
   - Kopje **Comments** met aantal ernaast.
   - Scrollbare lijst van bestaande opmerkingen (datum/tijd + verwijderen on hover).
   - Composer onderaan: textarea + **Plaatsen**-knop. `Enter` verstuurt, `Shift+Enter` = nieuwe regel. Max. 2000 tekens.
4. **Verwijderen-knop** (niet zichtbaar voor Start).

### Verbindingseigenschappen (één verbinding geselecteerd)

- **Label** — bewerkbaar tekstveld, max. 50 tekens. Voor Y/N-verbindingen blijft het onderliggende kind ongewijzigd.
- **Van / Naar** — ID + label van bron- en doelblok; klikbaar om naar dat blok te springen
- **Verwijderen** — verwijdert de verbinding

> Verbindingen hebben zelf geen data/context-veld meer. Bij Decision-blokken vind je context per pad in het **Decision**-blokpaneel onder *Data / context — Ja-pad* en *Data / context — Nee-pad*.

### Meervoudige selectie (> 1 item)

- Toont een korte samenvatting (aantal blokken / aantal verbindingen).
- Bevat uitsluitend een **Verwijderen**-knop die de hele selectie wegtrekt. Per-item bewerken gebeurt op één item tegelijk.

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
| **Thema** | Cyclet door **licht** → **donker** → **systeem**. Het icoon laat de huidige voorkeur zien (zon / maan / monitor). |

Alle knoppen behalve **Open Folder**, **New Diagram** en **Thema** zijn uitgeschakeld zolang er geen diagram open is.

**New Diagram** zit alleen in de toolbar — het zit niet dubbel in de sidebar-header, die houdt enkel de mapnaam + bestandsaantal.

---

## 10. Exporteren

### PNG

- Maakt een bitmap van het huidige diagram.
- Achtergrondkleur: wit (light-modus) of `#111111` (dark-modus).
- Bestandsnaam: `{diagramnaam}.png`.

### SVG

- Maakt een vectorafbeelding van het huidige diagram.
- Bestandsnaam: `{diagramnaam}.svg`.

Beide exports gebruiken xyflow's ingebouwde `getNodesBounds` + `getViewportForBounds` om de capture-regio exact op het diagram af te stemmen (32px padding). De transform wordt als clone-only `style.transform` aan `html-to-image` meegegeven — er wordt dus niets op het live DOM gemuteerd voor de snapshot. Dit voorkomt zowel lege ruimte in de SVG als afgesneden blokken in de PNG, ongeacht het huidige zoom-/pan-niveau op het canvas.

De export toont de vormen en lijnen exact zoals op het canvas: de diamond-binnenkant blijft gevuld met `--node-fill`, de edges houden hun `--edge-stroke`-kleur, inclusief labels en pijlpunten. Dit wordt geregeld door vóór de snapshot alle presentation-styles (fill/stroke/stroke-width) als inline-stijl op de SVG-elementen te promoveren — `getComputedStyle` lost de CSS-variabelen in het live DOM correct op, waar `html-to-image` dat tijdens de clone niet altijd doet.

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
| `Ctrl/Cmd+D` | Geselecteerde blokken dupliceren (inclusief interne verbindingen) |
| `Ctrl/Cmd+C` | Geselecteerde blokken kopiëren naar klembord |
| `Ctrl/Cmd+V` | Klembord plakken (offset stapelt op bij herhaaldelijk plakken) |
| `Delete` / `Backspace` | Geselecteerde blokken of verbindingen verwijderen |
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

### Meldingen (tijdelijk, 4 seconden, via toast-systeem)

Toasts stacken rechtsonder. Elke toast heeft optioneel een of meer actie-knoppen (bv. Herladen, Overschrijven); sticky toasts (zonder auto-dismiss) worden gebruikt voor confirmation-achtige flows zoals externe-wijziging-conflict.

| Situatie | Melding |
|---|---|
| Niet-ondersteund diagramtype | "Diagramtype {X} wordt niet ondersteund. Geopend in alleen-lezen." |
| Diagram te groot | "Dit diagram heeft N blokken (limiet 200). Geopend in alleen-lezen." |
| Opslaan mislukt | "Opslaan mislukt: {fout}" |
| Extern gewijzigd (op save) | Sticky: "Het bestand is extern gewijzigd…" met acties **Overschrijven** / **Herladen** |
| Extern gewijzigd (op refocus) | Sticky: "Dit bestand is extern gewijzigd." met actie **Herladen** |
| Verplaatsen geblokkeerd | "Kan map niet in zichzelf verplaatsen." / "…naar een eigen submap." / "Er bestaat al een item met deze naam." |
| Hernoemen/verwijderen/submap mislukt | Specifieke fout-melding |

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
