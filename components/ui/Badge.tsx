import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "positive" | "danger" | "warning";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-text-secondary border-border",
  positive: "bg-accent-muted text-accent border-accent-border",
  danger: "bg-danger-muted text-danger border-danger-border",
  warning: "bg-warning-muted text-warning border-transparent",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
