# Progress — MMD Flowchart Editor

Scratch-doc voor iteratieve voortgang. Niet authoritative — FO.md / USERFLOWS.md zijn leidend.

## Afgestemd met gebruiker (2026-04-22)
- Grid: **8px** (FO leidend; README gefixt).
- Verbindingstypes intern: `default | yes | no`. Mermaid-output: `Y` / `N`.
- Metadata-schema: strikt volgens `FO.md §4`. Negeer afwijkingen in `test-diagrams/`.
- Decision: **N = bottom**; **Y = right of left** (rechts default). Nieuwe verbinding van dezelfde kind → **oude verwijderen, nieuwe vervangt**.
- Alle blokken behalve Start hebben 4 bidirectionele knooppunten (N/O/Z/W).
- Stack: Vite + React 18 + TS strict, @xyflow/react v12, Tailwind v4 + shadcn/ui, Zustand, idb-keyval, html-to-image, mermaid (read-only).

## Iteratie 1 — scaffolding + core models ✅
- [x] `package.json` + `vite.config.ts` + `tsconfig.json` + `index.html`
- [x] Tailwind v4 install + `globals.css`
- [x] `src/types/domain.ts` — BlockType, Block, Connection, Diagram, Comment
- [x] `src/config/blockConfig.ts` — per-type config (FO §2)
- [x] `src/lib/mermaid/{parse,serialize,metadata,detect}.ts`
- [x] `src/store/diagramStore.ts` — Zustand store met undo/redo
- [x] Scaffold-App laadt sample en toont round-trip JSON + MMD
- [x] Vite build groen met Node 20

**BELANGRIJK**: dev/build vereist Node 20+. `nvm use 20` vóór `npm run dev`.

## Iteratie 2 — canvas ✅
- [x] `src/shell/AppShell.tsx` — grid shell
- [x] `src/canvas/Canvas.tsx` — ReactFlow canvas met snap, pan, marquee, isValidConnection
- [x] `BlockNode` + `BlockShape` — één generieke node switcht op `blockConfig`
- [x] `FlowEdge` — smoothstep (orthogonaal + afgerond), label met bg
- [x] Drag: live via `setBlockPositionLive`, drop via `moveBlocks` (= 1 undo-entry)
- [x] Inline label edit (Action/Decision/Result), Enter/Escape
- [x] Decision YN-redirect bij bezette handle werkt via store

**Keuzes tijdens bouwen:**
- Rechtermuis/middlemouse pan, linkermuis marquee. `multiSelectionKeyCode=['Shift','Meta']`.
- Edges in store zijn authoritative — `onEdgesChange` is no-op, alle mutaties via store actions.
- `isValidConnection` blokkeert sleep vóór drop; store-guards zijn defensief (dubbel slot).

## Iteratie 3 — right panel shell + content-views ✅
- [x] `src/panel/RightPanel.tsx` shell — dispatcht op selectie-summary
- [x] `Palette` met `PaletteThumbnail` (mini-SVG shapes, drag + click-to-add)
- [x] `BlockProperties` — type, ID, label, dataField/expectedOutcome, uitgaande paden, commentaar, delete
- [x] `ConnectionProperties` — label, from/to met spring-naar, dataField, delete
- [x] `CommentsPanel` — lijst, delete, Enter=submit / Shift+Enter=newline

## Iteratie 3b — design-polish ✅
- [x] Uitgaande paden in right panel voor álle bloktypen behalve End (niet meer alleen Decision)
- [x] Decision Y/N-labels editable; kind blijft behouden via metadata
- [x] Multi-select view: alleen een Delete-knop
- [x] Alle bloktypen behalve Start hebben 4 bidirectionele knooppunten (N/O/Z/W)
- [x] Comment counter badge op blokken; positie aangepast voor diamond-vorm
- [x] Action/Decision/Result ondersteunen onbeperkt inkomende verbindingen
- [x] Delete/Backspace shortcut (skipt inputs / textareas / contenteditable)
- [x] Edges herverbinden via drag van bron- of doelanker (`onReconnect` + `reconnectConnection` store action)
- [x] Decision Y-kind uit zowel **right** als **left** handle
- [x] Docs bijgewerkt: FO.md + USERFLOWS.md

## Iteratie 4 — stems + QuickAddMenu (uitgesteld)
Op verzoek overgeslagen; planning heropent zodra Stems/Radiaalmenu weer relevant is.

## Iteratie 5 — sidebar + FS ✅ (basis)
- [x] `src/lib/fs/fsAccess.ts` — directory picker, permission-check, tree-walk, read/write
- [x] `src/lib/fs/handleStore.ts` — IndexedDB-persistentie root-handle
- [x] `src/lib/fs/fileOps.ts` — `openRootFolder`, `restoreRootFolder`, `openFile`, `createNewDiagram`, `saveCurrentDiagram`
- [x] `src/store/folderStore.ts` — tree, status, expanded paths, currentFilePath
- [x] `src/sidebar/Sidebar.tsx` — states (unsupported-browser / permission-denied / error / loading / empty / ready)
- [x] `src/sidebar/FileTree.tsx` — VS Code-achtige tree met chevron + folder- en file-icons (lucide-react)
- [x] `src/sidebar/NewDiagramDialog.tsx` — modale dialoog voor "Nieuw diagram" (aangemaakt in root)
- [x] `src/shell/Toolbar.tsx` — Open-folder knop, bestandsnaam + dirty-stip, save-status (alleen wanneer er een bestand open is)
- [x] `src/hooks/useAutoSave.ts` — zustand-subscribe + 2s debounce + in-flight guard
- [x] App wiring: `restoreRootFolder()` bij mount, `useAutoSave()` actief, sample-mmd verwijderd, PlaceholderPanels weg

## Iteratie 5b — sidebar polish ✅
- [x] "Wissel"-knop verwijderd — Open folder in toolbar is canoniek
- [x] Drag-and-drop in sidebar: sleep files/folders tussen mappen (copy+delete via `moveNode` in `fileOps.ts`)
- [x] Root-dropzone: sleep naar de lege ruimte in de tree om naar de root te verplaatsen
- [x] Bescherming tegen drop-into-self en drop-into-descendant
- [x] Open bestand wordt automatisch opnieuw gemapt als het mee-verplaatst

**Nog te doen (iteratie 7):**
- [ ] Sidebar context-menu (hernoemen / verwijderen)
- [ ] Externe-wijziging-detectie met overschrijven/herladen-dialoog
- [ ] `createNewDiagram` op folder-scope (nu alleen root)

## Iteratie 6 — toolbar + undo/redo + export ✅
- [x] `src/shell/Toolbar.tsx` — volledige toolbar: Open folder, Save, New diagram, Export (PNG/SVG), bestandsnaam + save-status, Fit to screen, Zoom −/%/+, Undo, Redo, Thema
- [x] Save-knop + `Ctrl/Cmd+S` shortcut (disabled als er niets te saven valt)
- [x] Undo/Redo knoppen + `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` / `Ctrl/Cmd+Y`
- [x] Zoom in/out/% via `useReactFlow`; dubbelklik op % reset naar 100%
- [x] Fit to screen + `Ctrl/Cmd+Shift+F`
- [x] `src/hooks/useTheme.ts` — light/dark/system preference, gepersisteerd in localStorage; rechtsklik op thema-knop reset naar system
- [x] `src/hooks/useShortcuts.ts` — globale sneltoetsen (§11), skipt inputs/textarea/contentEditable
- [x] `src/lib/export/exportDiagram.ts` — PNG via `html-to-image` (2x pixelratio, thema-aware achtergrond), SVG vector-export; bounding box + 32px padding
- [x] New Diagram dialog-state verhuisd naar `folderStore` zodat zowel sidebar als toolbar het kunnen openen
- [x] `Ctrl/Cmd+A` = selectAll (bestond al in store, nu ook in shortcuts)

## Iteratie 7 — polish ✅
- [x] `src/lib/export/exportDiagram.ts` — export gerefactored naar xyflow's `getNodesBounds` + `getViewportForBounds`. Geen handmatige transform op het live DOM meer; de clone-only `style.transform` zorgt voor een strakke crop rond het diagram (PNG én SVG).
- [x] `src/store/toastStore.ts` + `src/shell/Toasts.tsx` — zustand-based toast-systeem met info/success/warning/error, optionele duration (null = sticky), één of meerdere acties per toast.
- [x] Sidebar context-menu (rechtsklik):
  - Op een map: Nieuw diagram hier / Nieuwe map hier / Hernoemen / Verwijderen.
  - Op een bestand: Hernoemen / Verwijderen.
  - Op de lege tree-achtergrond: root-acties (Nieuw diagram / Nieuwe map).
- [x] Inline rename in de tree (Enter = bevestigen, Escape = annuleren, blur = annuleren). Basenaam wordt default geselecteerd zodat extensie intact blijft.
- [x] `ConfirmDialog` voor destructieve delete-bevestiging.
- [x] `fileOps`: `renameNode`, `deleteNode`, `createSubfolder` via copy + recursive-delete (consistent met `moveNode`). Open bestand volgt rename / close bij delete.
- [x] `NewDiagramDialog` folder-scoped via `openNewDiagramDialog(targetFolder)`; toolbar opent op root, context-menu op klikte map.
- [x] Externe-wijziging-detectie:
  - Save controleert bestands-timestamp tegen `lastSavedAt`; bij conflict toont het een sticky toast met **Overschrijven** / **Herladen**.
  - `useExternalChangeWatch` checkt bij tab-focus/visibility-change en toont **Herladen** als het open bestand nieuwer is op schijf.
- [x] Toasts geïntegreerd in `saveCurrentDiagram`, `moveNode`, `openFile` (unsupported-type / te veel blokken), `renameNode`, `deleteNode`, `createSubfolder`.

**Nog niet in scope:**
- [ ] Read-only rendering via mermaid.js voor non-flowchart + >200 blocks (nu leeg canvas met toast-melding).
- [ ] Violation state — `computeViolations` en `animate-violation` bestaan al in de canvas-hook; visueel gedrag van de pulse kan later nog verfijnd worden.

## Open vragen / notities
- Commentaar-schema in FO.md §4 heeft `{id,text,timestamp}` — geen author. OK, skip author.
- `width`/`height` in metadata: nodes hebben dynamisch maten. Opslaan op save, bij load overnemen zodat layout 1:1 terugkomt.
- "New diagram" dialog in iteratie 5 is bewust minimaal (alleen naam + root-folder). Een volledige variant met folder-scope en inline rename volgt met de context-menu's in iteratie 7.
- Auto-save schrijft **stil**, alleen error toast bij mislukken (toast-systeem volgt in iteratie 7).
- Wanneer er geen bestand open is, toont de toolbar bewust geen save-status: auto-save kan niet schrijven zonder handle, en "Wijzigingen worden opgeslagen…" zou anders permanent blijven staan totdat de gebruiker een bestand kiest of aanmaakt.
