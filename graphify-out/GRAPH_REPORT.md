# Graph Report - mmd-flowchart  (2026-07-08)

## Corpus Check
- 62 files · ~49,247 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1296 nodes · 4132 edges · 74 communities (67 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 117 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f13d044e`
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
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]

## God Nodes (most connected - your core abstractions)
1. `B()` - 94 edges
2. `rE()` - 58 edges
3. `ce()` - 57 edges
4. `vE()` - 55 edges
5. `t()` - 45 edges
6. `E()` - 44 edges
7. `Qe()` - 44 edges
8. `T1()` - 43 edges
9. `l1()` - 42 edges
10. `n()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `Bloktypen spec` --references--> `BLOCK_CONFIG table`  [INFERRED]
  docs/FO.md → src/config/blockConfig.ts
- `Embedded MMD_META metadata` --shares_data_with--> `Block`  [INFERRED]
  docs/FO.md → src/types/domain.ts
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

## Communities (74 total, 7 thin omitted)

### Community 0 - "App Shell & Properties Panels"
Cohesion: 0.05
Nodes (148): _0(), aa(), Ac(), Ai(), am(), B(), Be(), Bi() (+140 more)

### Community 1 - "Theme & Toolbar/Dialogs"
Cohesion: 0.04
Nodes (40): __, bw(), bx(), Cw(), Dw(), ek(), fs(), Gl() (+32 more)

### Community 2 - "Block Config & Palette"
Cohesion: 0.07
Nodes (70): a(), A2(), Ae(), bb(), bg(), C2, CN(), cx() (+62 more)

### Community 3 - "File Operations & Tree CRUD"
Cohesion: 0.08
Nodes (59): _2(), a0(), ad(), Al(), ap(), b0(), Bp(), cd() (+51 more)

### Community 4 - "Canvas Rendering (nodes/edges)"
Cohesion: 0.05
Nodes (43): 10. Undo / Redo, 11. Blok-label bewerken (inline), 12. Thema wisselen, 13. Exporteren als PNG of SVG, 14. Bestandscontextmenu (rechtermuisknop in sidebar), 15. Externe-wijziging-detectie, 1. Nieuw diagram maken, 2. Blok toevoegen of verbinden via de stem (+35 more)

### Community 5 - "MMD Parsing & IDs"
Cohesion: 0.08
Nodes (28): inferBlockTypeFromId(), makeConnectionId(), BlockMeta, buildMetaBlock(), ConnectionMeta, DiagramMetaV1, extractMetaBlock(), EdgeLine (+20 more)

### Community 6 - "Domain Model & FO Spec"
Cohesion: 0.1
Nodes (33): ah(), ao(), bf(), Bo(), Dh(), er(), Fh(), Gh() (+25 more)

### Community 7 - "File System Access & Handle Store"
Cohesion: 0.12
Nodes (25): FsBackend, isVsCodeWebview(), PickRootResult, ReadResult, SaveExportResult, TreeFile, TreeFolder, TreeNode (+17 more)

### Community 8 - "Canvas Interaction & Grid Snapping"
Cohesion: 0.16
Nodes (32): b1(), c1(), d1(), Ex(), _f(), g1(), Go(), he() (+24 more)

### Community 9 - "MMD Serialization"
Cohesion: 0.19
Nodes (29): a1(), ag(), ar(), aw(), bc(), bn(), bS(), fo() (+21 more)

### Community 10 - "Domain Types"
Cohesion: 0.19
Nodes (29): Au(), B2(), dC(), ed(), eE(), En(), fy(), gi() (+21 more)

### Community 11 - "Bootstrap & Editor Hooks"
Cohesion: 0.12
Nodes (26): cg(), df(), dg(), ew(), F1(), fg(), h1(), hh() (+18 more)

### Community 12 - "Toast Notifications"
Cohesion: 0.22
Nodes (25): getFsBackend(), checkForExternalChange(), copyFile(), copyFolder(), createNewDiagram(), createSubfolder(), deleteNode(), fail() (+17 more)

### Community 13 - "MMD Round-trip Metadata"
Cohesion: 0.2
Nodes (25): At(), cb(), copy(), db(), eb(), gb(), Gc(), hb() (+17 more)

### Community 14 - "Button Primitive"
Cohesion: 0.1
Nodes (23): Ax(), bk(), bl(), Br(), fb(), Fr(), _g(), gk() (+15 more)

### Community 15 - "Diagram Export (PNG/SVG)"
Cohesion: 0.1
Nodes (23): BLOCK_CONFIG table, BlockTypeConfig, getBlockConfig, Block, BlockType, Comment, Connection, ConnectionKind (+15 more)

### Community 16 - "Shared Utilities"
Cohesion: 0.11
Nodes (22): $1(), as(), bu(), ck(), da(), Do(), eg(), Eu() (+14 more)

### Community 17 - "Macro-grid Alignment"
Cohesion: 0.12
Nodes (16): cn(), AppShell(), Props, FileTree(), TreeNodeView(), NewDiagramDialog(), countFiles(), OpenFolderButton() (+8 more)

### Community 18 - "Vite Config"
Cohesion: 0.14
Nodes (13): Canvas(), getBlockConfig(), allocateBlockId(), BlockProperties(), CommentsSection(), Props, ConnectionProperties(), Palette() (+5 more)

### Community 19 - "Read-only Mode"
Cohesion: 0.13
Nodes (20): ay(), by(), cl(), cy(), di(), ds(), e0(), el() (+12 more)

### Community 20 - "Undo/Redo"
Cohesion: 0.15
Nodes (6): buildHtml(), buildTree(), decodeDataUrl(), makeNonce(), MmdEditorProvider, MmdPanel

### Community 21 - "PNG/SVG Export Spec"
Cohesion: 0.12
Nodes (18): displayable(), e2(), eS(), h0(), If(), jf, Ju(), ma() (+10 more)

### Community 22 - "Right Panel Spec"
Cohesion: 0.14
Nodes (18): BlockNodeComponent, BlockShape, Canvas, isValidConnection, addBlock, addConnection, FlowEdgeComponent, allocateBlockId (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (12): ConfirmDialog(), Props, ContextMenu(), ContextMenuItem, Props, ConfirmState, MenuState, Props (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (17): InnerApp component, detectDiagramKind, alignBlocksToMacroGrid, loadDiagram, checkForExternalChange, openFile fileOp, saveCurrentDiagram fileOp, Externe-wijziging-detectie (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (12): defaultEdgeOptions, edgeTypes, nodeTypes, BlockNode, BlockNodeData, blocksToNodes(), connectionsToEdges(), EdgeData (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (11): Args, downloadDataUrl(), exportDiagram(), ExportKind, inlineSvgPresentationStyles(), stripExtension(), useAutoSave(), useExternalChangeWatch() (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (16): BlockProperties Component, CommentsSection Subcomponent, PathRow Subcomponent, nodeFillVar helper, Button Component, ConnectionProperties Component, summarizeSelection helper, useDiagramStore (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (16): AppShell Layout, ConfirmDialog Component, ContextMenu Component, createNewDiagram fileOp, createSubfolder fileOp, deleteNode fileOp, moveNode fileOp, refreshTree (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (7): ResolvedTheme, ThemePreference, useTheme(), ExportMenu(), IconButton(), Toolbar(), App()

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (14): ab(), bt(), dy(), fk(), gg(), Ix(), _k(), pk() (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.21
Nodes (12): openRootFolder(), restoreRootFolder(), buildTree(), ensureReadWrite(), isFileSystemAccessSupported(), joinPath(), pickRootFolder(), ReadResult (+4 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (13): 6. Canvas-interacties, Align-knop (toolbar, links van Fit-to-screen), Blokken dupliceren, Blokken selecteren, Blokken toevoegen, Blokken verplaatsen, Blokken verwijderen, Grid (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (12): Adding blocks: palette vs. quick-add, Connecting blocks manually / Decision Y/N assignment, Creating a new diagram, Editing labels, data fields, comments, Exporting, Macro-grid alignment, Opening a folder & a diagram, Saving, external-change conflicts, and read-only mode (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (12): App composition, Architecture: State & UI, Canvas ↔ React Flow integration, code:block1 (Toolbar   (save · new · export · zoom · undo/redo · theme)), `diagramStore.ts` (the core editor state machine, ~900 lines), `folderStore.ts`, Hooks (`src/hooks/`), Right panel (`src/panel/`) (+4 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (13): App component, exportDiagram function, openRootFolder fileOp, restoreRootFolder, buildTree, loadRootHandle, saveRootHandle, index.html shell (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (11): Aan de slag, Basisworkflow, code:bash (# Build), code:block2 (┌───────────────────────────────────────────────────────────), Documentatie, Eerste keer gebruiken, Hoe de app werkt, Lokaal draaien (Docker) (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (11): Architecture: Diagram Domain & `.mmd` File Format, Block types (`src/config/blockConfig.ts`), code:ts (type BlockType = "start" | "end" | "action" | "decision" | "), code:block2 (%% MMD_META_START), Domain model (`src/types/domain.ts`), Embedded metadata (`src/lib/mermaid/metadata.ts`), Label escaping, Parse / serialize / detect (`src/lib/mermaid/`) (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.27
Nodes (11): af(), clamp(), formatHsl(), gs(), lf(), of(), Vn(), Ws() (+3 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (10): Block, BlockType, Comment, Connection, ConnectionKind, Diagram, DiagramFile, HandleSide (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (10): 11. Toetsenbordsneltoetsen, 13. Read-only modus, 14. Undo / Redo, 1. Doel & scope, 7. Quick-add & radiaalmenu, 9. Toolbar, Functioneel Ontwerp — MMD Flowchart Editor, Inhoudsopgave (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.2
Nodes (10): Bd(), Bh(), Fd(), Hd(), Iw(), rm(), sh(), _w() (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.2
Nodes (10): Dn(), Dr(), Ea(), eo(), FN, Jr(), lN(), Mn() (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.27
Nodes (10): Ba(), Ch(), eh(), Ha(), Jo(), jx(), Mh(), Ng() (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.36
Nodes (8): initVsCodeBridge(), post(), pushDocumentEdit(), requestDocumentSave(), saveExportViaHost(), VsCodeApi, HostToWebview, WebviewToHost

### Community 45 - "Community 45"
Cohesion: 0.2
Nodes (9): code:bash (npm install), code:bash (npm run build       # tsc -b && vite build  -> dist/), code:bash (docker build -t mmd-flowchart .), Docker / deployment, Generated/ignored artifacts, Linting / type-checking, No automated test suite — what to check by hand, Operations (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (7): ClipboardEntry, DiagramState, EMPTY_DIAGRAM, EMPTY_SELECTION, Selection, SelectionSummary, Snapshot

### Community 47 - "Community 47"
Cohesion: 0.31
Nodes (8): Architectuur, Bouwen, code:block1 (┌────────────────────────────┐   "mmd-edit" (tekst)   ┌─────), code:bash (# 1. Webview-bundel (vanuit de repo-root) → vscode-extension), code:bash (npm run package         # maakt mmd-flowchart-<versie>.vsix), Draaien (development), Gedrag & keuzes, MMD Flowchart Editor — VSCode-extensie

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (8): code:block1 (src/), Conventions worth knowing before you change code, OpenWiki Quickstart — MMD Flowchart Editor, Repository layout, Sections, Tech stack, What this is, Where to start reading code

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (8): Architecture: Files, Persistence & Export, Export (`src/lib/export/exportDiagram.ts`), File System Access API wrapper (`src/lib/fs/fsAccess.ts`), Folder & file tree operations, Handle persistence (`src/lib/fs/handleStore.ts`), High-level file operations (`src/lib/fs/fileOps.ts`, ~660 lines), Saving & conflict handling, What to watch out for when changing this area

### Community 50 - "Community 50"
Cohesion: 0.32
Nodes (6): BlockNodeComponent, BlockNodeInner(), SIDE_TO_POSITION, BlockShape(), nodeFillVar(), Props

### Community 51 - "Community 51"
Cohesion: 0.25
Nodes (5): Toasts(), Toast, ToastKind, ToastState, useToastStore

### Community 52 - "Community 52"
Cohesion: 0.25
Nodes (8): 5. Bestandsbeheer, Bestand openen, Bestandscontextmenu (rechtermuisknop in sidebar), Bestandsstructuur in sidebar, Drag-and-drop in sidebar, Map openen, Nieuw diagram, Opslaan

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (8): 4. Bestandsformaat (.mmd), code:block1 (%% MMD_META_START), code:json ({), Embedded metadata (MMD_META), Label-escaping, Mermaid-bloknodes (syntaxis per type), Structuur, Volgorde in het bestand

### Community 54 - "Community 54"
Cohesion: 0.25
Nodes (8): 2. Bloktypen, Action, Blok-configuratietabel, Blok-properties (gemeenschappelijk), Decision, End, Result, Start

### Community 55 - "Community 55"
Cohesion: 0.36
Nodes (8): inferBlockTypeFromId, buildMetaBlock, DiagramMetaV1, extractMetaBlock, mermaidUnescape, parseMmd, mermaidEscape, serializeMmd

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (6): Button, ButtonProps, Size, sizeCls, Variant, variantCls

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (7): 3. Verbindingen, Regels, Verbindingen aanmaken, Verbindingen herverbinden, Verbindingseigenschappen, Verbindingstypen, YN-toewijzing

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (5): ALL_SIDES, BLOCK_CONFIG, BLOCK_TYPES_ORDERED, BlockTypeConfig, HandleDirection

### Community 60 - "Community 60"
Cohesion: 0.4
Nodes (5): jt(), o2(), tt(), Ue(), zg()

### Community 61 - "Community 61"
Cohesion: 0.7
Nodes (4): clearRootHandle(), loadRootHandle(), openDb(), saveRootHandle()

### Community 62 - "Community 62"
Cohesion: 0.4
Nodes (5): 8. Right panel, Blok-palette (standaard, geen selectie), Blok-properties (één blok geselecteerd), Meervoudige selectie (> 1 item), Verbindingseigenschappen (één verbinding geselecteerd)

### Community 63 - "Community 63"
Cohesion: 0.5
Nodes (3): detectDiagramKind(), DiagramKind, KNOWN_OTHER_DIAGRAMS

### Community 64 - "Community 64"
Cohesion: 0.5
Nodes (4): 12. Fout- en waarschuwingsstatussen, Meldingen (tijdelijk, 4 seconden, via toast-systeem), Opslaan geblokkeerd, Violation (verbindingslimiet overschreden)

### Community 65 - "Community 65"
Cohesion: 0.67
Nodes (3): 10. Exporteren, PNG, SVG

## Knowledge Gaps
- **252 isolated node(s):** `Rt`, `rd`, `Kr`, `Qy`, `__` (+247 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `parseMmd()` connect `MMD Parsing & IDs` to `Vite Config`, `Toast Notifications`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `getBlockConfig()` connect `Vite Config` to `Community 25`, `Community 50`, `Community 59`, `MMD Parsing & IDs`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `isVsCodeWebview()` connect `Community 26` to `Community 44`, `Community 29`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `Rt`, `rd`, `Kr` to the rest of the system?**
  _252 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Shell & Properties Panels` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Theme & Toolbar/Dialogs` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Block Config & Palette` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._