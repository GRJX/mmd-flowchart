import { create } from "zustand";
import type {
  Comment,
  ConnectionType,
  DiagramFile,
  DiagramSnapshot,
  FileTreeNode,
  UndoEntry,
  UndoableAction,
  BlockType,
  Connection,
} from "../types/diagram";
import { readDirectoryEntries } from "../lib/fileSystem";
import { saveDirectoryHandle } from "../lib/indexedDb";
import { createBlock } from "../lib/blockFactory";

// ── Undo/redo helpers (module-level) ─────────────────────────────────────────

function takeSnapshot(diagram: DiagramFile): DiagramSnapshot {
  return {
    blocks: structuredClone(diagram.blocks),
    connections: structuredClone(diagram.connections),
  };
}

const MAX_UNDO = 100;

// Nudge coalesce state — module-level so timer survives renders
let _nudgeTimer: ReturnType<typeof setTimeout> | null = null;
let _nudgeBefore: DiagramSnapshot | null = null;

// ── Toast ──────────────────────────────────────────────────────────────────────

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

// ── Theme ──────────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark";

const THEME_KEY = "mmd-theme";

function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage not available
  }
  return "dark";
}

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

// ── Store interface ────────────────────────────────────────────────────────────

interface AppStore {
  // ── Theme ──────────────────────────────────────────────────────────────────
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // ── Toast ──────────────────────────────────────────────────────────────────
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant) => void;
  removeToast: (id: string) => void;

  // ── File system ───────────────────────────────────────────────────────────
  directoryHandle: FileSystemDirectoryHandle | null;
  fileTree: FileTreeNode[];
  selectedFolderHandle: FileSystemDirectoryHandle | null;
  setDirectoryHandle: (handle: FileSystemDirectoryHandle) => Promise<void>;
  expandFolder: (node: FileTreeNode) => Promise<void>;
  refreshFileTree: () => Promise<void>;
  setSelectedFolderHandle: (handle: FileSystemDirectoryHandle | null) => void;

  // ── Active diagram ────────────────────────────────────────────────────────
  diagram: DiagramFile | null;
  setDiagram: (diagram: DiagramFile | null) => void;
  setDiagramDirty: (dirty: boolean) => void;

  // ── Undo/redo ─────────────────────────────────────────────────────────────
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
  pushUndo: (
    action: import("../types/diagram").UndoableAction,
    before: import("../types/diagram").DiagramSnapshot,
    after: import("../types/diagram").DiagramSnapshot,
  ) => void;
  undo: () => void;
  redo: () => void;
  /** Nudge selected blocks by dx/dy px; coalesces entries within 300 ms. */
  nudgeSelectedBlocks: (dx: number, dy: number) => void;

  // ── Canvas ────────────────────────────────────────────────────────────────
  canvasViewport: { x: number; y: number; zoom: number };
  setCanvasViewport: (vp: { x: number; y: number; zoom: number }) => void;

  // ── Selection ─────────────────────────────────────────────────────────────
  selection: Set<string>;
  setSelection: (ids: Set<string>) => void;

  // ── Connection selection (from RF edge selection) ─────────────────────────
  selectedConnectionId: string | null;
  setSelectedConnectionId: (id: string | null) => void;

  // ── Comment panel ─────────────────────────────────────────────────────────
  commentPanelBlockId: string | null;
  openCommentPanel: (blockId: string) => void;
  closeCommentPanel: () => void;

  // ── Block mutations ───────────────────────────────────────────────────────
  addBlock: (
    type: BlockType,
    position: { x: number; y: number },
  ) => string | null;
  deleteBlock: (id: string) => void;
  deleteBlocks: (ids: string[]) => void;
  updateBlockLabel: (id: string, label: string) => void;
  updateBlockPosition: (id: string, position: { x: number; y: number }) => void;
  moveBlocks: (
    moves: Array<{ id: string; position: { x: number; y: number } }>,
  ) => void;
  updateBlockDataField: (id: string, value: string | null) => void;
  updateBlockExpectedOutcome: (id: string, value: string | null) => void;
  addComment: (blockId: string, text: string) => void;
  deleteComment: (blockId: string, commentId: string) => void;

  // ── Connection mutations ──────────────────────────────────────────────────
  addConnection: (
    sourceId: string,
    targetId: string,
    type: ConnectionType,
  ) => string | null;
  deleteConnection: (id: string) => void;
  updateConnectionType: (id: string, type: ConnectionType) => void;
  updateConnectionWaypoints: (
    id: string,
    waypoints: Array<{ x: number; y: number }>,
  ) => void;
}

// ── Store implementation ───────────────────────────────────────────────────────

const initialTheme = loadTheme();
applyTheme(initialTheme);

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Theme ──────────────────────────────────────────────────────────────────
  theme: initialTheme,

  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  // ── Toast ──────────────────────────────────────────────────────────────────
  toasts: [],

  addToast: (message, variant = "info") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    // Auto-dismiss after 4 s
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ── File system ───────────────────────────────────────────────────────────
  directoryHandle: null,
  fileTree: [],
  selectedFolderHandle: null,

  setDirectoryHandle: async (handle) => {
    await saveDirectoryHandle(handle);
    const tree = await readDirectoryEntries(handle);
    set({
      directoryHandle: handle,
      fileTree: tree,
      selectedFolderHandle: null,
    });
  },

  expandFolder: async (node) => {
    if (node.type !== "folder") return;
    const children = await readDirectoryEntries(
      node.handle as FileSystemDirectoryHandle,
    );
    node.children = children;

    // Trigger re-render by replacing fileTree reference
    set((s) => ({ fileTree: [...s.fileTree] }));
  },

  refreshFileTree: async () => {
    const { directoryHandle } = get();
    if (!directoryHandle) return;
    const tree = await readDirectoryEntries(directoryHandle);
    set({ fileTree: tree });
  },

  setSelectedFolderHandle: (handle) => set({ selectedFolderHandle: handle }),

  // ── Active diagram ────────────────────────────────────────────────────────
  diagram: null,

  setDiagram: (diagram) =>
    set({ diagram, undoStack: [], redoStack: [], selection: new Set() }),

  setDiagramDirty: (dirty) =>
    set((s) =>
      s.diagram ? { diagram: { ...s.diagram, isDirty: dirty } } : {},
    ),

  // ── Undo/redo ─────────────────────────────────────────────────────────────
  undoStack: [],
  redoStack: [],

  pushUndo: (action: UndoableAction, before: DiagramSnapshot, after: DiagramSnapshot) => {
    const { undoStack } = get();
    const entry: UndoEntry = { id: crypto.randomUUID(), action, before, after };
    const newStack = [...undoStack, entry];
    if (newStack.length > MAX_UNDO) newStack.shift();
    set({ undoStack: newStack, redoStack: [] });
  },

  undo: () => {
    const { undoStack, redoStack, diagram } = get();
    if (!diagram || undoStack.length === 0) return;
    const entry = undoStack[undoStack.length - 1];
    set({
      diagram: {
        ...diagram,
        blocks: structuredClone(entry.before.blocks),
        connections: structuredClone(entry.before.connections),
        isDirty: true,
      },
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, entry],
    });
  },

  redo: () => {
    const { undoStack, redoStack, diagram } = get();
    if (!diagram || redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    set({
      diagram: {
        ...diagram,
        blocks: structuredClone(entry.after.blocks),
        connections: structuredClone(entry.after.connections),
        isDirty: true,
      },
      undoStack: [...undoStack, entry],
      redoStack: redoStack.slice(0, -1),
    });
  },

  nudgeSelectedBlocks: (dx: number, dy: number) => {
    const { diagram, selection } = get();
    if (!diagram || selection.size === 0) return;

    // Capture the before-snapshot on first keypress in the coalesce window
    if (!_nudgeBefore) {
      _nudgeBefore = takeSnapshot(diagram);
    }

    // Apply nudge
    const blocks = new Map(diagram.blocks);
    for (const id of selection) {
      const block = blocks.get(id);
      if (block) {
        blocks.set(id, {
          ...block,
          position: { x: block.position.x + dx, y: block.position.y + dy },
        });
      }
    }
    set({ diagram: { ...diagram, blocks, isDirty: true } });

    // Reset 300 ms coalesce timer
    if (_nudgeTimer) clearTimeout(_nudgeTimer);
    _nudgeTimer = setTimeout(() => {
      const currentDiagram = get().diagram;
      if (_nudgeBefore && currentDiagram) {
        get().pushUndo("moveBlock", _nudgeBefore, takeSnapshot(currentDiagram));
      }
      _nudgeBefore = null;
      _nudgeTimer = null;
    }, 300);
  },

  // ── Canvas ────────────────────────────────────────────────────────────────
  canvasViewport: { x: 0, y: 0, zoom: 1 },
  setCanvasViewport: (vp) => set({ canvasViewport: vp }),

  // ── Selection ─────────────────────────────────────────────────────────────
  selection: new Set(),
  setSelection: (ids) => {
    const update: Partial<AppStore> = { selection: ids }
    if (ids.size === 0) update.commentPanelBlockId = null
    set(update)
  },

  // ── Connection selection ────────────────────────────────────────────
  selectedConnectionId: null,
  setSelectedConnectionId: (id) => set({ selectedConnectionId: id }),

  // ── Comment panel ─────────────────────────────────────────────────
  commentPanelBlockId: null,
  openCommentPanel: (blockId) => set({ commentPanelBlockId: blockId }),
  closeCommentPanel: () => set({ commentPanelBlockId: null }),

  // ── Block mutations ───────────────────────────────────────────────────────
  addBlock: (type, position) => {
    const { diagram } = get();
    if (!diagram) return null;
    const before = takeSnapshot(diagram);
    const block = createBlock(type, position, diagram.blocks);
    const blocks = new Map(diagram.blocks);
    blocks.set(block.id, block);
    set({ diagram: { ...diagram, blocks, isDirty: true } });
    get().pushUndo("addBlock", before, takeSnapshot(get().diagram!));
    return block.id;
  },

  deleteBlock: (id) => {
    const { diagram } = get();
    if (!diagram) return;
    const before = takeSnapshot(diagram);
    const blocks = new Map(diagram.blocks);
    blocks.delete(id);
    // Drop all connections referencing this block
    const connections = new Map(diagram.connections);
    for (const [cid, conn] of connections) {
      if (conn.sourceId === id || conn.targetId === id) connections.delete(cid);
    }
    const selection = new Set(get().selection);
    selection.delete(id);
    set({
      diagram: { ...diagram, blocks, connections, isDirty: true },
      selection,
    });
    get().pushUndo("deleteBlock", before, takeSnapshot(get().diagram!));
  },

  deleteBlocks: (ids) => {
    const { diagram } = get();
    if (!diagram) return;
    const before = takeSnapshot(diagram);
    const idSet = new Set(ids);
    const blocks = new Map(diagram.blocks);
    const connections = new Map(diagram.connections);
    for (const id of idSet) blocks.delete(id);
    for (const [cid, conn] of connections) {
      if (idSet.has(conn.sourceId) || idSet.has(conn.targetId))
        connections.delete(cid);
    }
    const selection = new Set(get().selection);
    for (const id of idSet) selection.delete(id);
    set({
      diagram: { ...diagram, blocks, connections, isDirty: true },
      selection,
    });
    get().pushUndo("deleteBlock", before, takeSnapshot(get().diagram!));
  },

  updateBlockLabel: (id, label) => {
    const { diagram } = get();
    if (!diagram) return;
    const block = diagram.blocks.get(id);
    if (!block) return;
    const before = takeSnapshot(diagram);
    const blocks = new Map(diagram.blocks);
    blocks.set(id, { ...block, label });
    set({ diagram: { ...diagram, blocks, isDirty: true } });
    get().pushUndo("editLabel", before, takeSnapshot(get().diagram!));
  },

  updateBlockPosition: (id, position) => {
    const { diagram } = get();
    if (!diagram) return;
    const block = diagram.blocks.get(id);
    if (!block) return;
    const blocks = new Map(diagram.blocks);
    blocks.set(id, { ...block, position });
    set({ diagram: { ...diagram, blocks, isDirty: true } });
  },

  moveBlocks: (moves) => {
    const { diagram } = get();
    if (!diagram) return;
    const before = takeSnapshot(diagram);
    const blocks = new Map(diagram.blocks);
    for (const { id, position } of moves) {
      const block = blocks.get(id);
      if (block) blocks.set(id, { ...block, position });
    }
    set({ diagram: { ...diagram, blocks, isDirty: true } });
    get().pushUndo("moveBlock", before, takeSnapshot(get().diagram!));
  },

  updateBlockDataField: (id, value) => {
    const { diagram } = get();
    if (!diagram) return;
    const block = diagram.blocks.get(id);
    if (!block) return;
    const before = takeSnapshot(diagram);
    const blocks = new Map(diagram.blocks);
    blocks.set(id, { ...block, dataField: value });
    set({ diagram: { ...diagram, blocks, isDirty: true } });
    get().pushUndo("editDataField", before, takeSnapshot(get().diagram!));
  },

  updateBlockExpectedOutcome: (id, value) => {
    const { diagram } = get();
    if (!diagram) return;
    const block = diagram.blocks.get(id);
    if (!block) return;
    const before = takeSnapshot(diagram);
    const blocks = new Map(diagram.blocks);
    blocks.set(id, { ...block, expectedOutcome: value });
    set({ diagram: { ...diagram, blocks, isDirty: true } });
    get().pushUndo("editExpectedOutcome", before, takeSnapshot(get().diagram!));
  },

  addComment: (blockId, text) => {
    const { diagram } = get();
    if (!diagram) return;
    const block = diagram.blocks.get(blockId);
    if (!block) return;
    const before = takeSnapshot(diagram);
    const comment: Comment = {
      id: crypto.randomUUID(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const blocks = new Map(diagram.blocks);
    blocks.set(blockId, { ...block, comments: [...block.comments, comment] });
    set({ diagram: { ...diagram, blocks, isDirty: true } });
    get().pushUndo("addComment", before, takeSnapshot(get().diagram!));
  },

  deleteComment: (blockId, commentId) => {
    const { diagram } = get();
    if (!diagram) return;
    const block = diagram.blocks.get(blockId);
    if (!block) return;
    const before = takeSnapshot(diagram);
    const blocks = new Map(diagram.blocks);
    blocks.set(blockId, {
      ...block,
      comments: block.comments.filter((c) => c.id !== commentId),
    });
    set({ diagram: { ...diagram, blocks, isDirty: true } });
    get().pushUndo("deleteComment", before, takeSnapshot(get().diagram!));
  },

  // ── Connection mutations ───────────────────────────────────────────────────
  addConnection: (sourceId, targetId, type) => {
    const { diagram } = get();
    if (!diagram) return null;
    const before = takeSnapshot(diagram);
    const id = crypto.randomUUID();
    const connection: Connection = {
      id,
      sourceId,
      targetId,
      type,
      waypoints: [],
    };
    const connections = new Map(diagram.connections);
    connections.set(id, connection);
    set({ diagram: { ...diagram, connections, isDirty: true } });
    get().pushUndo("addConnection", before, takeSnapshot(get().diagram!));
    return id;
  },

  deleteConnection: (id) => {
    const { diagram } = get();
    if (!diagram) return;
    const before = takeSnapshot(diagram);
    const connections = new Map(diagram.connections);
    connections.delete(id);
    set({ diagram: { ...diagram, connections, isDirty: true } });
    get().pushUndo("deleteConnection", before, takeSnapshot(get().diagram!));
  },

  updateConnectionType: (id, type) => {
    const { diagram } = get();
    if (!diagram) return;
    const conn = diagram.connections.get(id);
    if (!conn) return;
    const before = takeSnapshot(diagram);
    const connections = new Map(diagram.connections);
    connections.set(id, { ...conn, type });
    set({ diagram: { ...diagram, connections, isDirty: true } });
    get().pushUndo("changeConnectionType", before, takeSnapshot(get().diagram!));
  },

  updateConnectionWaypoints: (id, waypoints) => {
    const { diagram } = get();
    if (!diagram) return;
    const conn = diagram.connections.get(id);
    if (!conn) return;
    const connections = new Map(diagram.connections);
    connections.set(id, { ...conn, waypoints });
    set({ diagram: { ...diagram, connections, isDirty: true } });
  },
}));
