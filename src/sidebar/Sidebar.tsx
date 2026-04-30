import { useFolderStore } from "@/store/folderStore";
import { useDiagramStore } from "@/store/diagramStore";
import { openRootFolder } from "@/lib/fs/fileOps";
import { FileTree } from "./FileTree";
import { cn } from "@/lib/utils";


/**
 * Left sidebar. Three visual states:
 * - Empty / permission states: centered CTA to open a folder.
 * - Loading: short status row.
 * - Ready: header with the folder name and an expandable file tree.
 */
export function Sidebar() {
  const status = useFolderStore((s) => s.status);
  const root = useFolderStore((s) => s.root);
  const currentFilePath = useFolderStore((s) => s.currentFilePath);
  const filePath = useDiagramStore((s) => s.filePath);

  // The diagram store's filePath wins when both are set — keeps the tree
  // highlight in sync even when we rebuild after external changes.
  const activePath = filePath ?? currentFilePath ?? null;

  if (status.kind === "unsupported-browser") {
    return (
      <EmptyState>
        <p className="font-semibold text-[var(--claude-text-primary)]">
          Browser niet ondersteund
        </p>
        <p className="mt-2 text-xs">
          Deze editor gebruikt de File System Access API. Open de app in een
          Chromium-gebaseerde browser (Chrome, Edge).
        </p>
      </EmptyState>
    );
  }

  if (status.kind === "permission-denied") {
    return (
      <EmptyState>
        <p className="font-semibold text-[var(--claude-text-primary)]">
          Geen toegang tot de map
        </p>
        <p className="mt-2 text-xs">
          Verleen schrijftoegang om de map te kunnen openen en aanpassen.
        </p>
        <OpenFolderButton className="mt-4" />
      </EmptyState>
    );
  }

  if (status.kind === "error") {
    return (
      <EmptyState>
        <p className="font-semibold text-[var(--claude-text-primary)]">
          Map kon niet worden geopend
        </p>
        <p className="mt-2 break-words text-xs">{status.message}</p>
        <OpenFolderButton className="mt-4" />
      </EmptyState>
    );
  }

  if (status.kind === "loading" && !root) {
    return (
      <EmptyState>
        <p className="text-xs">Map wordt geladen…</p>
      </EmptyState>
    );
  }

  if (!root) {
    return (
      <EmptyState>
        <p className="font-semibold text-[var(--claude-text-primary)]">
          Geen map geopend
        </p>
        <p className="mt-2 text-xs">
          Open een lokale map met <code>.mmd</code>-bestanden om te beginnen.
        </p>
        <OpenFolderButton className="mt-4" />
      </EmptyState>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--claude-border)] px-3 py-2">
        <p
          className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--claude-text-secondary)]"
          title={root.name}
        >
          {root.name}
        </p>
        <p className="text-[10px] text-[var(--claude-text-tertiary)]">
          {countFiles(root)} bestanden
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        <FileTree root={root} activePath={activePath} />
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center text-sm text-[var(--claude-text-secondary)]">
      {children}
    </div>
  );
}

function OpenFolderButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openRootFolder}
      className={cn(
        "inline-flex items-center gap-2 rounded-md bg-[var(--claude-accent)] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-90",
        className,
      )}
    >
      Open folder
    </button>
  );
}

function countFiles(node: {
  kind: "folder" | "file";
  children?: unknown[];
}): number {
  if (node.kind === "file") return 1;
  let total = 0;
  for (const c of (node.children as { kind: "folder" | "file" }[]) ?? []) {
    total += countFiles(c);
  }
  return total;
}
