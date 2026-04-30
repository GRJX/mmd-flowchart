import type { BlockType } from "@/types/domain";
import { nodeFillVar } from "@/canvas/nodes/BlockShape";

/**
 * Miniature preview of each block shape, rendered next to the palette label.
 * Shapes mirror BlockShape.tsx but at a fixed 40×28 footprint. The fill uses
 * the per-type tint so the palette entries match the canvas exactly.
 */
export function PaletteThumbnail({ type }: { type: BlockType }) {
  const fill = nodeFillVar(type);
  switch (type) {
    case "start":
    case "end":
      return (
        <svg width="40" height="28" viewBox="0 0 40 28" aria-hidden>
          <rect
            x="1"
            y="1"
            width="38"
            height="26"
            rx="13"
            ry="13"
            fill={fill}
            stroke="var(--node-stroke)"
            strokeWidth={1.5}
          />
        </svg>
      );

    case "action":
    case "result":
      return (
        <svg width="40" height="28" viewBox="0 0 40 28" aria-hidden>
          <rect
            x="1"
            y="1"
            width="38"
            height="26"
            rx="6"
            ry="6"
            fill={fill}
            stroke="var(--node-stroke)"
            strokeWidth={1.5}
          />
        </svg>
      );

    case "decision":
      return (
        <svg width="40" height="28" viewBox="0 0 40 28" aria-hidden>
          <polygon
            points="20,1 39,14 20,27 1,14"
            fill={fill}
            stroke="var(--node-stroke)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
