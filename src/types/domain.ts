/**
 * Core domain types for the MMD Flowchart editor.
 * Based on FO.md §2, §3 and §4.
 */

export type BlockType = "start" | "end" | "action" | "decision" | "result";

export interface Position {
  x: number;
  y: number;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
}

export interface Block {
  id: string;
  type: BlockType;
  label: string;
  position: Position;
  width: number;
  height: number;
  dataField: string | null;
  expectedOutcome: string | null;
  /** Decision-only: data/context per uitgaand pad. Voor andere bloktypen
   *  altijd `null`. Gepersisteerd via metadata zodat de gebruikersinhoud
   *  los staat van mermaid-syntax. */
  yesDataField: string | null;
  noDataField: string | null;
  comments: Comment[];
}

export type ConnectionKind = "default" | "yes" | "no";

export type HandleSide = "top" | "right" | "bottom" | "left";

export interface Connection {
  id: string;
  source: string;
  target: string;
  kind: ConnectionKind;
  label: string;
  /** Which side of the source block the wire leaves from. */
  sourceSide: HandleSide;
  /** Which side of the target block the wire enters. */
  targetSide: HandleSide;
}

export interface Diagram {
  blocks: Record<string, Block>;
  connections: Record<string, Connection>;
}

export interface DiagramFile {
  name: string;
  path: string;
  diagram: Diagram;
  readOnlyReason: ReadOnlyReason | null;
  rawContent: string;
  lastModified: number;
}

export type ReadOnlyReason =
  | { kind: "unsupported-type"; detected: string }
  | { kind: "too-many-blocks"; count: number };

export const MAX_BLOCKS_EDITABLE = 200;
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_DATAFIELD_LENGTH = 2000;
export const MAX_EDGE_LABEL_LENGTH = 50;
export const GRID_SIZE = 8;
export const UNDO_STACK_LIMIT = 100;
export const AUTOSAVE_DEBOUNCE_MS = 2000;
