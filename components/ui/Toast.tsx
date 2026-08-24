"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: "default" | "success" | "error";
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toneClasses: Record<ToastItem["tone"], string> = {
  default: "border-border",
  success: "border-accent-border",
  error: "border-danger-border",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto rounded-[var(--radius-md)] border bg-gradient-to-b from-surface-2/40 to-surface-1 px-4 py-3 shadow-[var(--shadow-elevated)] animate-toast-in",
              toneClasses[toast.tone],
            )}
          >
            <p className="text-sm font-medium text-text-primary">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-sm text-text-tertiary">{toast.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
