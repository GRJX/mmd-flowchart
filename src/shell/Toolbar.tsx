import { useEffect, useRef, useState } from "react";
import { useReactFlow, useStore as useReactFlowStore } from "@xyflow/react";
import {
  Download,
  Grid3x3,
  LayoutGrid,
  Maximize,
  Minus,
  Plus,
  Redo2,
  Undo2,
} from "lucide-react";
import { useDiagramStore } from "@/store/diagramStore";
import { exportDiagram } from "@/lib/export/exportDiagram";
import { currentTheme } from "@/lib/host/theme";
import { cn } from "@/lib/utils";

const FIT_PADDING = 0.2;
const FIT_DURATION_MS = 200;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4;

export function Toolbar() {
  const fileName = useDiagramStore((s) => s.fileName);
  const filePath = useDiagramStore((s) => s.filePath);
  const readOnlyReason = useDiagramStore((s) => s.readOnlyReason);
  const canUndo = useDiagramStore((s) => s.undoStack.length > 0);
  const canRedo = useDiagramStore((s) => s.redoStack.length > 0);
  const undo = useDiagramStore((s) => s.undo);
  const redo = useDiagramStore((s) => s.redo);
  const alignBlocks = useDiagramStore((s) => s.alignBlocksToMacroGrid);
  const macroGridVisible = useDiagramStore((s) => s.macroGridVisible);
  const toggleMacroGrid = useDiagramStore((s) => s.toggleMacroGrid);
  const hasStart = useDiagramStore((s) => Boolean(s.diagram.blocks["S"]));

  const hasFile = filePath !== null;
  const readOnly = readOnlyReason !== null;

  const flow = useReactFlow();
  const zoom = useReactFlowStore((s) => s.transform[2]);

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

      <ExportMenu disabled={!hasFile} />

      <div className="min-w-0 flex-1 truncate px-2 text-[var(--claude-text-secondary)]">
        {fileName ? (
          <span title={fileName}>
            <span className="text-[var(--claude-text-primary)]">{fileName}</span>
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

function ExportMenu({ disabled }: { disabled: boolean }) {
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
      await exportDiagram({ flow, fileName, kind, theme: currentTheme() });
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
