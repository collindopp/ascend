"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createLeadListAction } from "@/lib/admin/actions";

export function AddLeadListModal() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createLeadListAction({
        name: formData.get("name"),
        source: formData.get("source"),
        location: formData.get("location"),
        description: formData.get("description"),
        leadCount: formData.get("leadCount") || undefined,
        externalId: formData.get("externalId"),
        tags: formData.get("tags"),
      });
      if (!result.ok) {
        toast.push({ title: "Couldn't create lead list", description: result.error, tone: "error" });
        return;
      }
      toast.push({ title: "Lead list created", tone: "success" });
      setOpen(false);
      router.refresh();
    });
  }

  const inputClass =
    "h-10 rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 px-3 text-sm text-text-primary placeholder:text-text-tertiary";

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Add lead list
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add lead list" className="max-w-lg">
        <form action={handleSubmit} className="flex flex-col gap-3">
          <input name="name" required placeholder="Name" className={inputClass} />
          <input name="source" required placeholder="Source (e.g. Scout Data)" className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <input name="location" placeholder="Location" className={inputClass} />
            <input name="leadCount" type="number" min={0} placeholder="Lead count" className={inputClass} />
          </div>
          <input name="externalId" placeholder="External ID (optional)" className={inputClass} />
          <input name="tags" placeholder="Tags, comma-separated" className={inputClass} />
          <textarea name="description" placeholder="Description" rows={2} className={`${inputClass} h-auto py-2`} />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Creating…" : "Create lead list"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
