import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-gradient-to-b from-surface-2/25 to-surface-1 shadow-[var(--shadow-card)]">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-border", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border-subtle", className)} {...props} />;
}

/**
 * Totals row. Set apart with a heavier top border and a slightly raised
 * surface so it reads as a summary of the column rather than one more entry
 * in it.
 *
 * Rates belong here only when recomputed from the summed counts — averaging a
 * column of percentages weights a rep with 3 conversations the same as one
 * with 300 and produces a number that matches nothing.
 */
export function TableFoot({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn("border-t-2 border-border-strong bg-surface-2/40 font-medium", className)}
      {...props}
    />
  );
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors duration-[var(--duration-fast)] hover:bg-surface-2/60", className)}
      {...props}
    />
  );
}

/**
 * `numeric` right-aligns the column and applies the tabular mono face, so
 * digits line up place-by-place down the column and can be compared at a
 * glance — the convention serious financial and analytics tables follow.
 * It also collapses the `font-mono tabular-nums` pair that was repeated on
 * nearly every data cell in the app.
 */
type NumericProps = { numeric?: boolean };

export function TableHeadCell({
  className,
  numeric,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & NumericProps) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-tertiary whitespace-nowrap",
        numeric ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  numeric,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & NumericProps) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 text-text-primary whitespace-nowrap",
        numeric && "text-right font-mono tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
