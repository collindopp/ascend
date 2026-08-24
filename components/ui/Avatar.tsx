import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md";

const sizeClasses: Record<Size, string> = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/**
 * Deliberately monochrome — the design system reserves color for the accent
 * (positive states) and status tones, not for decorating people's names.
 * A neutral ring + initials reads as premium; a rainbow of avatar colors
 * would clash with the restrained palette everywhere else in the app.
 */
export function Avatar({ name, size = "md", className }: { name: string; size?: Size; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-2 font-mono font-semibold tracking-wide text-text-secondary",
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {initialsFor(name)}
    </span>
  );
}
