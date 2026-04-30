import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Label({
  children,
  className,
  hint,
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "flex items-center justify-between text-xs font-medium uppercase tracking-wide text-[var(--claude-text-secondary)]",
        className,
      )}
    >
      <span>{children}</span>
      {hint && <span className="text-[10px] text-[var(--claude-text-tertiary)]">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-[var(--claude-border)] bg-[var(--claude-bg)] px-2.5 py-1.5 text-sm",
        "text-[var(--claude-text-primary)] placeholder:text-[var(--claude-text-tertiary)]",
        "focus:border-[var(--claude-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--claude-accent-light)]",
        "disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = "Input";

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...rest }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "custom-scrollbar w-full resize-none rounded-md border border-[var(--claude-border)] bg-[var(--claude-bg)] px-2.5 py-1.5 text-sm",
        "text-[var(--claude-text-primary)] placeholder:text-[var(--claude-text-tertiary)]",
        "focus:border-[var(--claude-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--claude-accent-light)]",
        "disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  ),
);
TextArea.displayName = "TextArea";

export function ReadOnlyField({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border border-[var(--claude-border)] bg-[var(--claude-surface)] px-2.5 py-1.5 text-sm text-[var(--claude-text-secondary)]",
        mono && "font-mono",
      )}
    >
      {children}
    </div>
  );
}
