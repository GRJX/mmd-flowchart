import { getBlockConfig } from "@/config/blockConfig";
import type {
  Block,
  Connection,
  ConnectionKind,
  Diagram,
  HandleSide,
} from "@/types/domain";
import { inferBlockTypeFromId } from "@/lib/ids";
import { makeConnectionId } from "@/lib/ids";
import { extractMetaBlock, type DiagramMetaV1 } from "./metadata";

/**
 * Parse a `.mmd` file into a Diagram. Expects flowchart syntax.
 *
 * Node syntax (FO.md §4):
 *   Start / End : S([Label])    / E1([End])
 *   Action      : A1[Label]      or A1["Label with special chars"]
 *   Decision    : D1{Label?}     or D1{"Label"}
 *   Result      : R1[/Label/]    or R1[/"Label"/]
 *
 * Edge syntax:
 *   A1 --> B1
 *   D1 -- Y --> R1      (yes branch)
 *   D1 -- N --> E1      (no branch)
 *   A1 -- label --> B1  (free text; default kind)
 */

export interface ParseResult {
  diagram: Diagram;
  multipleStartCandidates: boolean;
  metaWasUnreadable: boolean;
}

const NODE_PATTERNS: {
  re: RegExp;
  extract: (m: RegExpExecArray) => { id: string; label: string };
}[] = [
  // S([Start]) / E1([End]) — circle (stadium)
  {
    re: /^([A-Za-z][A-Za-z0-9_]*)\(\[\s*(?:"(.*?)"|(.+?))\s*\]\)$/,
    extract: (m) => ({ id: m[1]!, label: m[2] ?? m[3] ?? "" }),
  },
  // D1{Label?} — diamond
  {
    re: /^([A-Za-z][A-Za-z0-9_]*)\{\s*(?:"(.*?)"|(.+?))\s*\}$/,
    extract: (m) => ({ id: m[1]!, label: m[2] ?? m[3] ?? "" }),
  },
  // R1[/Label/] — parallelogram
  {
    re: /^([A-Za-z][A-Za-z0-9_]*)\[\/\s*(?:"(.*?)"|(.+?))\s*\/\]$/,
    extract: (m) => ({ id: m[1]!, label: m[2] ?? m[3] ?? "" }),
  },
  // A1[Label] — rectangle (catch-all; must come last)
  {
    re: /^([A-Za-z][A-Za-z0-9_]*)\[\s*(?:"(.*?)"|(.+?))\s*\]$/,
    extract: (m) => ({ id: m[1]!, label: m[2] ?? m[3] ?? "" }),
  },
];

interface EdgeLine {
  source: string;
  target: string;
  rawLabel: string | null;
}

// Matches:   A --> B    A -- "lbl" --> B    A -- lbl --> B
const EDGE_RE =
  /^([A-Za-z][A-Za-z0-9_]*)\s*(?:--\s*(?:"([^"]*)"|([^-][^-]*?))\s*-->|-->)\s*([A-Za-z][A-Za-z0-9_]*)$/;

/**
 * Reverse of `mermaidEscape` in serialize.ts. Numeric HTML entities the
 * serializer emitted (`#amp; #quot; #lt; #gt;`) are decoded back to the
 * literal characters so the editor model holds plain text.
 */
function mermaidUnescape(s: string): string {
  return s
    .replace(/#quot;/g, '"')
    .replace(/#lt;/g, "<")
    .replace(/#gt;/g, ">")
    .replace(/#amp;/g, "&");
}

function parseEdgeLine(line: string): EdgeLine | null {
  const m = EDGE_RE.exec(line);
  if (!m) return null;
  const source = m[1]!;
  const target = m[4]!;
  const labelQuoted = m[2];
  const labelBare = m[3]?.trim();
  const raw = labelQuoted ?? labelBare ?? null;
  const rawLabel = raw == null ? null : mermaidUnescape(raw);
  return { source, target, rawLabel };
}

function tryParseNodeDecl(
  line: string,
): { id: string; label: string; shape: "stadium" | "diamond" | "parallelogram" | "rect" } | null {
  for (let i = 0; i < NODE_PATTERNS.length; i++) {
    const pat = NODE_PATTERNS[i]!;
    const m = pat.re.exec(line);
    if (m) {
      const { id, label } = pat.extract(m);
      const shape =
        i === 0 ? "stadium" : i === 1 ? "diamond" : i === 2 ? "parallelogram" : "rect";
      return { id, label: mermaidUnescape(label), shape };
    }
  }
  return null;
}

function mapLabelToKind(label: string | null): ConnectionKind {
  if (!label) return "default";
  const t = label.trim().toUpperCase();
  if (t === "Y" || t === "YES") return "yes";
  if (t === "N" || t === "NO") return "no";
  return "default";
}

function tokenizeEdgeLine(line: string): string[] {
  // Split compound edge lines like "A --> B --> C" into segments
  // Because Mermaid supports chaining, we keep it simple and only accept
  // single-edge declarations per line. If future writers emit chains, this
  // tokenizer can be extended.
  return [line];
}

export function parseMmd(source: string): ParseResult {
  const { meta, body, hadMetaButUnreadable } = extractMetaBlock(source);

  const blocks: Record<string, Block> = {};
  const connections: Record<string, Connection> = {};
  const seenIds = new Set<string>();
  const startCandidates: string[] = [];

  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) => l.length > 0 && !l.startsWith("%%") && !/^(flowchart|graph)\b/i.test(l),
    );

  // Pass 1 — node declarations
  for (const line of lines) {
    const node = tryParseNodeDecl(line);
    if (!node) continue;
    const type = shapeAndIdToType(node.id, node.shape);
    if (!type) continue;
    if (seenIds.has(node.id)) continue;
    seenIds.add(node.id);

    const cfg = getBlockConfig(type);
    const m = meta?.meta?.[node.id];
    const label = cfg.labelEditable ? node.label : cfg.defaultLabel;
    // Geen enkel bloktype heeft (nog) een resize-UI, dus de defaults uit
    // `blockConfig.ts` zijn altijd autoritief. Daardoor schalen bestaande
    // bestanden vanzelf mee als de defaults wijzigen — voorkomt knikken in
    // verbindingen na een tweak van bv. Action/Result-hoogte.

    blocks[node.id] = {
      id: node.id,
      type,
      label,
      position: m?.position ?? { x: 0, y: 0 },
      width: cfg.defaultSize.width,
      height: cfg.defaultSize.height,
      dataField: cfg.supportsDataField ? m?.dataField ?? null : null,
      expectedOutcome: cfg.supportsExpectedOutcome ? m?.expectedOutcome ?? null : null,
      yesDataField: type === "decision" ? m?.yesDataField ?? null : null,
      noDataField: type === "decision" ? m?.noDataField ?? null : null,
      comments: m?.comments ?? [],
    };

    if (type === "start") startCandidates.push(node.id);
  }

  // Pass 2 — implicit nodes mentioned in edges without decls
  for (const line of lines) {
    for (const seg of tokenizeEdgeLine(line)) {
      const e = parseEdgeLine(seg);
      if (!e) continue;
      for (const id of [e.source, e.target]) {
        if (seenIds.has(id)) continue;
        const type = inferBlockTypeFromId(id);
        if (!type) continue;
        const cfg = getBlockConfig(type);
        const m = meta?.meta?.[id];
        blocks[id] = {
          id,
          type,
          label: cfg.defaultLabel,
          position: m?.position ?? { x: 0, y: 0 },
          width: cfg.defaultSize.width,
          height: cfg.defaultSize.height,
          dataField: cfg.supportsDataField ? m?.dataField ?? null : null,
          expectedOutcome: cfg.supportsExpectedOutcome ? m?.expectedOutcome ?? null : null,
          yesDataField: type === "decision" ? m?.yesDataField ?? null : null,
          noDataField: type === "decision" ? m?.noDataField ?? null : null,
          comments: m?.comments ?? [],
        };
        seenIds.add(id);
        if (type === "start") startCandidates.push(id);
      }
    }
  }

  // Multiple-start handling: FO.md §12 — keep the canonical "S" and demote
  // the rest to ends.
  let multipleStarts = false;
  if (startCandidates.length > 1) {
    multipleStarts = true;
    const keep = startCandidates.includes("S") ? "S" : startCandidates[0]!;
    for (const id of startCandidates) {
      if (id === keep) continue;
      const b = blocks[id];
      if (!b) continue;
      // Demote to end
      const endCfg = getBlockConfig("end");
      blocks[id] = {
        ...b,
        type: "end",
        label: endCfg.defaultLabel,
        width: endCfg.defaultSize.width,
        height: endCfg.defaultSize.height,
        yesDataField: null,
        noDataField: null,
      };
    }
  }

  // Pass 3 — edges
  for (const line of lines) {
    for (const seg of tokenizeEdgeLine(line)) {
      const e = parseEdgeLine(seg);
      if (!e) continue;
      if (!blocks[e.source] || !blocks[e.target]) continue;

      // Derive a tentative kind from the label, then prefer the persisted
      // metadata kind for decision edges. The label is just a visual hint —
      // the user may have rewritten "Y" → "Ja" or even "Y" → "N" without
      // intending to flip the semantic branch. When metadata exists for
      // this source→target pair we treat its `kind` as authoritative.
      let kind = mapLabelToKind(e.rawLabel);
      if (blocks[e.source]!.type === "decision") {
        const matches = Object.entries(meta?.connections ?? {}).filter(
          ([mid]) => mid.startsWith(`${e.source}-${e.target}-`),
        );
        if (matches.length === 1 && matches[0]![1].kind) {
          kind = matches[0]![1].kind;
        } else if (matches.length > 1 && kind === "default") {
          for (const [, cMeta] of matches) {
            if (cMeta.kind && cMeta.kind !== "default") {
              kind = cMeta.kind;
              break;
            }
          }
        }
      }

      const id = makeConnectionId(e.source, e.target, kind);
      if (connections[id]) continue; // dedupe

      const isDecisionBranch =
        blocks[e.source]!.type === "decision" && (kind === "yes" || kind === "no");

      let label = e.rawLabel?.trim() ?? "";
      if (isDecisionBranch && (!label || label.toUpperCase() === (kind === "yes" ? "YES" : "NO"))) {
        label = kind === "yes" ? "Y" : "N";
      }

      const cMeta = meta?.connections?.[id];
      const srcBlock = blocks[e.source]!;
      const srcCfg = getBlockConfig(srcBlock.type);
      const defaultSourceSide: HandleSide =
        srcBlock.type === "decision" && kind === "yes"
          ? "right"
          : srcBlock.type === "decision" && kind === "no"
            ? "bottom"
            : (srcCfg.outgoingHandles[0] ?? "bottom");
      connections[id] = {
        id,
        source: e.source,
        target: e.target,
        kind,
        label,
        sourceSide: cMeta?.sourceSide ?? defaultSourceSide,
        targetSide: cMeta?.targetSide ?? "top",
      };
    }
  }

  return {
    diagram: { blocks, connections },
    multipleStartCandidates: multipleStarts,
    metaWasUnreadable: hadMetaButUnreadable,
  };
}

function shapeAndIdToType(
  id: string,
  shape: "stadium" | "diamond" | "parallelogram" | "rect",
): Block["type"] | null {
  // Shape is the authoritative signal. IDs are a soft hint used only when
  // shape matches ambiguous types.
  switch (shape) {
    case "diamond":
      return "decision";
    case "parallelogram":
      return "result";
    case "stadium": {
      // Start or End — use ID prefix to disambiguate
      if (id === "S") return "start";
      if (/^E\d+$/.test(id)) return "end";
      // Fallback: treat unknown stadium as "start" if id is "S", else "end"
      return id.startsWith("S") ? "start" : "end";
    }
    case "rect":
      return "action";
  }
}

// Re-export for tests/debug
export { extractMetaBlock, type DiagramMetaV1 };
