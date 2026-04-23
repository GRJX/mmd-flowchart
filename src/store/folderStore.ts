import { create } from "zustand";
import type { TreeFolder } from "@/lib/fs/fsAccess";

/**
 * Folder and file-tree state. Kept separate from the diagram store because
 * the two have different lifecycles: opening a folder doesn't touch the
 * diagram; loading a file doesn't touch the folder handle.
 */

export type FolderStatus =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "permission-denied" }
  | { kind: "unsupported-browser" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

interface FolderState {
  root: TreeFolder | null;
  status: FolderStatus;
  /** Paths of expanded folders (slash-separated, relative to root). */
  expandedPaths: Set<string>;
  /** Path of the currently open file, if any. */
  currentFilePath: string | null;
  /** Whether the "New diagram" dialog is visible. */
  newDiagramDialogOpen: boolean;
  /** Target folder for the dialog (empty string = root). */
  newDiagramTargetFolder: string;

  setRoot: (root: TreeFolder | null) => void;
  setStatus: (status: FolderStatus) => void;
  setCurrentFilePath: (path: string | null) => void;
  toggleExpanded: (path: string) => void;
  expand: (path: string) => void;
  openNewDiagramDialog: (targetFolder?: string) => void;
  closeNewDiagramDialog: () => void;
}

export const useFolderStore = create<FolderState>((set) => ({
  root: null,
  status: { kind: "empty" },
  expandedPaths: new Set<string>(),
  currentFilePath: null,
  newDiagramDialogOpen: false,
  newDiagramTargetFolder: "",

  setRoot: (root) => set({ root }),
  setStatus: (status) => set({ status }),
  setCurrentFilePath: (path) => set({ currentFilePath: path }),
  openNewDiagramDialog: (targetFolder = "") =>
    set({ newDiagramDialogOpen: true, newDiagramTargetFolder: targetFolder }),
  closeNewDiagramDialog: () =>
    set({ newDiagramDialogOpen: false, newDiagramTargetFolder: "" }),
  toggleExpanded: (path) => {
    const next = new Set(useFolderStore.getState().expandedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    set({ expandedPaths: next });
  },
  expand: (path) => {
    const cur = useFolderStore.getState().expandedPaths;
    if (cur.has(path)) return;
    const next = new Set(cur);
    next.add(path);
    set({ expandedPaths: next });
  },
}));
