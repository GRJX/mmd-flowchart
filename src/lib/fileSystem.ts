import type { FileTreeNode } from "../types/diagram";

// ── Directory tree reading ────────────────────────────────────────────────────

/**
 * Read the top-level children of a directory handle.
 * Only .mmd files and sub-folders are returned (other files filtered out).
 * children on folders is undefined (lazy — populated on expand).
 */
export async function readDirectoryEntries(
  dirHandle: FileSystemDirectoryHandle,
): Promise<FileTreeNode[]> {
  const nodes: FileTreeNode[] = [];

  for await (const [name, handle] of dirHandle as unknown as AsyncIterable<
    [string, FileSystemHandle]
  >) {
    if (handle.kind === "directory") {
      nodes.push({
        name,
        type: "folder",
        handle: handle as FileSystemDirectoryHandle,
      });
    } else if (handle.kind === "file" && name.endsWith(".mmd")) {
      nodes.push({
        name,
        type: "file",
        handle: handle as FileSystemFileHandle,
      });
    }
  }

  // Sort: folders first (alphabetical), then files (alphabetical)
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

// ── File reading ──────────────────────────────────────────────────────────────

export async function readFileText(
  handle: FileSystemFileHandle,
): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

/**
 * Returns the last-modified timestamp of the file backing a handle.
 * Used for external-change detection.
 */
export async function getFileLastModified(
  handle: FileSystemFileHandle,
): Promise<number> {
  const file = await handle.getFile();
  return file.lastModified;
}

// ── Atomic write ──────────────────────────────────────────────────────────────

/**
 * Writes text to a FileSystemFileHandle using the atomic write pattern (§9.3):
 * 1. Serialize content to string (done by caller)
 * 2. Open writable stream
 * 3. Write content
 * 4. Close stream (flushes to OS)
 *
 * Does NOT update isDirty — caller is responsible.
 */
export async function writeFileAtomic(
  handle: FileSystemFileHandle,
  content: string,
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

// ── File creation ─────────────────────────────────────────────────────────────

/**
 * Creates a new .mmd file inside dirHandle and returns its FileSystemFileHandle.
 * The file is created with empty content (caller writes initial content).
 */
export async function createMmdFile(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
): Promise<FileSystemFileHandle> {
  const name = filename.endsWith(".mmd") ? filename : `${filename}.mmd`;
  return dirHandle.getFileHandle(name, { create: true });
}

// ── Directory creation ────────────────────────────────────────────────────────

export async function createDirectory(
  parentHandle: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemDirectoryHandle> {
  return parentHandle.getDirectoryHandle(name, { create: true });
}

// ── Rename (copy + delete pattern) ────────────────────────────────────────────

/**
 * Renames a file in dirHandle from oldName to newName.
 * File System Access API has no native rename; we copy + delete.
 */
export async function renameFile(
  dirHandle: FileSystemDirectoryHandle,
  oldName: string,
  newName: string,
): Promise<FileSystemFileHandle> {
  const oldHandle = await dirHandle.getFileHandle(oldName);
  const content = await readFileText(oldHandle);
  const newHandle = await dirHandle.getFileHandle(newName, { create: true });
  await writeFileAtomic(newHandle, content);
  await (
    dirHandle as unknown as { removeEntry(name: string): Promise<void> }
  ).removeEntry(oldName);
  return newHandle;
}

// ── Move ──────────────────────────────────────────────────────────────────────

/**
 * Moves a file from srcDirHandle to destDirHandle (copy + delete).
 * File System Access API has no native move across directories.
 * If a file with the same name already exists in destDirHandle the existing
 * file is overwritten (standard file-manager behaviour).
 */
export async function moveFileToFolder(
  srcDirHandle: FileSystemDirectoryHandle,
  destDirHandle: FileSystemDirectoryHandle,
  filename: string,
): Promise<FileSystemFileHandle> {
  const srcHandle = await srcDirHandle.getFileHandle(filename);
  const content = await readFileText(srcHandle);
  const destHandle = await destDirHandle.getFileHandle(filename, {
    create: true,
  });
  await writeFileAtomic(destHandle, content);
  await (
    srcDirHandle as unknown as { removeEntry(name: string): Promise<void> }
  ).removeEntry(filename);
  return destHandle;
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteEntry(
  parentHandle: FileSystemDirectoryHandle,
  name: string,
): Promise<void> {
  await (
    parentHandle as unknown as {
      removeEntry(name: string, opts?: { recursive?: boolean }): Promise<void>;
    }
  ).removeEntry(name, { recursive: true });
}
