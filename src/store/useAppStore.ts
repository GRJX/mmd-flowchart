import { create } from "zustand";
import type { DiagramFile, FileTreeNode, UndoEntry } from "../types/diagram";
import { readDirectoryEntries } from "../lib/fileSystem";
import { saveDirectoryHandle } from "../lib/indexedDb";

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

  // ── Canvas ────────────────────────────────────────────────────────────────
  canvasViewport: { x: number; y: number; zoom: number };
  setCanvasViewport: (vp: { x: number; y: number; zoom: number }) => void;

  // ── Selection ─────────────────────────────────────────────────────────────
  selection: Set<string>;
  setSelection: (ids: Set<string>) => void;
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

  // ── Canvas ────────────────────────────────────────────────────────────────
  canvasViewport: { x: 0, y: 0, zoom: 1 },
  setCanvasViewport: (vp) => set({ canvasViewport: vp }),

  // ── Selection ─────────────────────────────────────────────────────────────
  selection: new Set(),
  setSelection: (ids) => set({ selection: ids }),
}));
