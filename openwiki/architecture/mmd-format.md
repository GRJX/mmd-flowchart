# Architecture: Diagram Domain & `.mmd` File Format

This page covers the domain model, the five block types and connection rules, the on-disk `.mmd`
format (Mermaid syntax + embedded metadata), and read-only/violation handling. The full,
authoritative behavioral spec is [`docs/FO.md`](../../docs/FO.md) §§2–4, 12–13; this page explains
how that spec maps onto the code.

## Domain model (`src/types/domain.ts`)

```ts
type BlockType = "start" | "end" | "action" | "decision" | "result";

interface Block {
  id: string;                 // stable, human-readable: "S", "A1", "D2", ...
  type: BlockType;
  label: string;
  position: Position;
  width: number; height: number;
  dataField: string | null;         // Start, Action
  expectedOutcome: string | null;   // Result
  yesDataField: string | null;      // Decision only — context for the Y path
  noDataField: string | null;       // Decision only — context for the N path
  comments: Comment[];
}

type ConnectionKind = "default" | "yes" | "no";
type HandleSide = "top" | "right" | "bottom" | "left";

interface Connection {
  id: string;            // `${source}-${target}-${kind}`, see src/lib/ids.ts
  source: string; target: string;
  kind: ConnectionKind;
  label: string;
  sourceSide: HandleSide; targetSide: HandleSide;
}

interface Diagram {
  blocks: Record<string, Block>;
  connections: Record<string, Connection>;
}
```

`DiagramFile` wraps a `Diagram` with its file path, raw `.mmd` text, a `readOnlyReason` (see
below), and `lastModified` timestamp — this is what `src/lib/fs/fileOps.ts` produces when opening
a file and what the diagram store loads from.

Key constants (`src/types/domain.ts`): `MAX_BLOCKS_EDITABLE = 200`, `MAX_COMMENT_LENGTH = 2000`,
`MAX_DATAFIELD_LENGTH = 2000`, `MAX_EDGE_LABEL_LENGTH = 50`, `GRID_SIZE = 8`,
`UNDO_STACK_LIMIT = 100`, `AUTOSAVE_DEBOUNCE_MS = 2000`, plus the macro-grid geometry constants
used by the Align feature (see [overview.md](overview.md#canvas--react-flow-integration)).

## Block types (`src/config/blockConfig.ts`)

Every block-type-specific rule is centralized in `BLOCK_CONFIG: Record<BlockType, BlockTypeConfig>`
— id prefix, singleton-ness, max inputs/outputs, which sides accept incoming vs. outgoing
connections, default label/size, palette/quick-add availability, and (for Decision) which handle
maps to which outgoing label/kind. **Adding a new block type is meant to be a config-only change**
— see the file's own header comment and `docs/FO.md` §2.

| Type | ID pattern | Max in | Max out | Label editable | Data Field | Expected Outcome | Shape |
|---|---|---|---|---|---|---|---|
| Start | `S` | 0 | 1 | no | yes | no | circle (green) |
| End | `E1..En` | ∞ | 0 | no | no | no | circle (slate) |
| Action | `A1..An` | ∞ | 1 | yes | yes | no | rounded rect (blue) |
| Decision | `D1..Dn` | ∞ | 2 (Y+N) | yes | no (2× yes/no context) | no | diamond (amber) |
| Result | `R1..Rn` | ∞ | 1 | yes | no | yes | rounded rect (teal) |

All four non-Start/End block types accept connections on **all four sides** and every visible
connection point is bidirectional (can be a source or a target). For a Decision, the *direction*
of an outgoing edge determines its kind: bottom → "no", right **or** left → "yes" (right is the
default side for Yes; left is an accepted alternate layout). A new Yes edge always replaces the
existing Yes edge regardless of which side it leaves from — see `docs/FO.md` §2/§3 for the full
rule set and `src/canvas/violations.ts` for how a diagram that violates these limits (e.g. from a
hand-edited file) is detected and flagged rather than silently "fixed".

`src/lib/ids.ts` implements ID allocation (`allocateBlockId` — next free integer per type prefix),
deterministic connection IDs (`makeConnectionId`), and handle-id encode/decode helpers
(`sourceHandleId`/`targetHandleId`/`sideFromHandleId`) used throughout the canvas layer.

## The `.mmd` file format

A saved file has two parts: an embedded metadata comment block, then standard Mermaid `flowchart`
syntax.

```
%% MMD_META_START
%% {"version":"1","meta":{...},"connections":{...}}
%% MMD_META_END
flowchart TD
    S([Start])
    A1[Label]
    D1{Condition?}
    R1[/Result/]
    E1([End])
    S --> A1
    A1 --> D1
    D1 -- Y --> R1
    D1 -- N --> E1
```

Node syntax per type: `S([Label])` (Start/End — Mermaid "stadium" shape), `A1[Label]` (Action —
rect), `D1{Label}` (Decision — diamond), `R1[/Result/]` (Result — parallelogram).

Blocks are always serialized in a fixed order (Start, then Action/Decision/Result numerically,
then End), and connections are written via a depth-first traversal from Start — disconnected
subgraphs are appended at the end (`docs/FO.md` §4). This keeps diffs stable across saves that
don't otherwise change structure.

### Embedded metadata (`src/lib/mermaid/metadata.ts`)

Everything that doesn't fit Mermaid's grammar — position, size, comments, data fields, and which
side a connection attaches to — lives in a `%% MMD_META_START` / `%% MMD_META_END` JSON block
(`DiagramMetaV1`). `extractMetaBlock()` pulls it out (tolerating an unparsable or missing block —
`hadMetaButUnreadable` signals that to callers), and `buildMetaBlock()` regenerates it on save.
`yesDataField`/`noDataField` are only ever written for Decision blocks.

### Label escaping

The in-memory model always holds literal text; escaping to Mermaid's numeric HTML entities
(`&` → `#amp;`, `"` → `#quot;`, `<` → `#lt;`, `>` → `#gt;`) happens only on serialize, and is
decoded back on load, so open → save-without-changes is lossless. Hard line breaks/tabs in a label
are collapsed to a single space on serialize (Mermaid's line-based grammar would otherwise split a
label mid-statement). See `docs/FO.md` §4 for the accepted edge case (literal `#quot;` typed by a
user round-trips to `"`).

### Parse / serialize / detect (`src/lib/mermaid/`)

- `parse.ts` — turns `.mmd` source (body + extracted metadata) into a `Diagram`.
- `serialize.ts` — turns a `Diagram` back into `.mmd` source (metadata block + flowchart body, in
  the fixed ordering above).
- `detect.ts` (`detectDiagramKind`) — sniffs the first non-empty, non-comment line to classify the
  file as `flowchart`/`graph` (editable), a known other Mermaid diagram type (`sequenceDiagram`,
  `classDiagram`, `pie`, etc. — rendered read-only), or `unknown`.

## Read-only mode (`docs/FO.md` §13)

A file opens read-only when either:
1. It's a supported-but-different Mermaid diagram type (per `detectDiagramKind`), or
2. It has more than `MAX_BLOCKS_EDITABLE` (200) blocks.

In read-only mode the diagram is rendered via the `mermaid` library as a static SVG, a banner
explains why, no edits are possible, and export is disabled. This is tracked as
`DiagramFile.readOnlyReason: ReadOnlyReason | null` (`{ kind: "unsupported-type", detected }` or
`{ kind: "too-many-blocks", count }`), set when opening a file in `src/lib/fs/fileOps.ts` and read
by `diagramStore`/`Canvas`/`Toolbar` to gate editing actions.

## What to watch out for when changing this area

- **Round-trip correctness is the most important invariant.** Any change to `parse.ts`,
  `serialize.ts`, or `metadata.ts` should be checked by hand: open a file, save without changes,
  and diff the result — it must be byte-identical (modulo the accepted label-escaping edge case).
  There is no automated test covering this (see [operations.md](operations.md)).
- If you add a field to `Block`/`Connection`, update `BlockMeta`/`ConnectionMeta` in
  `metadata.ts`, both `parse.ts` and `serialize.ts`, and the relevant panel component — all four
  need to stay in sync or the field will silently disappear on save/reload.
- Connection limits and Yes/No assignment logic live in `blockConfig.ts` +
  `src/canvas/violations.ts` + the store's `addConnection`/`reconnectConnection` — don't
  special-case block types elsewhere.
