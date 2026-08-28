interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
}

const PAD_Y = 2;

/**
 * Compact trend line for a table row — no axes, labels, or tooltip.
 *
 * Hand-rolled SVG rather than a charting library on purpose: one of these
 * renders per row, so a full chart instance each (with its own ResizeObserver
 * and client-side reconciliation) is real overhead for a 64×24 decoration.
 * As plain markup it stays a Server Component and ships no client JS at all.
 *
 * Decorative by design — every value it plots is already shown as a number in
 * the adjacent cells, so it's hidden from assistive tech rather than
 * duplicated as an unreadable list of figures.
 */
export function Sparkline({ values, width = 64, height = 24 }: SparklineProps) {
  if (values.length === 0) return null;

  // A flat run (every value 0) still draws a baseline rather than dividing by zero.
  const max = Math.max(...values, 1);
  const usableHeight = height - PAD_Y * 2;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((value, i) => {
    const x = i * stepX;
    const y = PAD_Y + usableHeight - (value / max) * usableHeight;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const line = `M${points.join(" L")}`;
  const area = `${line} L${width.toFixed(2)},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
      focusable="false"
      className="overflow-visible"
    >
      <path d={area} fill="var(--accent)" fillOpacity={0.14} />
      <path d={line} stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
