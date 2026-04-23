import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import type { FlowEdge as FlowEdgeType } from "@/canvas/rfAdapter";
import { cn } from "@/lib/utils";

/**
 * Orthogonal edge with lightly rounded corners (FO §3). Labels sit on top
 * of the path with a solid background so they read clearly against the
 * grid.
 */
function FlowEdgeInner(props: EdgeProps<FlowEdgeType>) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    markerEnd,
    data,
  } = props;

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 10,
  });

  const label = data?.connection.label ?? "";

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "absolute rounded px-1.5 py-0.5 text-xs font-medium",
              "bg-[var(--claude-bg)] text-[var(--claude-text-primary)] border border-[var(--claude-border)]",
              selected && "border-[var(--claude-accent)] text-[var(--claude-accent)]",
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const FlowEdgeComponent = memo(FlowEdgeInner);
