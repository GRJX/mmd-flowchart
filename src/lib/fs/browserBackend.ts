/**
 * Browser implementation of `FsBackend`, built on the File System Access
 * API (Chromium only). This module owns all `FileSystem*Handle` juggling:
 * during `buildTree()` it records a path → handle map so subsequent
 * path-based operations can resolve back to real handles. The tree handed
 * to the app is the handle-free mirror from `protocol.ts`.
 *
 * Moves and renames are copy + delete because `FileSystemHandle.move`
 * isn't universally available for directories yet.
 */

import type {
  FsBackend,
  PickRootResult,
  ReadResult,
  TreeFolder,
  TreeNode,
} from "./backend";
import {
  buildTree as buildHandleTree,
  ensureReadWrite,
  isFileSystemAccessSupported,
  pickRootFolder,
  readFile as readFileHandle,
  writeFile as writeFileHandle,
  type TreeNode as HandleNode,
} from "./fsAccess";
import { loadRootHandle, saveRootHandle } from "./handleStore";

export function createBrowserBackend(): FsBackend {
  let rootHandle: FileSystemDirectoryHandle | null = null;
  const fileHandles = new Map<string, FileSystemFileHandle>();
  const dirHandles = new Map<string, FileSystemDirectoryHandle>();

  function registerHandles(node: HandleNode): void {
    if (node.kind === "file") {
      fileHandles.set(node.path, node.handle);
    } else {
      dirHandles.set(node.path, node.handle);
      for (const child of node.children) registerHandles(child);
    }
  }

  function toPlain(node: HandleNode): TreeNode {
    if (node.kind === "file") {
      return { kind: "file", name: node.name, path: node.path };
    }
    return {
      kind: "folder",
      name: node.name,
      path: node.path,
      children: node.children.map(toPlain),
    };
  }

  function requireFileHandle(path: string): FileSystemFileHandle {
    const handle = fileHandles.get(path);
    if (!handle) throw new Error(`Bestand niet gevonden: ${path}`);
    return handle;
  }

  function requireDirHandle(path: string): FileSystemDirectoryHandle {
    const handle = dirHandles.get(path);
    if (!handle) throw new Error(`Map niet gevonden: ${path || "(root)"}`);
    return handle;
  }

  function splitPath(path: string): { parent: string; name: string } {
    const idx = path.lastIndexOf("/");
    if (idx === -1) return { parent: "", name: path };
    return { parent: path.substring(0, idx), name: path.substring(idx + 1) };
  }

  return {
    isSupported() {
      return isFileSystemAccessSupported();
    },

    async pickRoot(): Promise<PickRootResult> {
      if (!isFileSystemAccessSupported()) return "unavailable";
      const handle = await pickRootFolder();
      if (!handle) return "cancelled";
      const granted = await ensureReadWrite(handle);
      if (!granted) return "denied";
      rootHandle = handle;
      await saveRootHandle(handle);
      return "ok";
    },

    async restoreRoot(): Promise<boolean> {
      let handle: FileSystemDirectoryHandle | null = null;
      try {
        handle = await loadRootHandle();
      } catch {
        handle = null;
      }
      if (!handle) return false;

      const h = handle as FileSystemDirectoryHandle & {
        queryPermission?: (opts: {
          mode: "read" | "readwrite";
        }) => Promise<PermissionState>;
      };
      // We can't prompt without a user gesture. If access isn't already
      // granted, report failure and let the user click Open Folder again
      // (which triggers requestPermission inside a gesture).
      const state = h.queryPermission
        ? await h.queryPermission({ mode: "readwrite" })
        : "granted";
      if (state !== "granted") return false;

      rootHandle = handle;
      return true;
    },

    async buildTree(): Promise<TreeFolder | null> {
      if (!rootHandle) return null;
      const handleTree = await buildHandleTree(rootHandle);
      fileHandles.clear();
      dirHandles.clear();
      registerHandles(handleTree);
      return toPlain(handleTree) as TreeFolder;
    },

    async readFile(path: string): Promise<ReadResult> {
      return readFileHandle(requireFileHandle(path));
    },

    async writeFile(
      path: string,
      content: string,
      opts?: { create?: boolean },
    ): Promise<number> {
      let handle = fileHandles.get(path);
      if (!handle) {
        if (!opts?.create) throw new Error(`Bestand niet gevonden: ${path}`);
        const { parent, name } = splitPath(path);
        handle = await requireDirHandle(parent).getFileHandle(name, {
          create: true,
        });
        fileHandles.set(path, handle);
      }
      return writeFileHandle(handle, content);
    },

    async createFolder(path: string): Promise<void> {
      const { parent, name } = splitPath(path);
      const handle = await requireDirHandle(parent).getDirectoryHandle(name, {
        create: true,
      });
      dirHandles.set(path, handle);
    },

    async deleteNode(
      path: string,
      opts: { recursive: boolean },
    ): Promise<void> {
      const { parent, name } = splitPath(path);
      await requireDirHandle(parent).removeEntry(name, {
        recursive: opts.recursive,
      });
    },

    async moveNode(sourcePath: string, targetPath: string): Promise<void> {
      const source = splitPath(sourcePath);
      const target = splitPath(targetPath);
      const targetParent = requireDirHandle(target.parent);
      const sourceParent = requireDirHandle(source.parent);

      const fileHandle = fileHandles.get(sourcePath);
      if (fileHandle) {
        await copyFile(fileHandle, targetParent, target.name);
        await sourceParent.removeEntry(source.name);
        return;
      }
      const dirHandle = dirHandles.get(sourcePath);
      if (!dirHandle) throw new Error(`Niet gevonden: ${sourcePath}`);
      await copyFolder(dirHandle, targetParent, target.name);
      await sourceParent.removeEntry(source.name, { recursive: true });
    },

    async statMtime(path: string): Promise<number> {
      const file = await requireFileHandle(path).getFile();
      return file.lastModified;
    },
  };
}

async function copyFile(
  source: FileSystemFileHandle,
  targetParent: FileSystemDirectoryHandle,
  name: string,
): Promise<void> {
  const file = await source.getFile();
  const dest = await targetParent.getFileHandle(name, { create: true });
  const writable = await dest.createWritable();
  await writable.write(await file.arrayBuffer());
  await writable.close();
}

async function copyFolder(
  source: FileSystemDirectoryHandle,
  targetParent: FileSystemDirectoryHandle,
  name: string,
): Promise<void> {
  const destFolder = await targetParent.getDirectoryHandle(name, {
    create: true,
  });
  for await (const [childName, entry] of source as unknown as AsyncIterable<
    [string, FileSystemHandle]
  >) {
    if (entry.kind === "file") {
      await copyFile(entry as FileSystemFileHandle, destFolder, childName);
    } else {
      await copyFolder(
        entry as FileSystemDirectoryHandle,
        destFolder,
        childName,
      );
    }
  }
}
