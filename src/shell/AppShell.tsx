import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  toolbar: ReactNode;
  /** Pass null to omit the sidebar column entirely (VSCode mode — the
   *  Explorer is the file tree). */
  sidebar: ReactNode | null;
  canvas: ReactNode;
  rightPanel: ReactNode;
  className?: string;
}

/**
 * Fixed application shell (FO §8): a toolbar on top, sidebar on the left,
 * canvas in the middle, right panel on the right. The shell itself is
 * stable — content slots get swapped based on selection and view state.
 */
export function AppShell({
  toolbar,
  sidebar,
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
        gridTemplateColumns:
          sidebar !== null
            ? "260px minmax(0, 1fr) 320px"
            : "minmax(0, 1fr) 320px",
        gridTemplateRows: "48px minmax(0, 1fr)",
      }}
    >
      <div
        className="flex items-center border-b border-[var(--claude-border)] bg-[var(--claude-surface)]"
        style={{ gridColumn: "1 / -1" }}
      >
        {toolbar}
      </div>
      {sidebar !== null && (
        <aside className="overflow-hidden border-r border-[var(--claude-border)] bg-[var(--claude-surface)]">
          {sidebar}
        </aside>
      )}
      <main className="relative overflow-hidden">{canvas}</main>
      <aside className="overflow-hidden border-l border-[var(--claude-border)] bg-[var(--claude-surface)]">
        {rightPanel}
      </aside>
    </div>
  );
}
