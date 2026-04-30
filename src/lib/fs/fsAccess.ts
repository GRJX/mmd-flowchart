/**
 * File System Access API wrapper. The editor is browser-only, so all disk
 * I/O goes through this module. Callers never touch the raw handles.
 *
 * A "tree node" mirrors the on-disk layout: folders contain children
 * (folders + `.mmd` files), files carry their handle plus basic metadata.
 * The tree is rebuilt on demand — we don't try to track file-system events.
 */

export interface TreeFile {
  kind: "file";
  name: string;
  /** Slash-separated path relative to the root folder (e.g. "sub/foo.mmd"). */
  path: string;
  handle: FileSystemFileHandle;
}

export interface TreeFolder {
  kind: "folder";
  name: string;
  /** Slash-separated path relative to the root folder; empty string for root. */
  path: string;
  handle: FileSystemDirectoryHandle;
  children: TreeNode[];
}

export type TreeNode = TreeFile | TreeFolder;

const MMD_EXT = /\.mmd$/i;

export async function pickRootFolder(): Promise<FileSystemDirectoryHandle | null> {
  const w = window as unknown as {
    showDirectoryPicker?: (opts?: {
      mode?: "read" | "readwrite";
    }) => Promise<FileSystemDirectoryHandle>;
  };
  if (!w.showDirectoryPicker) return null;
  try {
    return await w.showDirectoryPicker({ mode: "readwrite" });
  } catch (err) {
    if ((err as Error).name === "AbortError") return null;
    throw err;
  }
}

/** Ensure we still have readwrite access; re-prompts if permission was
 *  revoked or downgraded between sessions. Returns true when access is
 *  granted. */
export async function ensureReadWrite(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const h = handle as FileSystemDirectoryHandle & {
    queryPermission?: (opts: {
      mode: "read" | "readwrite";
    }) => Promise<PermissionState>;
    requestPermission?: (opts: {
      mode: "read" | "readwrite";
    }) => Promise<PermissionState>;
  };
  if (!h.queryPermission || !h.requestPermission) return true;
  const q = await h.queryPermission({ mode: "readwrite" });
  if (q === "granted") return true;
  const r = await h.requestPermission({ mode: "readwrite" });
  return r === "granted";
}

/** Walk the tree and return it sorted (folders before files, alphabetical
 *  within each group). Only `.mmd` files are included. */
export async function buildTree(
  root: FileSystemDirectoryHandle,
): Promise<TreeFolder> {
  return walk(root, "", root.name);
}

async function walk(
  dir: FileSystemDirectoryHandle,
  relPath: string,
  displayName: string,
): Promise<TreeFolder> {
  const children: TreeNode[] = [];
  for await (const [name, entry] of (
    dir as unknown as AsyncIterable<[string, FileSystemHandle]>
  )) {
    if (entry.kind === "directory") {
      const child = await walk(
        entry as FileSystemDirectoryHandle,
        joinPath(relPath, name),
        name,
      );
      children.push(child);
    } else if (entry.kind === "file" && MMD_EXT.test(name)) {
      children.push({
        kind: "file",
        name,
        path: joinPath(relPath, name),
        handle: entry as FileSystemFileHandle,
      });
    }
  }
  children.sort(sortTreeNodes);
  return {
    kind: "folder",
    name: displayName,
    path: relPath,
    handle: dir,
    children,
  };
}

function sortTreeNodes(a: TreeNode, b: TreeNode): number {
  if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

function joinPath(parent: string, name: string): string {
  return parent ? `${parent}/${name}` : name;
}

export interface ReadResult {
  content: string;
  lastModified: number;
}

export async function readFile(handle: FileSystemFileHandle): Promise<ReadResult> {
  const file = await handle.getFile();
  return { content: await file.text(), lastModified: file.lastModified };
}

export async function writeFile(
  handle: FileSystemFileHandle,
  content: string,
): Promise<number> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
  const file = await handle.getFile();
  return file.lastModified;
}

export function findFileByPath(
  root: TreeFolder,
  path: string,
): TreeFile | null {
  if (!path) return null;
  const parts = path.split("/");
  let node: TreeNode = root;
  for (let i = 0; i < parts.length; i++) {
    if (node.kind !== "folder") return null;
    const next: TreeNode | undefined = node.children.find(
      (c) => c.name === parts[i],
    );
    if (!next) return null;
    node = next;
  }
  return node.kind === "file" ? node : null;
}

export function isFileSystemAccessSupported(): boolean {
  const w = window as unknown as { showDirectoryPicker?: unknown };
  return typeof w.showDirectoryPicker === "function";
}
