import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimale portable context-menu. Positioneert zichzelf bij `x,y` en
 * corrigeert als hij voorbij de viewport-rand zou vallen. Klik buiten of
 * Escape sluit. Items kunnen gescheiden zijn (`kind: "sep"`).
 */

export type ContextMenuItem =
  | { kind: "item"; label: string; onSelect: () => void; danger?: boolean; disabled?: boolean }
  | { kind: "sep" };

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - 8) {
      left = window.innerWidth - rect.width - 8;
    }
    if (top + rect.height > window.innerHeight - 8) {
      top = window.innerHeight - rect.height - 8;
    }
    setPos({ left: Math.max(4, left), top: Math.max(4, top) });
  }, [x, y]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-md border border-[var(--claude-border)] bg-[var(--claude-surface)] py-1 text-xs shadow-lg"
      style={{ left: pos.left, top: pos.top }}
      role="menu"
    >
      {items.map((item, i) =>
        item.kind === "sep" ? (
          <div
            key={`sep-${i}`}
            className="my-1 border-t border-[var(--claude-border)]"
          />
        ) : (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onSelect();
              onClose();
            }}
            className={cn(
              "flex w-full items-center px-3 py-1.5 text-left",
              item.disabled
                ? "cursor-not-allowed text-[var(--claude-text-tertiary)]"
                : item.danger
                  ? "text-[var(--claude-error)] hover:bg-[var(--claude-surface-hover)]"
                  : "text-[var(--claude-text-primary)] hover:bg-[var(--claude-surface-hover)]",
            )}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}
