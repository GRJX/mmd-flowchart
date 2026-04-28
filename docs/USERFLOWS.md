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

## 3b. Blokken dupliceren (Ctrl/Cmd+D)

Een snelle manier om bestaande blokken — al dan niet in groep — direct te kopiëren binnen het canvas. Handig voor herhalende patronen (bv. een set van Action → Decision → Result die je nog een paar keer wilt). Verbindingen die volledig binnen de selectie liggen worden mee-gekopieerd; verbindingen naar buiten de selectie blijven bij het origineel.

```mermaid
flowchart TD
    A([Start]) --> B["Selecteer één of meer blokken<br>via klik, Shift+klik of Shift+sleep (marquee)"]
    B --> C["Druk op Ctrl/Cmd+D"]
    C --> D{"Bevat de selectie<br>uitsluitend Start?"}
    D -- Ja --> E([Geen actie — Start is singleton])
    D -- Nee --> F["Singletons gefilterd<br>uit selectie"]
    F --> G["Voor elk blok:<br>nieuw uniek id toegekend<br>positie +24 px (gesnapt aan grid)<br>commentaren krijgen nieuwe id's"]
    G --> H{"Verbindingen waarbij<br>bron én doel gedupliceerd zijn?"}
    H -- Ja --> I["Verbindingen mee-gekopieerd<br>met nieuwe endpoints en kind behouden"]
    H -- Nee --> J["Verbindingen overslaan"]
    I --> K["Selectie verspringt naar nieuwe blokken<br>Undo-entry aangemaakt<br>Auto-save gestart"]
    J --> K
    K --> L([Klaar — verder slepen of opnieuw dupliceren])
```

---

## 3c. Kopiëren en plakken (Ctrl/Cmd+C / Ctrl/Cmd+V)

Naast direct dupliceren is er een echte klembord-flow: kopieer eerst, plak vervolgens één of meerdere keren. Het klembord houdt een snapshot vast die los staat van het origineel — verwijder of bewerk het origineel daarna en je plak nog steeds wat je gekopieerd had. Het klembord leeft alleen in de huidige sessie van het geopende bestand; bij bestand wisselen of refreshen is het leeg.

```mermaid
flowchart TD
    A([Start]) --> B["Selecteer één of meer blokken"]
    B --> C["Druk op Ctrl/Cmd+C"]
    C --> D{"Bevat selectie<br>niet-singleton blokken?"}
    D -- Nee --> E([Klembord blijft leeg<br>browser-kopie loopt door])
    D -- Ja --> F["Snapshot opgeslagen in klembord:<br>blokken + interne verbindingen<br>pasteCount = 0"]
    F --> G["Druk op Ctrl/Cmd+V"]
    G --> H{"Klembord leeg?"}
    H -- Ja --> I([Geen actie])
    H -- Nee --> J["pasteCount += 1<br>offset = 24 px × pasteCount"]
    J --> K["Nieuwe blokken aangemaakt<br>op originele positie + offset<br>nieuwe id's en comment-id's"]
    K --> L["Interne verbindingen mee-geplakt<br>met nieuwe endpoints"]
    L --> M["Selectie verspringt naar geplakte blokken<br>Undo-entry aangemaakt<br>Auto-save gestart"]
    M --> N{"Nogmaals plakken?"}
    N -- Ja --> G
    N -- Nee --> O([Klaar])
```

---

## 4. Blok verwijderen

Bij een meervoudige selectie (blokken + verbindingen) toont het right panel uitsluitend een verwijder-knop; een enkele druk op Delete of op die knop verwijdert het hele pakket.

```mermaid
flowchart TD
    A([Start]) --> B["Selecteer één of meer items<br>via klik, Shift+klik of Shift+sleep (marquee)"]
    B --> C{Hoe verwijderen?}
    C -- "Delete of Backspace" --> D{"Heeft een geselecteerd<br>blok commentaar?"}
    C -- "Verwijder-knop in right panel" --> D
    D -- Ja --> E["Bevestigingsdialoog:<br>Verwijderen inclusief commentaar?"]
    E --> F{Gebruiker kiest}
    F -- Annuleer --> G([Geen actie])
    F -- Bevestig --> H["Alle geselecteerde blokken<br>en bijbehorende verbindingen verwijderd"]
    D -- Nee --> H
    H --> I[Undo-entry aangemaakt]
    I --> J([Klaar])
```

---

## 4b. Door de flow navigeren via uitgaande paden

Het right panel toont voor elk geselecteerd blok (behalve End) een lijst van uitgaande paden. Klikken op een pad selecteert het doelblok — handig om een lange flow stap voor stap te volgen.

```mermaid
flowchart TD
    A([Start]) --> B[Selecteer een blok]
    B --> C["Right panel toont<br>blok-properties"]
    C --> D{"Bloktype"}
    D -- End --> E([Geen paden getoond])
    D -- "Start / Action / Result" --> F["Sectie 'Uitgaande paden':<br>één rij per verbinding"]
    D -- Decision --> G["Sectie 'Uitgaande paden':<br>Y-rij (rechts) + N-rij (onder)"]
    F --> H[Klik op een rij]
    G --> H
    H --> I["Selectie verschuift<br>naar het doelblok"]
    I --> J([Klaar — panel toont nieuwe blok])
```

---

## 5. Verbinding handmatig aanmaken

Alle bloktypen behalve Start hebben verbindingspunten op N, O, Z en W. Elk punt is bidirectioneel — het kan als bron én als doel dienen. Bij Decision geldt: **onder = N**, **rechts of links = Y** (rechts is default).

```mermaid
flowchart TD
    A([Start]) --> B[Hover over een bronblok]
    B --> C["Vier verbindingspunten<br>(N, O, Z, W) zichtbaar"]
    C --> D["Klik en sleep van een bronpunt<br>naar een punt op een doelblok"]
    D --> E{"Is de verbinding<br>geldig?"}
    E -- "Nee —<br>max. outputs bereikt of<br>self-loop" --> F["Sleep afgebroken<br>geen verbinding aangemaakt"]
    E -- Ja --> G{"Bron is een<br>Decision-blok?"}
    G -- Ja --> H["Kind bepaald door handle:<br>rechts of links = Y · onder = N"]
    H --> I["Verbinding aangemaakt<br>met de zijdes van bron en doel<br>opgeslagen in metadata"]
    G -- Nee --> J["Verbinding aangemaakt<br>als default-type"]
    I --> K["Undo-entry aangemaakt<br>Auto-save gestart"]
    J --> K
    K --> L([Klaar])
```

---

## 5b. Bestaande verbinding herverbinden

Een verbinding kan aan beide uiteinden opnieuw worden aangesloten zonder opnieuw te hoeven aanmaken. Label en Data Field blijven behouden; bij een Decision-bron wordt het kind opnieuw bepaald uit de nieuwe bronzijde.

```mermaid
flowchart TD
    A([Start]) --> B[Klik op een verbindingslijn]
    B --> C["Sleep-ankers verschijnen<br>op bron- en doeluiteinde"]
    C --> D{Welk anker slepen?}
    D -- Bron-anker --> E["Sleep naar ander verbindingspunt<br>op hetzelfde of ander blok"]
    D -- Doel-anker --> E
    E --> F{Doel geldig?}
    F -- "Nee — buiten handle<br>of limiet bereikt" --> G([Verbinding blijft ongewijzigd])
    F -- Ja --> H{"Bron is een<br>Decision-blok?"}
    H -- Ja --> I["Kind opnieuw bepaald:<br>rechts/links = Y · onder = N<br>Bestaande Y/N wordt omgeleid"]
    H -- Nee --> J["Kind blijft 'default'"]
    I --> K["Label en Data Field behouden<br>Sourceside / targetside bijgewerkt"]
    J --> K
    K --> L[Undo-entry aangemaakt]
    L --> M([Klaar])
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

## 7b. Bestand of map verslepen in sidebar

Bestanden en mappen kunnen direct naar een andere locatie in de tree gesleept worden. De verplaatsing gebeurt onder water via copy-in-doelmap + delete-uit-bronmap zodat dit ook werkt voor hele mapboomen.

```mermaid
flowchart TD
    A([Start]) --> B["Pak een rij in de sidebar<br>(bestand of map)"]
    B --> C{Drop op?}
    C -- Doelmap-rij --> D{"Valide?<br>(niet op zichzelf,<br>geen descendant,<br>naam nog vrij)"}
    C -- Lege ruimte in tree --> E[Verplaats naar root]
    D -- Nee --> F(["Geen actie —<br>drop genegeerd"])
    D -- Ja --> G["Content gekopieerd in doelmap<br>Bron verwijderd<br>Doelmap wordt uitgeklapt"]
    E --> G
    G --> H{"Open bestand in<br>(of binnen) verplaatst item?"}
    H -- Ja --> I["Editor volgt:<br>filePath herschreven<br>auto-save schrijft naar nieuwe locatie"]
    H -- Nee --> J([Klaar])
    I --> J
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

De Comments-sectie is een vast onderdeel van het blok-properties-paneel en zit onder ID / Label / Uitgaande paden. Het paneel is verdeeld in twee zones met elk hun eigen scroll: bovenin de eigenschappen, onderin de Comments-lijst met een vaste composer. Blokken met ≥ 1 comment tonen een accent-badge met het aantal in de rechterbovenhoek van het blok — zo is in één oogopslag te zien welke blokken notities bevatten.

```mermaid
flowchart TD
    A([Start]) --> B[Selecteer een blok]
    B --> C["Right panel toont<br>blok-properties<br>incl. Comments-sectie"]
    C --> D["Typ opmerking in de composer<br>onderin de Comments-sectie<br>(max. 2000 tekens)"]
    D --> E{Hoe toevoegen?}
    E -- Enter --> F["Opmerking toegevoegd<br>met timestamp"]
    E -- "Klik 'Plaatsen'-knop" --> F
    F --> G["Opmerking zichtbaar in lijst<br>Lijst scrollt indien nodig<br>Badge op canvas bijgewerkt"]
    G --> H{"Nog een<br>opmerking?"}
    H -- Ja --> D
    H -- Nee --> I([Klaar])
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

Alleen **Action**, **Decision** en **Result** hebben een bewerkbaar label. De labels van **Start** ("Start") en **End** ("End") zijn vast. Speciale tekens (`"`, `<`, `>`, `&`) zijn vrij te typen — ze worden bij het opslaan transparant naar mermaid-entities geëscapet en bij het laden weer terug-gedecodeerd. Zie FO.md §4 "Label-escaping".

```mermaid
flowchart TD
    A([Start]) --> B{"Bloktype<br>bewerkbaar?"}
    B -- "Start of End" --> C(["Geen actie —<br>label is vast"])
    B -- "Action / Decision / Result" --> D[Dubbelklik op het label]
    D --> E["Inline tekstveld verschijnt<br>huidige tekst geselecteerd"]
    E --> F["Typ nieuwe tekst<br>(quotes en HTML-tekens toegestaan)"]
    F --> G{Bevestigen?}
    G -- "Enter of klik buiten blok" --> H{Tekst gewijzigd?}
    H -- Ja --> I["Label bijgewerkt<br>Undo-entry aangemaakt<br>Bij save: speciale tekens<br>geëscapet naar mermaid-entities"]
    H -- Nee --> J([Geen actie])
    G -- Escape --> K["Bewerking geannuleerd<br>originele tekst hersteld"]
    I --> L([Klaar])
    K --> L
```

---

## 12. Thema wisselen

De themaknop toont het huidige voorkeur-icoon (**zon** = light, **maan** = dark, **monitor** = system) en cyclet bij elke klik door de drie varianten: light → dark → system → light. De voorkeur wordt in localStorage bewaard; in system-modus volgt de editor live de OS-instelling.

```mermaid
flowchart TD
    A([Start]) --> B{Huidig icoon?}
    B -- "Zon (light)" --> C[Klik]
    C --> D["Overgang naar dark<br>Icoon wordt maan"]
    B -- "Maan (dark)" --> E[Klik]
    E --> F["Overgang naar system<br>Icoon wordt monitor<br>Editor volgt nu OS"]
    B -- "Monitor (system)" --> G[Klik]
    G --> H["Overgang naar light<br>Icoon wordt zon"]
    D --> I([Klaar])
    F --> I
    H --> I
```

---

## 13. Exporteren als PNG of SVG

De export toont exact wat op het canvas staat: shapes houden hun vulkleur (diamonds krijgen dus een wit of donker interieur afhankelijk van thema), edge-lijnen blijven volledig zichtbaar inclusief label en pijlpunten. Onder water worden alle SVG `fill`/`stroke`-waarden net vóór de snapshot als inline-stijl gezet zodat CSS-variabelen correct meegenomen worden tijdens de clone.

```mermaid
flowchart TD
    A([Start]) --> B["Klik op 'Export'<br>in toolbar"]
    B --> C["Dropdown toont:<br>PNG · SVG"]
    C --> D{Kies formaat}
    D -- PNG --> E["Bitmap, achtergrond wit/donker<br>afhankelijk van thema,<br>2x pixel-ratio"]
    D -- SVG --> F["Vector, transparante achtergrond"]
    E --> G["Bestand gedownload:<br>diagramnaam.png"]
    F --> H["Bestand gedownload:<br>diagramnaam.svg"]
    G --> I([Klaar])
    H --> I
    D -- "Klik buiten menu of Escape" --> J(["Menu gesloten —<br>geen actie"])
```

---

## 14. Bestandscontextmenu (rechtermuisknop in sidebar)

Verplaatsen gebeurt niet via het menu maar via drag-and-drop (zie flow 7b).

```mermaid
flowchart TD
    A([Start]) --> B{"Rechtsklik op…"}

    B -- Bestand --> C{"Kies actie"}
    C -- Hernoemen --> D["Inline tekstveld in de tree<br>basenaam geselecteerd"]
    D --> E{Bevestigen?}
    E -- Enter --> F["Bestand hernoemd<br>open bestand volgt mee"]
    E -- "Escape of blur" --> G([Geen actie])
    C -- Verwijderen --> K["Bevestigingsdialoog"]
    K --> L{Gebruiker kiest}
    L -- Annuleer --> G
    L -- Bevestig --> M["Bestand verwijderd<br>Editor sluit als dit het open bestand was"]

    B -- Map --> N{"Kies actie"}
    N -- "Nieuw diagram hier…" --> O["NewDiagramDialog opent met<br>targetFolder = deze map"]
    N -- "Nieuwe map hier…" --> P["NewSubfolderDialog opent"]
    P --> Q["Submap aangemaakt<br>doelmap uitgeklapt"]
    N -- Hernoemen --> D
    N -- Verwijderen --> R["Bevestigingsdialoog<br>(recursief)"]
    R --> S{Gebruiker kiest}
    S -- Annuleer --> G
    S -- Bevestig --> T["Map + inhoud verwijderd<br>Editor sluit indien nodig"]

    B -- "Lege tree-achtergrond" --> U{"Kies actie"}
    U -- "Nieuw diagram hier…" --> O
    U -- "Nieuwe map hier…" --> P

    F --> V([Klaar])
    M --> V
    O --> V
    Q --> V
    T --> V
```

---

## 15. Externe-wijziging-detectie

De editor vergelijkt de `lastModified` van het open bestand met wat lokaal als laatst-opgeslagen bekend is. Checks gebeuren op twee momenten: vlak vóór een write en bij tab-refocus / visibility-change.

```mermaid
flowchart TD
    A([Trigger]) --> B{"Welk moment?"}
    B -- "Save (auto of Cmd+S)" --> C["Lees lastModified op schijf"]
    C --> D{"Nieuwer dan<br>lastSavedAt?"}
    D -- Nee --> E[Schrijf naar schijf]
    D -- Ja --> F["Sticky toast:<br>'Bestand is extern gewijzigd…'<br>acties: Overschrijven · Herladen"]
    F --> G{Keuze}
    G -- Overschrijven --> H["saveCurrentDiagram({force: true})<br>write gaat door"]
    G -- Herladen --> I["openFile(path)<br>disk-versie geladen<br>lokale wijzigingen verloren"]
    G -- "Toast sluiten" --> J([Geen actie])

    B -- "Tab refocus / visibility" --> K["Lees lastModified op schijf"]
    K --> L{"Nieuwer?"}
    L -- Nee --> M([Klaar])
    L -- Ja --> N["Sticky toast:<br>'Dit bestand is extern gewijzigd.'<br>actie: Herladen"]
    N --> O{Keuze}
    O -- Herladen --> I
    O -- "Toast sluiten" --> J
```

