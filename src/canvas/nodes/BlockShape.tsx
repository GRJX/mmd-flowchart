import type { ReactNode } from "react";
import type { BlockType } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Visual shapes for each block type (FO §2). The selected state is rendered
 * as an outline that follows the actual shape (circle / rounded-rect /
 * diamond / parallelogram) so the focus ring feels native to each type.
 *
 * Each type also gets a subtle background tint (`--node-fill-<type>` in
 * `globals.css`). Shape is the primary recognition cue; the tint is the
 * secondary cue that disambiguates Action vs Result (both rounded rects).
 */
interface Props {
  type: BlockType;
  selected: boolean;
  violation: boolean;
  children: ReactNode;
}

export function nodeFillVar(type: BlockType): string {
  return `var(--node-fill-${type})`;
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

  const fill = nodeFillVar(type);
  const fillStyle = { ...borderWidth, background: fill } as const;

  switch (type) {
    case "start":
    case "end":
      return (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full text-[var(--node-text)] shadow-sm",
            borderCls,
          )}
          style={fillStyle}
        >
          {children}
        </div>
      );

    case "action":
      return (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-xl text-[var(--node-text)] shadow-sm",
            borderCls,
          )}
          style={fillStyle}
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
                selected ? "stroke-[var(--claude-accent)]" : "stroke-[var(--node-stroke)]",
              )}
              fill={fill}
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
            "flex h-full w-full items-center justify-center rounded-xl text-[var(--node-text)] shadow-sm",
            borderCls,
          )}
          style={fillStyle}
        >
          {children}
        </div>
      );
  }
}
