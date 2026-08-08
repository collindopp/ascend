import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative inline-flex">
      <select
        className={cn(
          "h-9 appearance-none rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 pl-3 pr-8 text-sm text-text-primary",
          "hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          "cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
