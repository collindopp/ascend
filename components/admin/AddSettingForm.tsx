"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { upsertSystemSettingAction } from "@/lib/admin/actions";

export function AddSettingForm() {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertSystemSettingAction({
        key: formData.get("key"),
        value: formData.get("value"),
      });
      if (!result.ok) {
        toast.push({ title: "Couldn't save setting", description: result.error, tone: "error" });
        return;
      }
      toast.push({ title: "Setting saved", tone: "success" });
      router.refresh();
    });
  }

  const inputClass =
    "h-10 rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary";

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-tertiary">Key</label>
        <input name="key" required placeholder="e.g. supportEmail" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-tertiary">Value</label>
        <input name="value" required placeholder="Value" className={inputClass} />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
