import { useEffect, useMemo, useState } from "react";
import { useDiagramStore } from "@/store/diagramStore";
import { getBlockConfig } from "@/config/blockConfig";
import { Input, Label, ReadOnlyField, TextArea } from "@/ui/Field";
import { Button } from "@/ui/Button";
import { MAX_COMMENT_LENGTH, MAX_DATAFIELD_LENGTH } from "@/types/domain";

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
  const removeBlocks = useDiagramStore((s) => s.removeBlocks);
  const selectBlock = useDiagramStore((s) => s.selectBlock);

  const [label, setLabel] = useState(block?.label ?? "");
  const [dataField, setDataField] = useState(block?.dataField ?? "");
  const [expectedOutcome, setExpectedOutcome] = useState(block?.expectedOutcome ?? "");

  useEffect(() => {
    setLabel(block?.label ?? "");
    setDataField(block?.dataField ?? "");
    setExpectedOutcome(block?.expectedOutcome ?? "");
  }, [block?.id, block?.label, block?.dataField, block?.expectedOutcome]);

  const outgoingPaths = useMemo(() => {
    if (!block || block.type === "end") return null;
    const outs = Object.values(connections).filter((c) => c.source === block.id);
    return outs.map((c) => ({
      connId: c.id,
      kind: c.kind,
      badge: c.kind === "yes" ? "Y" : c.kind === "no" ? "N" : "→",
      targetId: c.target,
      targetLabel: blocks[c.target]?.label ?? c.target,
    }));
  }, [block, connections, blocks]);

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
            <Input
              id="block-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setLabel(block.label);
                  (e.target as HTMLInputElement).blur();
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
                  onJump={(id) => selectBlock(id)}
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
