# Architecture: Files, Persistence & Export

This page covers everything about getting a `.mmd` file from/to disk: the File System Access API
wrapper, folder/file tree management, saving and conflict handling, and PNG/SVG export. See
[overview.md](overview.md) for how these connect to the stores and UI, and
[mmd-format.md](mmd-format.md) for what's actually inside a `.mmd` file.

## File System Access API wrapper (`src/lib/fs/fsAccess.ts`)

The editor is browser-only — **all disk I/O goes through this module**; nothing else touches raw
`FileSystemHandle`s directly. Core pieces:

- `pickRootFolder()` — wraps `window.showDirectoryPicker({ mode: "readwrite" })`; returns `null`
  on user cancel (`AbortError`) or if the API is unsupported.
- `ensureReadWrite(handle)` — re-checks/re-requests `readwrite` permission (handles get restored
  from IndexedDB across sessions but permission grants don't always persist).
- `buildTree(root)` — recursively walks a directory handle into a `TreeFolder`/`TreeFile` tree,
  **filtering to `.mmd` files only**, sorted folders-before-files then alphabetically. The tree is
  rebuilt on demand; the app does not watch for filesystem events.
- `readFile`/`writeFile` — thin wrappers returning/consuming `file.lastModified`, which is the
  basis for external-change and save-conflict detection.
- `findFileByPath(root, path)` — resolves a slash-separated relative path to a `TreeFile` node.
- `isFileSystemAccessSupported()` — feature-detects `showDirectoryPicker`; drives the
  `"unsupported-browser"` folder status shown to Firefox/Safari users.

## Handle persistence (`src/lib/fs/handleStore.ts`)

The picked root `FileSystemDirectoryHandle` is stored directly in **IndexedDB** (structured-clone
supports storing the handle object itself) under a fixed `mmd-flowchart` database / `fs-handles`
store, so the same folder can be silently re-attached (after a permission re-prompt) on the next
visit. `App.tsx` calls `restoreRootFolder()` on mount to do this automatically.

## High-level file operations (`src/lib/fs/fileOps.ts`, ~660 lines)

This is where `fsAccess.ts` gets wired into `folderStore` and `diagramStore` — components call
into these functions and let the stores drive re-renders. Key exports:

- `openRootFolder()` / `restoreRootFolder()` — pick or restore the root folder, build the tree,
  persist the handle, and update `folderStore` status (`empty` / `loading` / `permission-denied` /
  `unsupported-browser` / `ready` / `error`).
- `openFile(path)` — reads a file, runs `detectDiagramKind` + `parseMmd`, decides the
  `readOnlyReason` (unsupported type, or >200 blocks), and loads the result into `diagramStore`.
- `createNewDiagram(...)` — creates a new `.mmd` file (single empty Start block) in a target
  folder and opens it.
- `moveNode(...)`, `renameNode(...)`, `deleteNode(...)`, `createSubfolder(...)` — sidebar
  tree-mutation operations, each returning a typed failure reason (`MoveNodeFailure`,
  `NodeOpFailure`) so the UI can show a specific error toast (e.g. "can't move a folder into
  itself/its own descendant", "an item with this name already exists").
- `saveCurrentDiagram(options?: { force?: boolean })` — see below.
- `checkForExternalChange()` — compares the open file's on-disk `lastModified` against what the
  editor last saw; shown on tab refocus via `useExternalChangeWatch`.

### Saving & conflict handling

Save flow (`saveCurrentDiagram`):

1. No-op if there's no open folder/file, or the diagram is read-only.
2. Unless `force: true`, peek the file's current on-disk `lastModified` and compare against
   `diagramStore.lastSavedAt` (with a small tolerance, `EXTERNAL_CHANGE_TOLERANCE_MS`). If the
   on-disk file is newer, the write is **aborted** and a sticky toast is shown with two actions:
   - **Overschrijven** ("Overwrite") → re-calls `saveCurrentDiagram({ force: true })`.
   - **Herladen** ("Reload") → calls `openFile(path)`, discarding local changes.
3. Otherwise, `serializeMmd(diagram)` is written via `writeFile()`, and `diagramStore.markSaved()`
   records the new `lastModified`.

Save also fails (with an error toast) if the diagram doesn't have exactly one Start block — see
`docs/FO.md` §12 "Opslaan geblokkeerd".

**Auto-save** (`src/hooks/useAutoSave.ts`) calls this same function 2 seconds
(`AUTOSAVE_DEBOUNCE_MS`) after the last diagram mutation, silently (no success toast), guarded
against concurrent in-flight saves. **Manual save** is the same function, triggered by the Save
toolbar button or `Ctrl/Cmd+S`.

### Folder & file tree operations

Move/rename/delete/create-subfolder all operate on the in-memory `TreeFolder` plus the real
directory handles, then rebuild/refresh the tree in `folderStore` (`refreshTree()`). Moving the
currently-open file (or a file inside a moved folder) re-targets the open path in `diagramStore`
(`retargetOpenFile`) so autosave keeps writing to the new location — see `docs/FO.md` §5 for the
full sidebar drag-and-drop and context-menu behavior (blocked cases: dropping a folder into
itself/its descendant, name conflicts).

## Export (`src/lib/export/exportDiagram.ts`)

`exportDiagram({ flow, fileName, kind, theme })` produces a PNG or SVG snapshot of the current
canvas using `html-to-image` (`toPng`/`toSvg`) plus React Flow's own `getNodesBounds` /
`getViewportForBounds` helpers to compute the exact capture region (32px padding) regardless of
current zoom/pan. Notable implementation details worth knowing before touching this file:

- The capture transform is passed to `html-to-image` as a **clone-only** `style.transform` — nothing
  on the live DOM is mutated to take the snapshot.
- Because `html-to-image`'s clone doesn't always resolve CSS custom properties, presentation
  styles (fill/stroke/stroke-width) are temporarily promoted to inline styles on the **live** SVG
  elements (via `getComputedStyle`) immediately before the snapshot, then restored — this is what
  makes exported diamonds/edges use the correct theme colors.
- PNG background is white in light mode, `#111111` in dark mode; PNG uses `PNG_PIXEL_RATIO = 2`
  for a sharper bitmap. Filenames are `{diagramName}.png` / `{diagramName}.svg`.
- Export is disabled entirely in read-only mode (FO §13).

## What to watch out for when changing this area

- Any change to save/conflict logic should be checked manually against the three FO §5/§12
  scenarios: normal save, external-change-detected-on-save, external-change-detected-on-refocus —
  there is no automated coverage (see [operations.md](operations.md)).
- `buildTree` filters to `.mmd` only and is not incremental — if you need live filesystem-change
  detection beyond focus/visibility polling, that's a deliberate scope gap, not an oversight (FO §1
  "buiten scope").
- Sidebar tree mutations must keep `diagramStore`'s open-file path in sync (`retargetOpenFile`) or
  autosave will silently write to a stale/nonexistent path after a move/rename.
