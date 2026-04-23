import { useDiagramStore, summarizeSelection } from "@/store/diagramStore";
import { Button } from "@/ui/Button";
import { Palette } from "./Palette";
import { BlockProperties } from "./BlockProperties";
import { ConnectionProperties } from "./ConnectionProperties";

/**
 * Right panel orchestrator (FO §8). Chooses between palette / block
 * properties / connection properties / multi-select based on the current
 * selection. Comments are rendered in-place as part of BlockProperties.
 */
export function RightPanel() {
  const selection = useDiagramStore((s) => s.selection);
  const summary = summarizeSelection(selection);
  const totalSelected = selection.blockIds.length + selection.connectionIds.length;

  let body;
  if (summary.view === "block") {
    body = <BlockProperties blockId={summary.blockId} />;
  } else if (summary.view === "connection") {
    body = <ConnectionProperties connectionId={summary.connectionId} />;
  } else if (totalSelected > 1) {
    body = <MultiSelect />;
  } else {
    body = <Palette />;
  }

  return <div className="h-full">{body}</div>;
}

function MultiSelect() {
  const selection = useDiagramStore((s) => s.selection);
  const readOnly = useDiagramStore((s) => s.readOnlyReason !== null);
  const removeBlocks = useDiagramStore((s) => s.removeBlocks);
  const removeConnection = useDiagramStore((s) => s.removeConnection);

  const blockCount = selection.blockIds.length;
  const connCount = selection.connectionIds.length;

  const deleteAll = () => {
    if (connCount) {
      for (const id of selection.connectionIds) removeConnection(id);
    }
    if (blockCount) {
      removeBlocks(selection.blockIds);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--claude-border)] px-4 py-3">
        <h2 className="text-sm font-semibold">Meerdere geselecteerd</h2>
        <p className="text-xs text-[var(--claude-text-tertiary)]">
          {blockCount} blok{blockCount === 1 ? "" : "ken"}
          {connCount > 0 &&
            `, ${connCount} verbinding${connCount === 1 ? "" : "en"}`}
        </p>
      </div>
      <div className="flex-1 p-4 text-sm text-[var(--claude-text-tertiary)]">
        Bewerk eigenschappen één item tegelijk.
      </div>
      {!readOnly && (
        <div className="border-t border-[var(--claude-border)] p-3">
          <Button variant="danger" size="sm" onClick={deleteAll}>
            Selectie verwijderen
          </Button>
        </div>
      )}
    </div>
  );
}
