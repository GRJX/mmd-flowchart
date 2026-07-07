# OpenWiki Quickstart — MMD Flowchart Editor

## What this is

**MMD Flowchart Editor** is a browser-based, offline-first WYSIWYG editor for authoring
[Mermaid](https://mermaid.js.org/) `flowchart` diagrams (`.mmd` files). It is built for teams
writing functional specifications and test flows: instead of hand-typing Mermaid syntax, a user
drags blocks onto a canvas and connects them, and the editor generates/maintains a valid,
human-readable `.mmd` file underneath.

Key product properties (see [`README.md`](../README.md), Dutch):

- **Local & offline** — runs entirely in the browser. No server, no account, no database. Files
  are read/written straight to a folder on disk via the **File System Access API**, so diagrams
  can live in a Git repo and diff cleanly.
- **Readable source format** — `.mmd` files are plain text (Mermaid syntax + an embedded JSON
  metadata block), so PR diffs stay meaningful.
- **Five block types** — Start, End, Action, Decision, Result — with a Decision having a Y/N
  branch. See [architecture/mmd-format.md](architecture/mmd-format.md).
- **Chromium-only** — the File System Access API is not supported in Firefox/Safari; the app
  requires Chrome or another Chromium browser.

The canonical, actively-maintained functional spec lives in [`docs/FO.md`](../docs/FO.md)
(detailed behavior for every feature) and [`docs/USERFLOWS.md`](../docs/USERFLOWS.md)
(step-by-step flows as Mermaid diagrams themselves). This wiki is a navigable synthesis layer over
those docs plus the source code — when in doubt about exact behavior, `docs/FO.md` is the source
of truth and this wiki links to the relevant section instead of duplicating it.

## Tech stack

- **React 18 + TypeScript**, built with **Vite** (`vite.config.ts`, alias `@` → `src/`).
- **Zustand** for state (no Redux/Context reducers).
- **`@xyflow/react`** (React Flow) for the canvas/node/edge rendering engine.
- **Tailwind CSS v4 (beta)** + Radix UI primitives for dialogs/dropdowns/tooltips.
- **`mermaid`** library, used only to render read-only previews of unsupported diagram types.
- **`html-to-image`** for PNG/SVG export.
- **`idb-keyval`**-style raw IndexedDB (hand-rolled, see `src/lib/fs/handleStore.ts`) to persist
  the picked root folder handle across sessions.
- Deployed as a static build behind **nginx** in a Docker container (see
  [operations.md](operations.md)).

There is currently **no automated test suite** in the repository (an earlier Playwright e2e suite
existed and was intentionally deleted during a full rewrite — see [operations.md](operations.md)
for details and what to watch out for).

## Repository layout

```
src/
  App.tsx, main.tsx       — entrypoint, mounts ReactFlowProvider + global hooks
  shell/                  — AppShell layout, Toolbar, Toasts
  sidebar/                — folder/file tree, context menus, new-diagram/new-folder dialogs
  canvas/                 — React Flow canvas, node/edge components, RF adapter, violation checks
  panel/                  — right-hand panel: block palette, block/connection property editors
  store/                  — zustand stores: diagramStore, folderStore, toastStore
  lib/
    mermaid/              — parse/serialize/detect .mmd <-> in-memory Diagram, embedded metadata
    fs/                   — File System Access API wrapper, tree ops, IndexedDB handle persistence
    export/               — PNG/SVG diagram export
    ids.ts, utils.ts      — id allocation/handle-id helpers, grid snapping, misc utils
  config/blockConfig.ts   — single source of truth for per-block-type behavior
  types/domain.ts         — core domain model + app-wide constants
  hooks/                  — useAutoSave, useExternalChangeWatch, useShortcuts, useTheme
  ui/                     — small shared primitives (Button, Field)
docs/
  FO.md                   — full functional design spec (Dutch) — canonical behavior reference
  USERFLOWS.md            — user flows as Mermaid flowcharts (Dutch)
Dockerfile, docker-compose.yml, nginx.conf — static build + nginx serving
graphify-out/             — generated output of an external code-graph analysis tool; not part
                             of the app itself, safe to ignore when exploring the codebase
```

## Where to start reading code

1. `src/types/domain.ts` — the domain model (`Block`, `Connection`, `Diagram`) and every
   app-wide constant (grid size, undo stack limit, max blocks, macro-grid geometry).
2. `src/config/blockConfig.ts` — per-block-type configuration table. **This is the intended
   extension point**: adding a new block type means adding a config entry here, not scattering
   `if (type === ...)` branches through the codebase.
3. `src/store/diagramStore.ts` — the central editor state machine (selection, undo/redo,
   clipboard, dirty tracking). Almost every mutation in the app goes through this store.
4. `src/canvas/Canvas.tsx` — where user interaction (drag, connect, select) turns into store
   mutations, via the React Flow adapter in `src/canvas/rfAdapter.ts`.
5. `src/lib/mermaid/{parse,serialize,metadata}.ts` — the `.mmd` <-> `Diagram` round trip.

## Sections

- **[Architecture: state & UI](architecture/overview.md)** — how the app shell, stores, canvas,
  and panels fit together; hooks that drive autosave/shortcuts/theme.
- **[Architecture: diagram domain & `.mmd` format](architecture/mmd-format.md)** — block types,
  connection rules, the `.mmd` file format and embedded metadata, read-only mode, and
  constraint-violation detection.
- **[Architecture: files & export](architecture/file-system.md)** — File System Access API
  integration, folder/file tree management, save/autosave/conflict handling, PNG/SVG export.
- **[Workflows](workflows.md)** — the product-level workflows a user performs (create diagram,
  connect blocks via quick-add, decision Y/N assignment, macro-grid align, copy/duplicate/paste,
  undo/redo) with pointers into the FO/USERFLOWS specs and the code that implements each.
- **[Operations](operations.md)** — running locally, building, Docker/nginx deploy, browser
  requirements, and the current lack of automated tests (what to check manually when changing
  behavior).

## Conventions worth knowing before you change code

- **Dutch-language docs and UI strings.** `docs/FO.md`, `docs/USERFLOWS.md`, and most in-app
  toast/dialog copy are in Dutch. Source code comments and identifiers are in English.
- **Config-over-conditionals.** Block-type-specific behavior belongs in
  `src/config/blockConfig.ts`, not in scattered `if`/`switch` statements — this is an explicit
  design rule stated in both `docs/FO.md` §2 and the file's own header comment.
- **The store is the single source of truth** for the diagram; `Canvas.tsx` re-derives React Flow
  nodes/edges from the store on every render rather than keeping parallel state.
- **Everything on an 8px grid** (`GRID_SIZE` in `src/types/domain.ts`), plus a separate 240×192
  "macro-grid" used only by the Align feature — see
  [architecture/overview.md](architecture/overview.md#canvas--react-flow-integration).
