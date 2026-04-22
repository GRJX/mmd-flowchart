# MMD Flowchart Editor

Een browser-gebaseerde WYSIWYG editor voor het maken en bewerken van Mermaid-flowcharts (`.mmd`-bestanden). Diagrammen worden opgeslagen als leesbare tekstbestanden, direct in een lokale map op schijf.

---

## Docker

```bash
# Build
docker build -t mmd-flowchart .

# Run
docker run -p 3100:80 mmd-flowchart
```

Of via Docker Compose:

```bash
docker compose up -d
```

Open `http://localhost:3100` in Chrome.

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
│  │ ├ a.mmd   │   Grid 16px                  │  Verbinding-props │
│  │ └ b.mmd   │   Quick-add stems (+)        │  Commentaar       │
│  └ c.mmd     │   QuickAdd-menu (radiaal)    │                   │
│              │   YN-picker (beslissing)     │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
```


---

## Documentatie

- [FO.md](FO.md) — gedetailleerde functionele beschrijving van alle features, bloktypen, verbindingsregels en interacties.
- [USERFLOWS.md](USERFLOWS.md) — stapsgewijze user flows als Mermaid-diagrammen (nieuw diagram, nodes toevoegen, verwijderen, opslaan, exporteren, etc.).
