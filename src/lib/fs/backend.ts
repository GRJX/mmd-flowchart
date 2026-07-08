/**
 * Disk I/O layer for the *browser* build: the File System Access API
 * wrapped behind a path-based interface (implementation in
 * `browserBackend.ts`). The app works with slash-separated relative paths
 * and the handle-free tree below; only the backend touches real handles.
 *
 * Inside VSCode this layer is not used at all — the extension host owns
 * the document and the file tree (VSCode explorer); see
 * `src/lib/vscode/bridge.ts`.
 */

import { createBrowserBackend } from "./browserBackend";

export interface TreeFile {
  kind: "file";
  name: string;
  /** Slash-separated path relative to the root folder (e.g. "sub/foo.mmd"). */
  path: string;
}

export interface TreeFolder {
  kind: "folder";
  name: string;
  /** Slash-separated path relative to the root folder; empty string for root. */
  path: string;
  children: TreeNode[];
}

export type TreeNode = TreeFile | TreeFolder;

export interface ReadResult {
  content: string;
  lastModified: number;
}

export type PickRootResult =
  /** A root folder is now available. */
  | "ok"
  /** User dismissed the picker; keep the previous state. */
  | "cancelled"
  /** User refused readwrite permission. */
  | "denied"
  /** Platform can't provide a folder picker (non-Chromium browser). */
  | "unavailable";

export interface FsBackend {
  /** Whether this platform can access a folder at all. */
  isSupported(): boolean;
  /** Interactively acquire a root folder via the folder picker. */
  pickRoot(): Promise<PickRootResult>;
  /** Silently restore a previously used root (no user gesture). */
  restoreRoot(): Promise<boolean>;
  /** Scan the root and return the `.mmd` tree, or null without a root. */
  buildTree(): Promise<TreeFolder | null>;
  readFile(path: string): Promise<ReadResult>;
  /** Write `content`; `create` allows creating a new file. Returns the
   *  file's new lastModified timestamp. */
  writeFile(
    path: string,
    content: string,
    opts?: { create?: boolean },
  ): Promise<number>;
  createFolder(path: string): Promise<void>;
  deleteNode(path: string, opts: { recursive: boolean }): Promise<void>;
  /** Move or rename a file/folder. `targetPath` is the full new path. */
  moveNode(sourcePath: string, targetPath: string): Promise<void>;
  statMtime(path: string): Promise<number>;
}

let cached: FsBackend | null = null;

export function getFsBackend(): FsBackend {
  if (!cached) cached = createBrowserBackend();
  return cached;
}
