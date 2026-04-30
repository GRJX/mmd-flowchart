import { useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { BLOCK_CONFIG, BLOCK_TYPES_ORDERED } from "@/config/blockConfig";
import { useDiagramStore } from "@/store/diagramStore";
import { cn } from "@/lib/utils";
import type { BlockType } from "@/types/domain";
import { PaletteThumbnail } from "./PaletteThumbnail";

const DRAG_MIME = "application/x-mmd-block";

/**
 * Palette view (FO §8). Each entry can be either dragged onto the canvas
 * or clicked to place the block at the viewport center.
 *
 * Start is disabled when the diagram already contains a Start block.
 */
export function Palette() {
  const hasStart = useDiagramStore((s) => Boolean(s.diagram.blocks["S"]));
  const addBlock = useDiagramStore((s) => s.addBlock);
  const readOnly = useDiagramStore((s) => s.readOnlyReason !== null);

  const rf = useReactFlow();

  const items = useMemo(
    () =>
      BLOCK_TYPES_ORDERED.filter((t) => BLOCK_CONFIG[t].availableInPalette).map((type) => {
        const cfg = BLOCK_CONFIG[type];
        const disabled = readOnly || (cfg.singleton && hasStart);
        return { type, cfg, disabled };
      }),
    [hasStart, readOnly],
  );

  const placeAtViewportCenter = (type: BlockType) => {
    const viewport = rf.getViewport();
    const bounds = document.querySelector(".react-flow")?.getBoundingClientRect();
    const cx = bounds ? bounds.width / 2 : 400;
    const cy = bounds ? bounds.height / 2 : 300;
    const position = rf.screenToFlowPosition({
      x: (bounds?.left ?? 0) + cx,
      y: (bounds?.top ?? 0) + cy,
    });
    addBlock({ type, position, markAsNew: true });
    void viewport;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--claude-border)] px-4 py-3">
        <h2 className="text-sm font-semibold">Bloktypes</h2>
        <p className="text-xs text-[var(--claude-text-tertiary)]">
          Sleep of klik om te plaatsen
        </p>
      </div>
      <div className="custom-scrollbar grid flex-1 grid-cols-1 content-start gap-2 overflow-auto p-3">
        {items.map(({ type, cfg, disabled }) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            draggable={!disabled}
            onDragStart={(e) => {
              if (disabled) return;
              e.dataTransfer.setData(DRAG_MIME, type);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => !disabled && placeAtViewportCenter(type)}
            className={cn(
              "group flex items-center gap-3 rounded-md border border-[var(--claude-border)] bg-[var(--claude-bg)] p-2.5 text-left transition-all",
              disabled
                ? "cursor-not-allowed opacity-40"
                : "cursor-grab hover:border-[var(--claude-accent)] hover:shadow-sm active:cursor-grabbing",
            )}
            title={disabled && cfg.singleton ? "Reeds één Start aanwezig" : cfg.displayName}
          >
            <PaletteThumbnail type={type} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{cfg.displayName}</span>
              <span className="text-[11px] text-[var(--claude-text-tertiary)]">
                {cfg.defaultLabel}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { DRAG_MIME };
