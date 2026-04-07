/**
 * serializer.ts — Store → .mmd file text  (§5.1 – §5.5, §9.1)
 *
 * Format:
 *   %% MMD_META_START
 *   %% {MetadataV1 JSON}
 *   %% MMD_META_END
 *   flowchart TD
 *       S([Start])
 *       A1[Action]
 *       D1{Decision?}
 *       ...
 *       S --> A1
 *       ...
 */

import type {
  Block,
  BlockType,
  Connection,
  DiagramFile,
} from "../types/diagram";

// ── MetadataV1 types (§5.2) ────────────────────────────────────────────────────

interface MetadataV1BlockMeta {
  dataField: string | null;
  expectedOutcome: string | null;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  comments: Array<{ id: string; text: string; timestamp: string }>;
}

interface MetadataV1 {
  version: "1";
  meta: Record<string, MetadataV1BlockMeta>;
  connections: Record<string, { waypoints: Array<{ x: number; y: number }> }>;
}

// ── Label escaping ─────────────────────────────────────────────────────────────

/**
 * Wrap a label in Mermaid double-quote syntax when it contains characters that
 * would break the Mermaid parser.  Inner double-quotes are replaced by &quot;.
 */
const NEEDS_QUOTING = /[[\]{}<>()|"'\\,;:!@#$%^&*+=`~?\n\r/]/;

function escapeMermaidLabel(label: string): string {
  return NEEDS_QUOTING.test(label)
    ? `"${label.replace(/"/g, "&quot;")}"`
    : label;
}

// ── Node / edge line builders ──────────────────────────────────────────────────

function nodeDefLine(block: Block): string {
  const lbl = escapeMermaidLabel(block.label);
  switch (block.type) {
    case "start":
    case "end":
      return `    ${block.id}([${lbl}])`;
    case "action":
      return `    ${block.id}[${lbl}]`;
    case "decision":
      return `    ${block.id}{${lbl}}`;
    case "result":
      return `    ${block.id}[/${lbl}/]`;
  }
}

function edgeDefLine(conn: Connection): string {
  switch (conn.type) {
    case "yes":
      return `    ${conn.sourceId} -- Y --> ${conn.targetId}`;
    case "no":
      return `    ${conn.sourceId} -- N --> ${conn.targetId}`;
    default:
      return `    ${conn.sourceId} --> ${conn.targetId}`;
  }
}

// ── Block ordering (§5.3): S → A1..An → D1..Dn → R1..Rn → E1..En ─────────────

function numericSuffix(id: string): number {
  const m = id.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

function sortBlocks(blocks: Map<string, Block>): Block[] {
  const groups: Record<BlockType, Block[]> = {
    start: [],
    action: [],
    decision: [],
    result: [],
    end: [],
  };
  for (const block of blocks.values()) {
    groups[block.type].push(block);
  }
  for (const type of ["action", "decision", "result", "end"] as const) {
    groups[type].sort((a, b) => numericSuffix(a.id) - numericSuffix(b.id));
  }
  return [
    ...groups.start,
    ...groups.action,
    ...groups.decision,
    ...groups.result,
    ...groups.end,
  ];
}

// ── Edge DFS ordering from start block (§5.3) ─────────────────────────────────

function collectEdgesDfs(
  startId: string,
  adjOut: Map<string, Connection[]>,
  allConns: Connection[],
): Connection[] {
  const ordered: Connection[] = [];
  const visited = new Set<string>(); // connection IDs

  function dfs(nodeId: string): void {
    const outgoing = adjOut.get(nodeId) ?? [];
    for (const conn of outgoing) {
      if (visited.has(conn.id)) continue;
      visited.add(conn.id);
      ordered.push(conn);
      dfs(conn.targetId);
    }
  }

  dfs(startId);

  // Append any connections not reachable from start (disconnected subgraphs)
  for (const conn of allConns) {
    if (!visited.has(conn.id)) ordered.push(conn);
  }

  return ordered;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export type SerializeResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

/**
 * Serialize a DiagramFile to .mmd text.
 * Applies integrity rules §9.1 — drops silent violations, blocks fatal ones.
 */
export function serializeDiagram(diagram: DiagramFile): SerializeResult {
  const { blocks, connections, directionHint } = diagram;

  // §9.1: Exactly one start block
  const startBlocks = [...blocks.values()].filter((b) => b.type === "start");
  if (startBlocks.length === 0) {
    return { ok: false, error: "Diagram must have exactly one Start block." };
  }
  if (startBlocks.length > 1) {
    return {
      ok: false,
      error: "Diagram must have exactly one Start block (found multiple).",
    };
  }
  const startBlock = startBlocks[0];

  const endBlockIds = new Set(
    [...blocks.values()].filter((b) => b.type === "end").map((b) => b.id),
  );

  // §9.1: Filter and validate connections
  const seenDecisionYes = new Map<string, true>();
  const seenDecisionNo = new Map<string, true>();
  const validConns: Connection[] = [];

  for (const conn of connections.values()) {
    // Orphaned — source or target missing from blocks
    if (!blocks.has(conn.sourceId) || !blocks.has(conn.targetId)) {
      console.warn(
        `[serializer] Dropping orphaned connection ${conn.id}: ${conn.sourceId} → ${conn.targetId}`,
      );
      continue;
    }

    // Start block can't be targetId
    if (conn.targetId === startBlock.id) {
      console.warn(
        `[serializer] Dropping connection ${conn.id}: start block cannot be a target`,
      );
      continue;
    }

    // End block can't be sourceId
    if (endBlockIds.has(conn.sourceId)) {
      console.warn(
        `[serializer] Dropping connection ${conn.id}: end block cannot be a source`,
      );
      continue;
    }

    // Decision: at most one yes and one no per sourceId (last wins → first dropped)
    if (conn.type === "yes") {
      if (seenDecisionYes.get(conn.sourceId)) {
        console.warn(
          `[serializer] Dropping duplicate 'yes' connection from ${conn.sourceId}`,
        );
        continue;
      }
      seenDecisionYes.set(conn.sourceId, true);
    }
    if (conn.type === "no") {
      if (seenDecisionNo.get(conn.sourceId)) {
        console.warn(
          `[serializer] Dropping duplicate 'no' connection from ${conn.sourceId}`,
        );
        continue;
      }
      seenDecisionNo.set(conn.sourceId, true);
    }

    validConns.push(conn);
  }

  // ── Build MetadataV1 ─────────────────────────────────────────────────────────

  const metaBlocks: MetadataV1["meta"] = {};
  for (const block of blocks.values()) {
    metaBlocks[block.id] = {
      dataField: block.dataField,
      expectedOutcome: block.expectedOutcome,
      position: { x: block.position.x, y: block.position.y },
      ...(block.width != null ? { width: block.width } : {}),
      ...(block.height != null ? { height: block.height } : {}),
      comments: block.comments.map((c) => ({
        id: c.id,
        text: c.text,
        timestamp: c.timestamp,
      })),
    };
  }

  const metaConns: MetadataV1["connections"] = {};
  for (const conn of validConns) {
    const key = `${conn.sourceId}-${conn.targetId}-${conn.type}`;
    metaConns[key] = { waypoints: conn.waypoints };
  }

  const metadata: MetadataV1 = {
    version: "1",
    meta: metaBlocks,
    connections: metaConns,
  };

  let metaJson: string;
  try {
    metaJson = JSON.stringify(metadata);
  } catch {
    return { ok: false, error: "Failed to serialize diagram metadata." };
  }

  // ── Assemble node lines ──────────────────────────────────────────────────────

  const sortedBlocks = sortBlocks(blocks);
  const nodeLines = sortedBlocks.map(nodeDefLine);

  // ── Assemble edge lines (DFS from start) ─────────────────────────────────────

  const adjOut = new Map<string, Connection[]>();
  for (const conn of validConns) {
    if (!adjOut.has(conn.sourceId)) adjOut.set(conn.sourceId, []);
    adjOut.get(conn.sourceId)!.push(conn);
  }
  const orderedConns = collectEdgesDfs(startBlock.id, adjOut, validConns);
  const edgeLines = orderedConns.map(edgeDefLine);

  // ── Build file text ──────────────────────────────────────────────────────────

  const lines = [
    "%% MMD_META_START",
    `%% ${metaJson}`,
    "%% MMD_META_END",
    `flowchart ${directionHint}`,
    ...nodeLines,
    ...edgeLines,
  ];

  return { ok: true, content: lines.join("\n") + "\n" };
}
