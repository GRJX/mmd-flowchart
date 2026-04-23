/**
 * Detect if a `.mmd` file contains a supported flowchart (TD/LR/etc.) or
 * another Mermaid diagram type (sequenceDiagram, classDiagram, stateDiagram,
 * pie, etc.) — which we only render read-only.
 */

const FLOWCHART_HEADER_RE = /^\s*(flowchart|graph)\b/i;
const KNOWN_OTHER_DIAGRAMS = [
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "gantt",
  "pie",
  "journey",
  "mindmap",
  "timeline",
  "gitGraph",
  "requirementDiagram",
  "C4Context",
  "C4Container",
  "C4Component",
  "quadrantChart",
  "sankey-beta",
  "xychart-beta",
  "block-beta",
];

export type DiagramKind =
  | { kind: "flowchart" }
  | { kind: "other"; detected: string }
  | { kind: "unknown" };

export function detectDiagramKind(source: string): DiagramKind {
  const lines = source.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("%%")) continue;
    if (FLOWCHART_HEADER_RE.test(line)) return { kind: "flowchart" };
    for (const kw of KNOWN_OTHER_DIAGRAMS) {
      if (line.toLowerCase().startsWith(kw.toLowerCase())) {
        return { kind: "other", detected: kw };
      }
    }
    // First non-empty non-comment line didn't match — bail.
    return { kind: "unknown" };
  }
  return { kind: "unknown" };
}
