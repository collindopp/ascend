"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-surface-1 p-0 text-text-primary backdrop:bg-black/60",
        className,
      )}
    >
      <div className="border-b border-border-subtle px-5 py-4">
        <h2 className="text-sm font-medium text-text-primary">{title}</h2>
        {description && <p className="mt-1 text-sm text-text-tertiary">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
