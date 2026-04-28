import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { getBlockConfig } from "@/config/blockConfig";
import { allocateBlockId, makeConnectionId } from "@/lib/ids";
import { snapPosition, isoNow } from "@/lib/utils";
import {
  UNDO_STACK_LIMIT,
  type Block,
  type BlockType,
  type Comment,
  type Connection,
  type ConnectionKind,
  type Diagram,
  type HandleSide,
  type Position,
  type ReadOnlyReason,
} from "@/types/domain";

/**
 * Central editor state. Keeps the full diagram in memory and manages
 * selection, "new" flags (for stems), undo/redo, and dirty tracking.
 */

/**
 * Selection is a set of block IDs and connection IDs. Both collections may
 * be non-empty at the same time (FO §8: right-panel view switches on the
 * total count — 0 or >1 ⇒ palette, exactly 1 block ⇒ block-properties,
 * exactly 1 connection ⇒ connection-properties).
 */
export interface Selection {
  blockIds: string[];
  connectionIds: string[];
}

const EMPTY_SELECTION: Selection = { blockIds: [], connectionIds: [] };

export type SelectionSummary =
  | { view: "palette" }
  | { view: "block"; blockId: string }
  | { view: "connection"; connectionId: string };

export function summarizeSelection(s: Selection): SelectionSummary {
  const total = s.blockIds.length + s.connectionIds.length;
  if (total === 1 && s.blockIds.length === 1) {
    return { view: "block", blockId: s.blockIds[0]! };
  }
  if (total === 1 && s.connectionIds.length === 1) {
    return { view: "connection", connectionId: s.connectionIds[0]! };
  }
  return { view: "palette" };
}

interface Snapshot {
  diagram: Diagram;
}

/**
 * Clipboard entry for copy/paste. Holds independent snapshots of the copied
 * blocks (and internal connections) so later edits to the originals — or
 * even deleting them — don't change what gets pasted.
 */
export interface ClipboardEntry {
  blocks: Block[];
  connections: Connection[];
}

export interface DiagramState {
  filePath: string | null;
  fileName: string | null;
  diagram: Diagram;
  selection: Selection;
  /** IDs of blocks that just appeared and should show a quick-add stem. */
  newBlockIds: Set<string>;
  isDirty: boolean;
  lastSavedAt: number | null;
  readOnlyReason: ReadOnlyReason | null;

  undoStack: Snapshot[];
  redoStack: Snapshot[];

  /** In-memory clipboard for Ctrl/Cmd+C / Ctrl/Cmd+V. Not persisted, not in
   *  undo history. `pasteCount` tracks how many times the current clipboard
   *  has been pasted so each paste lands a bit further from the originals. */
  clipboard: ClipboardEntry | null;
  pasteCount: number;

  /** ---- Loading ---- */
  loadDiagram: (args: {
    filePath: string | null;
    fileName: string | null;
    diagram: Diagram;
    readOnlyReason: ReadOnlyReason | null;
    lastSavedAt: number | null;
  }) => void;
  clear: () => void;
  markSaved: (ts: number) => void;
  /** Update filePath/fileName without touching the diagram (used after a
   *  move in the file tree). */
  retargetOpenFile: (newPath: string) => void;

  /** ---- Selection ---- */
  setSelection: (sel: Selection) => void;
  selectBlock: (id: string, additive?: boolean) => void;
  selectConnection: (id: string, additive?: boolean) => void;
  setBlockSelection: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;

  /** ---- Block mutations ---- */
  addBlock: (args: {
    type: BlockType;
    position: Position;
    markAsNew?: boolean;
    label?: string;
  }) => string | null;
  removeBlocks: (ids: string[]) => void;
  /** Duplicate the given blocks (skip singletons). Connections whose both
   *  endpoints are in `ids` are duplicated too. Returns the new block IDs. */
  duplicateBlocks: (ids: string[]) => string[];
  /** Snapshot the current block selection (and internal connections) into
   *  the clipboard. Returns true when at least one block was copied. */
  copySelection: () => boolean;
  /** Paste the clipboard. Each call increments `pasteCount` so successive
   *  pastes are offset further from the originals. Returns the new IDs. */
  paste: () => string[];
  moveBlocks: (moves: { id: string; position: Position }[]) => void;
  setBlockPositionLive: (id: string, position: Position) => void;
  setBlockLabel: (id: string, label: string) => void;
  setBlockSize: (id: string, size: { width: number; height: number }) => void;
  setBlockDataField: (id: string, value: string | null) => void;
  setBlockExpectedOutcome: (id: string, value: string | null) => void;
  /** Decision-only — data/context bij het Y- of N-pad. */
  setBlockYesDataField: (id: string, value: string | null) => void;
  setBlockNoDataField: (id: string, value: string | null) => void;
  clearNewFlag: (id: string) => void;

  /** ---- Connection mutations ---- */
  addConnection: (args: {
    source: string;
    target: string;
    kind?: ConnectionKind;
    label?: string;
    sourceSide?: HandleSide;
    targetSide?: HandleSide;
  }) => string | null;
  removeConnection: (id: string) => void;
  reconnectConnection: (args: {
    oldId: string;
    source: string;
    target: string;
    sourceSide?: HandleSide;
    targetSide?: HandleSide;
  }) => string | null;
  setConnectionLabel: (id: string, label: string) => void;

  /** ---- Comments ---- */
  addComment: (blockId: string, text: string) => void;
  removeComment: (blockId: string, commentId: string) => void;

  /** ---- Undo / redo ---- */
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const EMPTY_DIAGRAM: Diagram = { blocks: {}, connections: {} };

function cloneDiagram(d: Diagram): Diagram {
  return {
    blocks: Object.fromEntries(
      Object.entries(d.blocks).map(([id, b]) => [
        id,
        {
          ...b,
          position: { ...b.position },
          comments: b.comments.map((c) => ({ ...c })),
        },
      ]),
    ),
    connections: Object.fromEntries(
      Object.entries(d.connections).map(([id, c]) => [id, { ...c }]),
    ),
  };
}

export const useDiagramStore = create<DiagramState>((set, get) => {
  function pushHistory() {
    const { diagram, undoStack } = get();
    const next = [...undoStack, { diagram: cloneDiagram(diagram) }];
    while (next.length > UNDO_STACK_LIMIT) next.shift();
    set({ undoStack: next, redoStack: [] });
  }

  function mutateWithHistory(mutator: () => Diagram | void) {
    const prevDiagram = get().diagram;
    pushHistory();
    const result = mutator();
    const nextDiagram = result ?? get().diagram;
    set({
      diagram: nextDiagram,
      isDirty: nextDiagram !== prevDiagram ? true : get().isDirty,
    });
  }

  return {
    filePath: null,
    fileName: null,
    diagram: EMPTY_DIAGRAM,
    selection: EMPTY_SELECTION,
    newBlockIds: new Set(),
    isDirty: false,
    lastSavedAt: null,
    readOnlyReason: null,
    undoStack: [],
    redoStack: [],
    clipboard: null,
    pasteCount: 0,

    loadDiagram: ({ filePath, fileName, diagram, readOnlyReason, lastSavedAt }) => {
      set({
        filePath,
        fileName,
        diagram,
        readOnlyReason,
        selection: EMPTY_SELECTION,
        newBlockIds: new Set(),
        isDirty: false,
        lastSavedAt,
        undoStack: [],
        redoStack: [],
        clipboard: null,
        pasteCount: 0,
      });
    },

    clear: () => {
      set({
        filePath: null,
        fileName: null,
        diagram: EMPTY_DIAGRAM,
        readOnlyReason: null,
        selection: EMPTY_SELECTION,
        newBlockIds: new Set(),
        isDirty: false,
        lastSavedAt: null,
        undoStack: [],
        redoStack: [],
        clipboard: null,
        pasteCount: 0,
      });
    },

    markSaved: (ts) => set({ isDirty: false, lastSavedAt: ts }),

    retargetOpenFile: (newPath) => {
      const name = newPath.split("/").pop() ?? newPath;
      set({ filePath: newPath, fileName: name });
    },

    setSelection: (sel) => set({ selection: sel }),
    selectBlock: (id, additive) => {
      const { selection } = get();
      if (additive) {
        const ids = new Set(selection.blockIds);
        if (ids.has(id)) ids.delete(id);
        else ids.add(id);
        set({
          selection: { blockIds: [...ids], connectionIds: selection.connectionIds },
        });
        return;
      }
      set({ selection: { blockIds: [id], connectionIds: [] } });
    },
    selectConnection: (id, additive) => {
      const { selection } = get();
      if (additive) {
        const ids = new Set(selection.connectionIds);
        if (ids.has(id)) ids.delete(id);
        else ids.add(id);
        set({
          selection: { blockIds: selection.blockIds, connectionIds: [...ids] },
        });
        return;
      }
      set({ selection: { blockIds: [], connectionIds: [id] } });
    },
    setBlockSelection: (ids) => {
      set({
        selection: {
          blockIds: [...new Set(ids)],
          connectionIds: get().selection.connectionIds,
        },
      });
    },
    clearSelection: () => set({ selection: EMPTY_SELECTION }),
    selectAll: () => {
      const blockIds = Object.keys(get().diagram.blocks);
      const connectionIds = Object.keys(get().diagram.connections);
      set({ selection: { blockIds, connectionIds } });
    },

    addBlock: ({ type, position, markAsNew, label }) => {
      const cfg = getBlockConfig(type);
      const { diagram } = get();
      if (cfg.singleton && diagram.blocks[cfg.idPrefix]) return null;

      const id = allocateBlockId(type, diagram.blocks);
      const snapped = snapPosition(position);

      const block: Block = {
        id,
        type,
        label: label ?? cfg.defaultLabel,
        position: snapped,
        width: cfg.defaultSize.width,
        height: cfg.defaultSize.height,
        dataField: null,
        expectedOutcome: null,
        yesDataField: null,
        noDataField: null,
        comments: [],
      };

      mutateWithHistory(() => ({
        ...diagram,
        blocks: { ...diagram.blocks, [id]: block },
      }));

      if (markAsNew) {
        const nb = new Set(get().newBlockIds);
        nb.add(id);
        set({ newBlockIds: nb });
      }
      return id;
    },

    removeBlocks: (ids) => {
      if (!ids.length) return;
      mutateWithHistory(() => {
        const { diagram } = get();
        const blocks = { ...diagram.blocks };
        const connections = { ...diagram.connections };
        for (const id of ids) delete blocks[id];
        for (const c of Object.values(connections)) {
          if (ids.includes(c.source) || ids.includes(c.target)) {
            delete connections[c.id];
          }
        }
        return { blocks, connections };
      });

      const nb = new Set(get().newBlockIds);
      for (const id of ids) nb.delete(id);
      // Keep any edge selections the user had; drop the deleted blocks.
      const { selection } = get();
      set({
        newBlockIds: nb,
        selection: {
          blockIds: selection.blockIds.filter((bId) => !ids.includes(bId)),
          connectionIds: selection.connectionIds,
        },
      });
    },

    duplicateBlocks: (ids) => {
      if (!ids.length) return [];
      const { diagram } = get();

      const sources: Block[] = [];
      for (const id of ids) {
        const b = diagram.blocks[id];
        if (!b) continue;
        if (getBlockConfig(b.type).singleton) continue;
        sources.push(b);
      }
      if (!sources.length) return [];

      const idMap = new Map<string, string>();
      const workingBlocks: Record<string, Block> = { ...diagram.blocks };
      const newBlocks: Block[] = [];
      const OFFSET = 24;
      for (const b of sources) {
        const newId = allocateBlockId(b.type, workingBlocks);
        const cloned: Block = {
          ...b,
          id: newId,
          position: snapPosition({ x: b.position.x + OFFSET, y: b.position.y + OFFSET }),
          comments: b.comments.map((c) => ({ ...c, id: uuid() })),
        };
        workingBlocks[newId] = cloned;
        newBlocks.push(cloned);
        idMap.set(b.id, newId);
      }

      const newConnections: Record<string, Connection> = {};
      for (const c of Object.values(diagram.connections)) {
        const ns = idMap.get(c.source);
        const nt = idMap.get(c.target);
        if (!ns || !nt) continue;
        const newId = makeConnectionId(ns, nt, c.kind);
        newConnections[newId] = { ...c, id: newId, source: ns, target: nt };
      }

      pushHistory();
      set({
        diagram: {
          blocks: workingBlocks,
          connections: { ...diagram.connections, ...newConnections },
        },
        isDirty: true,
        selection: {
          blockIds: newBlocks.map((b) => b.id),
          connectionIds: [],
        },
      });

      return newBlocks.map((b) => b.id);
    },

    copySelection: () => {
      const { diagram, selection } = get();
      const ids = selection.blockIds;
      if (!ids.length) return false;

      const idSet = new Set<string>();
      const blocks: Block[] = [];
      for (const id of ids) {
        const b = diagram.blocks[id];
        if (!b) continue;
        if (getBlockConfig(b.type).singleton) continue;
        idSet.add(id);
        blocks.push({
          ...b,
          position: { ...b.position },
          comments: b.comments.map((c) => ({ ...c })),
        });
      }
      if (!blocks.length) return false;

      const connections: Connection[] = [];
      for (const c of Object.values(diagram.connections)) {
        if (idSet.has(c.source) && idSet.has(c.target)) {
          connections.push({ ...c });
        }
      }

      set({ clipboard: { blocks, connections }, pasteCount: 0 });
      return true;
    },

    paste: () => {
      const { clipboard, pasteCount, diagram } = get();
      if (!clipboard || !clipboard.blocks.length) return [];

      const nextCount = pasteCount + 1;
      const offset = 24 * nextCount;

      const idMap = new Map<string, string>();
      const workingBlocks: Record<string, Block> = { ...diagram.blocks };
      const newBlocks: Block[] = [];
      for (const b of clipboard.blocks) {
        if (getBlockConfig(b.type).singleton) continue;
        const newId = allocateBlockId(b.type, workingBlocks);
        const cloned: Block = {
          ...b,
          id: newId,
          position: snapPosition({ x: b.position.x + offset, y: b.position.y + offset }),
          comments: b.comments.map((c) => ({ ...c, id: uuid() })),
        };
        workingBlocks[newId] = cloned;
        newBlocks.push(cloned);
        idMap.set(b.id, newId);
      }
      if (!newBlocks.length) return [];

      const newConnections: Record<string, Connection> = {};
      for (const c of clipboard.connections) {
        const ns = idMap.get(c.source);
        const nt = idMap.get(c.target);
        if (!ns || !nt) continue;
        const newId = makeConnectionId(ns, nt, c.kind);
        newConnections[newId] = { ...c, id: newId, source: ns, target: nt };
      }

      pushHistory();
      set({
        diagram: {
          blocks: workingBlocks,
          connections: { ...diagram.connections, ...newConnections },
        },
        isDirty: true,
        pasteCount: nextCount,
        selection: {
          blockIds: newBlocks.map((b) => b.id),
          connectionIds: [],
        },
      });

      return newBlocks.map((b) => b.id);
    },

    moveBlocks: (moves) => {
      if (!moves.length) return;
      mutateWithHistory(() => {
        const { diagram } = get();
        const blocks = { ...diagram.blocks };
        for (const { id, position } of moves) {
          const b = blocks[id];
          if (!b) continue;
          blocks[id] = { ...b, position: snapPosition(position) };
        }
        return { ...diagram, blocks };
      });
    },

    // Non-history; used for react-flow drag preview
    setBlockPositionLive: (id, position) => {
      const { diagram } = get();
      const b = diagram.blocks[id];
      if (!b) return;
      set({
        diagram: {
          ...diagram,
          blocks: { ...diagram.blocks, [id]: { ...b, position } },
        },
      });
    },

    setBlockLabel: (id, label) => {
      const { diagram } = get();
      const b = diagram.blocks[id];
      if (!b) return;
      if (b.label === label) return;
      const cfg = getBlockConfig(b.type);
      if (!cfg.labelEditable) return;
      mutateWithHistory(() => ({
        ...diagram,
        blocks: { ...diagram.blocks, [id]: { ...b, label } },
      }));
    },

    setBlockSize: (id, size) => {
      const { diagram } = get();
      const b = diagram.blocks[id];
      if (!b) return;
      if (b.width === size.width && b.height === size.height) return;
      set({
        diagram: {
          ...diagram,
          blocks: { ...diagram.blocks, [id]: { ...b, ...size } },
        },
      });
    },

    setBlockDataField: (id, value) => {
      const { diagram } = get();
      const b = diagram.blocks[id];
      if (!b) return;
      if (b.dataField === value) return;
      mutateWithHistory(() => ({
        ...diagram,
        blocks: { ...diagram.blocks, [id]: { ...b, dataField: value } },
      }));
    },

    setBlockExpectedOutcome: (id, value) => {
      const { diagram } = get();
      const b = diagram.blocks[id];
      if (!b) return;
      if (b.expectedOutcome === value) return;
      mutateWithHistory(() => ({
        ...diagram,
        blocks: { ...diagram.blocks, [id]: { ...b, expectedOutcome: value } },
      }));
    },

    setBlockYesDataField: (id, value) => {
      const { diagram } = get();
      const b = diagram.blocks[id];
      if (!b || b.type !== "decision") return;
      if (b.yesDataField === value) return;
      mutateWithHistory(() => ({
        ...diagram,
        blocks: { ...diagram.blocks, [id]: { ...b, yesDataField: value } },
      }));
    },

    setBlockNoDataField: (id, value) => {
      const { diagram } = get();
      const b = diagram.blocks[id];
      if (!b || b.type !== "decision") return;
      if (b.noDataField === value) return;
      mutateWithHistory(() => ({
        ...diagram,
        blocks: { ...diagram.blocks, [id]: { ...b, noDataField: value } },
      }));
    },

    clearNewFlag: (id) => {
      const nb = new Set(get().newBlockIds);
      if (!nb.has(id)) return;
      nb.delete(id);
      set({ newBlockIds: nb });
    },

    addConnection: ({ source, target, kind, label, sourceSide, targetSide }) => {
      if (source === target) return null; // no self-loops
      const { diagram } = get();
      const src = diagram.blocks[source];
      const tgt = diagram.blocks[target];
      if (!src || !tgt) return null;

      const srcCfg = getBlockConfig(src.type);
      const tgtCfg = getBlockConfig(tgt.type);
      if (srcCfg.maxOutputs === 0) return null;
      if (tgtCfg.maxInputs === 0) return null;

      // Default side choices follow the config. Decision picks right (Y) vs
      // bottom (N) based on the kind; others default to bottom/top.
      const effSourceSide: HandleSide =
        sourceSide ??
        (src.type === "decision" && kind === "yes"
          ? "right"
          : src.type === "decision" && kind === "no"
            ? "bottom"
            : (srcCfg.outgoingHandles[0] ?? "bottom"));
      const effTargetSide: HandleSide =
        targetSide ?? (tgtCfg.incomingSides.includes("top") ? "top" : (tgtCfg.incomingSides[0] ?? "top"));

      // Derive kind from the source side if the caller didn't specify it.
      const effKind: ConnectionKind =
        kind ??
        (src.type === "decision"
          ? effSourceSide === "bottom"
            ? "no"
            : effSourceSide === "right" || effSourceSide === "left"
              ? "yes"
              : "default"
          : (srcCfg.outgoingKindByHandle?.[effSourceSide] ?? "default"));

      const id = makeConnectionId(source, target, effKind);
      if (diagram.connections[id]) return null;

      // Decision with Y/N: only one of each kind allowed — redirect.
      const nextConns = { ...diagram.connections };
      if (src.type === "decision" && (effKind === "yes" || effKind === "no")) {
        for (const c of Object.values(nextConns)) {
          if (c.source === source && c.kind === effKind) {
            delete nextConns[c.id];
          }
        }
      }

      // Enforce max outputs on source.
      if (srcCfg.maxOutputs !== null) {
        const outgoing = Object.values(nextConns).filter((c) => c.source === source);
        if (outgoing.length >= srcCfg.maxOutputs) {
          // Allowed to exceed only if we're redirecting a Y/N slot (already handled).
          if (src.type !== "decision") return null;
        }
      }
      if (tgtCfg.maxInputs !== null) {
        const incoming = Object.values(nextConns).filter((c) => c.target === target);
        if (incoming.length >= tgtCfg.maxInputs) return null;
      }

      const autoLabel =
        label ??
        (src.type === "decision" && effKind === "yes"
          ? "Y"
          : src.type === "decision" && effKind === "no"
            ? "N"
            : "");

      const conn: Connection = {
        id,
        source,
        target,
        kind: effKind,
        label: autoLabel,
        sourceSide: effSourceSide,
        targetSide: effTargetSide,
      };

      pushHistory();
      set({
        diagram: {
          ...diagram,
          connections: { ...nextConns, [id]: conn },
        },
        isDirty: true,
      });
      return id;
    },

    removeConnection: (id) => {
      const { diagram } = get();
      if (!diagram.connections[id]) return;
      mutateWithHistory(() => {
        const connections = { ...diagram.connections };
        delete connections[id];
        return { ...diagram, connections };
      });
      const { selection } = get();
      if (selection.connectionIds.includes(id)) {
        set({
          selection: {
            blockIds: selection.blockIds,
            connectionIds: selection.connectionIds.filter((cId) => cId !== id),
          },
        });
      }
    },

    reconnectConnection: ({ oldId, source, target, sourceSide, targetSide }) => {
      if (source === target) return null;
      const { diagram } = get();
      const old = diagram.connections[oldId];
      if (!old) return null;
      const src = diagram.blocks[source];
      const tgt = diagram.blocks[target];
      if (!src || !tgt) return null;
      const srcCfg = getBlockConfig(src.type);
      const tgtCfg = getBlockConfig(tgt.type);
      if (srcCfg.maxOutputs === 0) return null;
      if (tgtCfg.maxInputs === 0) return null;

      const effSourceSide: HandleSide =
        sourceSide ?? (src.id === old.source ? old.sourceSide : (srcCfg.outgoingHandles[0] ?? "bottom"));
      const effTargetSide: HandleSide =
        targetSide ?? (tgt.id === old.target ? old.targetSide : (tgtCfg.incomingSides.includes("top") ? "top" : (tgtCfg.incomingSides[0] ?? "top")));

      const effKind: ConnectionKind =
        src.type === "decision"
          ? effSourceSide === "bottom"
            ? "no"
            : effSourceSide === "right" || effSourceSide === "left"
              ? "yes"
              : "default"
          : (srcCfg.outgoingKindByHandle?.[effSourceSide] ?? "default");

      const newId = makeConnectionId(source, target, effKind);

      const nextConns = { ...diagram.connections };
      delete nextConns[oldId];

      if (newId !== oldId && nextConns[newId]) {
        // would collide with an existing edge; bail out and keep old
        return null;
      }

      if (src.type === "decision" && (effKind === "yes" || effKind === "no")) {
        for (const c of Object.values(nextConns)) {
          if (c.id === newId) continue;
          if (c.source === source && c.kind === effKind) {
            delete nextConns[c.id];
          }
        }
      }

      if (srcCfg.maxOutputs !== null) {
        const outgoing = Object.values(nextConns).filter((c) => c.source === source);
        if (outgoing.length >= srcCfg.maxOutputs && src.type !== "decision") return null;
      }
      if (tgtCfg.maxInputs !== null) {
        const incoming = Object.values(nextConns).filter((c) => c.target === target);
        if (incoming.length >= tgtCfg.maxInputs) return null;
      }

      let nextLabel = old.label;
      if (src.type === "decision") {
        const wasAutoY = old.kind === "yes" && old.label === "Y";
        const wasAutoN = old.kind === "no" && old.label === "N";
        if (effKind === "yes" && (wasAutoN || !old.label)) nextLabel = "Y";
        else if (effKind === "no" && (wasAutoY || !old.label)) nextLabel = "N";
      }

      const conn: Connection = {
        id: newId,
        source,
        target,
        kind: effKind,
        label: nextLabel,
        sourceSide: effSourceSide,
        targetSide: effTargetSide,
      };

      pushHistory();
      set({
        diagram: {
          ...diagram,
          connections: { ...nextConns, [newId]: conn },
        },
        isDirty: true,
      });

      const { selection } = get();
      if (newId !== oldId && selection.connectionIds.includes(oldId)) {
        set({
          selection: {
            blockIds: selection.blockIds,
            connectionIds: selection.connectionIds.map((cId) => (cId === oldId ? newId : cId)),
          },
        });
      }

      return newId;
    },

    setConnectionLabel: (id, label) => {
      const { diagram } = get();
      const c = diagram.connections[id];
      if (!c || c.label === label) return;
      mutateWithHistory(() => ({
        ...diagram,
        connections: { ...diagram.connections, [id]: { ...c, label } },
      }));
    },

    addComment: (blockId, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const { diagram } = get();
      const b = diagram.blocks[blockId];
      if (!b) return;
      const comment: Comment = { id: uuid(), text: trimmed, timestamp: isoNow() };
      mutateWithHistory(() => ({
        ...diagram,
        blocks: {
          ...diagram.blocks,
          [blockId]: { ...b, comments: [...b.comments, comment] },
        },
      }));
    },

    removeComment: (blockId, commentId) => {
      const { diagram } = get();
      const b = diagram.blocks[blockId];
      if (!b) return;
      if (!b.comments.some((c) => c.id === commentId)) return;
      mutateWithHistory(() => ({
        ...diagram,
        blocks: {
          ...diagram.blocks,
          [blockId]: {
            ...b,
            comments: b.comments.filter((c) => c.id !== commentId),
          },
        },
      }));
    },

    undo: () => {
      const { undoStack, diagram, redoStack } = get();
      if (!undoStack.length) return;
      const last = undoStack[undoStack.length - 1]!;
      set({
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, { diagram: cloneDiagram(diagram) }],
        diagram: last.diagram,
        isDirty: true,
        selection: EMPTY_SELECTION,
      });
    },
    redo: () => {
      const { redoStack, diagram, undoStack } = get();
      if (!redoStack.length) return;
      const last = redoStack[redoStack.length - 1]!;
      set({
        redoStack: redoStack.slice(0, -1),
        undoStack: [...undoStack, { diagram: cloneDiagram(diagram) }],
        diagram: last.diagram,
        isDirty: true,
        selection: EMPTY_SELECTION,
      });
    },
    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,
  };
});

