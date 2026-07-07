# Architecture: State & UI

This page covers how the app is composed at runtime: the shell layout, the zustand stores, how
the canvas talks to those stores, and the small set of global hooks that drive
autosave/shortcuts/theme/external-change detection.

For the diagram domain model and `.mmd` file format, see
[mmd-format.md](mmd-format.md). For file-system and export mechanics, see
[file-system.md](file-system.md).

## App composition

Entry point: `src/main.tsx` mounts `<App />` (`src/App.tsx`). `App` wraps everything in
`ReactFlowProvider` (required by `@xyflow/react`) and, on mount, calls `restoreRootFolder()` to
re-attach to a previously-picked folder handle from IndexedDB, and `useTheme()` to apply the
light/dark/system class before first paint.

`InnerApp` wires up three global hooks and renders the shell:

- `useAutoSave()` — debounced auto-save (see [file-system.md](file-system.md#saving--conflict-handling)).
- `useShortcuts()` — keyboard shortcuts (`src/hooks/useShortcuts.ts`) — undo/redo, save, select
  all, duplicate, copy/paste, delete, fit-to-screen. Ignored while focus is in a text input (FO §11).
- `useExternalChangeWatch()` — on window focus / tab visibility change, checks whether the
  open file changed on disk and prompts to reload (`src/hooks/useExternalChangeWatch.ts`).

`AppShell` (`src/shell/AppShell.tsx`) is a pure layout component: toolbar on top, sidebar / canvas
/ right-panel in a three-column body. Each region is passed in as a prop from `App.tsx`
(`Toolbar`, `Sidebar`, `Canvas`, `RightPanel`), so the shell itself has no knowledge of what it's
rendering.

```
Toolbar   (save · new · export · zoom · undo/redo · theme)
┌──────────────┬──────────────────────────────┬───────────────────┐
│ Sidebar      │ Canvas (React Flow)          │ Right panel        │
│ file tree    │ nodes/edges, 8px grid,       │ palette OR         │
│              │ quick-add stems, radial menu │ block/connection   │
│              │ macro-grid overlay           │ properties         │
└──────────────┴──────────────────────────────┴───────────────────┘
```

## Stores (`src/store/`)

Three independent zustand stores, deliberately not merged because they have different lifecycles:

### `diagramStore.ts` (the core editor state machine, ~900 lines)

Owns everything about the **currently open diagram**:

- `diagram: Diagram` — the in-memory `blocks`/`connections` maps (see
  [mmd-format.md](mmd-format.md#domain-model)).
- `selection: Selection` — sets of selected block IDs and connection IDs. `summarizeSelection()`
  derives which right-panel view to show: exactly one block → block properties, exactly one
  connection → connection properties, anything else (0 or >1 items) → palette / multi-select
  delete view (FO §8).
- `newBlockIds: Set<string>` — blocks that should show a "quick-add stem" because they were just
  placed (see [workflows.md](workflows.md#adding-blocks--quick-add)).
- `isDirty`, `lastSavedAt`, `readOnlyReason` — save-loop state consumed by `useAutoSave` and
  `fileOps.ts`.
- `undoStack` / `redoStack` — **full-diagram snapshots** (not diffs) capped at
  `UNDO_STACK_LIMIT = 100` (`src/types/domain.ts`). Every mutating action pushes a snapshot before
  applying the change. Loading a new diagram clears both stacks (FO §14).
- `clipboard` / `pasteCount` — in-memory copy/paste buffer, not persisted and not part of undo
  history; cleared on file switch, folder close, or page refresh (FO §6).
- `macroGridVisible` — editor-only UI toggle for the Align overlay, not persisted, not undoable.

Mutation methods (`addBlock`, `moveBlocks`, `addConnection`, `reconnectConnection`,
`removeBlocks`, `removeConnection`, duplicate/copy/paste, `alignToMacroGrid`, etc.) are the only
way the diagram changes. Components never mutate `diagram.blocks`/`diagram.connections` directly.

### `folderStore.ts`

Owns the **file-tree / folder session state**: the `TreeFolder` returned by
`src/lib/fs/fsAccess.ts`, expand/collapse state per path, the currently-open file path, and
new-diagram-dialog visibility/target. Kept separate from `diagramStore` because opening a folder
doesn't touch the diagram, and loading a file doesn't touch the folder handle.

### `toastStore.ts`

Simple queue of transient/sticky toast notifications (`showToast()`), used across the file-ops
layer for save conflicts, errors, and blocked operations (FO §12).

## Canvas ↔ React Flow integration

`src/canvas/Canvas.tsx` renders an `@xyflow/react` `<ReactFlow>` instance. It **re-derives** React
Flow's `nodes`/`edges` arrays from `diagramStore` on every render via the adapter functions in
`src/canvas/rfAdapter.ts` (`blocksToNodes`, `connectionsToEdges`) — there is no separate React
Flow state to keep in sync; the store is the single source of truth. The adapter also computes
per-block derived data needed by node rendering: which handle sides already have an outgoing/
incoming connection, and whether a Decision block already has its Yes/No path (used to decide
whether to still show a quick-add stem).

`src/canvas/violations.ts` (`computeViolations`) scans blocks/connections for constraint breaches
(too many outputs, more than one Yes/No edge on a Decision, etc.) — this can only happen from an
externally-edited `.mmd` file, since the in-app UI enforces `blockConfig.ts` limits at creation
time. Violating blocks get a pulsing warning outline (FO §12) but the diagram still saves —
excess connections are simply dropped again on next load if still invalid.

Custom node/edge renderers:
- `src/canvas/nodes/BlockNode.tsx` + `BlockShape.tsx` — renders the five block shapes (circle,
  rounded rect, diamond) with type-driven styling from `blockConfig.ts` / CSS variables.
- `src/canvas/edges/FlowEdge.tsx` — orthogonal, lightly-rounded connector with label.

Grid snapping (`GRID_SIZE = 8`) is applied via `snapPosition()` in `src/lib/utils.ts` whenever a
block is dragged or placed. The separate **macro-grid** (`MACRO_CELL_WIDTH/HEIGHT`,
`MACRO_GUTTER`, `MACRO_PITCH_X/Y` in `src/types/domain.ts`) is a coarser 240×192 grid, anchored at
the Start block's center, used only by the "Align" toolbar action to snap an entire messy diagram
into a tidy layout in one undo step (FO §6 "Macro-grid (Align)").

## Right panel (`src/panel/`)

`RightPanel.tsx` switches content based on `summarizeSelection()`:

| Component | Shown when |
|---|---|
| `Palette.tsx` / `PaletteThumbnail.tsx` | No selection, or >1 item selected |
| `BlockProperties.tsx` | Exactly one block selected — includes the inline comments section |
| `ConnectionProperties.tsx` | Exactly one connection selected |

`BlockProperties.tsx` is the largest panel component (~15KB) — it renders the block's editable
fields (label, data field(s), expected outcome, Decision's Yes/No context fields), the list of
outgoing paths, and the comments composer/list, all driven by `blockConfig.ts` (`supportsDataField`,
`supportsExpectedOutcome`, etc.) rather than per-type conditionals.

## Sidebar (`src/sidebar/`)

`FileTree.tsx` (~14KB) renders the folder/file tree from `folderStore.root`, supports drag-and-drop
move, and opens context menus (`ContextMenu.tsx`) for rename/delete/new-diagram/new-folder actions,
all implemented against the file operations described in
[file-system.md](file-system.md#folder--file-tree-operations). `NewDiagramDialog.tsx` /
`NewSubfolderDialog.tsx` are Radix-based modal dialogs; `ConfirmDialog.tsx` backs destructive
confirmations (e.g. deleting a block with comments, deleting a folder).

## Hooks (`src/hooks/`)

- `useAutoSave.ts` — subscribes to `diagramStore`; 2s after the last mutation
  (`AUTOSAVE_DEBOUNCE_MS`), calls `saveCurrentDiagram()` if dirty, not read-only, and a file is
  open. Subscribes to the store directly (not to `isDirty` as a dependency) so the debounce timer
  resets on every diagram change.
- `useExternalChangeWatch.ts` — re-checks the open file's on-disk timestamp on focus/visibility
  change.
- `useShortcuts.ts` — global keydown handler for the shortcut table in `docs/FO.md` §11.
- `useTheme.ts` — light/dark/system theme cycling, persisted via `localStorage`-style storage
  and applied as a root class.

## What to watch out for when changing this area

- Any new diagram mutation must go through a `diagramStore` action so it participates in
  undo/redo and dirty-tracking — don't mutate `diagram.blocks`/`diagram.connections` in place from
  a component.
- If you add a new field to `Block`/`Connection` (`src/types/domain.ts`), you likely also need to
  update: `blockConfig.ts` (if type-specific), `src/lib/mermaid/metadata.ts` (persist it),
  `src/lib/mermaid/parse.ts`/`serialize.ts` (round-trip), and `BlockProperties.tsx` /
  `ConnectionProperties.tsx` (UI).
- Since there is no test suite (see [operations.md](operations.md)), manually verify undo/redo,
  save/round-trip, and read-only behavior after non-trivial changes here — these are exactly the
  behaviors most likely to silently regress.
