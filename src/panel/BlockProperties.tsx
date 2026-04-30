import { useCallback, useEffect, useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useDiagramStore } from "@/store/diagramStore";
import { getBlockConfig } from "@/config/blockConfig";
import { Label, ReadOnlyField, TextArea } from "@/ui/Field";
import { Button } from "@/ui/Button";
import {
  MAX_COMMENT_LENGTH,
  MAX_DATAFIELD_LENGTH,
} from "@/types/domain";

interface Props {
  blockId: string;
}

/**
 * Block properties view (FO §8). Shows the editable fields at the top and a
 * dedicated Comments section at the bottom with its own scroll area and a
 * pinned composer.
 */
export function BlockProperties({ blockId }: Props) {
  const block = useDiagramStore((s) => s.diagram.blocks[blockId]);
  const connections = useDiagramStore((s) => s.diagram.connections);
  const blocks = useDiagramStore((s) => s.diagram.blocks);
  const readOnly = useDiagramStore((s) => s.readOnlyReason !== null);
  const setBlockLabel = useDiagramStore((s) => s.setBlockLabel);
  const setBlockDataField = useDiagramStore((s) => s.setBlockDataField);
  const setBlockExpectedOutcome = useDiagramStore((s) => s.setBlockExpectedOutcome);
  const setBlockYesDataField = useDiagramStore((s) => s.setBlockYesDataField);
  const setBlockNoDataField = useDiagramStore((s) => s.setBlockNoDataField);
  const removeBlocks = useDiagramStore((s) => s.removeBlocks);
  const selectBlock = useDiagramStore((s) => s.selectBlock);
  const flow = useReactFlow();

  /** Select the target block and pan the canvas so it lands in the centre of
   *  the viewport. Behoudt het huidige zoom-niveau zodat de gebruiker niet
   *  ineens uit-/inzoomt; korte transitie zodat de jump als beweging voelt. */
  const jumpToBlock = useCallback(
    (id: string) => {
      selectBlock(id);
      const target = useDiagramStore.getState().diagram.blocks[id];
      if (!target) return;
      const cx = target.position.x + target.width / 2;
      const cy = target.position.y + target.height / 2;
      flow.setCenter(cx, cy, { zoom: flow.getZoom(), duration: 300 });
    },
    [flow, selectBlock],
  );

  const [label, setLabel] = useState(block?.label ?? "");
  const [dataField, setDataField] = useState(block?.dataField ?? "");
  const [expectedOutcome, setExpectedOutcome] = useState(block?.expectedOutcome ?? "");
  const [yesData, setYesData] = useState(block?.yesDataField ?? "");
  const [noData, setNoData] = useState(block?.noDataField ?? "");

  useEffect(() => {
    setLabel(block?.label ?? "");
    setDataField(block?.dataField ?? "");
    setExpectedOutcome(block?.expectedOutcome ?? "");
    setYesData(block?.yesDataField ?? "");
    setNoData(block?.noDataField ?? "");
  }, [
    block?.id,
    block?.label,
    block?.dataField,
    block?.expectedOutcome,
    block?.yesDataField,
    block?.noDataField,
  ]);

  const outgoingPaths = useMemo(() => {
    if (!block || block.type === "end") return null;
    const outs = Object.values(connections)
      .filter((c) => c.source === block.id)
      // Stable order: yes → no → default, then by target id, so Y zit altijd
      // boven N bij Decision en de volgorde springt niet rond bij saves.
      .sort((a, b) => {
        const order = { yes: 0, no: 1, default: 2 } as const;
        if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind];
        return a.target.localeCompare(b.target);
      });
    return outs.map((c) => {
      const trimmed = c.label.trim();
      const fallback = c.kind === "yes" ? "Y" : c.kind === "no" ? "N" : "→";
      return {
        connId: c.id,
        badge: trimmed || fallback,
        targetId: c.target,
        targetLabel: blocks[c.target]?.label ?? c.target,
      };
    });
  }, [block, connections, blocks]);

  // Decision-specific: the visible label of the Y- and N-edge. Used to mirror
  // the user's rename in the "Data / context — <label>" field titles. Falls
  // back to "Y" / "N" when the edge doesn't exist yet or its label is empty.
  const decisionEdgeLabels = useMemo(() => {
    if (!block || block.type !== "decision") return null;
    const yesConn = Object.values(connections).find(
      (c) => c.source === block.id && c.kind === "yes",
    );
    const noConn = Object.values(connections).find(
      (c) => c.source === block.id && c.kind === "no",
    );
    return {
      yes: yesConn?.label.trim() || "Y",
      no: noConn?.label.trim() || "N",
    };
  }, [block, connections]);

  if (!block) {
    return (
      <div className="p-4 text-sm text-[var(--claude-text-tertiary)]">
        Blok niet gevonden.
      </div>
    );
  }

  const cfg = getBlockConfig(block.type);

  const commitLabel = () => {
    if (!cfg.labelEditable) return;
    const trimmed = label.trim();
    if (!trimmed) {
      setLabel(block.label);
      return;
    }
    setBlockLabel(block.id, trimmed);
  };

  const commitDataField = () => {
    const trimmed = dataField.trim();
    setBlockDataField(block.id, trimmed ? trimmed : null);
  };

  const commitExpectedOutcome = () => {
    const trimmed = expectedOutcome.trim();
    setBlockExpectedOutcome(block.id, trimmed ? trimmed : null);
  };

  const commitYesData = () => {
    const trimmed = yesData.trim();
    setBlockYesDataField(block.id, trimmed ? trimmed : null);
  };

  const commitNoData = () => {
    const trimmed = noData.trim();
    setBlockNoDataField(block.id, trimmed ? trimmed : null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--claude-border)] px-4 py-3">
        <h2 className="text-sm font-semibold">{cfg.displayName}</h2>
        <p className="text-xs text-[var(--claude-text-tertiary)]">Blokeigenschappen</p>
      </div>

      <div className="custom-scrollbar flex-none space-y-4 overflow-auto p-4"
           style={{ maxHeight: "50%" }}>
        <div className="space-y-1.5">
          <Label htmlFor="block-id">ID</Label>
          <ReadOnlyField mono>{block.id}</ReadOnlyField>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="block-label">Label</Label>
          {cfg.labelEditable ? (
            <TextArea
              id="block-label"
              rows={3}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  (e.target as HTMLTextAreaElement).blur();
                }
                if (e.key === "Escape") {
                  setLabel(block.label);
                  (e.target as HTMLTextAreaElement).blur();
                }
              }}
              disabled={readOnly}
              placeholder={cfg.defaultLabel}
            />
          ) : (
            <ReadOnlyField>{block.label}</ReadOnlyField>
          )}
        </div>

        {cfg.supportsDataField && (
          <div className="space-y-1.5">
            <Label htmlFor="block-datafield" hint={`${dataField.length}/${MAX_DATAFIELD_LENGTH}`}>
              Data / context
            </Label>
            <TextArea
              id="block-datafield"
              value={dataField}
              onChange={(e) => setDataField(e.target.value.slice(0, MAX_DATAFIELD_LENGTH))}
              onBlur={commitDataField}
              disabled={readOnly}
              rows={4}
              placeholder="Optioneel — context bij dit blok"
            />
          </div>
        )}

        {cfg.supportsExpectedOutcome && (
          <div className="space-y-1.5">
            <Label
              htmlFor="block-expected"
              hint={`${expectedOutcome.length}/${MAX_DATAFIELD_LENGTH}`}
            >
              Verwachte uitkomst
            </Label>
            <TextArea
              id="block-expected"
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value.slice(0, MAX_DATAFIELD_LENGTH))}
              onBlur={commitExpectedOutcome}
              disabled={readOnly}
              rows={4}
              placeholder="Wat moet deze uitkomst aantonen?"
            />
          </div>
        )}

        {block.type === "decision" && decisionEdgeLabels && (
          <>
            <div className="space-y-1.5">
              <Label
                htmlFor="block-yes-data"
                hint={`${yesData.length}/${MAX_DATAFIELD_LENGTH}`}
              >
                Data / context — {decisionEdgeLabels.yes}
              </Label>
              <TextArea
                id="block-yes-data"
                value={yesData}
                onChange={(e) => setYesData(e.target.value.slice(0, MAX_DATAFIELD_LENGTH))}
                onBlur={commitYesData}
                disabled={readOnly}
                rows={4}
                placeholder={`Optioneel — context bij het ${decisionEdgeLabels.yes}-pad`}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="block-no-data"
                hint={`${noData.length}/${MAX_DATAFIELD_LENGTH}`}
              >
                Data / context — {decisionEdgeLabels.no}
              </Label>
              <TextArea
                id="block-no-data"
                value={noData}
                onChange={(e) => setNoData(e.target.value.slice(0, MAX_DATAFIELD_LENGTH))}
                onBlur={commitNoData}
                disabled={readOnly}
                rows={4}
                placeholder={`Optioneel — context bij het ${decisionEdgeLabels.no}-pad`}
              />
            </div>
          </>
        )}

        {outgoingPaths && outgoingPaths.length > 0 && (
          <div className="space-y-1.5">
            <Label>Uitgaande paden</Label>
            <div className="space-y-1.5">
              {outgoingPaths.map((p) => (
                <PathRow
                  key={p.connId}
                  kindLabel={p.badge}
                  target={{
                    connId: p.connId,
                    targetId: p.targetId,
                    label: p.targetLabel,
                  }}
                  onJump={jumpToBlock}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CommentsSection blockId={block.id} readOnly={readOnly} />

      {!readOnly && !cfg.singleton && (
        <div className="border-t border-[var(--claude-border)] p-3">
          <Button
            variant="danger"
            size="sm"
            onClick={() => removeBlocks([block.id])}
          >
            Blok verwijderen
          </Button>
        </div>
      )}
    </div>
  );
}

function CommentsSection({
  blockId,
  readOnly,
}: {
  blockId: string;
  readOnly: boolean;
}) {
  const comments = useDiagramStore(
    (s) => s.diagram.blocks[blockId]?.comments ?? [],
  );
  const addComment = useDiagramStore((s) => s.addComment);
  const removeComment = useDiagramStore((s) => s.removeComment);

  const [draft, setDraft] = useState("");

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addComment(blockId, trimmed.slice(0, MAX_COMMENT_LENGTH));
    setDraft("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-[var(--claude-border)]">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--claude-text-secondary)]">
          Comments
        </h3>
        <span className="text-[10px] text-[var(--claude-text-tertiary)]">
          {comments.length}
        </span>
      </div>

      <div className="custom-scrollbar flex-1 space-y-2 overflow-auto px-4 pb-2">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-xs text-[var(--claude-text-tertiary)]">
            Nog geen comments.
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="group rounded-md border border-[var(--claude-border)] bg-[var(--claude-surface)] p-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap break-words text-[var(--claude-text-primary)]">
                  {c.text}
                </p>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeComment(blockId, c.id)}
                    className="text-[11px] text-[var(--claude-error)] opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
                    title="Verwijderen"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-[var(--claude-text-tertiary)]">
                {formatTimestamp(c.timestamp)}
              </p>
            </div>
          ))
        )}
      </div>

      {!readOnly && (
        <div className="space-y-1.5 border-t border-[var(--claude-border)] p-3">
          <TextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="Typ een comment — Enter = verstuur"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--claude-text-tertiary)]">
              {draft.length}/{MAX_COMMENT_LENGTH}
            </span>
            <Button
              size="sm"
              variant="primary"
              onClick={submit}
              disabled={!draft.trim()}
            >
              Plaatsen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function PathRow({
  kindLabel,
  target,
  onJump,
}: {
  kindLabel: string;
  target: { connId: string; targetId: string; label: string };
  onJump: (blockId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--claude-border)] bg-[var(--claude-surface)] px-2.5 py-1.5 text-sm">
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-[var(--claude-accent-light)] px-1 text-[11px] font-semibold text-[var(--claude-accent)]">
        {kindLabel}
      </span>
      <button
        type="button"
        onClick={() => onJump(target.targetId)}
        className="flex-1 truncate text-left text-[var(--claude-text-primary)] hover:underline"
        title={`Ga naar ${target.targetId}`}
      >
        {target.label}
        <span className="ml-1 text-[11px] text-[var(--claude-text-tertiary)]">
          ({target.targetId})
        </span>
      </button>
    </div>
  );
}
