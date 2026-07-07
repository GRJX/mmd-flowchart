# MMD Flowchart Editor

Een browser-gebaseerde WYSIWYG (What You See Is What You Get) editor voor het maken en bewerken van Mermaid-flowcharts (`.mmd`-bestanden). Diagrammen worden opgeslagen als leesbare tekstbestanden, direct in een lokale map op schijf.

---

## Wat is dit?

De MMD Flowchart Editor is een visuele editor voor het opstellen van flowcharts ten behoeve van functionele specificaties en testdocumentatie. In plaats van Mermaid-syntax handmatig te typen, sleep je blokken op een canvas en verbind je ze met elkaar — de editor genereert daaronder een geldig `.mmd`-bestand.

Belangrijke kenmerken:

- **Lokaal & offline** — draait volledig in de browser, geen server of account nodig. Bestanden worden via de File System Access API rechtstreeks naar een map op schijf geschreven, zodat je ze in Git kunt versiebeheren.
- **Leesbaar bronformaat** — `.mmd`-bestanden zijn gewone tekst (Mermaid-syntax + embedded metadata), dus diffs in pull requests blijven goed te volgen.
- **Vijf bloktypen** — Start, End, Action, Decision en Result. Decisions hebben een Y/N-pad, blokken kunnen optionele datafields of expected outcomes bevatten.
- **Bedoeld voor**: het uitwerken van testflows en functionele flows.

> **Browser-vereiste:** gebruik **Chrome** (of een andere Chromium-browser). De editor leunt op de File System Access API; Firefox en Safari ondersteunen deze nog niet.

---

## Aan de slag

De editor is gehost op:

> **https://mmd-flowchart.custom-tools.dictuy.iesprd.ictu-sr.nl/**

### Eerste keer gebruiken

1. Open de URL in Chrome.
2. Klik op **"Map openen"** in de sidebar en kies een lokale map waar je je `.mmd`-bestanden wilt opslaan (bv. een gekloonde Git-repo).
3. Verleen de browser lees-/schrijfrechten op die map als daarom gevraagd wordt.
4. Maak een nieuw diagram via **"Nieuw"** of open een bestaand `.mmd`-bestand uit de lijst.

### Basisworkflow

- **Blok toevoegen** — sleep vanuit het rechter palette naar het canvas,.
- **Blokken verbinden** — hover over een blok om de verbindingspunten (N/O/Z/W) zichtbaar te maken, en sleep van punt naar punt.
- **Blok bewerken** — dubbelklik op een blok om het label inline te bewerken, of selecteer het en bewerk eigenschappen in het rechter panel.
- **Decision Y/N** — bij een Decision-blok bepaalt de richting van de uitgaande lijn het pad: rechts/links = Y, onder = N.
- **Opslaan** — gebruik **Ctrl/Cmd + S** of de opslaan-knop. Het bestand wordt direct naar je gekozen map weggeschreven.
- **Exporteren** — exporteer naar SVG of PNG via de toolbar.

Zie [docs/FO.md](docs/FO.md) voor de volledige beschrijving van bloktypen, verbindingsregels en interacties, en [docs/USERFLOWS.md](docs/USERFLOWS.md) voor stapsgewijze user flows.

---

## Lokaal draaien (Docker)

Voor lokale ontwikkeling of een eigen interne deploy kun je de editor via Docker draaien:

```bash
# Build
docker build -t mmd-flowchart .

# Run
docker run -p 8080:8080 mmd-flowchart
```

Open op http://localhost:8080.

---

## Hoe de app werkt

```
┌─────────────────────────────────────────────────────────────────┐
│  Toolbar  (opslaan · nieuw · exporteren · zoom · undo/redo · thema) │
├──────────────┬──────────────────────────────┬───────────────────┤
│              │                              │                   │
│  Sidebar     │   Canvas (React Flow)        │  Right panel      │
│              │                              │                   │
│  Mappenpad   │   Nodes (blokken)            │  Blok-palette     │
│  ├ map/      │   Edges (verbindingen)       │  Blok-properties  │
│  │ ├ a.mmd   │   Grid 8px                   │  Verbinding-props │
│  │ └ b.mmd   │   Quick-add stems (+)        │  Commentaar       │
│  └ c.mmd     │   QuickAdd-menu (radiaal)    │                   │
│              │   YN-picker (beslissing)     │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
```


---

## Documentatie

- [docs/FO.md](docs/FO.md) — gedetailleerde functionele beschrijving van alle features, bloktypen, verbindingsregels en interacties.
- [docs/USERFLOWS.md](docs/USERFLOWS.md) — stapsgewijze user flows als Mermaid-diagrammen (nieuw diagram, nodes toevoegen, verwijderen, opslaan, exporteren, etc.).

---

## Sneltoetsen (selectie)

| Actie | Shortcut |
|---|---|
| Opslaan | `Ctrl/Cmd + S` |
| Undo / Redo | `Ctrl/Cmd + Z` / `Ctrl/Cmd + Shift + Z` |
| Selectie verwijderen | `Delete` / `Backspace` |
| Zoom | `Ctrl/Cmd + scroll` |
| Selecteren | `Shift + Klik + Slepen` |

Zie [docs/FO.md](docs/FO.md#11-toetsenbordsneltoetsen) voor het volledige overzicht.
