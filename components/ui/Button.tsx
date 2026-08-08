import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-black hover:bg-accent-strong active:bg-accent-strong disabled:bg-surface-3 disabled:text-text-disabled",
  secondary:
    "bg-surface-2 text-text-primary border border-border-strong hover:bg-surface-3 disabled:text-text-disabled disabled:bg-surface-1",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2 disabled:text-text-disabled",
  danger:
    "bg-transparent text-danger border border-danger-border hover:bg-danger-muted disabled:text-text-disabled disabled:border-border",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-[var(--radius-sm)] gap-1.5",
  md: "h-10 px-4 text-sm rounded-[var(--radius-md)] gap-2",
  lg: "h-12 px-6 text-base rounded-[var(--radius-md)] gap-2",
  xl: "h-16 px-8 text-lg rounded-[var(--radius-lg)] gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-expo)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "cursor-pointer active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
