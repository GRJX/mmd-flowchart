import type { Edge, Node } from "@xyflow/react";
import type { Block, Connection, HandleSide } from "@/types/domain";
import { sourceHandleId, targetHandleId } from "@/lib/ids";

/**
 * Adapter between our domain model (Block/Connection) and React Flow's
 * Node/Edge. The canvas re-derives RF state from the store on each render —
 * the store is the single source of truth.
 */

export type BlockNodeData = {
  block: Block;
  isNew: boolean;
  violation: boolean;
  /** Sides with an outgoing connection (used to show handle as "used"). */
  outgoingSides: Set<HandleSide>;
  /** Sides with an incoming connection. */
  incomingSides: Set<HandleSide>;
  /** Counts used for decision Y/N stem visibility. */
  hasYes: boolean;
  hasNo: boolean;
};

export type BlockNode = Node<BlockNodeData, "blockNode">;

export type EdgeData = {
  connection: Connection;
};

export type FlowEdge = Edge<EdgeData, "flowEdge">;

export function blocksToNodes(
  blocks: Record<string, Block>,
  connections: Record<string, Connection>,
  selection: { blockIds: Set<string>; connectionIds: Set<string> },
  newBlockIds: Set<string>,
  violationIds: Set<string>,
): BlockNode[] {
  const outgoingBySource = new Map<string, Set<HandleSide>>();
  const incomingByTarget = new Map<string, Set<HandleSide>>();
  const hasYes = new Set<string>();
  const hasNo = new Set<string>();

  for (const c of Object.values(connections)) {
    const s = outgoingBySource.get(c.source) ?? new Set();
    s.add(c.sourceSide);
    outgoingBySource.set(c.source, s);

    const t = incomingByTarget.get(c.target) ?? new Set();
    t.add(c.targetSide);
    incomingByTarget.set(c.target, t);

    if (c.kind === "yes") hasYes.add(c.source);
    if (c.kind === "no") hasNo.add(c.source);
  }

  return Object.values(blocks).map((b) => ({
    id: b.id,
    type: "blockNode" as const,
    position: b.position,
    selected: selection.blockIds.has(b.id),
    width: b.width,
    height: b.height,
    data: {
      block: b,
      isNew: newBlockIds.has(b.id),
      violation: violationIds.has(b.id),
      outgoingSides: outgoingBySource.get(b.id) ?? new Set(),
      incomingSides: incomingByTarget.get(b.id) ?? new Set(),
      hasYes: hasYes.has(b.id),
      hasNo: hasNo.has(b.id),
    },
    dragHandle: ".node-drag-handle",
  }));
}

export function connectionsToEdges(
  connections: Record<string, Connection>,
  selection: { blockIds: Set<string>; connectionIds: Set<string> },
): FlowEdge[] {
  return Object.values(connections).map((c) => ({
    id: c.id,
    source: c.source,
    target: c.target,
    sourceHandle: sourceHandleId(c.sourceSide),
    targetHandle: targetHandleId(c.targetSide),
    type: "flowEdge" as const,
    selected: selection.connectionIds.has(c.id),
    label: c.label,
    data: { connection: c },
  }));
}
