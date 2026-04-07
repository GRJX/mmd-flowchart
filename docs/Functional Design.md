# Functional Design: MMD Flowchart Editor

**Status:** Draft  
**Author:** Alex (Product Manager)  
**Date:** 3 April 2026  
**Version:** 1.1  
**License:** Open Source

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Non-Goals](#3-non-goals)
4. [User Persona](#4-user-persona)
5. [System Architecture](#5-system-architecture)
6. [Application Layout](#6-application-layout)
7. [Block Types & Properties](#7-block-types--properties)
8. [Canvas Interactions](#8-canvas-interactions)
9. [Connection System](#9-connection-system)
10. [Comment System](#10-comment-system)
11. [Properties Panel](#11-properties-panel)
12. [File System & Directory Management](#12-file-system--directory-management)
13. [File Format & Data Model](#13-file-format--data-model)
14. [Mermaid Integration](#14-mermaid-integration)
15. [Export Capabilities](#15-export-capabilities)
16. [Undo / Redo](#16-undo--redo)
17. [Dark Mode](#17-dark-mode)
18. [Keyboard Shortcuts](#18-keyboard-shortcuts)
19. [Recommended Tech Stack](#19-recommended-tech-stack)
20. [Open Questions & Future Scope](#20-open-questions--future-scope)

---

## 1. Product Overview

MMD Flowchart Editor is a locally-run, browser-based flowchart creation and editing tool designed for QA engineers. It runs inside a Docker container and is accessed via `localhost` in a browser.

The primary use case is creating test case flowcharts that represent system behavior, test paths, and decision logic. The tool reads and writes `.mmd` (Mermaid) files as the source of truth, enriching them with custom metadata stored as Mermaid comment blocks. This means files remain valid Mermaid syntax and can be opened by any standard Mermaid-compatible tool, while the editor preserves extra context such as block comments and data fields when round-tripped.

---

## 2. Goals & Success Metrics

| Metric                                                                | Baseline                     | Target                    | Window                        |
| --------------------------------------------------------------------- | ---------------------------- | ------------------------- | ----------------------------- |
| Time to create a 10-node flowchart                                    | 15 min (manual Mermaid text) | ≤ 5 min                   | At first use                  |
| Successful round-trip of `.mmd` file (load → edit → save → re-load)   | N/A                          | Zero data loss            | Every save                    |
| Mermaid `flowchart` import accuracy (existing files render correctly) | N/A                          | 100% node/edge fidelity   | All standard flowchart syntax |
| User satisfaction (self-reported)                                     | N/A                          | ≥ 4/5 after first session | On release                    |
| File open latency (parse + render to canvas)                          | N/A                          | ≤ 300 ms for ≤ 200 nodes  | Every file open               |
| File save latency (serialize + write to disk)                         | N/A                          | ≤ 200 ms for ≤ 200 nodes  | Every save                    |
| Metadata integrity — comments/fields survive external edit + reload   | N/A                          | 100% field preservation   | Every reload                  |
| Undo/redo correctness — undo N actions restores exact prior state     | N/A                          | 100% state equivalence    | All tracked action types      |
| App initial load time (Docker nginx → interactive canvas)             | N/A                          | ≤ 2 s on localhost        | Every cold start              |

### Notes on Metrics

- **Baseline for "Time to create"** is defined as composing an equivalent diagram by hand in the [Mermaid Live Editor](https://mermaid.live). This gives a concrete, reproducible comparison.
- **≤ 200 nodes** is the defined scale ceiling for v1. Files exceeding this limit will open in read-only Mermaid preview mode (see §14.4) with a banner advising the user.
- **Metadata integrity** is tested by: (1) opening a file with the editor, (2) editing it externally in a text editor to add a node, (3) reloading in the editor. All pre-existing comment/dataField/expectedOutcome values on unchanged nodes must survive.
- **Undo/redo correctness** is verified by replaying the undo stack to the empty-canvas state and confirming all node positions, labels, and connections match the initial load snapshot byte-for-byte (serialized).
- **App initial load time** is measured from `http://localhost:3000` first request to the `DOMContentLoaded` event resolving and the canvas being interactive. Excludes Docker container startup time.

---

## 3. Non-Goals

The following are explicitly out of scope for v1 and will not be designed or built:

- **BDD / Gherkin support** — no Given/When/Then generation
- **Automated test case generation** — no output to test management tools
- **AI features** — no AI-assisted model reflection or suggestions
- **Collaboration / multi-user editing** — single user only
- **Block grouping / swimlanes** — deferred to a future version
- **Non-flowchart Mermaid diagrams** — sequence, ER, Gantt, etc. are not supported
- **Cloud sync or remote storage** — all data stays local
- **User accounts, authentication, or licensing** — open source, no auth

---

## 4. User Persona

**Primary user: QA Engineer**

- Creates flowcharts to model test scenarios, happy/unhappy paths, and system behavior
- Works locally, often in low-light environments (needs dark mode)
- Familiar with Mermaid syntax but prefers a visual editor
- Manages flowcharts in a versioned folder structure on their local machine (often alongside code)
- Does not need to share diagrams in real time, but does need portable, open files

---

## 5. System Architecture

```
┌────────────────────────────────────┐
│         Docker Container           │
│                                    │
│   ┌──────────────────────────┐     │
│   │  Static Frontend (SPA)   │     │
│   │  Served by nginx          │     │
│   │  Accessible at localhost  │     │
│   └───────────┬──────────────┘     │
└───────────────┼────────────────────┘
                │ File System Access API
                ▼
   ┌─────────────────────────┐
   │   Host Machine           │
   │   Local directory        │
   │   (user-selected)        │
   └─────────────────────────┘
```

### Key Architecture Decisions

- **No backend required.** The app is a pure single-page application (SPA) served by nginx inside Docker. File I/O is handled entirely by the [File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) in the browser.
- **Browser requirement:** Chromium-based browsers only (Chrome, Edge, Brave). Safari and Firefox do not fully support the File System Access API. This must be documented clearly in the README.
- **Docker role:** Packages and serves the built frontend assets. No Node.js server process, no API layer.
- **State:** All application state lives in memory in the browser tab. User preferences are the only data persisted across sessions: theme is stored in `localStorage` (key `mmd-theme`); the directory handle is stored in **IndexedDB** (database `mmd-flowchart-db`, store `handles`, key `'lastDirectory'`) because `FileSystemDirectoryHandle` objects are not JSON-serializable and cannot be placed in `localStorage`. See Data Architecture §7.2 for the full persistence specification.

### Docker Setup

```
docker run -p 3000:80 mmd-flowchart-editor
```

User opens `http://localhost:3000` in Chrome/Chromium.

---

## 6. Application Layout

The interface is divided into three panels with a top toolbar. Layout is fixed (not resizable in v1).

```
┌────────────────────────────────────────────────────────────────────┐
│  Top Toolbar                                                        │
├──────────────┬─────────────────────────────────┬───────────────────┤
│              │                                  │                   │
│  Left Panel  │         Canvas (center)          │   Right Panel     │
│  File Tree   │                                  │   Block Palette   │
│  (240px)     │                                  │   (or Properties) │
│              │                                  │   (280px)         │
│              │                                  │                   │
└──────────────┴─────────────────────────────────┴───────────────────┘
```

### 6.1 Top Toolbar

Contains, left to right:

- **App logo / name**
- **Open Folder** button — triggers File System Access API directory picker
- **Save** button (Ctrl/Cmd+S) — saves the currently active diagram
- **New Diagram** button — creates a new `.mmd` file in the connected directory
- **Export** dropdown — PNG, SVG
- _(flexible spacer)_
- **Fit to Screen** button — zooms canvas to fit all blocks
- **Zoom In / Zoom Out** controls with percentage display
- **Undo / Redo** buttons (with disabled state when stack is empty)
- **Dark Mode toggle** — sun/moon icon, top-right

> **Implementation note:** This left-to-right order is **canonical**. All views and states of the application must render the toolbar in exactly this order. Fit to Screen sits to the right of the spacer, adjacent to the zoom controls, not between Export and the spacer.

### 6.2 Left Panel — File Tree

- Displays the connected directory using a **VSCode-style directory tree**: collapsible folders, file icons, indentation per depth level.
- Only `.mmd` files are shown. Non-`.mmd` files are hidden.
- Active file is highlighted.
- **Icons must be rendered as inline SVG**, matching the VS Code file explorer icon style:
  - Folders use a two-tone folder SVG (closed: flat base + tab on top; open: the same shape with the top open). The folder icon changes state when expanded.
  - `.mmd` files use a document SVG with a folded top-right corner. No emoji or system font glyphs — SVG only to guarantee consistent rendering across platforms.
- Right-click context menu on a file:
  - **Rename**
  - **Delete** (with confirmation dialog)
  - **Duplicate**
- Right-click context menu on a folder:
  - **New Diagram here**
  - **New Folder here**
- If no directory is connected, the panel shows a prompt: _"Open a folder to get started"_ with an **Open Folder** button.
- Files changed externally (outside the app) are detected when the user clicks them and reloaded with a toast notification: _"File changed on disk. Reloaded."_

### 6.3 Canvas (Center Panel)

- Infinite canvas with pan and zoom.
- Grid background (subtle dots pattern) in both light and dark mode.
- All flowchart blocks and connections are rendered here.
- See Section 8 for full interaction details.

#### 6.3.1 Default Viewport

- When a diagram is opened, the canvas **centers the diagram** within the visible viewport with a minimum 60px padding on all sides and **always at 100 % zoom (1:1 pixel ratio)**. If the diagram is too large to fit at 100 %, it scales down just enough to fit, but never zooms in beyond 100 %.
- New diagrams open with the canvas centered at the logical origin (0, 0). The first block placed via the palette is dropped at center-of-viewport.
- Minimum vertical spacing between nodes after auto-layout hint: **72px** between the bottom edge of one node and the top edge of the next.
- The diagram is never pinned to the top-left corner. If only one or two nodes exist, they are still centered.

### 6.4 Right Panel — Block Palette / Properties Panel

The right panel has two states:

1. **Palette mode (default):** Shows the available block types that can be dragged or clicked onto the canvas (see Section 7).
2. **Properties mode:** When a block on the canvas is selected, the panel switches to show that block's properties (see Section 11).

Switching between modes is automatic — clicking the canvas background deselects all blocks and returns to palette mode.

#### 6.4.1 Panel Header

The right panel does **not** use a tab bar with clickable "Palette" and "Properties" tabs. Instead it uses a **context header**:

- In **Palette mode**: the header shows the label `Blocks` in muted uppercase.
- In **Properties mode**: the header shows a `←` back-arrow button followed by the block type name (e.g., `← Action Block`). Clicking the back arrow explicitly deselects the block and returns to Palette mode — this is an alternative to clicking the canvas background.

This makes the automatic switching behaviour obvious and removes the false affordance of user-controlled tab navigation.

#### 6.4.2 Palette Block Previews

Each entry in the palette must display a **miniature visual preview** of the actual canvas shape, not a symbolic character or icon:

| Block    | Preview shape                          |
| -------- | -------------------------------------- |
| Start    | Small rounded pill (teal border)       |
| End      | Small rounded pill (red border)        |
| Action   | Small rectangle with square corners    |
| Decision | Small diamond (rotated square)         |
| Result   | Small rectangle with thick left border |

Previews are rendered as **inline SVG** at approximately 40×24px. The preview uses the same border colors as the canvas node so users immediately recognize the mapping. The block label is shown below the preview in 11px muted text.

---

### 6.5 Status Bar

A fixed 24px bar at the very bottom of the application window. Displays contextual read-only information about the current state.

**Items, left to right:**

| Item                                                     | Condition                | Style                                                     |
| -------------------------------------------------------- | ------------------------ | --------------------------------------------------------- |
| Save state (`● Saved` / `● Unsaved changes` / `⚠ Error`) | Always                   | Colored dot: green = saved, yellow = unsaved, red = error |
| Active filename (e.g. `happy-path.mmd`)                  | When a file is open      | **Bold**, full filename including extension               |
| Diagram stats (e.g. `6 nodes · 5 connections`)           | When a file is open      | Muted, lower weight                                       |
| Selection info (e.g. `B1 selected`)                      | When a block is selected | Muted, rightmost                                          |

**Visual hierarchy rules:**

- The active filename is the most important piece of context and must be visually dominant: `font-weight: 600`, `color: var(--text)` (full brightness), not muted.
- All other items use `color: var(--text-dim)` (muted) so the filename stands out without requiring a larger font size.
- The save-state dot is the only coloured element and draws the eye first; the filename is immediately next in reading order.

---

## 7. Block Types & Properties

There are five block types. Each is visually distinct.

### 7.1 Start Block

| Property       | Value                                                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shape          | Rounded pill / stadium shape                                                                                                                                                                               |
| Label          | "Start" (non-editable label; user cannot rename this)                                                                                                                                                      |
| Mermaid syntax | `A([Start])`                                                                                                                                                                                               |
| Constraint     | **Exactly one** per diagram. If one already exists, the Start block in the palette is greyed out and disabled.                                                                                             |
| Connections    | **Exactly one output.** Cannot receive incoming connections. The palette must prevent the user from drawing a second outgoing connection; the connection handle is hidden/disabled once one output exists. |

### 7.2 End Block

| Property       | Value                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Shape          | Rounded pill / stadium shape (visually distinct from Start — e.g., red accent border)                                                  |
| Label          | "End" (editable — user can rename, e.g., "End - Pass", "End - Fail")                                                                   |
| Mermaid syntax | `Z([End])`                                                                                                                             |
| Constraint     | Multiple allowed                                                                                                                       |
| Connections    | **Exactly one input.** Cannot have outgoing connections. The connection handle is hidden/disabled once one incoming connection exists. |

### 7.3 State / Action Block

| Property       | Value                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shape          | Rectangle                                                                                                                                                                              |
| Label          | Editable — default "Action"                                                                                                                                                            |
| Mermaid syntax | `B[Action description]`                                                                                                                                                                |
| Fields         | Description (inline editable), Data Field (in properties panel), Comments                                                                                                              |
| Connections    | **Exactly one input and one output.** Additional connection attempts beyond these limits must be blocked; the relevant connection handle is hidden/disabled once the limit is reached. |

The **Data Field** is a free-text field for additional context (e.g., test data, preconditions). It is stored in metadata only (not rendered in Mermaid output).

### 7.4 Decision Block

| Property       | Value                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Shape          | Diamond                                                                                                                     |
| Label          | Editable condition — default "Condition?"                                                                                   |
| Mermaid syntax | `C{Condition?}`                                                                                                             |
| Fields         | Condition description, Comments                                                                                             |
| Connections    | **Exactly one input and exactly two outputs**: Y and N. Additional incoming connection attempts beyond one must be blocked. |

**Output path defaults:**

- **Y path:** arrow exits to the **right** of the diamond
- **N path:** arrow exits **downward** from the diamond

Both paths can be reassigned by the user (see Section 9). A decision block without both a Y and N connection is shown with a visual warning indicator (orange border) to flag it as incomplete.

**Y / N edge label placement:** The "Y" and "N" labels must be rendered **immediately adjacent to the exit point on the diamond edge** (within 8–12px of the connection handle). Labels must not drift toward the midpoint of the edge or the target block. This ensures the label is unambiguous — it is visually tied to the decision source, not to the path itself.

### 7.5 Results Block

| Property       | Value                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shape          | Rectangle with a double left border (or parallelogram — developer to choose most readable option)                                                                                      |
| Label          | Editable — default "Result"                                                                                                                                                            |
| Mermaid syntax | `D[/Result description/]` (parallelogram) or custom                                                                                                                                    |
| Fields         | Expected outcome description, Comments                                                                                                                                                 |
| Connections    | **Exactly one input and one output.** Additional connection attempts beyond these limits must be blocked; the relevant connection handle is hidden/disabled once the limit is reached. |

---

## 8. Canvas Interactions

### 8.0 Grid Snapping

All blocks on the canvas **snap to a fixed grid** when moved or dropped. This ensures consistent alignment without the user needing to position blocks manually.

| Setting      | Value                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Grid size    | **16px** — all block positions are rounded to the nearest 16px multiple on drop/move                               |
| Snap-on-move | Snapping applies continuously while dragging (live snap), not only on release                                      |
| Snap-on-drop | Blocks added from the palette are snapped to the grid immediately on placement                                     |
| Multi-select | When multiple blocks are moved together, all snap independently to the nearest grid point                          |
| Visual grid  | The existing dot-pattern canvas background serves as the visual grid reference; no additional grid lines are drawn |

Grid snapping is **always on** in v1. There is no user toggle to disable it.

### 8.1 Adding Blocks

**Method 1 — Drag from palette:**  
User drags a block type from the right panel onto the canvas. A ghost/preview of the block follows the cursor. On drop, the block is placed at the drop position.

**Method 2 — Click in palette:**  
User clicks a block in the palette. The block is added to the **center of the visible canvas area**. A connection dot immediately appears on the block to indicate it is ready to connect.

**Method 3 — Contextual Predictive Creation (quick-add):**  
This is the fastest way to extend a workflow. It collapses the traditional 7-step manual process (find → drag → drop → aim → click → drag → connect) into 3 clicks:

1. **Intent detection** — Hover over any source-capable block. A small **`+` button** appears next to each active connection handle on the block's edge.
2. **Modal injection** — Click the `+` button. A **Quick Add** menu opens inline at the click position, offering selectable block types (Action, Decision, Result, End) with a short description of each.
3. **Automated bridging** — Select a block type. The system automatically:
   - Computes a placement position 240 px to the right of the source block (snapped to the 16 px grid), shifting downward in 128 px increments if the slot is occupied by an existing block.
   - Creates the new block at that position.
   - Draws a `default` connection from the source block to the new block.
   - Pushes a single undoable entry for the combined operation.

**Accessibility:** The `+` button and Quick Add menu are fully keyboard navigable. `Escape` closes the menu without creating a node.

### 8.2 Selecting Blocks

- **Single click** on a block: selects it, switches right panel to Properties mode.
- **Click on canvas background**: deselects all, returns to Palette mode.
- **Click + drag on canvas background**: draws a selection rectangle (marquee). All blocks fully within the rectangle are selected.
- **Shift+Click**: adds or removes a block from the current selection.

### 8.3 Moving Blocks

- **Single block:** Click and drag a selected block to reposition.
- **Multiple blocks:** When multiple blocks are selected, dragging any one of them moves all selected blocks together, preserving their relative positions.

### 8.4 Canvas Navigation

| Action             | Gesture                                                      |
| ------------------ | ------------------------------------------------------------ |
| Pan                | Click and drag on canvas background (or middle mouse button) |
| Zoom in/out        | Mouse wheel scroll, or toolbar buttons                       |
| Fit to screen      | Toolbar button or Ctrl/Cmd+Shift+F                           |
| Reset zoom to 100% | Double-click on zoom percentage display                      |

Zoom range: **10% to 400%**.

### 8.5 Inline Label Editing

- **Double-click** on a block opens its label for inline editing.
- Pressing **Enter** or **Escape** confirms and exits edit mode.
- Pressing **Delete** or **Backspace** when a block is selected (and not in edit mode) deletes the block and all its connections. A confirmation dialog is shown if the block has **comments** (to prevent accidental loss of annotation data). Blocks with no comments but with connections are deleted immediately without confirmation.

### 8.6 Multi-select Move

Selected blocks can be moved as a group. Connections between selected blocks move with them. Connections from selected blocks to unselected blocks stretch/re-route accordingly.

---

## 9. Connection System

### 9.1 Creating Connections

**Step 1:** Hover over any block on the canvas. A connection point (small circle) appears on each edge of the block (top, right, bottom, left).

**Step 2:** Hover over a connection point. The point **changes colour** to indicate it is active (e.g., from muted grey to the accent colour). The icon does **not** grow or scale on hover — size must remain constant. This prevents visual clutter and avoids unintentional layout shifts when the cursor approaches multiple nearby handles.

**Step 3:** Click the connection point and **drag** toward the target block (or simply **click** the source point and then **click** the target point — both interaction modes are supported). A preview line follows the cursor during drag.

**Step 4:** Release (or click) over a target block or its connection point. A connection is created.

### 9.2 Connection Types

| Source Block           | Connection Type     | Label on Arrow |
| ---------------------- | ------------------- | -------------- |
| Start, Action, Results | Default (unlabeled) | No label       |
| Decision (Y path)      | Yes                 | "Y"            |
| Decision (N path)      | No                  | "N"            |

When drawing a connection from a Decision block, a picker appears after the connection is dropped asking the user to assign it as the **Y path** or **N path**. If a path already exists, the user is warned and can choose to redirect the existing path or cancel.

**Picker dismiss behaviour:** The picker must always provide an explicit cancel affordance:

- An `✕` button in the top-right corner of the picker UI.
- Pressing `Escape` dismisses the picker and removes the in-progress connection draft.
- Clicking anywhere on the canvas outside the picker also dismisses it and removes the draft.

Without a cancel path, users who drop a connection by accident have no way to abort the operation.

### 9.3 Connection Routing

- Connections are drawn as **orthogonal (right-angle) arrows** by default, automatically routed to avoid overlapping blocks where possible.
- Users can drag the midpoint handle of a connection to create a manual bend/waypoint.
- Connections can be deleted by selecting them (click on the line) and pressing **Delete**.

### 9.4 Decision Block Direction Defaults

When a Decision block is placed on the canvas with no existing connections:

- The **Y exit point** is on the **right edge** of the diamond.
- The **N exit point** is on the **bottom edge** of the diamond.

These defaults are visual only and can be overridden by drawing connections from any edge.

### 9.5 Editing Connections

Clicking a connection line selects it and shows:

- Its type (Y / N / default) in the Properties panel
- A **Delete connection** button
- For Decision connections: a **Swap Y/N** button

---

## 10. Comment System

Comments are attached to individual blocks, not to connections or the diagram level.

### 10.1 Comment Indicator

- Each block that has **one or more comments** displays a small **red dot icon** in its **top-right corner**.
- If the block has **more than one comment**, the dot shows a **numeric badge** (e.g., `3`).
- Blocks with no comments show no indicator.

**Rendering requirements:**

- The dot must **visually hang outside** the block boundary — centered on the top-right corner, approximately half inside and half outside the block edge.
- Minimum size: **18×18px** (increased from any smaller default) to ensure it is easily clickable and visible against the canvas background.
- The parent block element must use `overflow: visible` so the dot is never clipped.
- The dot must sit above all other canvas elements (`z-index` higher than block bodies) so it is never obscured by adjacent nodes.
- The dot background is solid `#f87171` (red token) with a 2px border in the canvas background colour to create a halo separation from the block border.

### 10.2 Comment Panel

- Clicking the red dot icon **opens a Comment Panel** anchored to the block (slide-in drawer or floating panel — developer to choose the most readable option, recommended: slide-in from right, pushing the Properties panel).
- The Comment Panel shows:
  - A list of all comments for that block, each with:
    - Comment text
    - Timestamp (stored in metadata)
    - A **Delete** button
  - A text input at the bottom with an **Add Comment** button / Enter to submit.
- Closing the Comment Panel returns to the Properties Panel.

### 10.3 Comment Storage

Comments are **not** stored in Mermaid syntax. They are stored exclusively in the metadata section of the `.mmd` file (see Section 13.2).

---

## 11. Properties Panel

When a block is selected, the right panel switches from Palette mode to Properties mode and shows the following fields:

### 11.1 Common Fields (all block types)

| Field          | Description                                 | Editable                             |
| -------------- | ------------------------------------------- | ------------------------------------ |
| Block Type     | Read-only label (e.g., "Decision Block")    | No                                   |
| ID             | Auto-generated Mermaid node ID (e.g., `C1`) | No (internal use)                    |
| Description    | The block's main label text                 | Yes — text input                     |
| Comments count | Number of attached comments                 | No (click dot icon to open comments) |

### 11.2 State / Action Block — Additional Fields

| Field      | Description                                                                              |
| ---------- | ---------------------------------------------------------------------------------------- |
| Data Field | Free-text field for test data, preconditions, or context notes. Stored in metadata only. |

### 11.3 Decision Block — Additional Fields

| Field                | Description                                              |
| -------------------- | -------------------------------------------------------- |
| Condition            | The condition text shown on the diamond label.           |
| Y Path target        | Read-only display of which block the Y path connects to. |
| N Path target        | Read-only display of which block the N path connects to. |
| Incomplete indicator | Orange warning if Y or N path is missing.                |

### 11.4 Results Block — Additional Fields

| Field            | Description                                                                   |
| ---------------- | ----------------------------------------------------------------------------- |
| Expected Outcome | Free-text field describing the expected test result. Stored in metadata only. |

### 11.5 End Block — Additional Fields

| Field       | Description                                    |
| ----------- | ---------------------------------------------- |
| Description | Editable label (e.g., rename to "End - Fail"). |

### 11.6 Connection Properties

When a connection is selected:

| Field  | Description                                                      |
| ------ | ---------------------------------------------------------------- |
| Type   | Y / N / Default (editable via dropdown for Decision connections) |
| From   | Source block ID and label (read-only)                            |
| To     | Target block ID and label (read-only)                            |
| Delete | Button to remove the connection                                  |

---

## 12. File System & Directory Management

### 12.1 Opening a Directory

1. User clicks **Open Folder** in the top toolbar or in the empty left panel prompt.
2. The browser's native directory picker opens (File System Access API: `showDirectoryPicker()`).
3. The user selects a directory on their local machine.
4. The app stores the `FileSystemDirectoryHandle` in **IndexedDB** (database `mmd-flowchart-db`, object store `handles`, key `'lastDirectory'`). The handle persists across page refreshes and browser restarts. On next load the app calls `handle.queryPermission({ mode: 'readwrite' })`; if the result is `'granted'` the directory is silently restored, if `'prompt'` the empty-state screen is shown and no directory picker is auto-opened. See Data Architecture §7.2 for the full algorithm.
5. The left panel populates with the file tree.

> **Important for developers:** When using `showDirectoryPicker()`, the browser may prompt the user to grant read/write permission. The app must request both read and write access (`mode: 'readwrite'`). If permission is denied, show an error toast: _"Read/write permission is required to use this folder."_

### 12.2 Reading Files

- All `.mmd` files in the selected directory (and subdirectories) are listed in the file tree.
- Files are read on demand when clicked (lazy loading — not pre-loaded into memory).
- Directories are shown as expandable nodes. Non-`.mmd` files are hidden but not deleted.

### 12.3 Saving Files

- **Save (Ctrl/Cmd+S):** Writes the current diagram state to the open `.mmd` file using `FileSystemWritableFileStream`.
- **Auto-save:** Not implemented in v1. Users save manually.
- If the file has been modified externally since it was loaded, the app shows a dialog: _"This file has been modified on disk. Overwrite with your changes, or discard and reload?"_
- **Unsaved changes on tab close:** When `diagram.isDirty` is `true`, the app registers a `beforeunload` event handler to trigger the browser's native "Leave site?" confirmation dialog. The handler is removed immediately after a successful save. This is a last-resort safeguard supplementing the dirty-state indicator in the status bar.

### 12.4 Creating New Files

- Clicking **New Diagram** opens a dialog: _"Filename:"_ with a text input. Extension `.mmd` is appended automatically if not provided.
- The file is created in the **currently selected folder** in the tree. If no folder is selected, it is created in the root of the connected directory.
- The new file is opened immediately on the canvas with a **single Start block pre-placed at the logical center of the viewport**. This ensures the structural constraint (exactly one Start block per diagram) is satisfied from the moment of creation. The undo stack is empty; the file is in an unsaved (`isDirty = true`) state.

### 12.5 Renaming and Deleting

- **Rename:** Inline rename in the file tree (click the filename or use context menu). The file is renamed on disk immediately.
- **Delete:** Confirmation dialog: _"Delete [filename]? This cannot be undone."_ On confirm, the file is deleted from disk via the File System Access API.

---

## 13. File Format & Data Model

### 13.1 Design Philosophy

The `.mmd` file is the **single source of truth**. The file must remain valid Mermaid flowchart syntax so it can be rendered by any standard Mermaid tool (e.g., GitHub, VS Code preview, Mermaid Live Editor). Metadata is embedded as a `%%` comment block at the top of the file, which Mermaid parsers ignore.

### 13.2 File Structure

```
%% MMD_META_START
%% {"version":"1","meta":{"blockId":{"dataField":"...","expectedOutcome":"...","comments":[{"id":"c1","text":"...","timestamp":"2026-04-03T10:00:00Z"}]}}}
%% MMD_META_END
flowchart TD
    A([Start]) --> B[Login with valid credentials]
    B --> C{Auth successful?}
    C -- Y --> D[/Expected: Dashboard loads/]
    C -- N --> E([End - Fail])
    D --> F([End - Pass])
```

### 13.3 Metadata Schema

```json
{
  "version": "1",
  "meta": {
    "<nodeId>": {
      "dataField": "string | null",
      "expectedOutcome": "string | null",
      "position": { "x": 0, "y": 0 },
      "comments": [
        {
          "id": "string (uuid)",
          "text": "string",
          "timestamp": "ISO 8601 string"
        }
      ]
    }
  },
  "connections": {
    "<sourceId>-<targetId>-<type>": {
      "waypoints": [{ "x": 0, "y": 0 }]
    }
  }
}
```

> **`position`** is stored per block in the metadata (not in Mermaid syntax) so that canvas layout is preserved across round-trips. **`connections`** stores waypoints only; the edge topology (source, target, type) is derived from the Mermaid syntax and is not duplicated. The connection key `"<sourceId>-<targetId>-<type>"` is deterministic and survives a re-parse. See Data Architecture §5.2 for the full TypeScript interface.

The metadata JSON is stored **as a single line** within the `%% MMD_META_START` / `%% MMD_META_END` block. The `%%` prefix is prepended to the JSON line as: `%% <json>`.

### 13.4 Node ID Generation

Each block placed on the canvas is assigned a short, stable, human-readable ID:

- Start: `S`
- End blocks: `E1`, `E2`, `E3`, ...
- Action blocks: `A1`, `A2`, ...
- Decision blocks: `D1`, `D2`, ...
- Results blocks: `R1`, `R2`, ...

IDs are assigned at creation time and do not change when blocks are renamed or moved.

### 13.5 Loading an Existing `.mmd` File

**If the file has metadata** (contains `MMD_META_START`):

1. Parse and strip the metadata comment block.
2. Parse the remaining Mermaid syntax into the internal block/connection graph.
3. Merge metadata fields into the corresponding blocks by node ID.
4. Render the graph on the canvas.

**If the file has no metadata** (plain Mermaid file):

1. Parse the Mermaid syntax directly.
2. Infer block types from Mermaid shape syntax (see Section 14.2).
3. Assign all blocks empty metadata.
4. Render on canvas.
5. Display a toast: _"Opened as Mermaid file. Metadata will be added on save."_

---

## 14. Mermaid Integration

### 14.1 Supported Mermaid Syntax

Only `flowchart` and `graph` diagram types are supported. Any other diagram type (e.g., `sequenceDiagram`, `erDiagram`) will be rejected with an error message: _"This file type is not supported. Only flowchart diagrams are supported."_

Supported directives: `flowchart TD`, `flowchart LR`, `flowchart TB`, `graph TD`, `graph LR`, etc.

> **Note:** The canvas layout direction is always handled as a top-down or left-right suggestion from the Mermaid direction flag. The user can override visual positions via drag-and-drop.

### 14.2 Block Type Inference from Mermaid Syntax

When loading a plain Mermaid file without metadata, block types are inferred as follows:

| Mermaid Syntax  | Inferred Block Type                                                 |
| --------------- | ------------------------------------------------------------------- |
| `A([text])`     | Start or End (Start if no incoming edges; End if no outgoing edges) |
| `B[text]`       | State/Action block                                                  |
| `C{text}`       | Decision block                                                      |
| `D[/text/]`     | Results block                                                       |
| Any other shape | State/Action block (fallback)                                       |

### 14.3 Exporting to Mermaid

On save, the internal graph is serialized to Mermaid flowchart syntax:

1. Metadata comment block is written first (`MMD_META_START` ... `MMD_META_END`).
2. `flowchart TD` header is written.
3. Each block is written as a node definition line using the appropriate shape syntax.
4. Each connection is written as an edge: `A --> B`, `C -- Y --> D`, `C -- N --> E`.
5. The file is written to disk, overwriting the previous version.

### 14.4 Mermaid Rendering Fallback

If a loaded `.mmd` file cannot be parsed into the interactive graph (e.g., it uses unsupported Mermaid features), the file is displayed as a **read-only Mermaid preview** using the Mermaid.js library for rendering. A banner is shown: _"This diagram could not be loaded for editing. It is shown in read-only preview mode."_

---

## 15. Export Capabilities

Accessible via the **Export** dropdown in the top toolbar.

### 15.1 Export as PNG

- The canvas content (all blocks and connections) is rendered to a `<canvas>` element using the current zoom level reset to 100%.
- The resulting image is downloaded as `<filename>.png`.
- Background color matches the current theme (white in light mode, dark in dark mode).
- Padding of 32px is applied around the diagram bounds.

### 15.2 Export as SVG

- The canvas is serialized as an SVG file.
- Fonts, colors, and shapes are embedded.
- Downloaded as `<filename>.svg`.

> **Note for developers:** React Flow supports SVG export natively via the `toSvg` utility. PNG export can be achieved via `toPng` from the `@xyflow/react` package.

---

## 16. Undo / Redo

- **Undo:** Ctrl/Cmd+Z — reverts the last action on the canvas.
- **Redo:** Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z — reapplies the last undone action.
- Toolbar buttons reflect the state: greyed out when the undo/redo stack is empty.

**Actions tracked by undo/redo:**

| Action                   | Undoable |
| ------------------------ | -------- |
| Add block                | Yes      |
| Delete block             | Yes      |
| Move block(s)            | Yes      |
| Edit label / description | Yes      |

> **Drag-move coalescing:** A drag-move gesture is recorded as a **single** undo entry per drag. The `UndoEntry` is pushed on pointer-up (drag end), capturing block positions before and after the complete gesture — not on every individual pixel of movement. Arrow-key nudge events within a 300 ms window are similarly coalesced into one entry.
> | Add connection | Yes |
> | Delete connection | Yes |
> | Change connection type (Y/N) | Yes |
> | Add comment | Yes |
> | Delete comment | Yes |
> | Edit data field / expected outcome | Yes |

**Actions NOT tracked (not undoable):**

| Action                                     |
| ------------------------------------------ |
| Save file                                  |
| Open file                                  |
| Create / rename / delete file in file tree |
| Theme switch                               |

**Stack size:** Maximum 100 actions. Older entries are dropped when the limit is exceeded.

---

## 17. Dark Mode

- **Toggle:** Top-right icon in the toolbar (sun/moon).
- **Persistence:** Theme preference is stored in `localStorage` and restored on next load.
- **Scope:** All UI elements switch — toolbar, panels, canvas background, block colors, connection lines.
- **Default:** Dark mode is the default theme. This matches the primary user environment (low-light, developer workstations).

### 17.1 Design Token Reference

The UI is implemented with CSS custom properties. Dark-mode values are the canonical implementation; light-mode overrides are applied via `[data-theme="light"]`.

**Background surfaces (dark mode):**

| Token          | Value     | Usage                               |
| -------------- | --------- | ----------------------------------- |
| `--bg-app`     | `#1e1e1e` | Primary app surface                 |
| `--bg-panel`   | `#181818` | Toolbar and panel surfaces          |
| `--bg-sidebar` | `#141414` | File-tree sidebar (deepest surface) |
| `--bg-canvas`  | `#111111` | Canvas background                   |
| `--bg-hover`   | `#252525` | Interactive item hover state        |
| `--bg-active`  | `#2d2d2d` | Selected/active item                |
| `--bg-input`   | `#1c1c1c` | Form inputs and text areas          |
| `--bg-dialog`  | `#1a1a1a` | Modal dialogs, floating menus       |

**Borders:**

| Token         | Value     | Usage                                 |
| ------------- | --------- | ------------------------------------- |
| `--border`    | `#272727` | Default structural borders            |
| `--border-hi` | `#3c3c3c` | Emphasized borders (dialogs, focused) |

**Typography:**

| Token          | Value     | Usage                    |
| -------------- | --------- | ------------------------ |
| `--text`       | `#e2e2e2` | Primary body text        |
| `--text-muted` | `#7a7a7a` | Secondary / inactive     |
| `--text-dim`   | `#4a4a4a` | Tertiary / disabled text |

**Accent & semantic colors (shared across light and dark):**

| Token       | Value     | Usage                                      |
| ----------- | --------- | ------------------------------------------ |
| `--accent`  | `#4da3ff` | Primary interactive — focus, links, badges |
| `--accent2` | `#a78bfa` | Secondary — logo, secondary badges         |
| `--green`   | `#4ade80` | Success, pass state, saved indicator       |
| `--red`     | `#f87171` | Error, fail state, delete actions          |
| `--yellow`  | `#fbbf24` | Decision block, warning states             |
| `--orange`  | `#fb923c` | Caution — incomplete decision block        |
| `--teal`    | `#2dd4bf` | Start block, result block accent           |

> **Design rationale:** The palette uses neutral dark grays (no purple or blue tint) consistent with VS Code Dark+, Notion, and Claude chat. This improves eye comfort in extended low-light use. The single blue accent (`#4da3ff`) anchors all interactive affordances; semantic colors (green/red/yellow/orange/teal) are used strictly for their conventional meaning.

**Color scheme guidance:**

| Element           | Light Mode               | Dark Mode                 |
| ----------------- | ------------------------ | ------------------------- |
| Canvas background | `#F5F5F5` (off-white)    | `#111111` (neutral dark)  |
| Grid dots         | `#E0E0E0`                | `#252525`                 |
| Start block       | Teal accent border       | Same                      |
| End block         | Red accent border        | Same                      |
| Action block      | White fill, grey border  | Dark fill, lighter border |
| Decision block    | White fill, amber border | Dark fill, amber border   |
| Results block     | Light teal fill          | Dark teal fill            |
| Selected block    | Blue highlight border    | Same                      |
| Connection lines  | `#555`                   | `#444444`                 |

---

## 18. Keyboard Shortcuts

| Shortcut                          | Action                                       |
| --------------------------------- | -------------------------------------------- |
| `Ctrl/Cmd+S`                      | Save current file                            |
| `Ctrl/Cmd+Z`                      | Undo                                         |
| `Ctrl/Cmd+Y` / `Ctrl/Cmd+Shift+Z` | Redo                                         |
| `Ctrl/Cmd+Shift+F`                | Fit canvas to screen                         |
| `Delete` / `Backspace`            | Delete selected block(s) or connection       |
| `Escape`                          | Deselect all / cancel active connection draw |
| `Ctrl/Cmd+A`                      | Select all blocks on canvas                  |
| `Arrow keys`                      | Nudge selected block(s) by 8px               |
| `Shift+Arrow keys`                | Nudge selected block(s) by 1px               |
| `Double-click block`              | Enter inline label edit mode                 |
| `Enter` (during edit)             | Confirm edit                                 |
| `Escape` (during edit)            | Cancel edit                                  |

---

## 19. Recommended Tech Stack

These are recommendations for the development team. All items are open source.

| Layer                  | Recommendation                                      | Rationale                                                                                                        |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Frontend framework     | **React 18+** with TypeScript                       | Ecosystem, tooling, React Flow compatibility                                                                     |
| Canvas / flow engine   | **@xyflow/react (React Flow v12)**                  | Purpose-built for interactive node-edge diagrams; built-in drag-drop, pan/zoom, multi-select, connection handles |
| Mermaid parsing/export | **mermaid.js** (parser only) + custom serializer    | Parse existing files; write custom serialization for export                                                      |
| State management       | **Zustand**                                         | Minimal boilerplate; ideal for canvas state + undo/redo history                                                  |
| Styling                | **Tailwind CSS**                                    | Rapid UI development; dark mode via `dark:` variant                                                              |
| Build tool             | **Vite**                                            | Fast dev server and build                                                                                        |
| Docker                 | **nginx:alpine** serving `/dist`                    | Lightweight, production-ready                                                                                    |
| Icons                  | **Lucide React**                                    | Clean, consistent icon set used in VSCode-like UIs                                                               |
| Undo/redo              | **Zustand + immer middleware** or **zundo library** | Clean history stack integration with Zustand                                                                     |

**Dockerfile (outline):**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 20. Open Questions & Future Scope

### Deferred to Later Versions

| Feature                                       | Trigger to Revisit                               |
| --------------------------------------------- | ------------------------------------------------ |
| Block grouping / swimlanes                    | User feedback after v1 ships                     |
| Auto-layout (re-arrange blocks automatically) | If users report layout as a pain point           |
| BDD / Gherkin export                          | If QA users request a path to test formalization |
| Automated test case generation                | After flowchart editing is stable                |
| Collaboration / multi-user                    | If teams request shared editing                  |
| AI-assisted modeling                          | After core tool is validated with real users     |

### Known Constraints to Document in README

1. **Browser compatibility:** Requires Chrome, Edge, or Brave (Chromium-based). Firefox and Safari are not supported due to File System Access API limitations.
2. **Mermaid scope:** Only `flowchart` / `graph` diagram types are supported for visual editing.
3. **No auto-save:** Users must save manually (Ctrl+S).
4. **Metadata loss:** If the file is edited externally after metadata has been added, the metadata comment block may be corrupted. The app will warn the user if it cannot parse metadata and fall back to plain Mermaid rendering.
