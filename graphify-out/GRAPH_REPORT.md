# Graph Report - mmd-flowchart  (2026-07-08)

## Corpus Check
- 68 files · ~50,908 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1361 nodes · 5365 edges · 77 communities (68 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cb7bde92`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_App Shell & Properties Panels|App Shell & Properties Panels]]
- [[_COMMUNITY_Theme & ToolbarDialogs|Theme & Toolbar/Dialogs]]
- [[_COMMUNITY_Block Config & Palette|Block Config & Palette]]
- [[_COMMUNITY_File Operations & Tree CRUD|File Operations & Tree CRUD]]
- [[_COMMUNITY_Canvas Rendering (nodesedges)|Canvas Rendering (nodes/edges)]]
- [[_COMMUNITY_MMD Parsing & IDs|MMD Parsing & IDs]]
- [[_COMMUNITY_Domain Model & FO Spec|Domain Model & FO Spec]]
- [[_COMMUNITY_File System Access & Handle Store|File System Access & Handle Store]]
- [[_COMMUNITY_Canvas Interaction & Grid Snapping|Canvas Interaction & Grid Snapping]]
- [[_COMMUNITY_MMD Serialization|MMD Serialization]]
- [[_COMMUNITY_Domain Types|Domain Types]]
- [[_COMMUNITY_Bootstrap & Editor Hooks|Bootstrap & Editor Hooks]]
- [[_COMMUNITY_Toast Notifications|Toast Notifications]]
- [[_COMMUNITY_MMD Round-trip Metadata|MMD Round-trip Metadata]]
- [[_COMMUNITY_Button Primitive|Button Primitive]]
- [[_COMMUNITY_Diagram Export (PNGSVG)|Diagram Export (PNG/SVG)]]
- [[_COMMUNITY_Shared Utilities|Shared Utilities]]
- [[_COMMUNITY_Macro-grid Alignment|Macro-grid Alignment]]
- [[_COMMUNITY_Vite Config|Vite Config]]
- [[_COMMUNITY_Read-only Mode|Read-only Mode]]
- [[_COMMUNITY_UndoRedo|Undo/Redo]]
- [[_COMMUNITY_PNGSVG Export Spec|PNG/SVG Export Spec]]
- [[_COMMUNITY_Right Panel Spec|Right Panel Spec]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]

## God Nodes (most connected - your core abstractions)
1. `B()` - 124 edges
2. `rE()` - 81 edges
3. `ce()` - 79 edges
4. `vE()` - 71 edges
5. `E()` - 65 edges
6. `t()` - 60 edges
7. `Qe()` - 57 edges
8. `n()` - 56 edges
9. `l1()` - 51 edges
10. `t1()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `Embedded MMD_META metadata` --shares_data_with--> `Block`  [INFERRED]
  docs/FO.md → src/types/domain.ts
- `Bloktypen spec` --references--> `BLOCK_CONFIG table`  [INFERRED]
  docs/FO.md → src/config/blockConfig.ts
- `Grid sizing rationale` --references--> `BLOCK_CONFIG table`  [EXTRACTED]
  docs/FO.md → src/config/blockConfig.ts
- `Vite config` --references--> `index.html shell`  [INFERRED]
  vite.config.ts → index.html
- `Externe-wijziging-detectie` --references--> `useExternalChangeWatch`  [INFERRED]
  docs/FO.md → src/hooks/useExternalChangeWatch.ts

## Hyperedges (group relationships)
- **React app bootstrap chain** — index_html, main_root, app_app, app_innerapp [EXTRACTED 0.85]
- **Config-driven block type system** — domain_blocktype, blockconfig_blockconfig, fo_blocktypes [INFERRED 0.85]
- **MMD persistence and metadata model** — fo_mmdformat, fo_embeddedmetadata, fo_labelescaping, domain_diagramfile [INFERRED 0.75]
- **Selection-driven right panel view routing** — rightpanel_rightpanel, palette_palette, blockproperties_blockproperties, connectionproperties_connectionproperties, rightpanel_multiselect [EXTRACTED 1.00]
- **File tree CRUD via fileOps** — filetree_filetree, fileops_movenode, fileops_deletenode, fileops_renamenode, fileops_openfile [INFERRED 0.85]
- **Four-slot app shell layout composition** — appshell_appshell, toolbar_toolbar, sidebar_sidebar, rightpanel_rightpanel [INFERRED 0.75]
- **MMD file parse/serialize round-trip** — parse_parsemmd, serialize_serializemmd, metadata_extractmetablock, metadata_buildmetablock [INFERRED 0.90]
- **Diagram save pipeline** — useautosave_useautosave, fileops_savecurrentdiagram, serialize_serializemmd, fsaccess_writefile, diagramstore_usediagramstore [INFERRED 0.85]
- **File open and load pipeline** — fileops_openfile, fsaccess_readfile, detect_detectdiagramkind, parse_parsemmd, diagramstore_loaddiagram [INFERRED 0.85]

## Communities (77 total, 9 thin omitted)

### Community 0 - "App Shell & Properties Panels"
Cohesion: 0.06
Nodes (157): _0(), a1(), ac(), Ae(), af(), An(), Ar(), As() (+149 more)

### Community 1 - "Theme & Toolbar/Dialogs"
Cohesion: 0.05
Nodes (126): aa(), ag(), Ah(), Ai(), B(), Bd(), bf(), Bh() (+118 more)

### Community 2 - "Block Config & Palette"
Cohesion: 0.08
Nodes (68): Au(), Bi(), Ci(), dE(), dy(), e2(), ed(), EE() (+60 more)

### Community 3 - "File Operations & Tree CRUD"
Cohesion: 0.1
Nodes (60): _2, a0(), Al(), ap(), b0(), bp, c0(), cd() (+52 more)

### Community 4 - "Canvas Rendering (nodes/edges)"
Cohesion: 0.04
Nodes (38): __, _1(), Aw(), bw(), C2, Cw(), displayable(), Dw() (+30 more)

### Community 5 - "MMD Parsing & IDs"
Cohesion: 0.11
Nodes (48): a(), A2(), bg(), CN(), D(), D2(), E(), F2() (+40 more)

### Community 6 - "Domain Model & FO Spec"
Cohesion: 0.05
Nodes (43): 10. Undo / Redo, 11. Blok-label bewerken (inline), 12. Thema wisselen, 13. Exporteren als PNG of SVG, 14. Bestandscontextmenu (rechtermuisknop in sidebar), 15. Externe-wijziging-detectie, 1. Nieuw diagram maken, 2. Blok toevoegen of verbinden via de stem (+35 more)

### Community 7 - "File System Access & Handle Store"
Cohesion: 0.08
Nodes (28): inferBlockTypeFromId(), makeConnectionId(), BlockMeta, buildMetaBlock(), ConnectionMeta, DiagramMetaV1, extractMetaBlock(), EdgeLine (+20 more)

### Community 8 - "Canvas Interaction & Grid Snapping"
Cohesion: 0.12
Nodes (25): FsBackend, isVsCodeWebview(), PickRootResult, ReadResult, SaveExportResult, TreeFile, TreeFolder, TreeNode (+17 more)

### Community 9 - "MMD Serialization"
Cohesion: 0.18
Nodes (32): ab(), At(), bb(), cb(), copy(), db(), eb(), Fr() (+24 more)

### Community 10 - "Domain Types"
Cohesion: 0.15
Nodes (32): ay(), B2(), by(), _c(), Cc(), cy(), dc(), Di() (+24 more)

### Community 11 - "Bootstrap & Editor Hooks"
Cohesion: 0.19
Nodes (24): ad(), am(), bm(), cl(), d0(), Dm(), gp(), ht() (+16 more)

### Community 12 - "Toast Notifications"
Cohesion: 0.24
Nodes (23): getFsBackend(), checkForExternalChange(), copyFile(), copyFolder(), createNewDiagram(), createSubfolder(), deleteNode(), fail() (+15 more)

### Community 13 - "MMD Round-trip Metadata"
Cohesion: 0.1
Nodes (3): documentChanged(), MmdFileEditor, MmdFileEditorProvider

### Community 14 - "Button Primitive"
Cohesion: 0.12
Nodes (16): cn(), AppShell(), Props, FileTree(), TreeNodeView(), NewDiagramDialog(), countFiles(), OpenFolderButton() (+8 more)

### Community 15 - "Diagram Export (PNG/SVG)"
Cohesion: 0.14
Nodes (13): Canvas(), getBlockConfig(), allocateBlockId(), BlockProperties(), CommentsSection(), Props, ConnectionProperties(), Palette() (+5 more)

### Community 16 - "Shared Utilities"
Cohesion: 0.16
Nodes (20): InnerApp component, AppShell Layout, nodeFillVar helper, alignBlocksToMacroGrid, summarizeSelection helper, useDiagramStore, exportDiagram function, saveCurrentDiagram fileOp (+12 more)

### Community 17 - "Macro-grid Alignment"
Cohesion: 0.15
Nodes (19): ce(), Ei(), El(), ey, i0, _m(), Pl(), q0() (+11 more)

### Community 18 - "Vite Config"
Cohesion: 0.15
Nodes (6): buildHtml(), buildTree(), decodeDataUrl(), makeNonce(), MmdEditorProvider, MmdPanel

### Community 19 - "Read-only Mode"
Cohesion: 0.14
Nodes (13): Args, downloadDataUrl(), exportDiagram(), ExportKind, inlineSvgPresentationStyles(), stripExtension(), useAutoSave(), useExternalChangeWatch() (+5 more)

### Community 20 - "Undo/Redo"
Cohesion: 0.14
Nodes (18): BlockNodeComponent, BlockShape, Canvas, isValidConnection, addBlock, addConnection, FlowEdgeComponent, allocateBlockId (+10 more)

### Community 21 - "PNG/SVG Export Spec"
Cohesion: 0.15
Nodes (12): ConfirmDialog(), Props, ContextMenu(), ContextMenuItem, Props, ConfirmState, MenuState, Props (+4 more)

### Community 22 - "Right Panel Spec"
Cohesion: 0.15
Nodes (17): detectDiagramKind, loadDiagram, checkForExternalChange, openFile fileOp, findFileByPath, readFile, inferBlockTypeFromId, buildMetaBlock (+9 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (16): ba(), Bx(), ch(), ck(), eh(), Ha(), Hr(), Jo() (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (12): defaultEdgeOptions, edgeTypes, nodeTypes, BlockNode, BlockNodeData, blocksToNodes(), connectionsToEdges(), EdgeData (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (13): openRootFolder(), restoreRootFolder(), buildTree(), ensureReadWrite(), isFileSystemAccessSupported(), joinPath(), pickRootFolder(), readFile() (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (14): BLOCK_CONFIG table, BlockTypeConfig, getBlockConfig, Block, BlockType, Comment, Connection, ConnectionKind (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (14): ConfirmDialog Component, ContextMenu Component, createNewDiagram fileOp, createSubfolder fileOp, deleteNode fileOp, moveNode fileOp, refreshTree, renameNode fileOp (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (13): Ax(), dr, Fn(), fs(), _g(), gk(), jk(), Lx() (+5 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (13): 6. Canvas-interacties, Align-knop (toolbar, links van Fit-to-screen), Blokken dupliceren, Blokken selecteren, Blokken toevoegen, Blokken verplaatsen, Blokken verwijderen, Grid (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (12): Adding blocks: palette vs. quick-add, Connecting blocks manually / Decision Y/N assignment, Creating a new diagram, Editing labels, data fields, comments, Exporting, Macro-grid alignment, Opening a folder & a diagram, Saving, external-change conflicts, and read-only mode (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (12): App composition, Architecture: State & UI, Canvas ↔ React Flow integration, code:block1 (Toolbar   (save · new · export · zoom · undo/redo · theme)), `diagramStore.ts` (the core editor state machine, ~900 lines), `folderStore.ts`, Hooks (`src/hooks/`), Right panel (`src/panel/`) (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.24
Nodes (11): HostGlobals, initHostBridge(), JcefHost, post(), pushDocumentEdit(), requestDocumentSave(), saveExportViaHost(), Transport (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.2
Nodes (12): bk(), bl(), Br(), fb(), Kg(), lb(), rb(), uk() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.17
Nodes (11): Aan de slag, Basisworkflow, code:bash (# Build), code:block2 (┌───────────────────────────────────────────────────────────), Documentatie, Eerste keer gebruiken, Hoe de app werkt, Lokaal draaien (Docker) (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.17
Nodes (11): Architecture: Diagram Domain & `.mmd` File Format, Block types (`src/config/blockConfig.ts`), code:ts (type BlockType = "start" | "end" | "action" | "decision" | "), code:block2 (%% MMD_META_START), Domain model (`src/types/domain.ts`), Embedded metadata (`src/lib/mermaid/metadata.ts`), Label escaping, Parse / serialize / detect (`src/lib/mermaid/`) (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.18
Nodes (10): Block, BlockType, Comment, Connection, ConnectionKind, Diagram, DiagramFile, HandleSide (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (10): 10. Exporteren, 11. Toetsenbordsneltoetsen, 13. Read-only modus, 14. Undo / Redo, 1. Doel & scope, 9. Toolbar, Functioneel Ontwerp — MMD Flowchart Editor, Inhoudsopgave (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (4): ResolvedTheme, ThemePreference, useTheme(), App()

### Community 39 - "Community 39"
Cohesion: 0.2
Nodes (9): code:bash (npm install), code:bash (npm run build       # tsc -b && vite build  -> dist/), code:bash (docker build -t mmd-flowchart .), Docker / deployment, Generated/ignored artifacts, Linting / type-checking, No automated test suite — what to check by hand, Operations (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.36
Nodes (8): initVsCodeBridge(), post(), pushDocumentEdit(), requestDocumentSave(), saveExportViaHost(), VsCodeApi, HostToWebview, WebviewToHost

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (10): App component, openRootFolder fileOp, restoreRootFolder, buildTree, loadRootHandle, saveRootHandle, index.html shell, main.tsx entrypoint (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.31
Nodes (9): ao(), clamp(), ew(), formatHsl(), lf(), of(), Xs(), yi() (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (7): ClipboardEntry, DiagramState, EMPTY_DIAGRAM, EMPTY_SELECTION, Selection, SelectionSummary, Snapshot

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (8): Bouwen, code:block1 (┌────────────────────────────┐  __mmdHost.postMessage  ┌────), code:bash (# 1. Webview-bundel (vanuit de repo-root)), code:bash (./gradlew runIde), Draaien (development), Installeren / delen, MMD Flowchart Editor — IntelliJ-plugin, Status & aandachtspunten

### Community 45 - "Community 45"
Cohesion: 0.31
Nodes (8): Architectuur, Bouwen, code:block1 (┌────────────────────────────┐   "mmd-edit" (tekst)   ┌─────), code:bash (# 1. Webview-bundel (vanuit de repo-root) → vscode-extension), code:bash (npm run package         # maakt mmd-flowchart-<versie>.vsix), Draaien (development), Gedrag & keuzes, MMD Flowchart Editor — VSCode-extensie

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): code:block1 (src/), Conventions worth knowing before you change code, OpenWiki Quickstart — MMD Flowchart Editor, Repository layout, Sections, Tech stack, What this is, Where to start reading code

### Community 47 - "Community 47"
Cohesion: 0.22
Nodes (8): Architecture: Files, Persistence & Export, Export (`src/lib/export/exportDiagram.ts`), File System Access API wrapper (`src/lib/fs/fsAccess.ts`), Folder & file tree operations, Handle persistence (`src/lib/fs/handleStore.ts`), High-level file operations (`src/lib/fs/fileOps.ts`, ~660 lines), Saving & conflict handling, What to watch out for when changing this area

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (9): Verbindingen spec, Embedded MMD_META metadata, Functioneel Ontwerp (FO), Label-escaping, MMD bestandsformaat, Quick-add & radiaalmenu, MMD Flowchart Editor overview, File System Access API (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (9): BlockProperties Component, CommentsSection Subcomponent, PathRow Subcomponent, Button Component, ConnectionProperties Component, Input Field Component, Label Field Component, ReadOnlyField Component (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.32
Nodes (6): BlockNodeComponent, BlockNodeInner(), SIDE_TO_POSITION, BlockShape(), nodeFillVar(), Props

### Community 51 - "Community 51"
Cohesion: 0.25
Nodes (8): 2. Bloktypen, Action, Blok-configuratietabel, Blok-properties (gemeenschappelijk), Decision, End, Result, Start

### Community 52 - "Community 52"
Cohesion: 0.25
Nodes (8): 4. Bestandsformaat (.mmd), code:block1 (%% MMD_META_START), code:json ({), Embedded metadata (MMD_META), Label-escaping, Mermaid-bloknodes (syntaxis per type), Structuur, Volgorde in het bestand

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (8): 5. Bestandsbeheer, Bestand openen, Bestandscontextmenu (rechtermuisknop in sidebar), Bestandsstructuur in sidebar, Drag-and-drop in sidebar, Map openen, Nieuw diagram, Opslaan

### Community 54 - "Community 54"
Cohesion: 0.25
Nodes (5): Toasts(), Toast, ToastKind, ToastState, useToastStore

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (6): Button, ButtonProps, Size, sizeCls, Variant, variantCls

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (7): 3. Verbindingen, Regels, Verbindingen aanmaken, Verbindingen herverbinden, Verbindingseigenschappen, Verbindingstypen, YN-toewijzing

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (5): ALL_SIDES, BLOCK_CONFIG, BLOCK_TYPES_ORDERED, BlockTypeConfig, HandleDirection

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (5): loadDiagramContent(), onHostMessage(), detectDiagramKind(), DiagramKind, KNOWN_OTHER_DIAGRAMS

### Community 60 - "Community 60"
Cohesion: 0.4
Nodes (5): 8. Right panel, Blok-palette (standaard, geen selectie), Blok-properties (één blok geselecteerd), Meervoudige selectie (> 1 item), Verbindingseigenschappen (één verbinding geselecteerd)

### Community 61 - "Community 61"
Cohesion: 0.7
Nodes (4): clearRootHandle(), loadRootHandle(), openDb(), saveRootHandle()

### Community 62 - "Community 62"
Cohesion: 0.5
Nodes (4): Jy, U2(), W2(), Y2

### Community 64 - "Community 64"
Cohesion: 0.5
Nodes (4): 12. Fout- en waarschuwingsstatussen, Meldingen (tijdelijk, 4 seconden, via toast-systeem), Opslaan geblokkeerd, Violation (verbindingslimiet overschreden)

### Community 66 - "Community 66"
Cohesion: 0.67
Nodes (3): 7. Quick-add & radiaalmenu, NodeAddStem, QuickAddMenu

## Knowledge Gaps
- **257 isolated node(s):** `Rt`, `Qy`, `Props`, `Props`, `MenuState` (+252 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `g` connect `Block Config & Palette` to `Community 32`, `App Shell & Properties Panels`?**
  _High betweenness centrality (0.225) - this node is a cross-community bridge._
- **Why does `isEmbeddedHost()` connect `Read-only Mode` to `Community 32`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `Toolbar()` connect `Read-only Mode` to `Community 38`, `Diagram Export (PNG/SVG)`, `Button Primitive`, `Community 63`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `Rt`, `Qy`, `Props` to the rest of the system?**
  _257 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Shell & Properties Panels` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Theme & Toolbar/Dialogs` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Block Config & Palette` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._