import { detectDiagramKind } from "@/lib/mermaid/detect";
import { parseMmd } from "@/lib/mermaid/parse";
import { MAX_BLOCKS_EDITABLE, type Diagram, type ReadOnlyReason } from "@/types/domain";
import { useDiagramStore } from "@/store/diagramStore";
import { showToast } from "@/store/toastStore";

/** Laadt de tekst van een `.mmd`-bestand in de editor. Een leeg bestand
 *  begint met één Start-blok; onbekende of te grote diagrammen openen
 *  alleen-lezen. */
export function loadText(fileName: string, text: string): void {
  const load = (diagram: Diagram, readOnlyReason: ReadOnlyReason | null) =>
    useDiagramStore.getState().loadDiagram({
      filePath: fileName,
      fileName,
      diagram,
      readOnlyReason,
      lastSavedAt: null,
    });

  if (!text.trim()) {
    load(starterDiagram(), null);
    return;
  }

  const kind = detectDiagramKind(text);
  if (kind.kind === "other") {
    load(emptyDiagram(), { kind: "unsupported-type", detected: kind.detected });
    showToast({
      kind: "warning",
      message: `Diagramtype "${kind.detected}" wordt niet ondersteund. Geopend in alleen-lezen.`,
    });
    return;
  }
  if (kind.kind === "unknown") {
    load(emptyDiagram(), { kind: "unsupported-type", detected: "unknown" });
    showToast({
      kind: "warning",
      message: "Diagramtype niet herkend. Geopend in alleen-lezen.",
    });
    return;
  }

  const { diagram } = parseMmd(text);
  const blockCount = Object.keys(diagram.blocks).length;
  if (blockCount > MAX_BLOCKS_EDITABLE) {
    load(diagram, { kind: "too-many-blocks", count: blockCount });
    showToast({
      kind: "warning",
      message: `Dit diagram heeft ${blockCount} blokken (limiet ${MAX_BLOCKS_EDITABLE}). Geopend in alleen-lezen.`,
    });
    return;
  }
  load(diagram, null);
}

function emptyDiagram(): Diagram {
  return { blocks: {}, connections: {} };
}

function starterDiagram(): Diagram {
  return {
    blocks: {
      S: {
        id: "S",
        type: "start",
        label: "Start",
        position: { x: 200, y: 120 },
        width: 96,
        height: 96,
        dataField: null,
        expectedOutcome: null,
        yesDataField: null,
        noDataField: null,
        comments: [],
      },
    },
    connections: {},
  };
}
