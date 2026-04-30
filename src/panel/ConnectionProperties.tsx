import { useEffect, useState } from "react";
import { useDiagramStore } from "@/store/diagramStore";
import { Input, Label } from "@/ui/Field";
import { Button } from "@/ui/Button";
import { MAX_EDGE_LABEL_LENGTH } from "@/types/domain";

/**
 * Connection properties view (FO §8). All edge labels are editable — the
 * kind (Y/N) is determined by the decision handle the wire leaves from, not
 * by the label text. Decision edges get "Y"/"N" as default labels but the
 * user may rewrite them freely. Per-connection data/context lives op het
 * Decision-blok zelf (yesDataField / noDataField), niet op de verbinding.
 */
export function ConnectionProperties({ connectionId }: { connectionId: string }) {
  const connection = useDiagramStore((s) => s.diagram.connections[connectionId]);
  const blocks = useDiagramStore((s) => s.diagram.blocks);
  const readOnly = useDiagramStore((s) => s.readOnlyReason !== null);
  const setConnectionLabel = useDiagramStore((s) => s.setConnectionLabel);
  const removeConnection = useDiagramStore((s) => s.removeConnection);
  const selectBlock = useDiagramStore((s) => s.selectBlock);

  const [label, setLabel] = useState(connection?.label ?? "");

  useEffect(() => {
    setLabel(connection?.label ?? "");
  }, [connection?.id, connection?.label]);

  if (!connection) {
    return (
      <div className="p-4 text-sm text-[var(--claude-text-tertiary)]">
        Verbinding niet gevonden.
      </div>
    );
  }

  const src = blocks[connection.source];
  const tgt = blocks[connection.target];

  const commitLabel = () => {
    setConnectionLabel(connection.id, label);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--claude-border)] px-4 py-3">
        <h2 className="text-sm font-semibold">Verbinding</h2>
        <p className="text-xs text-[var(--claude-text-tertiary)]">
          {connection.kind === "yes"
            ? "Decision — Ja-pad"
            : connection.kind === "no"
              ? "Decision — Nee-pad"
              : "Standaard"}
        </p>
      </div>

      <div className="custom-scrollbar flex-1 space-y-4 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Van</Label>
            <EndpointButton
              id={connection.source}
              label={src?.label ?? connection.source}
              onJump={() => selectBlock(connection.source)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Naar</Label>
            <EndpointButton
              id={connection.target}
              label={tgt?.label ?? connection.target}
              onJump={() => selectBlock(connection.target)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="conn-label" hint={`${label.length}/${MAX_EDGE_LABEL_LENGTH}`}>
            Label
          </Label>
          <Input
            id="conn-label"
            value={label}
            onChange={(e) => setLabel(e.target.value.slice(0, MAX_EDGE_LABEL_LENGTH))}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setLabel(connection.label);
                (e.target as HTMLInputElement).blur();
              }
            }}
            disabled={readOnly}
            placeholder={
              connection.kind === "yes"
                ? "Y"
                : connection.kind === "no"
                  ? "N"
                  : "Optioneel label"
            }
          />
        </div>

      </div>

      {!readOnly && (
        <div className="border-t border-[var(--claude-border)] p-3">
          <Button
            variant="danger"
            size="sm"
            onClick={() => removeConnection(connection.id)}
          >
            Verbinding verwijderen
          </Button>
        </div>
      )}
    </div>
  );
}

function EndpointButton({
  id,
  label,
  onJump,
}: {
  id: string;
  label: string;
  onJump: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onJump}
      className="w-full rounded-md border border-[var(--claude-border)] bg-[var(--claude-surface)] px-2.5 py-1.5 text-left text-sm hover:border-[var(--claude-accent)]"
      title={`Ga naar ${id}`}
    >
      <span className="block truncate text-[var(--claude-text-primary)]">{label}</span>
      <span className="block font-mono text-[11px] text-[var(--claude-text-tertiary)]">
        {id}
      </span>
    </button>
  );
}
