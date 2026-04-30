import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
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

  // Plaats het label op een vaste afstand van de source-handle, langs de
  // richting waarin de edge vertrekt. Daardoor zit het label altijd vlak na
  // de uitgang van het bron-blok — onafhankelijk van de totale lengte van
  // de verbinding. `labelX`/`labelY` (het smoothstep-midden) worden alleen
  // nog gebruikt als fallback voor onbekende oriëntaties.
  const LABEL_OFFSET = 8;
  let labelPosX = sourceX;
  let labelPosY = sourceY;
  switch (sourcePosition) {
    case Position.Top:
      labelPosY = sourceY - LABEL_OFFSET;
      break;
    case Position.Right:
      labelPosX = sourceX + LABEL_OFFSET;
      break;
    case Position.Bottom:
      labelPosY = sourceY + LABEL_OFFSET;
      break;
    case Position.Left:
      labelPosX = sourceX - LABEL_OFFSET;
      break;
    default:
      labelPosX = labelX;
      labelPosY = labelY;
  }

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
              transform: `translate(-50%, -50%) translate(${labelPosX}px, ${labelPosY}px)`,
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
