import { useRef, useState } from "react";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { useFolderStore } from "@/store/folderStore";
import {
  deleteNode,
  moveNode,
  openFile,
  renameNode,
} from "@/lib/fs/fileOps";
import type { TreeFolder, TreeNode } from "@/lib/fs/fsAccess";
import { cn } from "@/lib/utils";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { ConfirmDialog } from "./ConfirmDialog";
import { NewSubfolderDialog } from "./NewSubfolderDialog";

/**
 * VS Code-style file tree with HTML5 drag-and-drop, a right-click context
 * menu, inline rename, and confirmation-guarded delete. Rows are draggable;
 * folders (including the root's empty space) accept drops.
 */

const INDENT_PX = 12;
const ROW_PADDING_LEFT = 4;
const DRAG_MIME = "application/x-mmd-path";

interface Props {
  root: TreeFolder;
  activePath: string | null;
}

type MenuState = {
  x: number;
  y: number;
  path: string;
  kind: "file" | "folder";
} | null;

type ConfirmState = {
  path: string;
  kind: "file" | "folder";
  name: string;
} | null;

type RenameState = { path: string } | null;

type SubfolderState = { parentPath: string } | null;

export function FileTree({ root, activePath }: Props) {
  const [rootDropActive, setRootDropActive] = useState(false);
  const rootDragDepth = useRef(0);

  const [menu, setMenu] = useState<MenuState>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState>(null);
  const [renaming, setRenaming] = useState<RenameState>(null);
  const [newSubfolder, setNewSubfolder] = useState<SubfolderState>(null);

  const openNewDiagram = useFolderStore((s) => s.openNewDiagramDialog);

  const onRootDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    rootDragDepth.current += 1;
    setRootDropActive(true);
  };
  const onRootDragLeave = () => {
    rootDragDepth.current = Math.max(0, rootDragDepth.current - 1);
    if (rootDragDepth.current === 0) setRootDropActive(false);
  };
  const onRootDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    rootDragDepth.current = 0;
    setRootDropActive(false);
    const sourcePath = e.dataTransfer.getData(DRAG_MIME);
    if (!sourcePath) return;
    void moveNode(sourcePath, "");
  };

  const onRootContextMenu = (e: React.MouseEvent) => {
    // Allow right-click on the empty tree background to target the root.
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, path: "", kind: "folder" });
  };

  const menuItems: ContextMenuItem[] = menu
    ? menu.kind === "folder"
      ? [
          {
            kind: "item",
            label: "Nieuw diagram hier…",
            onSelect: () => openNewDiagram(menu.path),
          },
          {
            kind: "item",
            label: "Nieuwe map hier…",
            onSelect: () => setNewSubfolder({ parentPath: menu.path }),
          },
          ...(menu.path
            ? [
                { kind: "sep" as const },
                {
                  kind: "item" as const,
                  label: "Hernoemen",
                  onSelect: () => setRenaming({ path: menu.path }),
                },
                {
                  kind: "item" as const,
                  label: "Verwijderen",
                  danger: true,
                  onSelect: () =>
                    setConfirmDelete({
                      path: menu.path,
                      kind: "folder",
                      name: menu.path.split("/").pop() ?? menu.path,
                    }),
                },
              ]
            : []),
        ]
      : [
          {
            kind: "item",
            label: "Hernoemen",
            onSelect: () => setRenaming({ path: menu.path }),
          },
          {
            kind: "item",
            label: "Verwijderen",
            danger: true,
            onSelect: () =>
              setConfirmDelete({
                path: menu.path,
                kind: "file",
                name: menu.path.split("/").pop() ?? menu.path,
              }),
          },
        ]
    : [];

  return (
    <>
      <ul
        onDragEnter={onRootDragEnter}
        onDragLeave={onRootDragLeave}
        onDragOver={onRootDragOver}
        onDrop={onRootDrop}
        onContextMenu={onRootContextMenu}
        className={cn(
          "min-h-full py-1 text-sm",
          rootDropActive && "bg-[var(--claude-accent)]/5",
        )}
      >
        {root.children.map((child) => (
          <TreeNodeView
            key={child.path}
            node={child}
            depth={0}
            activePath={activePath}
            renamingPath={renaming?.path ?? null}
            onRenameDone={() => setRenaming(null)}
            onContextMenu={(x, y, path, kind) =>
              setMenu({ x, y, path, kind })
            }
          />
        ))}
        {root.children.length === 0 && (
          <li className="px-3 py-2 text-xs italic text-[var(--claude-text-tertiary)]">
            Deze map bevat nog geen <code>.mmd</code>-bestanden.
          </li>
        )}
      </ul>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={
            confirmDelete.kind === "folder" ? "Map verwijderen" : "Bestand verwijderen"
          }
          message={
            confirmDelete.kind === "folder"
              ? `Weet je zeker dat je "${confirmDelete.name}" en alle inhoud permanent wilt verwijderen?`
              : `Weet je zeker dat je "${confirmDelete.name}" permanent wilt verwijderen?`
          }
          confirmLabel="Verwijderen"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            const path = confirmDelete.path;
            setConfirmDelete(null);
            void deleteNode(path);
          }}
        />
      )}

      {newSubfolder && (
        <NewSubfolderDialog
          parentPath={newSubfolder.parentPath}
          onClose={() => setNewSubfolder(null)}
        />
      )}
    </>
  );
}

function TreeNodeView({
  node,
  depth,
  activePath,
  renamingPath,
  onRenameDone,
  onContextMenu,
}: {
  node: TreeNode;
  depth: number;
  activePath: string | null;
  renamingPath: string | null;
  onRenameDone: () => void;
  onContextMenu: (x: number, y: number, path: string, kind: "file" | "folder") => void;
}) {
  const expandedPaths = useFolderStore((s) => s.expandedPaths);
  const toggleExpanded = useFolderStore((s) => s.toggleExpanded);
  const expand = useFolderStore((s) => s.expand);

  const [dragging, setDragging] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const dragDepth = useRef(0);

  const isRenaming = renamingPath === node.path;

  const onDragStart = (e: React.DragEvent) => {
    if (isRenaming) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(DRAG_MIME, node.path);
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation();
    setDragging(true);
  };
  const onDragEnd = () => setDragging(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e.clientX, e.clientY, node.path, node.kind);
  };

  if (node.kind === "folder") {
    const expanded = expandedPaths.has(node.path);

    const onDragEnter = (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
      e.stopPropagation();
      dragDepth.current += 1;
      setDropActive(true);
    };
    const onDragLeave = (e: React.DragEvent) => {
      e.stopPropagation();
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDropActive(false);
    };
    const onDragOver = (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
    };
    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setDropActive(false);
      const sourcePath = e.dataTransfer.getData(DRAG_MIME);
      if (!sourcePath) return;
      expand(node.path);
      void moveNode(sourcePath, node.path);
    };

    return (
      <li
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div
          draggable={!isRenaming}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onContextMenu={handleContextMenu}
          onClick={() => !isRenaming && toggleExpanded(node.path)}
          className={cn(
            "flex w-full cursor-pointer items-center gap-1 py-0.5 text-left text-[var(--claude-text-primary)] hover:bg-[var(--claude-surface-hover)]",
            dragging && "opacity-40",
            dropActive &&
              "bg-[var(--claude-accent)]/15 outline outline-1 outline-[var(--claude-accent)]",
          )}
          style={{ paddingLeft: ROW_PADDING_LEFT + depth * INDENT_PX }}
        >
          <ChevronRight
            size={14}
            className={cn(
              "shrink-0 text-[var(--claude-text-tertiary)] transition-transform",
              expanded && "rotate-90",
            )}
          />
          {expanded ? (
            <FolderOpen
              size={15}
              className="shrink-0 text-[var(--claude-text-secondary)]"
            />
          ) : (
            <Folder
              size={15}
              className="shrink-0 text-[var(--claude-text-secondary)]"
            />
          )}
          {isRenaming ? (
            <RenameInput
              initial={node.name}
              onCancel={onRenameDone}
              onSubmit={async (newName) => {
                const res = await renameNode(node.path, newName);
                if (res.ok) onRenameDone();
              }}
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>
        {expanded && (
          <ul>
            {node.children.map((child) => (
              <TreeNodeView
                key={child.path}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                renamingPath={renamingPath}
                onRenameDone={onRenameDone}
                onContextMenu={onContextMenu}
              />
            ))}
            {node.children.length === 0 && (
              <li
                className="py-0.5 text-xs italic text-[var(--claude-text-tertiary)]"
                style={{
                  paddingLeft:
                    ROW_PADDING_LEFT + (depth + 1) * INDENT_PX + 14 + 4 + 15 + 4,
                }}
              >
                (leeg)
              </li>
            )}
          </ul>
        )}
      </li>
    );
  }

  const isActive = activePath === node.path;
  return (
    <li>
      <div
        draggable={!isRenaming}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onContextMenu={handleContextMenu}
        onClick={() => !isRenaming && void openFile(node.path)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-1 py-0.5 text-left",
          isActive
            ? "bg-[var(--claude-accent)]/15 text-[var(--claude-accent)]"
            : "text-[var(--claude-text-primary)] hover:bg-[var(--claude-surface-hover)]",
          dragging && "opacity-40",
        )}
        style={{ paddingLeft: ROW_PADDING_LEFT + depth * INDENT_PX + 14 + 4 }}
        title={node.path}
      >
        <File
          size={15}
          className={cn(
            "shrink-0",
            isActive
              ? "text-[var(--claude-accent)]"
              : "text-[var(--claude-text-tertiary)]",
          )}
        />
        {isRenaming ? (
          <RenameInput
            initial={node.name}
            onCancel={onRenameDone}
            onSubmit={async (newName) => {
              const res = await renameNode(node.path, newName);
              if (res.ok) onRenameDone();
            }}
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
      </div>
    </li>
  );
}

function RenameInput({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: string;
  onSubmit: (newName: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <input
      ref={(el) => {
        inputRef.current = el;
        if (el && document.activeElement !== el) {
          // Select the base name (before extension) to make replacing easy.
          el.focus();
          const dot = initial.lastIndexOf(".");
          el.setSelectionRange(0, dot > 0 ? dot : initial.length);
        }
      }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit(value.trim());
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      onBlur={() => onCancel()}
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e) => e.preventDefault()}
      className="min-w-0 flex-1 rounded border border-[var(--claude-accent)] bg-[var(--claude-bg)] px-1 py-0 text-sm text-[var(--claude-text-primary)] outline-none"
    />
  );
}
