import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantCls: Record<Variant, string> = {
  primary:
    "bg-[var(--claude-accent)] text-white hover:bg-[var(--claude-accent-hover)] disabled:opacity-50",
  secondary:
    "bg-[var(--claude-surface)] border border-[var(--claude-border)] text-[var(--claude-text-primary)] hover:bg-[var(--claude-surface-hover)] disabled:opacity-50",
  ghost:
    "text-[var(--claude-text-secondary)] hover:bg-[var(--claude-surface-hover)] hover:text-[var(--claude-text-primary)] disabled:opacity-50",
  danger:
    "text-[var(--claude-error)] hover:bg-[color-mix(in_srgb,var(--claude-error)_12%,transparent)] disabled:opacity-50",
};

const sizeCls: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs rounded-md gap-1.5",
  md: "h-9 px-3 text-sm rounded-md gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", type = "button", ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors select-none",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--claude-accent)]",
          variantCls[variant],
          sizeCls[size],
          className,
        )}
        {...rest}
      />
    );
  },
);
Button.displayName = "Button";
