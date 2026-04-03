# Data Architecture: MMD Flowchart Editor

**Status:** Draft  
**Author:** Backend Architect  
**Date:** 3 April 2026  
**Version:** 1.0  
**Relates to:** [Functional Design v1.0](./Functional%20Design.md)

---

## Table of Contents

1. [Architecture Decision Record](#1-architecture-decision-record)
2. [Storage Layer Overview](#2-storage-layer-overview)
3. [Data Models](#3-data-models)
4. [Entity Relationships](#4-entity-relationships)
5. [File Format — Serialization Contract](#5-file-format--serialization-contract)
6. [In-Memory State Store](#6-in-memory-state-store)
7. [Browser Persistence](#7-browser-persistence)
8. [Scale Constraints & Limits](#8-scale-constraints--limits)
9. [Data Integrity Rules](#9-data-integrity-rules)
10. [Performance Targets](#10-performance-targets)

---

## 1. Architecture Decision Record

```
Pattern:       Client-side SPA — no backend server, no remote database
Communication: File System Access API (browser ↔ host filesystem, direct R/W)
Data pattern:  CRUD over in-memory Zustand store + file serialization on save
Auth:          None — single user, localhost-only, open source
Cache:         Zustand store IS the operational cache (no separate layer needed)
Queue:         None
Infra:         nginx:alpine serving /dist — static assets only
Scaling:       Not applicable (single-user desktop-class tool)
```

### Rationale

This tool runs entirely inside a browser tab served from local Docker. There is no multi-user concern, no network latency, and no shared data. The "database" is therefore a three-tier local stack:

| Tier            | Technology                      | Role                                      |
| --------------- | ------------------------------- | ----------------------------------------- |
| 1 — Operational | Zustand in-memory store         | Active diagram state, undo/redo history   |
| 2 — Durable     | `.mmd` files on host filesystem | Source of truth, persisted on manual save |
| 3 — Preference  | `localStorage` (browser)        | Theme, last directory handle              |

Data flows in one direction per operation: **file → store → canvas** (load) and **canvas → store → file** (save). There is no sync, no conflict resolution, and no background write path.

---

## 2. Storage Layer Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser Tab (SPA)                                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Zustand Store  (Tier 1 — Operational)                  │    │
│  │                                                          │    │
│  │  DiagramState   BlockMap   ConnectionMap   UndoStack    │    │
│  │  SelectionState  DirtyFlag  PreviewState                │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │  Serializer / Parser  (stateless transform layer)        │    │
│  │  serialize(store) → .mmd text                            │    │
│  │  parse(.mmd text) → store snapshot                       │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │  File System Access API  (browser built-in)              │    │
│  │  FileSystemDirectoryHandle  FileSystemFileHandle         │    │
│  │  FileSystemWritableFileStream                            │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │  localStorage  (Tier 3 — Preference)                     │    │
│  │  theme: 'dark' | 'light'                                 │    │
│  │  lastDirHandle: serialized FileSystemDirectoryHandle     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                             │
                    File System Access API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Host Filesystem  (Tier 2 — Durable)                             │
│                                                                  │
│  qa-tests/                                                       │
│  ├── login/                                                      │
│  │   ├── happy-path.mmd                                          │
│  │   └── forgot-password.mmd                                     │
│  └── checkout/                                                   │
│      └── guest-checkout.mmd                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Models

All models below represent the **canonical in-memory shape** held in the Zustand store. They are the single source of truth at runtime; the `.mmd` file is a serialized projection of this state.

---

### 3.1 `DiagramFile`

Represents one open `.mmd` file and its fully parsed runtime state.

| Field             | Type                                   | Required | Description                                                                                     |
| ----------------- | -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `path`            | `string`                               | Yes      | Full filesystem path (from `FileSystemFileHandle.name` + parent path). Used as a unique key.    |
| `name`            | `string`                               | Yes      | Filename without path, e.g. `happy-path.mmd`.                                                   |
| `directionHint`   | `'TD' \| 'LR' \| 'TB' \| 'BT' \| 'RL'` | Yes      | From the Mermaid `flowchart` directive. Defaults to `'TD'`.                                     |
| `blocks`          | `Map<string, Block>`                   | Yes      | Keyed by `Block.id`. Empty map on new diagrams.                                                 |
| `connections`     | `Map<string, Connection>`              | Yes      | Keyed by `Connection.id`.                                                                       |
| `isDirty`         | `boolean`                              | Yes      | `true` when store state diverges from last saved file content.                                  |
| `lastSavedAt`     | `Date \| null`                         | Yes      | Timestamp of last successful save. `null` on new unsaved files.                                 |
| `fileHandle`      | `FileSystemFileHandle`                 | Yes      | Live browser handle. Not serialized; discarded on tab close.                                    |
| `metadataVersion` | `'1' \| null`                          | Yes      | Version token from the `MMD_META_START` block. `null` for plain Mermaid files with no metadata. |

**Constraints:**

- Exactly one `Block` with `type === 'start'` per `DiagramFile`.
- `Block.id` values must be unique within a `DiagramFile`.
- `Connection.id` values must be unique within a `DiagramFile`.

---

### 3.2 `Block`

A node on the canvas. Maps 1:1 to a Mermaid node definition.

| Field             | Type                       | Required | Description                                                                                                                                                                         |
| ----------------- | -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `string`                   | Yes      | Stable human-readable ID generated at creation. Format: `S` (start), `E1`…`En` (end), `A1`…`An` (action), `D1`…`Dn` (decision), `R1`…`Rn` (result). Never changes after assignment. |
| `type`            | `BlockType`                | Yes      | Enum: `'start' \| 'end' \| 'action' \| 'decision' \| 'result'`                                                                                                                      |
| `label`           | `string`                   | Yes      | Displayed text inside the shape. `'Start'` is fixed for `type === 'start'`.                                                                                                         |
| `position`        | `{ x: number; y: number }` | Yes      | Canvas coordinates of the top-left corner in logical pixels.                                                                                                                        |
| `dataField`       | `string \| null`           | No       | Metadata-only. Valid on `type === 'action'` only. Stored in `%%` block, not in Mermaid syntax.                                                                                      |
| `expectedOutcome` | `string \| null`           | No       | Metadata-only. Valid on `type === 'result'` only. Stored in `%%` block.                                                                                                             |
| `comments`        | `Comment[]`                | Yes      | Ordered array, newest last. `[]` when no comments.                                                                                                                                  |

**Type → Mermaid shape mapping:**

| `BlockType` | Mermaid syntax | Canvas shape                     |
| ----------- | -------------- | -------------------------------- |
| `start`     | `ID([label])`  | Rounded pill — teal border       |
| `end`       | `ID([label])`  | Rounded pill — red border        |
| `action`    | `ID[label]`    | Rectangle                        |
| `decision`  | `ID{label}`    | Diamond                          |
| `result`    | `ID[/label/]`  | Rectangle with thick left border |

> **Disambiguation of `start` vs `end`:** Both use `([...])` Mermaid syntax. On save, they are written identically. On load of a plain Mermaid file, they are inferred from graph topology: no incoming edges → `start`; no outgoing edges → `end`.

---

### 3.3 `Connection`

A directed edge between two blocks. Maps 1:1 to a Mermaid edge definition.

| Field       | Type                         | Required | Description                                                                            |
| ----------- | ---------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `id`        | `string`                     | Yes      | UUID v4. Internal only — not written to the `.mmd` file.                               |
| `sourceId`  | `string`                     | Yes      | `Block.id` of the source node.                                                         |
| `targetId`  | `string`                     | Yes      | `Block.id` of the target node.                                                         |
| `type`      | `ConnectionType`             | Yes      | Enum: `'default' \| 'yes' \| 'no'`                                                     |
| `waypoints` | `{ x: number; y: number }[]` | Yes      | User-defined bend points. `[]` = auto-routed. Stored in metadata (not Mermaid syntax). |

**Type → Mermaid edge mapping:**

| `ConnectionType` | Mermaid syntax | Label rendered |
| ---------------- | -------------- | -------------- |
| `default`        | `A --> B`      | None           |
| `yes`            | `A -- Y --> B` | Y              |
| `no`             | `A -- N --> B` | N              |

**Constraints:**

- `sourceId` and `targetId` must both reference existing `Block.id` values within the same `DiagramFile`.
- A `Block` with `type === 'start'` may not be a `targetId`.
- A `Block` with `type === 'end'` may not be a `sourceId`.
- A `Block` with `type === 'decision'` may have at most one `type === 'yes'` and one `type === 'no'` outgoing connection.
- No self-loops: `sourceId !== targetId`.

---

### 3.4 `Comment`

An annotation attached to one block. Stored exclusively in the `%%` metadata block.

| Field       | Type     | Required | Description                                               |
| ----------- | -------- | -------- | --------------------------------------------------------- |
| `id`        | `string` | Yes      | UUID v4. Stable across saves.                             |
| `text`      | `string` | Yes      | Free-text comment body. Max 2000 characters (soft limit). |
| `timestamp` | `string` | Yes      | ISO 8601 datetime string, set at creation, never mutated. |

> Comments have no `blockId` field — they are nested inside `Block.comments[]` and their ownership is implied by containment. This avoids a foreign-key join on the read path.

---

### 3.5 `UserPreferences`

Preferences are the only data persisted across sessions outside of diagram content.

| Field                 | Type                                | Storage     | Key                  | Description                                                                                                   |
| --------------------- | ----------------------------------- | ----------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `theme`               | `'light' \| 'dark'`                 | localStorage | `mmd-theme`          | Persists across tab sessions. Defaults to `'dark'`.                                                           |
| `lastDirectoryHandle` | `FileSystemDirectoryHandle \| null` | IndexedDB   | `'lastDirectory'`    | Stored in the `handles` object store of `mmd-flowchart-db`. Restored on reload; requires permission re-check via `queryPermission()` before use. Never serialized to JSON. See §7.2. |

---

### 3.6 `UndoEntry`

One entry in the undo/redo history stack.

| Field    | Type              | Description                                                                   |
| -------- | ----------------- | ----------------------------------------------------------------------------- |
| `id`     | `string`          | UUID v4.                                                                      |
| `action` | `UndoableAction`  | Enum tag matching the action type table in §16 of the Functional Design.      |
| `before` | `DiagramSnapshot` | Deep clone of the relevant portions of `DiagramFile` state before the action. |
| `after`  | `DiagramSnapshot` | Deep clone after the action.                                                  |

`DiagramSnapshot` is a plain JSON-serializable subset of `DiagramFile` containing `blocks` and `connections` only — it excludes `isDirty`, `fileHandle`, and `lastSavedAt`.

**Stack constraints:**

- Maximum 100 `UndoEntry` items. When the limit is reached, the oldest entry (`stack[0]`) is dropped.
- The stack is destroyed when the file is closed. It is not persisted.

---

### 3.7 `FileTreeNode`

A node in the left-panel file tree. Recursive structure covering both folders and `.mmd` files.

| Field      | Type                                              | Required | Description                                                              |
| ---------- | ------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| `name`     | `string`                                          | Yes      | Folder name or filename, e.g. `"login"` or `"happy-path.mmd"`.           |
| `type`     | `'folder' \| 'file'`                             | Yes      | Discriminator. Determines which file system handle type is present.      |
| `handle`   | `FileSystemDirectoryHandle \| FileSystemFileHandle` | Yes      | Live browser handle. `FileSystemDirectoryHandle` for folders, `FileSystemFileHandle` for `.mmd` files. |
| `children` | `FileTreeNode[]`                                  | No       | Present and non-empty only when `type === 'folder'`. Populated lazily on folder expand. |

**Constraints:**
- Only nodes where `name` ends in `.mmd` or `type === 'folder'` are included. All other files are filtered out.
- `children` is `undefined` (not `[]`) on folders that have not yet been expanded, to distinguish "not loaded" from "empty folder".

---

## 4. Entity Relationships

```
┌──────────────────────────────────────────────────────────┐
│                        DiagramFile                        │
│  id (path)                                                │
│  name · directionHint · isDirty · lastSavedAt            │
│  metadataVersion · fileHandle                            │
└────────────────┬────────────────────┬────────────────────┘
                 │ 1                  │ 1
              contains             contains
                 │ N                  │ N
    ┌────────────▼───────────┐   ┌───▼──────────────────────┐
    │         Block           │   │        Connection         │
    │  id (stable human ID)   │   │  id (uuid)               │
    │  type · label           │◄──┤  sourceId  (→ Block.id)  │
    │  position {x,y}         │◄──┤  targetId  (→ Block.id)  │
    │  dataField?             │   │  type (default|yes|no)   │
    │  expectedOutcome?       │   │  waypoints[]             │
    └────────────┬────────────┘   └──────────────────────────┘
                 │ 1
              contains
                 │ N
    ┌────────────▼────────────┐
    │         Comment          │
    │  id (uuid)               │
    │  text                    │
    │  timestamp (ISO 8601)    │
    └──────────────────────────┘

    ┌──────────────────────────┐
    │     UserPreferences       │  (localStorage — not part of DiagramFile)
    │  theme                    │
    │  lastDirectoryHandle      │
    └──────────────────────────┘

    ┌──────────────────────────┐
    │       UndoEntry           │  (in-memory stack only — not persisted)
    │  id · action              │
    │  before: DiagramSnapshot  │
    │  after: DiagramSnapshot   │
    └──────────────────────────┘
```

**Cardinality summary:**

| Relationship                      | Cardinality                                    |
| --------------------------------- | ---------------------------------------------- |
| DiagramFile → Block               | 1 : N (min 0, no max, soft ceiling 200 per §8) |
| DiagramFile → Connection          | 1 : N (min 0)                                  |
| Block → Comment                   | 1 : N (min 0, no max)                          |
| Connection → Block (source)       | N : 1 (required)                               |
| Connection → Block (target)       | N : 1 (required)                               |
| Decision Block → `yes` Connection | 1 : 0..1                                       |
| Decision Block → `no` Connection  | 1 : 0..1                                       |

---

## 5. File Format — Serialization Contract

The `.mmd` file is the durable representation of `DiagramFile`. The serializer must produce output that:

1. Is valid Mermaid `flowchart` syntax when the `%%` comment blocks are stripped.
2. Round-trips without data loss (all `Block`, `Connection`, and `Comment` fields survive load → save → load).

### 5.1 File Structure

```
%% MMD_META_START
%% {<metadata JSON — single line, minified>}
%% MMD_META_END
flowchart TD
    <node definitions>
    <edge definitions>
```

### 5.2 Metadata JSON Schema (v1)

```typescript
interface MetadataV1 {
  version: "1";
  meta: {
    [blockId: string]: {
      dataField: string | null;
      expectedOutcome: string | null;
      position: { x: number; y: number };
      comments: Array<{
        id: string; // UUID v4
        text: string;
        timestamp: string; // ISO 8601
      }>;
    };
  };
  connections: {
    [connectionId: string]: {
      waypoints: Array<{ x: number; y: number }>;
    };
  };
}
```

> **`position` is stored in metadata**, not in Mermaid syntax. Mermaid has no position concept — coordinates are ours. Storing them in the `%%` block means layout is preserved on round-trips while the raw Mermaid remains portable.

> **`connections` map** stores only extension data (waypoints). The structural topology (source, target, type) is derived entirely from the Mermaid edge syntax and does not need duplication. The `connectionId` is a deterministic key derived from `${sourceId}-${targetId}-${type}` so it survives a re-parse (no UUID needed in the file).

### 5.3 Node Definition Order

On save, nodes are serialized in this order for human readability:

1. Start block (`S`)
2. Action blocks (`A1`, `A2`, … in creation order)
3. Decision blocks (`D1`, `D2`, …)
4. Result blocks (`R1`, `R2`, …)
5. End blocks (`E1`, `E2`, …)

### 5.4 Edge Definition Order

Edges are serialized in topological order (depth-first from the Start block). This ensures the file reads naturally as a flow when opened in a text editor.

### 5.5 Serialization Example

```
%% MMD_META_START
%% {"version":"1","meta":{"A1":{"dataField":"Username: test@example.com","expectedOutcome":null,"position":{"x":320,"y":180},"comments":[{"id":"c1a2b3c4-...","text":"Check token expiry","timestamp":"2026-04-03T10:00:00Z"}]},"D1":{"dataField":null,"expectedOutcome":null,"position":{"x":320,"y":300},"comments":[]}},"connections":{}}
%% MMD_META_END
flowchart TD
    S([Start])
    A1[Login with valid credentials]
    D1{Auth successful?}
    R1[/Dashboard loads/]
    E1([End - Fail])
    E2([End - Pass])
    S --> A1
    A1 --> D1
    D1 -- Y --> R1
    D1 -- N --> E1
    R1 --> E2
```

---

## 6. In-Memory State Store

The Zustand store is the operational database. It holds the complete runtime state of the application.

### 6.1 Store Shape

```typescript
interface AppStore {
  // ── Active diagram ───────────────────────────────
  diagram: DiagramFile | null; // null = no file open

  // ── UI state ─────────────────────────────────────
  selection: Set<string>; // selected Block.id values
  canvasViewport: { x: number; y: number; zoom: number };

  // ── Undo/redo ─────────────────────────────────────
  undoStack: UndoEntry[]; // [0] = oldest
  redoStack: UndoEntry[]; // [0] = most recently undone

  // ── File tree ─────────────────────────────────────
  directoryHandle: FileSystemDirectoryHandle | null;
  fileTree: FileTreeNode[]; // recursive tree of folders + .mmd files

  // ── Preferences ───────────────────────────────────
  theme: "light" | "dark";
}
```

### 6.2 Derived / Computed Values

These are never stored — always computed on read:

| Computed value        | Derived from                                                               |
| --------------------- | -------------------------------------------------------------------------- |
| `hasUnsavedChanges`   | `diagram.isDirty`                                                          |
| `selectedBlocks`      | `diagram.blocks` filtered by `selection`                                   |
| `canUndo`             | `undoStack.length > 0`                                                     |
| `canRedo`             | `redoStack.length > 0`                                                     |
| `incompleteDecisions` | `diagram.blocks` where `type === 'decision'` and missing Y or N connection |
| `totalComments`       | Sum of `block.comments.length` for all blocks                              |

### 6.3 Write Paths

Every user action that mutates the diagram must follow this pattern:

```
1. Clone current DiagramSnapshot → push UndoEntry.before
2. Apply mutation to store
3. Clone new DiagramSnapshot → push UndoEntry.after
4. Push UndoEntry to undoStack, clear redoStack
5. Set diagram.isDirty = true
6. Trim undoStack to max 100 entries
```

The only operations exempt from undo tracking are file-level operations (open, save, rename, delete) — these reset the undo stack.

---

## 7. Browser Persistence

### 7.1 `localStorage` Keys

| Key         | Type                | Description                                                               |
| ----------- | ------------------- | ------------------------------------------------------------------------- |
| `mmd-theme` | `'light' \| 'dark'` | Last active theme. Read on app init before first render to prevent flash. |

### 7.2 `FileSystemDirectoryHandle` Persistence

`FileSystemDirectoryHandle` objects cannot be stored in `localStorage` (they are not serializable to JSON). They must be stored in **IndexedDB** via the browser's native handle persistence.

```
Database name:   mmd-flowchart-db
Object store:    handles
Key:             'lastDirectory'
Value:           FileSystemDirectoryHandle (structured clone)
```

On app start: query `handles['lastDirectory']`. If found, call `handle.queryPermission({ mode: 'readwrite' })`. If `'granted'`, restore the directory handle silently. If `'prompt'`, show the "Open a folder" state and wait — do not auto-prompt.

> **Security:** The File System Access API requires explicit user gesture to grant permission. The stored handle can only be re-verified, not silently re-authorized. This is a browser security constraint and cannot be bypassed.

### 7.3 No Session Restore Beyond Preferences

The Functional Design explicitly states: _"All application state lives in memory in the browser tab."_ Therefore:

- The last-open file name is displayed as a hint in the empty state but is not auto-reopened.
- Diagram content (blocks, connections, comments) is **never** stored in localStorage or IndexedDB.
- If the user closes the tab with unsaved changes, those changes are lost — the dirty-state warning is a UX affordance, not a recovery mechanism.

---

## 8. Scale Constraints & Limits

These are hard or soft limits that bound the operational envelope of the v1 design.

| Constraint          | Limit                | Enforcement                                                                             |
| ------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| Blocks per diagram  | 200 (soft ceiling)   | Files exceeding 200 blocks open in read-only Mermaid preview (§14.4). No hard error.    |
| Comments per block  | No hard limit        | Soft UX limit: comment list virtualizes beyond 50 items.                                |
| Comment text length | 2000 characters      | Enforced at input (textarea `maxlength`).                                               |
| Block label length  | 200 characters       | Enforced at input. Longer labels are truncated with `…` on canvas.                      |
| Metadata JSON size  | ~50 KB practical max | No enforcement. Derived from 200 blocks × 5 comments × 200 chars.                       |
| Undo stack depth    | 100 entries          | Hard limit. Oldest entry dropped when exceeded.                                         |
| `.mmd` file size    | No limit             | The File System Access API has no size restriction. Performance degrades above ~500 KB. |
| Directory depth     | No limit             | All `.mmd` files are shown regardless of nesting depth.                                 |
| Files in directory  | No limit             | File tree is lazy-loaded. No pagination.                                                |

---

## 9. Data Integrity Rules

These rules must be enforced by the serializer on save and by the parser on load.

### 9.1 On Save (store → file)

| Rule                                                                      | Violation handling                                                                           |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Exactly one `start` block per diagram                                     | Block save if violated; surface error toast. Never write a broken file.                      |
| All `Connection.sourceId` and `targetId` values reference existing blocks | Orphaned connections are silently dropped. A console warning is emitted.                     |
| Decision block may have at most one `yes` and one `no` connection         | Duplicate typed connections are dropped; last-written wins.                                  |
| `start` block may not be a `targetId`                                     | Connection is silently dropped.                                                              |
| `end` block may not be a `sourceId`                                       | Connection is silently dropped.                                                              |
| Metadata JSON must be valid UTF-8 single-line JSON                        | If serialization fails, abort the save and show an error toast. Do not write a partial file. |

### 9.2 On Load (file → store)

| Rule                                                                     | Violation handling                                                                                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MMD_META_START` block is present but JSON is malformed                  | Fall back to plain Mermaid load (ignore metadata). Show toast: _"Metadata could not be read. Comments and data fields were not loaded."_             |
| `metadataVersion` is not `"1"`                                           | Same fallback as malformed JSON.                                                                                                                     |
| Metadata references a `blockId` that does not exist in the Mermaid graph | Orphaned metadata entries are silently discarded.                                                                                                    |
| Mermaid syntax is not a `flowchart` or `graph` type                      | Open in read-only preview mode (§14.4).                                                                                                              |
| Multiple `start` candidates inferred from topology                       | The block with the lowest node index in the file is treated as `start`. A warning is shown: _"Multiple start candidates found. The first was used."_ |

### 9.3 Atomic Write Pattern

To avoid leaving a corrupted file if the write is interrupted:

```
1. Serialize store → mmdText (in memory)
2. Validate mmdText parses cleanly (re-parse and check round-trip)
3. Open FileSystemWritableFileStream
4. Write mmdText to stream
5. Close stream (flushes to OS)
6. Set diagram.isDirty = false, diagram.lastSavedAt = now()
```

Step 2 is a defensive re-parse. If the re-parse fails, the write is aborted and an error toast is shown. The existing file is never touched until step 4.

---

## 10. Performance Targets

Derived from the Goals & Success Metrics in the Functional Design (§2).

| Operation                               | Target                 | Measurement point                            |
| --------------------------------------- | ---------------------- | -------------------------------------------- |
| Parse `.mmd` file → store               | ≤ 300 ms (≤ 200 nodes) | `performance.now()` around `parse()` call    |
| Serialize store → `.mmd` + write        | ≤ 200 ms (≤ 200 nodes) | `performance.now()` around serialize + write |
| Apply undo/redo step                    | ≤ 16 ms                | Must not drop a frame (60 fps budget)        |
| Canvas re-render after state change     | ≤ 16 ms                | React render cycle via React DevTools        |
| App initial load (Docker → interactive) | ≤ 2 s                  | `DOMContentLoaded`                           |

### Implementation guidance for parse/serialize performance

- The metadata JSON blob is a single line ≤ ~50 KB. `JSON.parse` + `JSON.stringify` on this size completes in < 5 ms in V8.
- The Mermaid syntax body for 200 nodes is ≤ ~10 KB. A hand-rolled line-by-line parser with regex is sufficient and faster than the full `mermaid.js` parser for this subset.
- `FileSystemWritableFileStream.write()` is async but typically completes in < 50 ms on local SSDs. The 200 ms budget is generous.
- The undo/redo deep-clone cost is the main performance risk. Use `structuredClone()` on the `DiagramSnapshot` (blocks + connections only, not file handles). For 200 nodes, `structuredClone()` completes in < 2 ms.
