import type { Block, Comment, Connection, ConnectionKind, HandleSide } from "@/types/domain";

/**
 * Embedded metadata block in `.mmd` files. Format per FO.md §4:
 *
 *   %% MMD_META_START
 *   %% { ...json... }
 *   %% MMD_META_END
 *
 * The JSON may span multiple `%%`-prefixed lines; we strip the prefix and
 * concatenate before parsing.
 */

export const META_START = "%% MMD_META_START";
export const META_END = "%% MMD_META_END";

export interface BlockMeta {
  dataField: string | null;
  expectedOutcome: string | null;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  comments: Comment[];
}

export interface ConnectionMeta {
  dataField: string | null;
  sourceSide?: HandleSide;
  targetSide?: HandleSide;
  /** Persisted kind so decision Y/N semantics survive even when the user
   *  rewrote the visible label (e.g. "Y" → "ja, graag"). */
  kind?: ConnectionKind;
}

export interface DiagramMetaV1 {
  version: "1";
  meta: Record<string, BlockMeta>;
  connections: Record<string, ConnectionMeta>;
}

export function emptyMeta(): DiagramMetaV1 {
  return { version: "1", meta: {}, connections: {} };
}

export function extractMetaBlock(source: string): {
  meta: DiagramMetaV1 | null;
  body: string;
  hadMetaButUnreadable: boolean;
} {
  const lines = source.split(/\r?\n/);
  const startIdx = lines.findIndex((l) => l.trim() === META_START);
  const endIdx = lines.findIndex((l) => l.trim() === META_END);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return { meta: null, body: source, hadMetaButUnreadable: false };
  }

  const jsonLines = lines
    .slice(startIdx + 1, endIdx)
    .map((l) => l.replace(/^\s*%%\s?/, ""));
  const jsonText = jsonLines.join("\n").trim();

  const body = [...lines.slice(0, startIdx), ...lines.slice(endIdx + 1)].join(
    "\n",
  );

  try {
    const parsed = JSON.parse(jsonText) as DiagramMetaV1;
    if (parsed && parsed.version === "1" && parsed.meta && parsed.connections) {
      return { meta: parsed, body, hadMetaButUnreadable: false };
    }
    return { meta: null, body, hadMetaButUnreadable: true };
  } catch {
    return { meta: null, body, hadMetaButUnreadable: true };
  }
}

export function buildMetaBlock(
  blocks: Record<string, Block>,
  connections: Record<string, Connection>,
): string {
  const meta: Record<string, BlockMeta> = {};
  for (const b of Object.values(blocks)) {
    meta[b.id] = {
      dataField: b.dataField,
      expectedOutcome: b.expectedOutcome,
      position: { x: b.position.x, y: b.position.y },
      width: b.width,
      height: b.height,
      comments: b.comments,
    };
  }

  const connMeta: Record<string, ConnectionMeta> = {};
  for (const c of Object.values(connections)) {
    connMeta[c.id] = {
      dataField: c.dataField,
      sourceSide: c.sourceSide,
      targetSide: c.targetSide,
      kind: c.kind,
    };
  }

  const payload: DiagramMetaV1 = {
    version: "1",
    meta,
    connections: connMeta,
  };

  const json = JSON.stringify(payload);
  return [META_START, `%% ${json}`, META_END].join("\n");
}
