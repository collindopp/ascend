import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg" | "xl";
type Tone = "default" | "positive" | "muted";

interface MetricDisplayProps {
  label: string;
  value: string;
  size?: Size;
  tone?: Tone;
  sublabel?: string;
  className?: string;
}

const valueSizeClasses: Record<Size, string> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-6xl md:text-7xl",
};

const toneClasses: Record<Tone, string> = {
  default: "text-text-primary",
  positive: "text-accent",
  muted: "text-text-secondary",
};

/**
 * The single most important visual primitive in ASCEND: a large, dominant number
 * with a quiet label. Every dashboard metric should compose this rather than
 * inventing its own number/label pairing.
 */
export function MetricDisplay({
  label,
  value,
  size = "md",
  tone = "default",
  sublabel,
  className,
}: MetricDisplayProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <span
        className={cn(
          "font-mono font-semibold leading-none tabular-nums",
          valueSizeClasses[size],
          toneClasses[tone],
        )}
      >
        {value}
      </span>
      {sublabel && <span className="text-sm text-text-secondary">{sublabel}</span>}
    </div>
  );
}
