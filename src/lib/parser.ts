/**
 * parser.ts — .mmd file text → store data structures  (§9.2, §14.2)
 *
 * Handles:
 *  - MetadataV1 extraction (MMD_META_START / MMD_META_END block)
 *  - Mermaid flowchart / graph node + edge parsing
 *  - Block type inference from topology (§14.2)
 *  - Load integrity rules (§9.2)
 *  - Returns read-only flag for unsupported diagram types
 */

import type {
  Block,
  BlockType,
  Comment,
  Connection,
  ConnectionType,
  DirectionHint,
} from "../types/diagram";

// ── MetadataV1 types (§5.2) ────────────────────────────────────────────────────

interface MetadataV1BlockMeta {
  dataField?: string | null;
  expectedOutcome?: string | null;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  comments?: Array<{ id: string; text: string; timestamp: string }>;
}

interface MetadataV1 {
  version: string;
  meta: Record<string, MetadataV1BlockMeta>;
  connections?: Record<
    string,
    { waypoints?: Array<{ x: number; y: number }>; dataField?: string | null }
  >;
}

// ── Label unescaping ───────────────────────────────────────────────────────────

/** Strip Mermaid double-quote wrapping and unescape &quot; → " */
function unescapeLabel(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('"') && t.endsWith('"')) {
    return t.slice(1, -1).replace(/&quot;/g, '"');
  }
  return t;
}

// ── Regex patterns ─────────────────────────────────────────────────────────────

// Node definitions — checked in priority order (result before action to avoid misclassification)
const RE_PILL = /^\s*(\w+)\(\[(.+?)\]\)\s*$/; // ID([label])         → start or end
const RE_RESULT = /^\s*(\w+)\[\/(.+?)\/\]\s*$/; // ID[/label/]         → result
const RE_DECISION = /^\s*(\w+)\{(.+?)\}\s*$/; // ID{label}           → decision
const RE_ACTION = /^\s*(\w+)\[([^\\/].+?|[^\\/])\]\s*$/; // ID[label]         → action (first char not /)

// Edge definitions — checked in priority order (labeled edges before plain)
const RE_EDGE_YES = /^\s*(\w+)\s*--\s*Y\s*-->\s*(\w+)/;
const RE_EDGE_NO = /^\s*(\w+)\s*--\s*N\s*-->\s*(\w+)/;
const RE_EDGE_DEFAULT = /^\s*(\w+)\s*-->\s*(\w+)/;

const RE_DIRECTIVE = /^\s*(?:flowchart|graph)\s+(\w+)/i;

// ── Direction hint ────────────────────────────────────────────────────────────

function parseDirection(directiveLine: string): DirectionHint {
  const m = directiveLine.match(RE_DIRECTIVE);
  if (!m) return "TD";
  const d = m[1].toUpperCase() as DirectionHint;
  return (["TD", "LR", "TB", "BT", "RL"] as DirectionHint[]).includes(d)
    ? d
    : "TD";
}

// ── Public types ───────────────────────────────────────────────────────────────

export interface ParseSuccess {
  blocks: Map<string, Block>;
  connections: Map<string, Connection>;
  directionHint: DirectionHint;
  metadataVersion: "1" | null;
  warnings: string[];
}

export type ParseResult =
  | ({ ok: true } & ParseSuccess)
  | { ok: false; readOnly: true; mmd: string; reason: string };

// ── Main parser ────────────────────────────────────────────────────────────────

/**
 * Parse .mmd text into diagram data structures.
 * Applies load integrity rules from §9.2.
 */
export function parseMmd(text: string): ParseResult {
  const warnings: string[] = [];

  // ── Extract MetadataV1 block ────────────────────────────────────────────────

  const metaStartIdx = text.indexOf("%% MMD_META_START");
  const metaEndIdx = text.indexOf("%% MMD_META_END");

  let metadata: MetadataV1 | null = null;
  let metadataVersion: "1" | null = null;
  let mmdBody = text;

  if (metaStartIdx !== -1 && metaEndIdx !== -1 && metaEndIdx > metaStartIdx) {
    const metaSection = text.slice(
      metaStartIdx,
      metaEndIdx + "%% MMD_META_END".length,
    );
    const jsonLine = metaSection.split("\n").find((l) => /^%%\s*\{/.test(l));

    if (jsonLine) {
      const jsonStr = jsonLine.replace(/^%%\s*/, ""); // strip leading "%% "
      try {
        const parsed = JSON.parse(jsonStr) as MetadataV1;
        if (parsed.version !== "1") {
          // §9.2 rule 2: unsupported metadata version
          warnings.push(
            "Metadata could not be read. Comments and data fields were not loaded.",
          );
        } else {
          metadata = parsed;
          metadataVersion = "1";
        }
      } catch {
        // §9.2 rule 1: malformed JSON
        warnings.push(
          "Metadata could not be read. Comments and data fields were not loaded.",
        );
      }
    }

    // Mermaid body lives after the meta block
    mmdBody = text.slice(metaEndIdx + "%% MMD_META_END".length);
  }

  // ── Find and validate the flowchart directive ───────────────────────────────

  const lines = mmdBody.split("\n");
  const directiveLine = lines.find((l) => RE_DIRECTIVE.test(l));

  if (!directiveLine) {
    // §9.2 rule 4: non-flowchart/graph type → read-only
    return {
      ok: false,
      readOnly: true,
      mmd: text,
      reason: "Diagram type is not supported for editing.",
    };
  }

  const directionHint = parseDirection(directiveLine);

  // ── Parse node and edge lines ───────────────────────────────────────────────

  type RawNodeType = "pill" | "action" | "decision" | "result";
  const rawNodes = new Map<
    string,
    { nodeType: RawNodeType; label: string; index: number }
  >();
  const rawEdges: Array<{
    sourceId: string;
    targetId: string;
    type: ConnectionType;
  }> = [];
  let nodeIndex = 0;

  for (const line of lines) {
    if (RE_DIRECTIVE.test(line)) continue;
    if (/^\s*%%/.test(line)) continue;
    if (/^\s*$/.test(line)) continue;

    // Edge lines contain '-->'; check them before node patterns
    if (line.includes("-->")) {
      if (RE_EDGE_YES.test(line)) {
        const m = line.match(RE_EDGE_YES)!;
        rawEdges.push({ sourceId: m[1], targetId: m[2], type: "yes" });
      } else if (RE_EDGE_NO.test(line)) {
        const m = line.match(RE_EDGE_NO)!;
        rawEdges.push({ sourceId: m[1], targetId: m[2], type: "no" });
      } else {
        const m = line.match(RE_EDGE_DEFAULT);
        if (m)
          rawEdges.push({ sourceId: m[1], targetId: m[2], type: "default" });
      }
      continue;
    }

    // Node patterns — checked in priority order
    const pillMatch = line.match(RE_PILL);
    if (pillMatch) {
      rawNodes.set(pillMatch[1], {
        nodeType: "pill",
        label: unescapeLabel(pillMatch[2]),
        index: nodeIndex++,
      });
      continue;
    }

    const resultMatch = line.match(RE_RESULT);
    if (resultMatch) {
      rawNodes.set(resultMatch[1], {
        nodeType: "result",
        label: unescapeLabel(resultMatch[2]),
        index: nodeIndex++,
      });
      continue;
    }

    const decisionMatch = line.match(RE_DECISION);
    if (decisionMatch) {
      rawNodes.set(decisionMatch[1], {
        nodeType: "decision",
        label: unescapeLabel(decisionMatch[2]),
        index: nodeIndex++,
      });
      continue;
    }

    const actionMatch = line.match(RE_ACTION);
    if (actionMatch) {
      rawNodes.set(actionMatch[1], {
        nodeType: "action",
        label: unescapeLabel(actionMatch[2]),
        index: nodeIndex++,
      });
      continue;
    }
  }

  // ── Topology: count incoming / outgoing edges ───────────────────────────────

  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();

  for (const { sourceId, targetId } of rawEdges) {
    outgoingCount.set(sourceId, (outgoingCount.get(sourceId) ?? 0) + 1);
    incomingCount.set(targetId, (incomingCount.get(targetId) ?? 0) + 1);
  }

  // ── Classify pill nodes (§14.2) ─────────────────────────────────────────────

  const startCandidates: Array<{ id: string; index: number }> = [];

  const blocks = new Map<string, Block>();

  for (const [id, raw] of rawNodes) {
    let type: BlockType;

    if (raw.nodeType === "pill") {
      const hasIncoming = (incomingCount.get(id) ?? 0) > 0;
      if (!hasIncoming) {
        type = "start";
        startCandidates.push({ id, index: raw.index });
      } else {
        type = "end";
      }
    } else if (raw.nodeType === "decision") {
      type = "decision";
    } else if (raw.nodeType === "result") {
      type = "result";
    } else {
      type = "action";
    }

    // Position from metadata, or auto-distribute as fallback
    const meta = metadata?.meta?.[id];
    const position: { x: number; y: number } = meta?.position ?? {
      x: 360 + (raw.index % 4) * 200,
      y: 120 + Math.floor(raw.index / 4) * 150,
    };

    // Comments from metadata
    const comments: Comment[] = [];
    if (meta?.comments) {
      for (const c of meta.comments) {
        if (c.id && typeof c.text === "string" && c.timestamp) {
          comments.push({ id: c.id, text: c.text, timestamp: c.timestamp });
        }
      }
    }

    blocks.set(id, {
      id,
      type,
      label: raw.label,
      position,
      ...(meta?.width != null ? { width: meta.width } : {}),
      ...(meta?.height != null ? { height: meta.height } : {}),
      dataField: meta?.dataField ?? null,
      expectedOutcome: meta?.expectedOutcome ?? null,
      comments,
    });
  }

  // §9.2 rule 5: multiple start candidates → lowest index wins, others become end blocks
  if (startCandidates.length > 1) {
    startCandidates.sort((a, b) => a.index - b.index);
    const [, ...extras] = startCandidates;
    warnings.push(
      `Multiple start block candidates found. Using '${startCandidates[0].id}'; others treated as end blocks.`,
    );
    for (const extra of extras) {
      const block = blocks.get(extra.id);
      if (block) blocks.set(extra.id, { ...block, type: "end" });
    }
  }

  // ── Build connections ────────────────────────────────────────────────────────

  const connections = new Map<string, Connection>();
  const connMeta = metadata?.connections ?? {};

  for (const rawEdge of rawEdges) {
    const { sourceId, targetId, type } = rawEdge;
    // §9.2: discard edges referencing unknown nodes
    if (!blocks.has(sourceId) || !blocks.has(targetId)) continue;

    const id = crypto.randomUUID();
    const metaKey = `${sourceId}-${targetId}-${type}`;
    const waypoints = connMeta[metaKey]?.waypoints ?? [];
    const connDataField = connMeta[metaKey]?.dataField ?? null;

    connections.set(id, {
      id,
      sourceId,
      targetId,
      type,
      waypoints,
      dataField: connDataField,
    });
  }

  return {
    ok: true,
    blocks,
    connections,
    directionHint,
    metadataVersion,
    warnings,
  };
}
