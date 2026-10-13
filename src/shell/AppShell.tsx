import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  toolbar: ReactNode;
  canvas: ReactNode;
  rightPanel: ReactNode;
  className?: string;
}

/**
 * Fixed application shell (FO §8): a toolbar on top, the canvas in the
 * middle and the right panel on the right. Files are managed by the IDE. The shell itself is
 * stable — content slots get swapped based on selection and view state.
 */
export function AppShell({
  toolbar,
  canvas,
  rightPanel,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "grid h-screen w-screen bg-[var(--claude-bg)] text-[var(--claude-text-primary)]",
        className,
      )}
      style={{
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gridTemplateRows: "48px minmax(0, 1fr)",
      }}
    >
      <div
        className="col-span-2 flex items-center border-b border-[var(--claude-border)] bg-[var(--claude-surface)]"
        style={{ gridColumn: "1 / -1" }}
      >
        {toolbar}
      </div>
      <main className="relative overflow-hidden">{canvas}</main>
      <aside className="overflow-hidden border-l border-[var(--claude-border)] bg-[var(--claude-surface)]">
        {rightPanel}
      </aside>
    </div>
  );
}
