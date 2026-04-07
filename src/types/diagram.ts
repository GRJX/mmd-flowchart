// ── Block ─────────────────────────────────────────────────────────────────────

export type BlockType = "start" | "end" | "action" | "decision" | "result";

export interface Comment {
  id: string; // UUID v4
  text: string; // max 2000 chars
  timestamp: string; // ISO 8601, set at creation, never mutated
}

export interface Block {
  id: string; // S, E1..En, A1..An, D1..Dn, R1..Rn
  type: BlockType;
  label: string;
  position: { x: number; y: number };
  width?: number; // custom size (undefined = use type default)
  height?: number; // custom size (undefined = use type default)
  dataField: string | null; // action only, metadata-only
  expectedOutcome: string | null; // result only, metadata-only
  comments: Comment[];
}

// ── Connection ────────────────────────────────────────────────────────────────

export type ConnectionType = "default" | "yes" | "no";

export interface Connection {
  id: string; // UUID v4
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  waypoints: Array<{ x: number; y: number }>;
  dataField: string | null; // test data / preconditions for this path
}

// ── Diagram file ──────────────────────────────────────────────────────────────

export type DirectionHint = "TD" | "LR" | "TB" | "BT" | "RL";

export interface DiagramFile {
  path: string;
  name: string;
  directionHint: DirectionHint;
  blocks: Map<string, Block>;
  connections: Map<string, Connection>;
  isDirty: boolean;
  lastSavedAt: Date | null;
  fileHandle: FileSystemFileHandle;
  metadataVersion: "1" | null;
  /** True when the file cannot be edited (unsupported diagram type, or >200 blocks). */
  isReadOnly?: boolean;
  /** Raw .mmd text preserved for read-only preview rendering. */
  rawMmd?: string;
}

// ── Snapshot (for undo/redo — no fileHandle / isDirty / lastSavedAt) ──────────

export interface DiagramSnapshot {
  blocks: Map<string, Block>;
  connections: Map<string, Connection>;
}

// ── Undo ──────────────────────────────────────────────────────────────────────

export type UndoableAction =
  | "addBlock"
  | "deleteBlock"
  | "moveBlock"
  | "resizeBlock"
  | "editLabel"
  | "addConnection"
  | "deleteConnection"
  | "changeConnectionType"
  | "addComment"
  | "deleteComment"
  | "editDataField"
  | "editConnectionDataField"
  | "editExpectedOutcome";

export interface UndoEntry {
  id: string;
  action: UndoableAction;
  before: DiagramSnapshot;
  after: DiagramSnapshot;
}

// ── File tree ─────────────────────────────────────────────────────────────────

export interface FileTreeNode {
  name: string;
  type: "folder" | "file";
  handle: FileSystemDirectoryHandle | FileSystemFileHandle;
  children?: FileTreeNode[]; // undefined = not yet loaded; [] = empty folder
}
