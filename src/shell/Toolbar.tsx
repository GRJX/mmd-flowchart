import { useEffect, useRef, useState } from "react";
import { useReactFlow, useStore as useReactFlowStore } from "@xyflow/react";
import {
  Download,
  FilePlus,
  FolderOpen,
  Grid3x3,
  LayoutGrid,
  Maximize,
  Minus,
  Monitor,
  Moon,
  Plus,
  Redo2,
  Save,
  Sun,
  Undo2,
} from "lucide-react";
import { useDiagramStore } from "@/store/diagramStore";
import { useFolderStore } from "@/store/folderStore";
import { openRootFolder, saveCurrentDiagram } from "@/lib/fs/fileOps";
import { exportDiagram } from "@/lib/export/exportDiagram";
import { isEmbeddedHost } from "@/lib/host/bridge";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const FIT_PADDING = 0.2;
const FIT_DURATION_MS = 200;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4;

export function Toolbar() {
  const fileName = useDiagramStore((s) => s.fileName);
  const filePath = useDiagramStore((s) => s.filePath);
  const isDirty = useDiagramStore((s) => s.isDirty);
  const lastSavedAt = useDiagramStore((s) => s.lastSavedAt);
  const readOnlyReason = useDiagramStore((s) => s.readOnlyReason);
  const canUndo = useDiagramStore((s) => s.undoStack.length > 0);
  const canRedo = useDiagramStore((s) => s.redoStack.length > 0);
  const undo = useDiagramStore((s) => s.undo);
  const redo = useDiagramStore((s) => s.redo);
  const alignBlocks = useDiagramStore((s) => s.alignBlocksToMacroGrid);
  const macroGridVisible = useDiagramStore((s) => s.macroGridVisible);
  const toggleMacroGrid = useDiagramStore((s) => s.toggleMacroGrid);
  const hasStart = useDiagramStore((s) => Boolean(s.diagram.blocks["S"]));

  const root = useFolderStore((s) => s.root);
  const openNewDialog = useFolderStore((s) => s.openNewDiagramDialog);

  const embedded = isEmbeddedHost();
  const hasFile = filePath !== null;
  const readOnly = readOnlyReason !== null;
  const canSave = hasFile && !readOnly;

  const flow = useReactFlow();
  const zoom = useReactFlowStore((s) => s.transform[2]);
  const { resolved, preference, cycle } = useTheme();

  const onFit = () =>
    void flow.fitView({ padding: FIT_PADDING, duration: FIT_DURATION_MS });
  const onZoomIn = () => flow.zoomIn({ duration: 120 });
  const onZoomOut = () => flow.zoomOut({ duration: 120 });
  const onZoomReset = () => flow.zoomTo(1, { duration: 120 });

  return (
    <div className="flex w-full items-center gap-2 px-3 text-sm">
      <span className="whitespace-nowrap font-semibold text-[var(--claude-text-primary)]">
        MMD Flowchart
      </span>

      <div className="mx-1 h-5 w-px bg-[var(--claude-border)]" />

      {/* File lifecycle is the host IDE's job when embedded: open/create
          via its explorer, save via the IDE's own save (settings/Ctrl+S). */}
      {!embedded && (
        <>
          <IconButton
            icon={<FolderOpen size={15} />}
            onClick={openRootFolder}
            title="Open folder"
          />
          <IconButton
            icon={<Save size={15} />}
            onClick={() => void saveCurrentDiagram()}
            disabled={!canSave || !isDirty}
            title="Opslaan (Ctrl/Cmd+S)"
          />
          <IconButton
            icon={<FilePlus size={15} />}
            onClick={() => openNewDialog("")}
            disabled={!root}
            title="Nieuw diagram"
          />
        </>
      )}
      <ExportMenu disabled={!hasFile} resolved={resolved} />

      <div className="min-w-0 flex-1 truncate px-2 text-[var(--claude-text-secondary)]">
        {fileName ? (
          <span title={fileName}>
            <span className="text-[var(--claude-text-primary)]">{fileName}</span>
            {isDirty && (
              <span
                className="ml-1 text-[var(--claude-accent)]"
                title="Niet-opgeslagen wijzigingen"
              >
                •
              </span>
            )}
            {readOnly && (
              <span className="ml-2 rounded bg-[var(--claude-bg)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--claude-text-tertiary)]">
                read-only
              </span>
            )}
          </span>
        ) : (
          <span className="text-[var(--claude-text-tertiary)]">
            Geen bestand geopend
          </span>
        )}
      </div>

      {!embedded && (
        <SaveStatus
          hasFile={hasFile}
          isDirty={isDirty}
          lastSavedAt={lastSavedAt}
          readOnly={readOnly}
        />
      )}

      <div className="mx-1 h-5 w-px bg-[var(--claude-border)]" />

      <IconButton
        icon={<LayoutGrid size={15} />}
        onClick={alignBlocks}
        disabled={!hasFile || readOnly || !hasStart}
        title="Align — snap blokken naar het macro-grid"
      />
      <IconButton
        icon={<Grid3x3 size={15} />}
        onClick={toggleMacroGrid}
        disabled={!hasFile}
        active={macroGridVisible}
        title={
          macroGridVisible
            ? "Verberg macro-grid overlay"
            : "Toon macro-grid overlay"
        }
      />
      <IconButton
        icon={<Maximize size={15} />}
        onClick={onFit}
        disabled={!hasFile}
        title="Fit to screen (Ctrl/Cmd+Shift+F)"
      />
      <IconButton
        icon={<Minus size={15} />}
        onClick={onZoomOut}
        disabled={!hasFile || zoom <= ZOOM_MIN + 0.01}
        title="Zoom out"
      />
      <button
        type="button"
        onDoubleClick={onZoomReset}
        disabled={!hasFile}
        className={cn(
          "min-w-[48px] rounded px-1.5 py-1 text-center text-[11px] tabular-nums",
          hasFile
            ? "text-[var(--claude-text-secondary)] hover:bg-[var(--claude-surface-hover)]"
            : "text-[var(--claude-text-tertiary)]",
        )}
        title="Dubbelklik om te resetten naar 100%"
      >
        {Math.round(zoom * 100)}%
      </button>
      <IconButton
        icon={<Plus size={15} />}
        onClick={onZoomIn}
        disabled={!hasFile || zoom >= ZOOM_MAX - 0.01}
        title="Zoom in"
      />

      <div className="mx-1 h-5 w-px bg-[var(--claude-border)]" />

      <IconButton
        icon={<Undo2 size={15} />}
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl/Cmd+Z)"
      />
      <IconButton
        icon={<Redo2 size={15} />}
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl/Cmd+Y)"
      />

      <div className="mx-1 h-5 w-px bg-[var(--claude-border)]" />

      <button
        type="button"
        onClick={cycle}
        className="flex h-7 w-7 items-center justify-center rounded text-[var(--claude-text-secondary)] hover:bg-[var(--claude-surface-hover)]"
        title={`Thema: ${preference} (klik om te wisselen)`}
      >
        {preference === "system" ? (
          <Monitor size={15} />
        ) : preference === "dark" ? (
          <Moon size={15} />
        ) : (
          <Sun size={15} />
        )}
      </button>
    </div>
  );
}

function IconButton({
  icon,
  onClick,
  disabled,
  title,
  active,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  /** Toon de knop als "ingedrukt"/aan-stand. Voor toggle-knoppen. */
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded",
        disabled
          ? "text-[var(--claude-text-tertiary)] opacity-50"
          : active
            ? "bg-[var(--claude-accent-light)] text-[var(--claude-accent)]"
            : "text-[var(--claude-text-secondary)] hover:bg-[var(--claude-surface-hover)]",
      )}
    >
      {icon}
    </button>
  );
}

function ExportMenu({
  disabled,
  resolved,
}: {
  disabled: boolean;
  resolved: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const flow = useReactFlow();
  const fileName = useDiagramStore((s) => s.fileName);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const doExport = async (kind: "png" | "svg") => {
    setOpen(false);
    if (!fileName) return;
    try {
      await exportDiagram({ flow, fileName, kind, theme: resolved });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        icon={<Download size={15} />}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title="Exporteren"
      />
      {open && !disabled && (
        <div className="absolute left-0 top-full z-40 mt-1 min-w-[120px] overflow-hidden rounded-md border border-[var(--claude-border)] bg-[var(--claude-surface)] shadow-lg">
          <button
            type="button"
            onClick={() => void doExport("png")}
            className="block w-full px-3 py-1.5 text-left text-xs text-[var(--claude-text-primary)] hover:bg-[var(--claude-surface-hover)]"
          >
            Exporteer als PNG
          </button>
          <button
            type="button"
            onClick={() => void doExport("svg")}
            className="block w-full px-3 py-1.5 text-left text-xs text-[var(--claude-text-primary)] hover:bg-[var(--claude-surface-hover)]"
          >
            Exporteer als SVG
          </button>
        </div>
      )}
    </div>
  );
}

function SaveStatus({
  hasFile,
  isDirty,
  lastSavedAt,
  readOnly,
}: {
  hasFile: boolean;
  isDirty: boolean;
  lastSavedAt: number | null;
  readOnly: boolean;
}) {
  if (!hasFile) return null;
  if (readOnly)
    return (
      <span className="text-xs text-[var(--claude-text-tertiary)]">
        alleen-lezen
      </span>
    );
  if (!lastSavedAt && !isDirty) return null;
  if (isDirty)
    return (
      <span className="text-xs text-[var(--claude-text-tertiary)]">
        Wijzigingen worden opgeslagen…
      </span>
    );
  return (
    <span
      className="text-xs text-[var(--claude-text-tertiary)]"
      title={new Date(lastSavedAt!).toLocaleString()}
    >
      Opgeslagen
    </span>
  );
}
