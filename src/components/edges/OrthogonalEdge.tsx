import { useState, useCallback } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore'

/**
 * Computes a 3-segment orthogonal SVG path through a single waypoint.
 * Path: source → (wpX, sourceY) → (wpX, targetY) → target
 */
function getOrthogonalPathWithWaypoint(
  sx: number, sy: number,
  wpX: number,
  tx: number, ty: number,
): string {
  return `M ${sx} ${sy} L ${wpX} ${sy} L ${wpX} ${ty} L ${tx} ${ty}`
}

/**
 * Custom edge that renders as an orthogonal (right-angle) arrow.
 *
 * - No waypoints: uses React Flow's smoothstep path (right-angle auto-routing).
 * - One waypoint: routes through it via a 3-segment orthogonal path.
 * - Selected or waypoint present: shows a draggable midpoint handle.
 * - Y/N connections get a small label badge at the edge midpoint.
 */
export function OrthogonalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
  style,
}: EdgeProps) {
  const { screenToFlowPosition } = useReactFlow()
  const updateConnectionWaypoints = useAppStore((s) => s.updateConnectionWaypoints)

  const [dragging, setDragging] = useState(false)
  const [liveWp, setLiveWp] = useState<{ x: number; y: number } | null>(null)

  const waypoints = (data?.waypoints as Array<{ x: number; y: number }> | undefined) ?? []
  const storedWp = waypoints[0] ?? null
  const activeWp = liveWp ?? storedWp

  // ── Path computation ──────────────────────────────────────────────────────

  let edgePath: string
  let handleX: number
  let handleY: number

  if (activeWp) {
    edgePath = getOrthogonalPathWithWaypoint(sourceX, sourceY, activeWp.x, targetX, targetY)
    handleX = activeWp.x
    handleY = (sourceY + targetY) / 2
  } else {
    const [path, lx, ly] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 4,
    })
    edgePath = path
    handleX = lx
    handleY = ly
  }

  const labelX = (sourceX + targetX) / 2
  const labelY = (sourceY + targetY) / 2
  const connectionType = data?.connectionType as string | undefined

  // ── Waypoint drag handling ────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      setDragging(true)
      setLiveWp(activeWp ?? { x: handleX, y: handleY })
    },
    [activeWp, handleX, handleY],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setLiveWp(pos)
    },
    [dragging, screenToFlowPosition],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      setDragging(false)
      if (liveWp) updateConnectionWaypoints(id, [liveWp])
      setLiveWp(null)
    },
    [dragging, liveWp, id, updateConnectionWaypoints],
  )

  // Show handle when edge is selected OR a stored waypoint exists
  const showHandle = selected || !!storedWp

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />

      {/* Y / N connection label */}
      {connectionType && connectionType !== 'default' && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label edge-label--${connectionType}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              position: 'absolute',
              pointerEvents: 'none',
            }}
          >
            {connectionType === 'yes' ? 'Y' : 'N'}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Midpoint waypoint drag handle */}
      {showHandle && (
        <EdgeLabelRenderer>
          <div
            className={`edge-waypoint-handle${dragging ? ' edge-waypoint-handle--dragging' : ''}`}
            title="Drag to add a bend"
            style={{
              transform: `translate(-50%, -50%) translate(${handleX}px,${handleY}px)`,
              position: 'absolute',
              pointerEvents: 'all',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </EdgeLabelRenderer>
      )}
    </>
  )
}
