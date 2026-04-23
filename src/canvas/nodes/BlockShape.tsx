import type { ReactNode } from "react";
import type { BlockType } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Visual shapes for each block type (FO §2). The selected state is rendered
 * as an outline that follows the actual shape (circle / rounded-rect /
 * diamond / parallelogram) so the focus ring feels native to each type.
 */
interface Props {
  type: BlockType;
  selected: boolean;
  violation: boolean;
  children: ReactNode;
}

export function BlockShape({ type, selected, children }: Props) {
  // The selected state is expressed by recoloring the *existing* border of
  // each shape (and thickening it slightly) — no extra outer ring. The
  // shape itself stays at its original footprint so layout doesn't shift
  // when selection toggles.
  const borderCls = selected
    ? "border-[var(--claude-accent)]"
    : "border-[var(--node-stroke)]";
  const borderWidth = { borderWidth: selected ? 3 : 2 } as const;

  switch (type) {
    case "start":
    case "end":
      return (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-[var(--node-fill)] text-[var(--node-text)] shadow-sm",
            borderCls,
          )}
          style={borderWidth}
        >
          {children}
        </div>
      );

    case "action":
      return (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-xl bg-[var(--node-fill)] text-[var(--node-text)] shadow-sm",
            borderCls,
          )}
          style={borderWidth}
        >
          {children}
        </div>
      );

    case "decision":
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full drop-shadow-sm"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points="50,2 98,50 50,98 2,50"
              className={cn(
                "fill-[var(--node-fill)]",
                selected ? "stroke-[var(--claude-accent)]" : "stroke-[var(--node-stroke)]",
              )}
              strokeWidth={selected ? 3 : 2}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          </svg>
          <div className="relative z-10 flex h-full w-full items-center justify-center px-4 text-[var(--node-text)]">
            {children}
          </div>
        </div>
      );

    case "result":
      return (
        <div
          className={cn(
            "relative flex h-full w-full items-center justify-center rounded-md bg-[var(--node-fill)] text-[var(--node-text)] shadow-sm overflow-hidden",
            borderCls,
          )}
          style={borderWidth}
        >
          <span
            className="absolute left-0 top-0 h-full w-2"
            style={{ background: "var(--result-accent)" }}
          />
          <span className="px-3 pl-5">{children}</span>
        </div>
      );
  }
}
