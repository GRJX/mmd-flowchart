import { memo, useEffect, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getBlockConfig } from "@/config/blockConfig";
import { useDiagramStore } from "@/store/diagramStore";
import type { BlockNode } from "@/canvas/rfAdapter";
import { cn } from "@/lib/utils";
import type { HandleSide } from "@/types/domain";
import { sourceHandleId, targetHandleId } from "@/lib/ids";
import { BlockShape } from "./BlockShape";

const SIDE_TO_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

/**
 * Single node component for all block types. The visual shape is delegated
 * to `BlockShape`; handles are placed based on the per-type config so new
 * block types only require a config entry.
 *
 * Each side declared in `incomingSides` gets a target handle, and each side
 * in `outgoingHandles` gets a source handle — both can coexist on the same
 * side (they stack visually as a single dot).
 */
function BlockNodeInner(props: NodeProps<BlockNode>) {
  const { data, selected } = props;
  const block = data.block;
  const cfg = getBlockConfig(block.type);

  const setBlockLabel = useDiagramStore((s) => s.setBlockLabel);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.label);

  useEffect(() => setDraft(block.label), [block.label]);

  const commit = () => {
    const next = draft.trim();
    if (!next || !cfg.labelEditable) {
      setDraft(block.label);
      setEditing(false);
      return;
    }
    if (next !== block.label) setBlockLabel(block.id, next);
    setEditing(false);
  };

  const onDoubleClick = () => {
    if (cfg.labelEditable) setEditing(true);
  };

  const commentCount = block.comments.length;

  return (
    <div
      className={cn(
        "node-drag-handle relative select-none",
        data.violation && "animate-violation rounded-[inherit]",
      )}
      style={{ width: block.width, height: block.height }}
      onDoubleClick={onDoubleClick}
    >
      <BlockShape
        type={block.type}
        selected={!!selected}
        violation={data.violation}
      >
        {editing ? (
          <textarea
            autoFocus
            className="w-[90%] resize-none bg-transparent text-center text-sm leading-tight outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setDraft(block.label);
                setEditing(false);
              }
              e.stopPropagation();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="pointer-events-none px-2 text-center text-sm font-medium leading-tight">
            {block.label}
          </span>
        )}
      </BlockShape>

      {commentCount > 0 && (
        <span
          className="pointer-events-none absolute z-10 inline-flex h-5 min-w-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-[var(--claude-accent)] px-1.5 text-[10px] font-semibold text-white shadow-sm"
          style={
            block.type === "decision"
              ? { top: "25%", right: "25%" }
              : { top: 0, right: 0 }
          }
          title={`${commentCount} comment${commentCount === 1 ? "" : "s"}`}
        >
          {commentCount}
        </span>
      )}

      {cfg.incomingSides.map((side) => (
        <Handle
          key={`tgt-${side}`}
          id={targetHandleId(side)}
          type="target"
          position={SIDE_TO_POSITION[side]}
        />
      ))}

      {cfg.outgoingHandles.map((side) => (
        <Handle
          key={`src-${side}`}
          id={sourceHandleId(side)}
          type="source"
          position={SIDE_TO_POSITION[side]}
        />
      ))}
    </div>
  );
}

export const BlockNodeComponent = memo(BlockNodeInner);
