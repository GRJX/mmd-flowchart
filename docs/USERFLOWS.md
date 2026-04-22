# User Flows — MMD Flowchart Editor

Alle interacties beschreven als stapsgewijze flows in Mermaid-syntax.

---

## 1. Nieuw diagram maken

```mermaid
flowchart TD
    A([Start]) --> B[Klik op 'New Diagram' in toolbar]
    B --> C["Dialoogvenster verschijnt:<br>Voer bestandsnaam in"]
    C --> D{"Bestandsnaam<br>ingevoerd?"}
    D -- Nee --> C
    D -- Ja --> E[Klik 'Create' of druk Enter]
    E --> F[".mmd bestand aangemaakt<br>in geselecteerde map"]
    F --> G["Diagram geladen in canvas<br>met één Start-blok"]
    G --> H([Klaar — diagram is bewerkbaar])
```

---

## 2. Blok toevoegen of verbinden via de stem

De stem verschijnt **alleen bij nieuw op het canvas geplaatste blokken** als visuele hint om direct door te bouwen. Aan het uiteinde van de stemlijn zit het **verbindingspunt** (source handle) én de **+**-knop.

```mermaid
flowchart TD
    A([Start]) --> B{"Wat doet de gebruiker<br>bij de stem?"}

    B -- "Klik op + knop" --> C["Radiaalmenu verschijnt<br>met 4 opties:<br>Decision · Action · Result · End"]
    C --> D{Kies een type}
    D -- "Klik op type" --> E["Nieuw blok aangemaakt<br>~120px verwijderd<br>op vrije gridpositie"]
    E --> F["Verbinding automatisch<br>aangemaakt van bron naar nieuw blok"]
    F --> G{"Bron is een<br>Decision-blok?"}
    G -- Ja --> H["Padtype automatisch toegewezen:<br>Y = rechter stem<br>N = onderste stem"]
    G -- Nee --> I[Verbindingstype = default]
    H --> J([Klaar])
    I --> J
    D -- "Escape / klik buiten menu" --> K([Menu gesloten — geen actie])

    B -- "Sleep van verbindingspunt<br>op lijnuiteinde" --> L["Preview-lijn verschijnt direct:<br>orthogonaal gestippeld pad<br>dat de exacte route toont"]
    L --> M[Sleep naar doelblok]
    M --> N{Verbinding geldig?}
    N -- Ja --> O["Verbinding aangemaakt<br>vanafexact het gebruikte punt"]
    N -- Nee --> P([Verbinding geannuleerd])
    O --> J
```

**Positielogica (quick-add):**
- Het nieuwe blok wordt gecentreerd onder het huidige blok geplaatst.
- Als die positie bezet is, wordt een vrije positie naast of verder weg geprobeerd (tot 8 pogingen, telkens 120px opzij).

**Verbindingspunt op de lijnpunt:**
- Het source handle zit op het uiteinde van de stemlijn, niet op de blok-rand.
- De stem verdwijnt zodra het bijbehorende pad aangemaakt is. Als een bestaande verbinding later verwijderd wordt, keert de stem **niet** terug.

---

## 3. Blok verplaatsen (slepen)

```mermaid
flowchart TD
    A([Start]) --> B[Klik en houd vast op een blok]
    B --> C[Blok volgt de cursor]
    C --> D[Laat los op gewenste positie]
    D --> E[Positie snapt aan 8px grid]
    E --> F["Verbindingen hertekend<br>naar nieuwe positie"]
    F --> G["Positie opgeslagen<br>undo-entry aangemaakt"]
    G --> H([Klaar])
```

---

## 4. Blok verwijderen

```mermaid
flowchart TD
    A([Start]) --> B["Selecteer één of meer blokken<br>via klik of marquee-selectie"]
    B --> C[Druk Delete of Backspace]
    C --> D{"Heeft een geselecteerd<br>blok commentaar?"}
    D -- Ja --> E["Bevestigingsdialoog:<br>Verwijderen inclusief commentaar?"]
    E --> F{Gebruiker kiest}
    F -- Annuleer --> G([Geen actie])
    F -- Bevestig --> H["Blok en alle bijbehorende<br>verbindingen verwijderd"]
    D -- Nee --> H
    H --> I[Undo-entry aangemaakt]
    I --> J([Klaar])
```

---

## 5. Verbinding handmatig aanmaken

```mermaid
flowchart TD
    A([Start]) --> B[Hover over een bronblok]
    B --> C["Verbindingspunten worden zichtbaar<br>op de randen van het blok"]
    C --> D["Klik en sleep van een bronpunt<br>naar een doelblok"]
    D --> E{"Is de verbinding<br>geldig?"}
    E -- "Nee —<br>limiet bereikt of<br>ongeldige combinatie" --> F["Sleep afgebroken<br>geen verbinding aangemaakt"]
    E -- Ja --> G{"Bron is een<br>Decision-blok?"}
    G -- Ja --> H["Label automatisch ingesteld<br>op basis van handle-richting:<br>rechts = Y · onder = N"]
    H --> I["Verbinding aangemaakt<br>met automatisch padtype"]
    G -- Nee --> J["Verbinding aangemaakt<br>als default-type"]
    I --> K["Undo-entry aangemaakt<br>Auto-save gestart"]
    J --> K
    K --> L([Klaar])
```

---

## 6. Diagram opslaan

```mermaid
flowchart TD
    A([Start]) --> B{"Hoe slaat de<br>gebruiker op?"}
    B -- "Handmatig:<br>Ctrl+S of Save-knop" --> C{"Bestand extern<br>gewijzigd?"}
    C -- Ja --> D["Dialoog:<br>Overschrijven of herladen?"]
    D --> E{Keuze}
    E -- Overschrijven --> F["Diagram weggeschreven<br>naar schijf"]
    E -- Herladen --> G["Bestand opnieuw ingeladen<br>Wijzigingen gaan verloren"]
    C -- Nee --> F
    B -- "Auto-save:<br>2 sec. na laatste wijziging" --> H{"Diagram geldig<br>om op te slaan?"}
    F --> H
    H -- "Nee —<br>geen Start-blok of<br>meer dan één Start-blok" --> I[Foutmelding getoond]
    H -- Ja --> J["isDirty = false<br>Timestamp bijgewerkt"]
    J --> K([Klaar])
```

---

## 7. Map openen en bestand selecteren

```mermaid
flowchart TD
    A([Start]) --> B["Klik 'Open Folder'<br>in toolbar of sidebar"]
    B --> C["Browser toont<br>mappenkiezer"]
    C --> D{"Gebruiker kiest<br>een map?"}
    D -- Annuleer --> E([Geen actie])
    D -- "Map gekozen" --> F["Browser vraagt toestemming<br>voor de map"]
    F --> G{"Toestemming<br>verleend?"}
    G -- Nee --> E
    G -- Ja --> H["Map-handle opgeslagen<br>in IndexedDB"]
    H --> I["Bestandsstructuur geladen<br>in sidebar"]
    I --> J[Klik op een .mmd bestand]
    J --> K{"Bestand extern<br>gewijzigd?"}
    K -- Ja --> L["Melding: bestand is gewijzigd<br>Meest recente versie wordt geladen"]
    K -- Nee --> M{"Bestand ondersteund<br>en ≤ 200 blokken?"}
    L --> M
    M -- Nee --> N["Diagram geopend<br>in read-only modus"]
    M -- Ja --> O["Diagram geopend<br>in canvas"]
    O --> P([Klaar — diagram bewerkbaar])
    N --> Q([Klaar — alleen lezen])
```

---

## 8. Verbinding verwijderen

```mermaid
flowchart TD
    A([Start]) --> B["Klik op een verbindingspijl<br>in het canvas"]
    B --> C["Verbinding geselecteerd<br>Right panel toont verbindingseigenschappen"]
    C --> D{Hoe verwijderen?}
    D -- "Delete of Backspace" --> E[Verbinding verwijderd]
    D -- "Verwijder-knop<br>in right panel" --> E
    E --> F["Undo-entry aangemaakt<br>Auto-save gestart"]
    F --> G([Klaar])
```

---

## 9. Commentaar toevoegen aan een blok

```mermaid
flowchart TD
    A([Start]) --> B[Selecteer een blok]
    B --> C["Right panel toont<br>blok-properties"]
    C --> D[Klik op 'Commentaar'-knop]
    D --> E[Commentaarpaneel opent]
    E --> F["Typ opmerking in tekstveld<br>(max. 2000 tekens)"]
    F --> G{Hoe toevoegen?}
    G -- Enter --> H["Opmerking toegevoegd<br>met timestamp"]
    G -- "Klik 'Toevoegen'-knop" --> H
    H --> I[Opmerking zichtbaar in lijst]
    I --> J{"Nog een<br>opmerking?"}
    J -- Ja --> F
    J -- Nee --> K([Klaar])
```

---

## 10. Undo / Redo

```mermaid
flowchart TD
    A([Start]) --> B{Welke actie?}
    B -- "Ctrl+Z of Undo-knop" --> C{"Undo-stack<br>niet leeg?"}
    C -- Nee --> D["Undo-knop uitgeschakeld<br>geen actie"]
    C -- Ja --> E["Vorige diagramtoestand<br>hersteld"]
    E --> F[Redo-stack bijgewerkt]
    F --> G([Klaar])
    B -- "Ctrl+Y of Redo-knop" --> H{"Redo-stack<br>niet leeg?"}
    H -- Nee --> I["Redo-knop uitgeschakeld<br>geen actie"]
    H -- Ja --> J["Teruggedraaide toestand<br>opnieuw toegepast"]
    J --> K[Undo-stack bijgewerkt]
    K --> G
```

---

## 11. Blok-label bewerken (inline)

Alleen **Action**, **Decision** en **Result** hebben een bewerkbaar label. De labels van **Start** ("Start") en **End** ("End") zijn vast.

```mermaid
flowchart TD
    A([Start]) --> B{"Bloktype<br>bewerkbaar?"}
    B -- "Start of End" --> C(["Geen actie —<br>label is vast"])
    B -- "Action / Decision / Result" --> D[Dubbelklik op het label]
    D --> E["Inline tekstveld verschijnt<br>huidige tekst geselecteerd"]
    E --> F[Typ nieuwe tekst]
    F --> G{Bevestigen?}
    G -- "Enter of klik buiten blok" --> H{Tekst gewijzigd?}
    H -- Ja --> I["Label bijgewerkt<br>Undo-entry aangemaakt"]
    H -- Nee --> J([Geen actie])
    G -- Escape --> K["Bewerking geannuleerd<br>originele tekst hersteld"]
    I --> L([Klaar])
    K --> L
```

---

## 12. Thema wisselen

```mermaid
flowchart TD
    A([Start]) --> B{Huidige themamodus?}

    B -- "Automatisch<br>(monitor-icoon)" --> C[Klik op themaknop]
    C --> D["Handmatige override actief<br>Thema omgewisseld<br>Opgeslagen in localStorage"]
    D --> E{Gewenst resultaat?}
    E -- Ja --> F([Klaar])
    E -- "Terug naar systeeminstelling" --> G[Rechtsklik op themaknop]
    G --> H["Override verwijderd<br>Editor volgt systeem weer<br>Icoon wordt monitor"]
    H --> F

    B -- "Handmatig<br>(zon of maan-icoon)" --> I[Klik op themaknop]
    I --> J["Thema omgewisseld<br>localStorage bijgewerkt"]
    J --> E
```

---

## 13. Exporteren als PNG of SVG

```mermaid
flowchart TD
    A([Start]) --> B["Klik op 'Export'<br>in toolbar"]
    B --> C["Dropdown toont:<br>PNG · SVG"]
    C --> D{Kies formaat}
    D -- PNG --> E["Canvas vastgelegd als bitmap<br>Achtergrond: wit of donker<br>op basis van thema"]
    D -- SVG --> F[Canvas vastgelegd als vector]
    E --> G["Bestand gedownload:<br>diagramnaam.png"]
    F --> H["Bestand gedownload:<br>diagramnaam.svg"]
    G --> I([Klaar])
    H --> I
    D -- "Klik buiten menu" --> J(["Menu gesloten —<br>geen actie"])
```

---

## 14. Bestandscontextmenu (rechtermuisknop in sidebar)

```mermaid
flowchart TD
    A([Start]) --> B{"Rechtsklik op<br>bestand of map?"}

    B -- Bestand --> C{"Kies actie"}
    C -- Hernoemen --> D["Inline naamveld verschijnt<br>huidige naam geselecteerd"]
    D --> E{"Bevestigen?"}
    E -- "Enter of klik buiten veld" --> F["Bestand hernoemd<br>Sidebar bijgewerkt"]
    E -- Escape --> G([Geen actie])

    C -- Verplaatsen --> H["Dialoog: kies doelmap<br>uit mappenstructuur"]
    H --> I{"Doelmap<br>gekozen?"}
    I -- Annuleer --> G
    I -- Bevestig --> J["Bestand verplaatst<br>Sidebar bijgewerkt"]

    C -- Verwijderen --> K["Bevestigingsdialoog:<br>Verwijderen?"]
    K --> L{Gebruiker kiest}
    L -- Annuleer --> G
    L -- Bevestig --> M["Bestand verwijderd<br>Sidebar bijgewerkt"]

    B -- Map --> N{"Kies actie"}
    N -- "Nieuw diagram aanmaken" --> O["Dialoogvenster: bestandsnaam<br>Diagram aangemaakt in deze map"]
    N -- "Submap aanmaken" --> P["Inline naamveld voor<br>nieuwe submap"]
    P --> Q["Submap aangemaakt<br>Sidebar bijgewerkt"]
    N -- "Map verwijderen" --> R["Bevestigingsdialoog:<br>Map inclusief inhoud verwijderen?"]
    R --> S{Gebruiker kiest}
    S -- Annuleer --> G
    S -- Bevestig --> T["Map en inhoud verwijderd<br>Sidebar bijgewerkt"]

    F --> U([Klaar])
    J --> U
    M --> U
    O --> U
    Q --> U
    T --> U
```
