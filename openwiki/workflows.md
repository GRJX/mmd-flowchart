# Workflows

Product-level workflows a user performs in the editor, with pointers to the exact FO.md/
USERFLOWS.md sections and the code that implements each. Use this page to find "where does X
happen" quickly; use [`docs/FO.md`](../docs/FO.md) for exhaustive behavioral detail and
[`docs/USERFLOWS.md`](../docs/USERFLOWS.md) for the flows drawn out as Mermaid diagrams.

## Opening a folder & a diagram

1. User clicks **Open Folder** (toolbar) or the empty-sidebar CTA →
   `openRootFolder()` (`src/lib/fs/fileOps.ts`) → browser directory picker → tree built via
   `buildTree()` → handle persisted to IndexedDB.
2. User clicks a `.mmd` file in the sidebar → `openFile(path)` → `detectDiagramKind` +
   `parseMmd` decide editable vs. read-only → `diagramStore.loadDiagram()`.

See [architecture/file-system.md](architecture/file-system.md) and `docs/FO.md` §5.

## Creating a new diagram

Toolbar **New Diagram** → dialog for a filename (`NewDiagramDialog.tsx`) →
`createNewDiagram()` writes a fresh `.mmd` with a single Start block into the target folder (root
or a folder chosen via the sidebar context menu) → the new file is opened automatically.
`docs/USERFLOWS.md` §1 has the exact step diagram.

## Adding blocks: palette vs. quick-add

**Via the palette** (`src/panel/Palette.tsx`): drag a block type from the right panel onto the
canvas; a transparent, grid-snapped preview follows the cursor; dropping places the block on the
nearest grid position (`diagramStore.addBlock`).

**Via quick-add stems**: newly-placed blocks that don't yet have an outgoing connection show a
"stem" — a short line with a **+** button sticking out of the block edge (bottom stem on
Start/Action/Result/Decision-N, right stem on Decision-Y). Clicking **+** opens a radial
`QuickAddMenu` with four block types (Decision, Action, Result, End — Start is deliberately
excluded, since a diagram always has exactly one). Picking a type creates the new block ~120px
away on a free grid position, wires a connection from source to new block, and — if the source is
a Decision — assigns the Yes/No kind based on which stem was clicked. The stem disappears once its
path exists and does **not** reappear if that connection is later deleted (connection points
remain available via hover regardless). See `docs/FO.md` §7 and `docs/USERFLOWS.md` §2.

## Connecting blocks manually / Decision Y/N assignment

Hover a block to reveal its four connection points (N/E/S/W, bidirectional — any point can be a
source or a target); drag from one point to another (a dashed orthogonal preview line shows the
resulting path). For a Decision block, the *side* the drag starts from determines the connection's
`kind`: right or left → `"yes"` (label "Y"), bottom → `"no"` (label "N"). Creating a new Yes edge
always replaces an existing one, even from the opposite side. Existing connections can be
re-anchored at either end by dragging their endpoint handles. Implementation:
`diagramStore.addConnection` / `reconnectConnection`, handle-side decoding in `src/lib/ids.ts`,
config in `src/config/blockConfig.ts` (`outgoingKindByHandle`). Full rules: `docs/FO.md` §3.

## Selecting, moving, deleting, duplicating

- Select: click (single), Shift+click or Shift+drag marquee (multi), `Ctrl/Cmd+A` (all).
- Move: drag one or more selected blocks; snaps live to the 8px grid; an undo entry is created on
  release.
- Delete: `Delete`/`Backspace`; blocks with comments prompt a confirmation dialog first; all
  connections touching a deleted block are removed with it.
- Duplicate: `Ctrl/Cmd+D` clones the selection one grid step away immediately, one undo step.
- Copy/paste: `Ctrl/Cmd+C` snapshots the selection into an in-memory clipboard (survives repeated
  pastes within the same file, cleared on file switch/folder close/refresh); each `Ctrl/Cmd+V`
  pastes again with an accumulating +24px offset per repeat paste, reset by the next `Ctrl/Cmd+C`.
  Connections are copied only when **both** endpoints were in the selection. The Start block can
  never be duplicated/copied (singleton — silently skipped).

See `docs/FO.md` §6 for the full rule set (including comment/label copy semantics) and
[architecture/overview.md](architecture/overview.md#stores-src-store) for how this maps onto
`diagramStore`.

## Editing labels, data fields, comments

Double-click an Action/Decision/Result label for inline editing (`Enter` confirms, `Escape`
cancels); Start/End labels are fixed. The right panel's **Block properties** view
(`src/panel/BlockProperties.tsx`) exposes the same label field plus type-specific fields (Data
Field, Expected Outcome, or the Decision's two Yes-path/No-path context textareas — these live on
the Decision block itself, not on the connection) and a scrollable, timestamped comments list with
a composer (`Enter` submits, `Shift+Enter` newlines, 2000-char max). See `docs/FO.md` §8.

## Macro-grid alignment

Toolbar **Align** button snaps every non-Start block's center onto the nearest cell of a 240×192
macro-grid anchored at the Start block's center (see
[architecture/overview.md](architecture/overview.md#canvas--react-flow-integration) for the
geometry constants). Collisions are resolved in BFS order (cells closer to Start claim first, ties
broken by block ID; later blocks search outward in Chebyshev distance for the next free cell).
Connections are untouched — React Flow recomputes the orthogonal paths automatically. The whole
operation is one undo step, and is disabled when there's no Start block, no open file, or the
diagram is read-only. A separate toggle overlays dotted macro-grid lines on the canvas (editor-only
state, not persisted, not undoable). Full algorithm description: `docs/FO.md` §6.

## Saving, external-change conflicts, and read-only mode

Auto-save fires 2s after the last edit; manual save is `Ctrl/Cmd+S` or the toolbar button. Both
check the on-disk timestamp first and, if it's newer than what the editor last saved, block the
write and offer **Overwrite** / **Reload** via a sticky toast — see
[architecture/file-system.md](architecture/file-system.md#saving--conflict-handling). Files that
are a different (non-flowchart) Mermaid diagram type, or have more than 200 blocks, open
read-only and render via the `mermaid` library instead of the interactive canvas — see
[architecture/mmd-format.md](architecture/mmd-format.md#read-only-mode-docsfomd-13).

## Undo / redo

Every mutating action snapshots the full diagram state (blocks + connections) onto `undoStack`
before applying the change (cap: 100 entries; both stacks clear when a new diagram loads).
`Ctrl/Cmd+Z` undoes, `Ctrl/Cmd+Y` / `Ctrl/Cmd+Shift+Z` redoes. See `docs/FO.md` §14 for the full
list of undo-covered actions and [architecture/overview.md](architecture/overview.md) for where
this lives in `diagramStore`.

## Exporting

Toolbar **Export** dropdown → PNG or SVG, generated from the live canvas via
`src/lib/export/exportDiagram.ts` — see
[architecture/file-system.md](architecture/file-system.md#export-srclibexportexportdiagramts).
Disabled in read-only mode.

## When changing a workflow

- Update `docs/FO.md` (and `docs/USERFLOWS.md` if the step sequence changes) alongside the code —
  they are the canonical spec other contributors and agents will check behavior against.
- There are no automated tests to catch regressions (see [operations.md](operations.md)) — manually
  walk through the affected flow, including its undo step and its interaction with read-only mode
  and the >200-block / non-flowchart guards where relevant.
