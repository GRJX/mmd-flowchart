import type { Block, Connection, Diagram } from "@/types/domain";
import { BLOCK_TYPES_ORDERED } from "@/config/blockConfig";
import { buildMetaBlock } from "./metadata";

/**
 * Serialize a Diagram into a `.mmd` file (FO.md §4).
 *
 * - Metadata block first
 * - `flowchart TD` header
 * - Node declarations in the fixed order: Start, Action, Decision, Result, End
 * - Edges via depth-first traversal from Start; unreachable subgraphs appended
 */

export function serializeMmd(diagram: Diagram): string {
  const meta = buildMetaBlock(diagram.blocks, diagram.connections);
  const body = buildBody(diagram);
  return `${meta}\n${body}\n`;
}

function buildBody(diagram: Diagram): string {
  const lines: string[] = ["flowchart TD"];

  // Node declarations
  const byType = groupByType(diagram.blocks);
  for (const type of BLOCK_TYPES_ORDERED) {
    const list = byType[type] ?? [];
    list.sort(numericIdCompare);
    for (const b of list) {
      lines.push(`    ${nodeDecl(b)}`);
    }
  }

  // Edges via DFS from Start; unreachable appended
  const edgeLines = orderEdges(diagram);
  for (const edge of edgeLines) {
    lines.push(`    ${edgeDecl(edge, diagram)}`);
  }

  return lines.join("\n");
}

function groupByType(
  blocks: Record<string, Block>,
): Record<Block["type"], Block[]> {
  const out: Record<Block["type"], Block[]> = {
    start: [],
    action: [],
    decision: [],
    result: [],
    end: [],
  };
  for (const b of Object.values(blocks)) out[b.type].push(b);
  return out;
}

function numericIdCompare(a: Block, b: Block): number {
  const na = parseInt(a.id.replace(/^[A-Za-z]+/, ""), 10);
  const nb = parseInt(b.id.replace(/^[A-Za-z]+/, ""), 10);
  const va = isNaN(na) ? 0 : na;
  const vb = isNaN(nb) ? 0 : nb;
  if (va !== vb) return va - vb;
  return a.id.localeCompare(b.id);
}

function escapeLabel(label: string): string {
  // Quote if the label contains special characters; escape any quotes inside.
  const needsQuotes = /["'()\[\]{}|/\\<>#:%&=+,;]/.test(label) || /\s/.test(label);
  const cleaned = label.replace(/"/g, '\\"');
  return needsQuotes ? `"${cleaned}"` : cleaned;
}

function nodeDecl(block: Block): string {
  const label = escapeLabel(block.label);
  switch (block.type) {
    case "start":
    case "end":
      return `${block.id}([${label}])`;
    case "action":
      return `${block.id}[${label}]`;
    case "decision":
      return `${block.id}{${label}}`;
    case "result":
      return `${block.id}[/${label}/]`;
  }
}

function edgeDecl(conn: Connection, _diagram: Diagram): string {
  const lbl = mermaidEdgeLabel(conn);
  if (lbl == null) return `${conn.source} --> ${conn.target}`;
  return `${conn.source} -- ${lbl} --> ${conn.target}`;
}

/**
 * Decide how to render an edge label. Decision-branch edges default to the
 * canonical `Y` / `N` short form, but the user may have rewritten the label
 * — in that case we emit the custom text and rely on the meta-block to keep
 * the semantic kind. Default edges with empty labels render label-less.
 */
function mermaidEdgeLabel(conn: Connection): string | null {
  let lbl = conn.label.trim();
  if (conn.kind === "yes" && !lbl) lbl = "Y";
  if (conn.kind === "no" && !lbl) lbl = "N";
  if (!lbl) return null;
  return /\s|[-"'(){}\[\]<>]/.test(lbl) ? `"${lbl.replace(/"/g, '\\"')}"` : lbl;
}

/**
 * Order edges so the file is readable: depth-first from Start, then any
 * remaining unreachable edges (grouped by source).
 */
function orderEdges(diagram: Diagram): Connection[] {
  const out: Connection[] = [];
  const visited = new Set<string>();
  const edgesBySource = new Map<string, Connection[]>();

  for (const c of Object.values(diagram.connections)) {
    const list = edgesBySource.get(c.source) ?? [];
    list.push(c);
    edgesBySource.set(c.source, list);
  }
  // Sort children deterministically: yes → no → default, then by target id
  for (const list of edgesBySource.values()) {
    list.sort(edgeOrdering);
  }

  const visit = (source: string) => {
    const children = edgesBySource.get(source) ?? [];
    for (const c of children) {
      if (visited.has(c.id)) continue;
      visited.add(c.id);
      out.push(c);
      visit(c.target);
    }
  };

  if (diagram.blocks["S"]) visit("S");

  // Append any edges not reached
  for (const c of Object.values(diagram.connections)) {
    if (visited.has(c.id)) continue;
    visited.add(c.id);
    out.push(c);
  }

  return out;
}

function edgeOrdering(a: Connection, b: Connection): number {
  const order = { yes: 0, no: 1, default: 2 } as const;
  if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
  return a.target.localeCompare(b.target);
}
