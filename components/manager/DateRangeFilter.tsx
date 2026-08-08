"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { DATE_RANGE_LABELS, type DateRangePreset } from "@/lib/utils/date-range";

const PRESETS: DateRangePreset[] = ["today", "yesterday", "7d", "30d", "90d"];

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("range") as DateRangePreset) || "30d";

  function setRange(preset: DateRangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", preset);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-border bg-surface-1 p-1">
      {PRESETS.map((preset) => (
        <button
          key={preset}
          onClick={() => setRange(preset)}
          className={cn(
            "rounded-[calc(var(--radius-sm)-2px)] px-3 py-1.5 text-xs font-medium transition-colors duration-[var(--duration-fast)]",
            current === preset
              ? "bg-surface-3 text-text-primary"
              : "text-text-tertiary hover:text-text-primary",
          )}
        >
          {DATE_RANGE_LABELS[preset]}
        </button>
      ))}
    </div>
  );
}
