# User Flows — MMD Flowchart Editor

Alle interacties beschreven als stapsgewijze flows in Mermaid-syntax.

---

## 1. Nieuw diagram maken

```mermaid
flowchart TD
    A([Start]) --> B[Klik op 'New Diagram' in toolbar]
    B --> C[Dialoogvenster verschijnt:\nVoer bestandsnaam in]
    C --> D{Bestandsnaam\ningevoerd?}
    D -- Nee --> C
    D -- Ja --> E[Klik 'Create' of druk Enter]
    E --> F[.mmd bestand aangemaakt\nin geselecteerde map]
    F --> G[Diagram geladen in canvas\nmet één Start-node]
    G --> H([Klaar — diagram is bewerkbaar])
```

---

## 2. Node toevoegen of verbinden via de stem

Elk blok dat nog verbindingen kan aanmaken, toont een **stem**: een lijn met pijlpunt in de kleur van verbindingslijnen. Aan het uiteinde van de lijn zit het **verbindingspunt** (source handle) én de **+**-knop.

```mermaid
flowchart TD
    A([Start]) --> B{Wat doet de gebruiker\nbij de stem?}

    B -- Klik op + knop --> C[Radiaalmenu verschijnt\nmet 4 opties:\nAction · Decision · Result · End]
    C --> D{Kies een type}
    D -- Klik op type --> E[Nieuwe node aangemaakt\n120px recht onder de bronnode\nop dezelfde X-positie]
    E --> F[Verbinding automatisch\naangemaakt van bron naar nieuwe node]
    F --> G{Bron is een\nDecision-node?}
    G -- Ja --> H[Padtype automatisch toegewezen\nY = rechter stem\nN = onderste stem]
    G -- Nee --> I[Verbindingstype = default]
    H --> J([Klaar])
    I --> J
    D -- Escape / klik buiten menu --> K([Menu gesloten\ngeen actie])

    B -- Sleep van verbindingspunt\nop lijnuiteinde --> L[Preview-lijn verschijnt direct:\northogonaal gestippeld pad\ndat de exacte route toont]
    L --> M[Sleep naar doelnode]
    M --> N{Verbinding geldig?}
    N -- Ja --> O[Verbinding aangemaakt\nvanaf exact het gebruikte punt]
    N -- Nee --> P([Verbinding geannuleerd])
    N --> J
```

**Positielogica (quick-add):**
- De nieuwe node krijgt dezelfde X-positie als de bronnode.
- De Y-positie is: `bronnode.y + 120px` (altijd recht naar beneden).
- Als die positie bezet is, wordt 120px opzij geprobeerd (tot 8 pogingen).

**Verbindingspunt op de lijnpunt:**
- Het source handle zit op het uiteinde van de stemlijn, niet op de node-rand.
- Hierdoor is de stem visueel én functioneel de vervanger van het verbindingspunt op die zijde.

---

## 3. Node verplaatsen (slepen)

```mermaid
flowchart TD
    A([Start]) --> B[Klik en houd vast op een node]
    B --> C[Node volgt de cursor]
    C --> D[Laat los op gewenste positie]
    D --> E[Positie snapt aan 16px grid]
    E --> F[Verbindingen hertekend\nnaar nieuwe positie]
    F --> G[Positie opgeslagen\nundo-entry aangemaakt]
    G --> H([Klaar])
```

---

## 4. Node verwijderen

```mermaid
flowchart TD
    A([Start]) --> B[Selecteer één of meer nodes\nvia klik of marquee-selectie]
    B --> C[Druk Delete of Backspace]
    C --> D{Heeft een geselecteerde\nnode commentaar?}
    D -- Ja --> E[Bevestigingsdialoog:\nVerwijderen inclusief commentaar?]
    E --> F{Gebruiker kiest}
    F -- Annuleer --> G([Geen actie])
    F -- Bevestig --> H[Node en alle bijbehorende\nverbindingen verwijderd]
    D -- Nee --> H
    H --> I[Undo-entry aangemaakt]
    I --> J([Klaar])
```

---

## 5. Verbinding handmatig aanmaken

```mermaid
flowchart TD
    A([Start]) --> B[Hover over een bronnode]
    B --> C[Verbindingspunten worden zichtbaar\nop de randen van de node]
    C --> D[Klik en sleep van een bronpunt\nnaar een doelnode]
    D --> E{Is de verbinding\ngeldig?}
    E -- Nee\nlimiet bereikt of\nongeldige combinatie --> F[Sleep afgebroken\ngeen verbinding aangemaakt]
    E -- Ja --> G{Bron is een\nDecision-node?}
    G -- Ja --> H[YN-picker verschijnt:\nKies Y-pad of N-pad]
    H --> I{Gebruiker kiest}
    I -- Annuleer / Escape --> J([Geen verbinding aangemaakt])
    I -- Y of N --> K[Verbinding aangemaakt\nmet gekozen padtype]
    G -- Nee --> L[Verbinding aangemaakt\nals default-type]
    K --> M[Undo-entry aangemaakt\nAuto-save gestart]
    L --> M
    M --> N([Klaar])
```

---

## 6. Diagram opslaan

```mermaid
flowchart TD
    A([Start]) --> B{Hoe slaat de\ngebruiker op?}
    B -- Handmatig:\nCtrl+S of Save-knop --> C{Bestand extern\ngewijzigd?}
    C -- Ja --> D[Dialoog:\nOverschrijven of herladen?]
    D --> E{Keuze}
    E -- Overschrijven --> F[Diagram weggeschreven\nnaar schijf]
    E -- Herladen --> G[Bestand opnieuw ingeladen\nWijzigingen gaan verloren]
    C -- Nee --> F
    B -- Auto-save:\n2 sec. na laatste wijziging --> F
    F --> H{Opslaan gelukt?}
    H -- Nee\ngeen Start-node\nof andere fout --> I[Foutmelding getoond]
    H -- Ja --> J[isDirty = false\nTimestamp bijgewerkt]
    J --> K([Klaar])
```

---

## 7. Map openen en bestand selecteren

```mermaid
flowchart TD
    A([Start]) --> B[Klik 'Open Folder'\nin toolbar of sidebar]
    B --> C[Browser toont\nmapper-kiezer]
    C --> D{Gebruiker kiest\neen map?}
    D -- Annuleer --> E([Geen actie])
    D -- Map gekozen --> F[Browser vraagt toestemming\nvoor de map]
    F --> G{Toestemming\nverleend?}
    G -- Nee --> E
    G -- Ja --> H[Map-handle opgeslagen\nin IndexedDB]
    H --> I[Bestandsstructuur geladen\nin sidebar]
    I --> J[Klik op een .mmd bestand]
    J --> K{Bestand ondersteund\nen ≤ 200 blokken?}
    K -- Nee --> L[Diagram geopend\nin read-only modus]
    K -- Ja --> M[Diagram geopend\nin canvas]
    M --> N([Klaar — diagram bewerkbaar])
    L --> O([Klaar — alleen lezen])
```

---

## 8. Verbinding verwijderen

```mermaid
flowchart TD
    A([Start]) --> B[Klik op een verbindingspijl\nin het canvas]
    B --> C[Verbinding geselecteerd\nRight panel toont verbindingseigenschappen]
    C --> D{Hoe verwijderen?}
    D -- Delete of Backspace --> E[Verbinding verwijderd]
    D -- Verwijder-knop\nin right panel --> E
    E --> F[Undo-entry aangemaakt\nAuto-save gestart]
    F --> G([Klaar])
```

---

## 9. Commentaar toevoegen aan een node

```mermaid
flowchart TD
    A([Start]) --> B[Selecteer een node]
    B --> C[Right panel toont\nblok-properties]
    C --> D[Klik op 'Commentaar'-knop]
    D --> E[Commentaarpaneel opent]
    E --> F[Typ opmerking in tekstveld\nmax. 2000 tekens]
    F --> G{Hoe toevoegen?}
    G -- Enter --> H[Opmerking toegevoegd\nmet timestamp]
    G -- Klik 'Toevoegen'-knop --> H
    H --> I[Opmerking zichtbaar in lijst]
    I --> J{Nog een\nopmerking?}
    J -- Ja --> F
    J -- Nee --> K([Klaar])
```

---

## 10. Undo / Redo

```mermaid
flowchart TD
    A([Start]) --> B{Welke actie?}
    B -- Ctrl+Z of Undo-knop --> C{Undo-stack\nniet leeg?}
    C -- Nee --> D[Undo-knop uitgeschakeld\ngeen actie]
    C -- Ja --> E[Vorige diagramtoestand\nhersteld]
    E --> F[Redo-stack bijgewerkt]
    F --> G([Klaar])
    B -- Ctrl+Y of Redo-knop --> H{Redo-stack\nniet leeg?}
    H -- Nee --> I[Redo-knop uitgeschakeld\ngeen actie]
    H -- Ja --> J[Teruggedraaide toestand\nopnieuw toegepast]
    J --> K[Undo-stack bijgewerkt]
    K --> G
```

---

## 11. Node label bewerken (inline)

Alleen **Action**, **Decision** en **Result** hebben een bewerkbaar label. De labels van **Start** ("Start") en **End** ("End") zijn vast.

```mermaid
flowchart TD
    A([Start]) --> B{Bloktype\nbewerkbaar?}
    B -- Start of End --> C([Geen actie\nlabel is vast])
    B -- Action / Decision / Result --> D[Dubbelklik op het label]
    D --> E[Inline tekstveld verschijnt\nhuidige tekst geselecteerd]
    E --> F[Typ nieuwe tekst]
    F --> G{Bevestigen?}
    G -- Enter of klik buiten node --> H{Tekst gewijzigd?}
    H -- Ja --> I[Label bijgewerkt\nUndo-entry aangemaakt]
    H -- Nee --> J([Geen actie])
    G -- Escape --> K[Bewerking geannuleerd\noriginele tekst hersteld]
    I --> L([Klaar])
    K --> L
```

---

## 12. Thema wisselen

```mermaid
flowchart TD
    A([Start]) --> B{Huidige themamodus?}

    B -- Automatisch\nmonitor-icoon --> C[Klik op themaknop]
    C --> D[Handmatige override actief\nThema omgewisseld\nOpgeslagen in localStorage]
    D --> E{Gewenst resultaat?}
    E -- Ja --> F([Klaar])
    E -- Terug naar systeeminstelling --> G[Rechtsklik op themaknop]
    G --> H[Override verwijderd\nEditor volgt systeem weer\nIconoon wordt monitor]
    H --> F

    B -- Handmatig\nzon of maan-icoon --> I[Klik op themaknop]
    I --> J[Thema omgewisseld\nLocalStorage bijgewerkt]
    J --> E
```

---

## 13. Exporteren als PNG of SVG

```mermaid
flowchart TD
    A([Start]) --> B[Klik op 'Export'\nin toolbar]
    B --> C[Dropdown toont:\nPNG · SVG]
    C --> D{Kies formaat}
    D -- PNG --> E[Canvas vastgelegd als bitmap\nAchtergrond: wit of donker\nop basis van thema]
    D -- SVG --> F[Canvas vastgelegd als vector]
    E --> G[Bestand gedownload:\ndiagramnaam.png]
    F --> H[Bestand gedownload:\ndiagramnaam.svg]
    G --> I([Klaar])
    H --> I
    D -- Klik buiten menu --> J([Menu gesloten\ngeen actie])
```
