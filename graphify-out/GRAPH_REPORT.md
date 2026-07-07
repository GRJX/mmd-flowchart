# Graph Report - .  (2026-07-07)

## Corpus Check
- Corpus is ~30,614 words - fits in a single context window. You may not need a graph.

## Summary
- 363 nodes · 521 edges · 23 communities (17 shown, 6 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.8)
- Token cost: 0 input · 212,382 output

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
- [[_COMMUNITY_Read-only Mode|Read-only Mode]]
- [[_COMMUNITY_UndoRedo|Undo/Redo]]
- [[_COMMUNITY_PNGSVG Export Spec|PNG/SVG Export Spec]]
- [[_COMMUNITY_Right Panel Spec|Right Panel Spec]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 15 edges
2. `useDiagramStore` - 12 edges
3. `useDiagramStore` - 12 edges
4. `parseMmd()` - 11 edges
5. `BlockProperties Component` - 10 edges
6. `saveCurrentDiagram fileOp` - 9 edges
7. `Canvas` - 9 edges
8. `showToast()` - 8 edges
9. `FileTree Component` - 8 edges
10. `refreshTree()` - 7 edges

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

## Communities (23 total, 6 thin omitted)

### Community 0 - "App Shell & Properties Panels"
Cohesion: 0.05
Nodes (61): App component, InnerApp component, AppShell Layout, BlockProperties Component, CommentsSection Subcomponent, PathRow Subcomponent, nodeFillVar helper, Button Component (+53 more)

### Community 1 - "Theme & Toolbar/Dialogs"
Cohesion: 0.05
Nodes (34): ResolvedTheme, ThemePreference, useTheme(), cn(), AppShell(), Props, ExportMenu(), IconButton() (+26 more)

### Community 2 - "Block Config & Palette"
Cohesion: 0.07
Nodes (25): ALL_SIDES, BLOCK_CONFIG, BLOCK_TYPES_ORDERED, BlockTypeConfig, getBlockConfig(), HandleDirection, allocateBlockId(), BlockNodeInner() (+17 more)

### Community 3 - "File Operations & Tree CRUD"
Cohesion: 0.16
Nodes (24): checkForExternalChange(), copyFile(), copyFolder(), createNewDiagram(), createSubfolder(), deleteNode(), fail(), findFolderByPath() (+16 more)

### Community 4 - "Canvas Rendering (nodes/edges)"
Cohesion: 0.12
Nodes (18): Canvas(), defaultEdgeOptions, edgeTypes, nodeTypes, BlockNode, BlockNodeData, blocksToNodes(), connectionsToEdges() (+10 more)

### Community 5 - "MMD Parsing & IDs"
Cohesion: 0.12
Nodes (16): inferBlockTypeFromId(), makeConnectionId(), BlockMeta, ConnectionMeta, DiagramMetaV1, extractMetaBlock(), EdgeLine, mapLabelToKind() (+8 more)

### Community 6 - "Domain Model & FO Spec"
Cohesion: 0.1
Nodes (23): BLOCK_CONFIG table, BlockTypeConfig, getBlockConfig, Block, BlockType, Comment, Connection, ConnectionKind (+15 more)

### Community 7 - "File System Access & Handle Store"
Cohesion: 0.16
Nodes (16): openRootFolder(), restoreRootFolder(), buildTree(), ensureReadWrite(), isFileSystemAccessSupported(), joinPath(), pickRootFolder(), ReadResult (+8 more)

### Community 8 - "Canvas Interaction & Grid Snapping"
Cohesion: 0.13
Nodes (19): BlockNodeComponent, BlockShape, Canvas, isValidConnection, addBlock, addConnection, alignBlocksToMacroGrid, FlowEdgeComponent (+11 more)

### Community 9 - "MMD Serialization"
Cohesion: 0.25
Nodes (12): buildMetaBlock(), buildBody(), edgeDecl(), escapeLabel(), groupByType(), MERMAID_ENTITIES, mermaidEdgeLabel(), mermaidEscape() (+4 more)

### Community 10 - "Domain Types"
Cohesion: 0.18
Nodes (10): Block, BlockType, Comment, Connection, ConnectionKind, Diagram, DiagramFile, HandleSide (+2 more)

### Community 11 - "Bootstrap & Editor Hooks"
Cohesion: 0.2
Nodes (5): useAutoSave(), useExternalChangeWatch(), useShortcuts(), App(), InnerApp()

### Community 12 - "Toast Notifications"
Cohesion: 0.25
Nodes (5): Toasts(), Toast, ToastKind, ToastState, useToastStore

### Community 13 - "MMD Round-trip Metadata"
Cohesion: 0.36
Nodes (8): inferBlockTypeFromId, buildMetaBlock, DiagramMetaV1, extractMetaBlock, mermaidUnescape, parseMmd, mermaidEscape, serializeMmd

### Community 14 - "Button Primitive"
Cohesion: 0.29
Nodes (6): Button, ButtonProps, Size, sizeCls, Variant, variantCls

### Community 15 - "Diagram Export (PNG/SVG)"
Cohesion: 0.43
Nodes (6): Args, downloadDataUrl(), exportDiagram(), ExportKind, inlineSvgPresentationStyles(), stripExtension()

## Knowledge Gaps
- **109 isolated node(s):** `Props`, `Props`, `MenuState`, `ConfirmState`, `RenameState` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getBlockConfig()` connect `Block Config & Palette` to `Canvas Rendering (nodes/edges)`, `MMD Parsing & IDs`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `parseMmd()` connect `MMD Parsing & IDs` to `Block Config & Palette`, `File Operations & Tree CRUD`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **Why does `openFile()` connect `File Operations & Tree CRUD` to `MMD Parsing & IDs`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `cn()` (e.g. with `ConfirmDialog()` and `FileTree()`) actually correct?**
  _`cn()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `useDiagramStore` (e.g. with `Sidebar()` and `Palette()`) actually correct?**
  _`useDiagramStore` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `parseMmd()` (e.g. with `getBlockConfig()` and `inferBlockTypeFromId()`) actually correct?**
  _`parseMmd()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Props`, `Props`, `MenuState` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._