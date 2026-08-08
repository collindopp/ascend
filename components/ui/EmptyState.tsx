import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border px-6 py-16 text-center">
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-text-tertiary">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
