import {
  buildTree,
  ensureReadWrite,
  findFileByPath,
  isFileSystemAccessSupported,
  pickRootFolder,
  readFile,
  writeFile,
  type TreeFile,
  type TreeFolder,
} from "@/lib/fs/fsAccess";
import { loadRootHandle, saveRootHandle } from "@/lib/fs/handleStore";
import { parseMmd } from "@/lib/mermaid/parse";
import { serializeMmd } from "@/lib/mermaid/serialize";
import { detectDiagramKind } from "@/lib/mermaid/detect";
import {
  MAX_BLOCKS_EDITABLE,
  type Diagram,
  type ReadOnlyReason,
} from "@/types/domain";
import { useDiagramStore } from "@/store/diagramStore";
import { useFolderStore } from "@/store/folderStore";
import { showToast } from "@/store/toastStore";

/**
 * High-level file operations that wire the FS wrapper into the two stores.
 * Components stay thin — they call into here and let the stores drive the
 * UI.
 */

export async function openRootFolder(): Promise<void> {
  const folder = useFolderStore.getState();

  if (!isFileSystemAccessSupported()) {
    folder.setStatus({ kind: "unsupported-browser" });
    return;
  }

  folder.setStatus({ kind: "loading" });
  const handle = await pickRootFolder();
  if (!handle) {
    folder.setStatus(folder.root ? { kind: "ready" } : { kind: "empty" });
    return;
  }
  const granted = await ensureReadWrite(handle);
  if (!granted) {
    folder.setStatus({ kind: "permission-denied" });
    return;
  }

  try {
    const tree = await buildTree(handle);
    await saveRootHandle(handle);
    folder.setRoot(tree);
    folder.setStatus({ kind: "ready" });
  } catch (err) {
    folder.setStatus({
      kind: "error",
      message: (err as Error).message ?? "Onbekende fout bij het openen van de map.",
    });
  }
}

export async function restoreRootFolder(): Promise<void> {
  const folder = useFolderStore.getState();

  if (!isFileSystemAccessSupported()) {
    folder.setStatus({ kind: "unsupported-browser" });
    return;
  }

  let handle: FileSystemDirectoryHandle | null = null;
  try {
    handle = await loadRootHandle();
  } catch {
    handle = null;
  }
  if (!handle) {
    folder.setStatus({ kind: "empty" });
    return;
  }

  const h = handle as FileSystemDirectoryHandle & {
    queryPermission?: (opts: {
      mode: "read" | "readwrite";
    }) => Promise<PermissionState>;
  };
  const state = h.queryPermission
    ? await h.queryPermission({ mode: "readwrite" })
    : "granted";

  // We can't prompt without a user gesture. If access isn't already
  // granted, stay in empty state and let the user click Open Folder again
  // (which triggers requestPermission inside a gesture).
  if (state !== "granted") {
    folder.setStatus({ kind: "empty" });
    return;
  }

  try {
    const tree = await buildTree(handle);
    folder.setRoot(tree);
    folder.setStatus({ kind: "ready" });
  } catch {
    folder.setStatus({ kind: "empty" });
  }
}

export async function refreshTree(): Promise<void> {
  const folder = useFolderStore.getState();
  const root = folder.root;
  if (!root) return;
  const tree = await buildTree(root.handle);
  folder.setRoot(tree);
}

export async function openFile(path: string): Promise<void> {
  const folderState = useFolderStore.getState();
  const diagramStore = useDiagramStore.getState();
  const root = folderState.root;
  if (!root) return;

  const file = findFileByPath(root, path);
  if (!file) return;

  const { content, lastModified } = await readFile(file.handle);
  const loadInto = (diagram: Diagram, readOnlyReason: ReadOnlyReason | null) => {
    diagramStore.loadDiagram({
      filePath: path,
      fileName: file.name,
      diagram,
      readOnlyReason,
      lastSavedAt: lastModified,
    });
    folderState.setCurrentFilePath(path);
  };

  const kind = detectDiagramKind(content);
  if (kind.kind === "other") {
    loadInto(
      { blocks: {}, connections: {} },
      { kind: "unsupported-type", detected: kind.detected },
    );
    showToast({
      kind: "warning",
      message: `Diagramtype "${kind.detected}" wordt niet ondersteund. Geopend in alleen-lezen.`,
    });
    return;
  }
  if (kind.kind === "unknown") {
    loadInto(
      { blocks: {}, connections: {} },
      { kind: "unsupported-type", detected: "unknown" },
    );
    showToast({
      kind: "warning",
      message: "Diagramtype niet herkend. Geopend in alleen-lezen.",
    });
    return;
  }

  const { diagram } = parseMmd(content);
  const blockCount = Object.keys(diagram.blocks).length;
  if (blockCount > MAX_BLOCKS_EDITABLE) {
    loadInto(diagram, { kind: "too-many-blocks", count: blockCount });
    showToast({
      kind: "warning",
      message: `Dit diagram heeft ${blockCount} blokken (limiet ${MAX_BLOCKS_EDITABLE}). Geopend in alleen-lezen.`,
    });
    return;
  }
  loadInto(diagram, null);
}

/**
 * Create a new `.mmd` file inside `folderPath` (empty string = root).
 * The file starts with a single Start block so it opens cleanly in the
 * editor. Returns the full path of the created file, or an error reason.
 */
export async function createNewDiagram(args: {
  name: string;
  folderPath: string;
}): Promise<
  | { ok: true; path: string }
  | { ok: false; reason: "no-root" | "invalid-name" | "exists" | "write-failed" }
> {
  const folderState = useFolderStore.getState();
  const root = folderState.root;
  if (!root) return { ok: false, reason: "no-root" };

  const cleanName = args.name.trim();
  if (!cleanName || /[\\/]/.test(cleanName) || cleanName.startsWith(".")) {
    return { ok: false, reason: "invalid-name" };
  }
  const fileName = cleanName.toLowerCase().endsWith(".mmd")
    ? cleanName
    : `${cleanName}.mmd`;

  const parent = findFolderByPath(root, args.folderPath);
  if (!parent) return { ok: false, reason: "no-root" };

  if (parent.children.some((c) => c.name.toLowerCase() === fileName.toLowerCase())) {
    return { ok: false, reason: "exists" };
  }

  try {
    const handle = await parent.handle.getFileHandle(fileName, { create: true });
    const starterDiagram = {
      blocks: {
        S: {
          id: "S",
          type: "start" as const,
          label: "Start",
          position: { x: 200, y: 120 },
          width: 96,
          height: 96,
          dataField: null,
          expectedOutcome: null,
          comments: [],
        },
      },
      connections: {},
    };
    const content = serializeMmd(starterDiagram);
    const lastModified = await writeFile(handle, content);

    await refreshTree();
    const path = args.folderPath ? `${args.folderPath}/${fileName}` : fileName;
    if (args.folderPath) {
      useFolderStore.getState().expand(args.folderPath);
    }

    // Load the fresh file straight into the editor.
    useDiagramStore.getState().loadDiagram({
      filePath: path,
      fileName,
      diagram: starterDiagram,
      readOnlyReason: null,
      lastSavedAt: lastModified,
    });
    useFolderStore.getState().setCurrentFilePath(path);

    return { ok: true, path };
  } catch {
    return { ok: false, reason: "write-failed" };
  }
}

function findFolderByPath(root: TreeFolder, path: string): TreeFolder | null {
  if (!path) return root;
  const parts = path.split("/");
  let node: TreeFolder = root;
  for (const part of parts) {
    const next = node.children.find(
      (c) => c.kind === "folder" && c.name === part,
    );
    if (!next || next.kind !== "folder") return null;
    node = next;
  }
  return node;
}

function findNodeByPath(
  root: TreeFolder,
  path: string,
): { node: TreeFolder | TreeFile; parent: TreeFolder } | null {
  if (!path) return null;
  const parts = path.split("/");
  let parent: TreeFolder = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = parent.children.find(
      (c) => c.kind === "folder" && c.name === parts[i],
    );
    if (!next || next.kind !== "folder") return null;
    parent = next;
  }
  const last = parts[parts.length - 1];
  const node = parent.children.find((c) => c.name === last);
  if (!node) return null;
  return { node, parent };
}

function fail(
  reason: MoveNodeFailure,
  message: string,
): { ok: false; reason: MoveNodeFailure } {
  showToast({ kind: "warning", message });
  return { ok: false, reason };
}

export type MoveNodeFailure =
  | "no-root"
  | "not-found"
  | "into-self"
  | "into-descendant"
  | "same-parent"
  | "name-conflict"
  | "move-failed";

/**
 * Move a file or folder to another folder inside the same root. Uses
 * copy + delete under the hood since `FileSystemHandle.move` isn't
 * universally available for directories yet.
 *
 * `targetFolderPath` is the path of the destination folder, empty string
 * meaning the root.
 */
export async function moveNode(
  sourcePath: string,
  targetFolderPath: string,
): Promise<{ ok: true; newPath: string } | { ok: false; reason: MoveNodeFailure }> {
  const folderState = useFolderStore.getState();
  const root = folderState.root;
  if (!root) return { ok: false, reason: "no-root" };

  const found = findNodeByPath(root, sourcePath);
  if (!found) return { ok: false, reason: "not-found" };
  const { node: source, parent: oldParent } = found;

  const target = findFolderByPath(root, targetFolderPath);
  if (!target) return { ok: false, reason: "not-found" };

  if (source.kind === "folder" && source.path === target.path) {
    return fail("into-self", "Kan map niet in zichzelf verplaatsen.");
  }
  if (
    source.kind === "folder" &&
    (target.path === source.path ||
      target.path.startsWith(source.path + "/"))
  ) {
    return fail(
      "into-descendant",
      "Kan map niet verplaatsen naar een eigen submap.",
    );
  }
  if (oldParent.path === target.path) {
    return { ok: false, reason: "same-parent" };
  }
  if (
    target.children.some(
      (c) => c.name.toLowerCase() === source.name.toLowerCase(),
    )
  ) {
    return fail(
      "name-conflict",
      `Er bestaat al een item met de naam "${source.name}" in de doelmap.`,
    );
  }

  try {
    if (source.kind === "file") {
      await copyFile(source.handle, target.handle, source.name);
      await oldParent.handle.removeEntry(source.name);
    } else {
      await copyFolder(source.handle, target.handle, source.name);
      await oldParent.handle.removeEntry(source.name, { recursive: true });
    }
  } catch (err) {
    return fail(
      "move-failed",
      `Verplaatsen mislukt: ${(err as Error).message ?? "onbekende fout"}`,
    );
  }

  const newPath = targetFolderPath
    ? `${targetFolderPath}/${source.name}`
    : source.name;

  await refreshTree();

  useFolderStore.getState().expand(target.path);

  // Re-point the editor if the open file moved along with the operation.
  const diagramStore = useDiagramStore.getState();
  const openPath = diagramStore.filePath;
  if (openPath) {
    let nextOpenPath: string | null = null;
    if (openPath === sourcePath) {
      nextOpenPath = newPath;
    } else if (openPath.startsWith(sourcePath + "/")) {
      nextOpenPath = newPath + openPath.substring(sourcePath.length);
    }
    if (nextOpenPath) {
      diagramStore.retargetOpenFile(nextOpenPath);
      useFolderStore.getState().setCurrentFilePath(nextOpenPath);
    }
  }

  return { ok: true, newPath };
}

export type NodeOpFailure =
  | "no-root"
  | "not-found"
  | "invalid-name"
  | "name-conflict"
  | "write-failed"
  | "delete-failed";

/** Rename a file or folder in place. Uses copy + delete for the same
 *  reason as `moveNode` — `FileSystemHandle.move` isn't universally
 *  available for directories. */
export async function renameNode(
  path: string,
  newName: string,
): Promise<{ ok: true; newPath: string } | { ok: false; reason: NodeOpFailure }> {
  const folderState = useFolderStore.getState();
  const root = folderState.root;
  if (!root) return { ok: false, reason: "no-root" };

  const found = findNodeByPath(root, path);
  if (!found) return { ok: false, reason: "not-found" };
  const { node, parent } = found;

  const cleanName = newName.trim();
  if (!cleanName || /[\\/]/.test(cleanName) || cleanName.startsWith(".")) {
    showToast({
      kind: "warning",
      message: "Ongeldige naam. Geen schuine strepen en niet met een punt beginnen.",
    });
    return { ok: false, reason: "invalid-name" };
  }
  // For files we auto-append .mmd if missing so the tree-filter keeps it.
  const finalName =
    node.kind === "file" && !cleanName.toLowerCase().endsWith(".mmd")
      ? `${cleanName}.mmd`
      : cleanName;

  if (finalName === node.name) return { ok: true, newPath: path };

  if (
    parent.children.some(
      (c) => c.name.toLowerCase() === finalName.toLowerCase(),
    )
  ) {
    showToast({
      kind: "warning",
      message: `Er bestaat al een item met de naam "${finalName}" in deze map.`,
    });
    return { ok: false, reason: "name-conflict" };
  }

  try {
    if (node.kind === "file") {
      await copyFile(node.handle, parent.handle, finalName);
      await parent.handle.removeEntry(node.name);
    } else {
      await copyFolder(node.handle, parent.handle, finalName);
      await parent.handle.removeEntry(node.name, { recursive: true });
    }
  } catch (err) {
    showToast({
      kind: "error",
      message: `Hernoemen mislukt: ${(err as Error).message ?? "onbekende fout"}`,
    });
    return { ok: false, reason: "write-failed" };
  }

  const newPath = parent.path ? `${parent.path}/${finalName}` : finalName;
  await refreshTree();

  // Re-point the editor if the open file (or its folder) was renamed.
  const diagramStore = useDiagramStore.getState();
  const openPath = diagramStore.filePath;
  if (openPath) {
    let nextOpenPath: string | null = null;
    if (openPath === path) nextOpenPath = newPath;
    else if (openPath.startsWith(path + "/"))
      nextOpenPath = newPath + openPath.substring(path.length);
    if (nextOpenPath) {
      diagramStore.retargetOpenFile(nextOpenPath);
      useFolderStore.getState().setCurrentFilePath(nextOpenPath);
    }
  }

  return { ok: true, newPath };
}

/** Permanently delete a file or (recursively) a folder. */
export async function deleteNode(
  path: string,
): Promise<{ ok: true } | { ok: false; reason: NodeOpFailure }> {
  const folderState = useFolderStore.getState();
  const root = folderState.root;
  if (!root) return { ok: false, reason: "no-root" };

  const found = findNodeByPath(root, path);
  if (!found) return { ok: false, reason: "not-found" };
  const { node, parent } = found;

  try {
    await parent.handle.removeEntry(node.name, { recursive: node.kind === "folder" });
  } catch (err) {
    showToast({
      kind: "error",
      message: `Verwijderen mislukt: ${(err as Error).message ?? "onbekende fout"}`,
    });
    return { ok: false, reason: "delete-failed" };
  }

  await refreshTree();

  // Close the editor if the open file was inside what we just deleted.
  const diagramStore = useDiagramStore.getState();
  const openPath = diagramStore.filePath;
  if (openPath && (openPath === path || openPath.startsWith(path + "/"))) {
    diagramStore.clear();
    useFolderStore.getState().setCurrentFilePath(null);
  }

  return { ok: true };
}

/** Create an empty subfolder inside `parentPath` (empty string = root). */
export async function createSubfolder(
  parentPath: string,
  name: string,
): Promise<{ ok: true; path: string } | { ok: false; reason: NodeOpFailure }> {
  const folderState = useFolderStore.getState();
  const root = folderState.root;
  if (!root) return { ok: false, reason: "no-root" };

  const cleanName = name.trim();
  if (!cleanName || /[\\/]/.test(cleanName) || cleanName.startsWith(".")) {
    showToast({
      kind: "warning",
      message: "Ongeldige mapnaam.",
    });
    return { ok: false, reason: "invalid-name" };
  }

  const parent = findFolderByPath(root, parentPath);
  if (!parent) return { ok: false, reason: "not-found" };
  if (
    parent.children.some(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase(),
    )
  ) {
    showToast({
      kind: "warning",
      message: `Er bestaat al een item met de naam "${cleanName}" in deze map.`,
    });
    return { ok: false, reason: "name-conflict" };
  }

  try {
    await parent.handle.getDirectoryHandle(cleanName, { create: true });
  } catch (err) {
    showToast({
      kind: "error",
      message: `Map aanmaken mislukt: ${(err as Error).message ?? "onbekende fout"}`,
    });
    return { ok: false, reason: "write-failed" };
  }

  await refreshTree();
  const path = parentPath ? `${parentPath}/${cleanName}` : cleanName;
  useFolderStore.getState().expand(parentPath || path);
  return { ok: true, path };
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

const EXTERNAL_CHANGE_TOLERANCE_MS = 100;

export async function saveCurrentDiagram(options?: {
  force?: boolean;
}): Promise<boolean> {
  const folderState = useFolderStore.getState();
  const diagramStore = useDiagramStore.getState();
  const root = folderState.root;
  const path = folderState.currentFilePath;
  if (!root || !path) return false;
  if (diagramStore.readOnlyReason !== null) return false;

  const file = findFileByPath(root, path);
  if (!file) return false;

  // Check for external changes before writing — unless the caller explicitly
  // forces an overwrite (user confirmed "Overschrijven" in the toast).
  if (!options?.force) {
    const serverModified = await peekLastModified(file.handle);
    const known = diagramStore.lastSavedAt;
    if (
      known !== null &&
      serverModified > known + EXTERNAL_CHANGE_TOLERANCE_MS
    ) {
      showToast({
        kind: "warning",
        duration: null,
        message:
          "Het bestand is extern gewijzigd. Overschrijven wist de externe wijzigingen; herladen wist je lokale wijzigingen.",
        actions: [
          {
            label: "Overschrijven",
            onClick: () => void saveCurrentDiagram({ force: true }),
          },
          {
            label: "Herladen",
            onClick: () => void openFile(path),
          },
        ],
      });
      return false;
    }
  }

  const content = serializeMmd(diagramStore.diagram);
  try {
    const lastModified = await writeFile(file.handle, content);
    diagramStore.markSaved(lastModified);
    return true;
  } catch (err) {
    showToast({
      kind: "error",
      message: `Opslaan mislukt: ${(err as Error).message ?? "onbekende fout"}`,
    });
    return false;
  }
}

async function peekLastModified(handle: FileSystemFileHandle): Promise<number> {
  const file = await handle.getFile();
  return file.lastModified;
}

/** Check the currently-open file's on-disk timestamp and surface a toast if
 *  it has changed since we last saved. Called on window refocus / visibility
 *  changes. */
export async function checkForExternalChange(): Promise<void> {
  const folderState = useFolderStore.getState();
  const diagramStore = useDiagramStore.getState();
  const root = folderState.root;
  const path = folderState.currentFilePath;
  if (!root || !path) return;
  const file = findFileByPath(root, path);
  if (!file) return;

  const serverModified = await peekLastModified(file.handle);
  const known = diagramStore.lastSavedAt;
  if (known === null) return;
  if (serverModified <= known + EXTERNAL_CHANGE_TOLERANCE_MS) return;

  showToast({
    kind: "warning",
    duration: null,
    message: "Dit bestand is extern gewijzigd.",
    actions: [
      {
        label: "Herladen",
        onClick: () => void openFile(path),
      },
    ],
  });
}
